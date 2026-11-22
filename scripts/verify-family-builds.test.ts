import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { FAMILY_BUILD_IDS, parseFamilyVerifyArgs, verifyFamilyRecipe } from './verify-family-builds.js';

test('parseFamilyVerifyArgs parses --live and --only flags', () => {
  const parsed = parseFamilyVerifyArgs(['--live', '--only', 'fedora-dnf,void-xbps']);
  assert.equal(parsed.live, true);
  assert.deepEqual(parsed.only, ['fedora-dnf', 'void-xbps']);
});

test('verifyFamilyRecipe dry-run validates Makefile syntax for every family generator', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'dt-family-verify-'));
  try {
    for (const id of FAMILY_BUILD_IDS) {
      await verifyFamilyRecipe(id, path.join(tmp, id), false);
    }
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
