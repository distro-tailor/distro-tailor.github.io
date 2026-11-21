import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  PERSONA_BUILD_SPECS,
  exportPersonaRecipe,
  parseArgs,
  resolvePersonasToVerify
} from './verify-persona-builds.js';
import { getPersonaPresetById } from '../packages/web/src/data/persona-presets.js';

test('every PERSONA_BUILD_SPECS entry maps to a valid recipe-backed persona preset', () => {
  assert.ok(PERSONA_BUILD_SPECS.length >= 6);
  for (const spec of PERSONA_BUILD_SPECS) {
    const preset = getPersonaPresetById(spec.personaId);
    assert.ok(preset, `Missing persona preset for "${spec.personaId}"`);
    assert.ok(preset.recipeId, `Persona "${spec.personaId}" has no recipeId`);
    assert.ok(spec.buildCommand.length > 0, `${spec.personaId}: missing buildCommand`);
    assert.ok(spec.verifyCommand.length > 0, `${spec.personaId}: missing verifyCommand`);
  }
});

test('resolvePersonasToVerify handles all-fast, all, single ids, and unknown ids', () => {
  const fast = resolvePersonasToVerify('all-fast');
  assert.ok(fast.length > 0);
  assert.ok(fast.every((s) => s.tier === 'fast'));

  const all = resolvePersonasToVerify('all');
  assert.equal(all.length, PERSONA_BUILD_SPECS.length);

  const single = resolvePersonasToVerify('cloud-init-vm');
  assert.equal(single.length, 1);
  assert.equal(single[0].personaId, 'cloud-init-vm');

  assert.throws(() => resolvePersonasToVerify('non-existent-persona'), /Unknown persona/);
});

test('parseArgs parses persona, out, dry-run, skip-apt, skip-smoke, list, and matrix flags', () => {
  const parsed = parseArgs([
    '--persona',
    'wsl2-developer-box',
    '--out',
    '/tmp/out',
    '--dry-run',
    '--docker',
    '--skip-apt',
    '--skip-smoke',
    '--matrix',
    'all'
  ]);
  assert.deepEqual(parsed, {
    persona: 'wsl2-developer-box',
    outDir: '/tmp/out',
    dryRun: true,
    docker: true,
    skipApt: true,
    skipSmoke: true,
    list: false,
    matrix: 'all'
  });
});

test('bootable VM/ISO personas define QEMU boot smoke tests with serial console and timeout', () => {
  for (const id of ['cloud-init-vm', 'debootstrap-live-iso']) {
    const spec = PERSONA_BUILD_SPECS.find((s) => s.personaId === id);
    assert.ok(spec?.qemuSmoke, `${id}: expected qemuSmoke config`);
    assert.match(spec.qemuSmoke.command, /qemu-system-x86_64/);
    assert.match(spec.qemuSmoke.command, /console=ttyS0/);
    assert.ok(spec.qemuSmoke.timeoutMs >= 60_000);
    assert.ok(spec.aptPackages.includes('qemu-system-x86'));
  }
});

test('exportPersonaRecipe writes Makefile or config files for every configured persona', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'distro-tailor-verify-'));
  try {
    for (const spec of PERSONA_BUILD_SPECS) {
      const targetDir = path.join(tmpRoot, spec.personaId);
      const result = await exportPersonaRecipe(spec.personaId, targetDir);
      assert.ok(result.files.length > 0, `${spec.personaId}: expected exported files`);
      assert.ok(result.files.includes('Makefile'), `${spec.personaId}: expected Makefile`);
      const makefileContent = await fs.readFile(path.join(targetDir, 'Makefile'), 'utf-8');
      assert.ok(makefileContent.length > 0);
    }
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
