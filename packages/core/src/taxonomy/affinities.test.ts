import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISTRO_REGISTRY } from './distros.js';
import {
  AffinityTier,
  BOOT_MEDIUM_AFFINITIES,
  BOOTLOADER_AFFINITIES,
  DEVICE_PASSTHROUGH_AFFINITIES,
  DRIVER_PHILOSOPHY_AFFINITIES,
  FILESYSTEM_AFFINITIES,
  FIRMWARE_MODE_AFFINITIES,
  SECURE_BOOT_AFFINITIES,
  TPM_USAGE_AFFINITIES,
  FORM_FACTOR_AFFINITIES,
  GUI_CAPABLE_DISTRO_IDS,
  KERNEL_FLAVOR_AFFINITIES,
  NETWORKING_STACK_AFFINITIES,
  PERIPHERAL_AFFINITIES,
  REALTIME_AUDIO_AFFINITIES,
  SECURITY_PROFILE_AFFINITIES,
  UNCONSTRAINED_BASELINE,
  UNIVERSAL_DEFAULT_DISTRO_IDS,
  VIRT_HOST_AFFINITIES,
  WORKFLOW_STYLE_AFFINITIES
} from './affinities.js';

const TABLES: Record<string, Readonly<Record<string, readonly AffinityTier[]>>> = {
  formFactor: FORM_FACTOR_AFFINITIES,
  workflowStyle: WORKFLOW_STYLE_AFFINITIES,
  driverPhilosophy: DRIVER_PHILOSOPHY_AFFINITIES,
  bootMedium: BOOT_MEDIUM_AFFINITIES,
  peripherals: PERIPHERAL_AFFINITIES,
  realtimeAudio: { enabled: REALTIME_AUDIO_AFFINITIES },
  fileSystem: FILESYSTEM_AFFINITIES,
  firmwareMode: FIRMWARE_MODE_AFFINITIES,
  secureBoot: SECURE_BOOT_AFFINITIES,
  tpmUsage: TPM_USAGE_AFFINITIES,
  virtHost: VIRT_HOST_AFFINITIES,
  devicePassthrough: DEVICE_PASSTHROUGH_AFFINITIES,
  kernelFlavor: KERNEL_FLAVOR_AFFINITIES,
  bootloader: BOOTLOADER_AFFINITIES,
  securityProfile: SECURITY_PROFILE_AFFINITIES,
  networkingStack: NETWORKING_STACK_AFFINITIES,
  baseline: { none: UNCONSTRAINED_BASELINE }
};

function allTiers(): Array<{ where: string; tier: AffinityTier }> {
  return Object.entries(TABLES).flatMap(([name, table]) =>
    Object.entries(table).flatMap(([value, tiers]) =>
      tiers.map((tier, i) => ({ where: `${name}.${value}[${i}]`, tier }))
    )
  );
}

test('Affinities: every referenced distro id exists in DISTRO_REGISTRY', () => {
  const known = new Set(DISTRO_REGISTRY.map((d) => d.id));
  const referenced = [
    ...allTiers().flatMap(({ where, tier }) => (tier.distroIds ?? []).map((id) => ({ where, id }))),
    ...GUI_CAPABLE_DISTRO_IDS.map((id) => ({ where: 'GUI_CAPABLE_DISTRO_IDS', id })),
    ...UNIVERSAL_DEFAULT_DISTRO_IDS.map((id) => ({ where: 'UNIVERSAL_DEFAULT_DISTRO_IDS', id }))
  ];
  const unknown = referenced.filter(({ id }) => !known.has(id));
  assert.deepEqual(unknown, [], 'Affinity tables reference distro ids missing from the registry');
});

test('Affinities: each tier targets distros by id or predicate, and reasons carry an explanation', () => {
  for (const { where, tier } of allTiers()) {
    assert.ok(!!tier.distroIds !== !!tier.appliesTo, `${where} must set exactly one of distroIds / appliesTo`);
    if (tier.feature) assert.ok(tier.explanation, `${where} has a feature but no explanation`);
    assert.ok(tier.points !== 0, `${where} awards zero points`);
  }
});
