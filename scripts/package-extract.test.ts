import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractCloudConfigPackages, extractInstalledPackages } from './package-extract.js';

const names = (text: string, manager: 'apt' | 'apk') =>
  extractInstalledPackages(text)
    .filter((p) => p.manager === manager)
    .map((p) => p.name)
    .sort();

test('Package Extract: reads multi-line apt-get install with continuations and stops at &&', () => {
  const text = [
    'apt-get install -y --no-install-recommends \\',
    '\tlinux-image-amd64 \\',
    '\tsystemd-sysv \\',
    '\tcurl && \\',
    'systemctl enable docker'
  ].join('\n');
  assert.deepEqual(names(text, 'apt'), ['curl', 'linux-image-amd64', 'systemd-sysv']);
});

test('Package Extract: ignores flags, make variables, shell syntax, and quoted values', () => {
  const text = "apt-get install -y $(EXTRA_PKGS) '$(X)' ${VAR} foo=1.0 /tmp/a.deb real-pkg; echo done";
  assert.deepEqual(names(text, 'apt'), ['real-pkg']);
});

test('Package Extract: reads apk add and apt in the same file separately', () => {
  const text = 'apk add --no-cache openrc curl && rc-update add x\napt-get install -y nftables';
  assert.deepEqual(names(text, 'apk'), ['curl', 'openrc']);
  assert.deepEqual(names(text, 'apt'), ['nftables']);
});

test('Package Extract: does not mistake rc-update or other "add" commands for packages', () => {
  assert.deepEqual(names('rc-update add docker default', 'apk'), []);
});

test('Package Extract: reads cloud-config packages list', () => {
  const yaml = '#cloud-config\npackages:\n  - qemu-guest-agent\n  - curl\n\nruncmd:\n  - echo hi';
  assert.deepEqual(extractCloudConfigPackages(yaml).map((p) => p.name), ['qemu-guest-agent', 'curl']);
});
