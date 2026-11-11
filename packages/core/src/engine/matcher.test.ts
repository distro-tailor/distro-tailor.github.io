import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISTRO_REGISTRY } from '../taxonomy/distros.js';
import { DistroProfile } from '../types.js';
import { evaluateCriteria } from './matcher.js';

test('Matcher Scoring: criteria with only undefined values use the unconstrained Linux Mint baseline', () => {
  const result = evaluateCriteria({ useCase: undefined, platform: undefined });
  assert.equal(result.bestMatch.distro.id, 'linux-mint');
  assert.equal(result.bestMatch.reasons[0]?.feature, 'Universal Baseline');
});

test('Matcher Scoring: alignment bonuses count toward the maximum, so exact footprint tier wins', () => {
  const result = evaluateCriteria({ footprint: 'standard' });
  const debian = result.allMatches.find((m) => m.distro.id === 'debian');
  const alpine = result.allMatches.find((m) => m.distro.id === 'alpine');
  assert.ok(debian && alpine);
  assert.equal(debian.score, 100, 'exact tier match should be a perfect score');
  assert.ok(alpine.score < debian.score, 'smaller-tier distro should no longer tie at 100%');
});

test('Matcher Scoring: router-only distributions are treated as dedicated appliances', () => {
  const debian = DISTRO_REGISTRY.find((d) => d.id === 'debian');
  assert.ok(debian);
  const routerOnly: DistroProfile = { ...debian, id: 'router-only', name: 'Router Only', primaryUseCases: ['router-networking'] };
  const result = evaluateCriteria({ useCase: 'gaming' }, [routerOnly]);
  const useCase = result.bestMatch.reasons.find((r) => r.feature === 'Use Case');
  assert.match(useCase?.explanation ?? '', /Dedicated appliance/);
});

test('Matcher Scoring: filesystem selection applies points and reasons accurately', () => {
  const zfsResult = evaluateCriteria({ fileSystem: 'zfs' });
  const zfsTop = zfsResult.topMatches.map((m) => m.distro.id);
  assert.ok(zfsTop.includes('truenas-scale') || zfsTop.includes('proxmox-ve') || zfsTop.includes('smartos'));
  const zfsReason = zfsResult.bestMatch.reasons.find((r) => r.feature === 'Root Filesystem');
  assert.ok(zfsReason?.matched);

  const fat32Result = evaluateCriteria({ fileSystem: 'fat32' });
  assert.equal(fat32Result.bestMatch.distro.id, 'freedos');
});

test('Matcher Scoring: kernel, bootloader, security, and networking affinities apply', () => {
  const rtResult = evaluateCriteria({ kernelFlavor: 'realtime-rt' });
  const rtDistros = rtResult.topMatches.map((m) => m.distro.id);
  assert.ok(rtDistros.includes('ubuntu-studio') || rtDistros.includes('debian'));

  const selinuxResult = evaluateCriteria({ securityProfile: 'selinux' });
  const selinuxDistros = selinuxResult.topMatches.map((m) => m.distro.id);
  assert.ok(selinuxDistros.includes('fedora') || selinuxDistros.includes('talos'));

  const systemdBootResult = evaluateCriteria({ bootloader: 'systemd-boot' });
  const systemdBootDistros = systemdBootResult.topMatches.map((m) => m.distro.id);
  assert.ok(systemdBootDistros.includes('pop-os') || systemdBootDistros.includes('arch'));

  const networkdResult = evaluateCriteria({ networkingStack: 'systemd-networkd' });
  const networkdDistros = networkdResult.topMatches.map((m) => m.distro.id);
  assert.ok(networkdDistros.includes('arch') || networkdDistros.includes('nixos'));
});

test('Matcher Scoring: firmware, Secure Boot, and TPM affinities apply only when selected', () => {
  const baseline = evaluateCriteria({});
  assert.equal(baseline.bestMatch.distro.id, 'linux-mint');

  const bios = evaluateCriteria({ firmwareMode: 'legacy-bios' });
  const bazzite = bios.allMatches.find((m) => m.distro.id === 'bazzite');
  const antix = bios.allMatches.find((m) => m.distro.id === 'antix');
  assert.ok(bazzite && antix && antix.score > bazzite.score);

  const sb = evaluateCriteria({ secureBoot: 'required' });
  const arch = sb.allMatches.find((m) => m.distro.id === 'arch');
  const ubuntu = sb.allMatches.find((m) => m.distro.id === 'ubuntu');
  assert.ok(arch && ubuntu && ubuntu.score > arch.score);
  assert.ok(sb.bestMatch.reasons.some((r) => r.feature === 'Secure Boot' && r.matched));

  const ownKeys = evaluateCriteria({ secureBoot: 'own-keys' });
  assert.ok(['nixos', 'talos', 'arch'].includes(ownKeys.bestMatch.distro.id));

  const tpm = evaluateCriteria({ tpmUsage: 'disk-unlock' });
  const freedos = tpm.allMatches.find((m) => m.distro.id === 'freedos');
  assert.ok(freedos && freedos.score < tpm.bestMatch.score);
});
