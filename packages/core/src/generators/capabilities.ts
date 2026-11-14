import { RecipeGeneratorId, UserCriteria } from '../types.js';

export type RecipeOptionKey =
  | 'fileSystem'
  | 'kernelFlavor'
  | 'bootloader'
  | 'securityProfile'
  | 'networkingStack'
  | 'firmwareMode'
  | 'secureBoot'
  | 'tpmUsage'
  | 'virtHost'
  | 'devicePassthrough'
  | 'guestPlatform';

export const RECIPE_OPTION_LABELS: Readonly<Record<RecipeOptionKey, string>> = {
  fileSystem: 'Filesystem',
  kernelFlavor: 'Kernel Flavor',
  bootloader: 'Bootloader',
  securityProfile: 'Security Profile',
  networkingStack: 'Networking Stack',
  firmwareMode: 'Firmware Mode',
  secureBoot: 'Secure Boot',
  tpmUsage: 'TPM 2.0 Usage',
  virtHost: 'Virtualization Host',
  devicePassthrough: 'Device Passthrough',
  guestPlatform: 'VM Guest Platform'
};

/**
 * Criteria options honored by each recipe generator.
 * Typed as a Record over RecipeGeneratorId so adding a new generator requires declaring its capabilities.
 */
export const RECIPE_CAPABILITIES: Readonly<Record<RecipeGeneratorId, readonly RecipeOptionKey[]>> = {
  'debootstrap-debian': [
    'fileSystem',
    'kernelFlavor',
    'bootloader',
    'securityProfile',
    'networkingStack',
    'firmwareMode',
    'secureBoot',
    'tpmUsage',
    'virtHost',
    'devicePassthrough'
  ],
  'nixos-flake': [
    'fileSystem',
    'kernelFlavor',
    'bootloader',
    'securityProfile',
    'networkingStack',
    'firmwareMode',
    'secureBoot',
    'tpmUsage',
    'virtHost',
    'devicePassthrough',
    'guestPlatform'
  ],
  'cloud-init-qcow2': ['fileSystem', 'firmwareMode', 'secureBoot', 'tpmUsage', 'guestPlatform'],
  'alpine-chroot': [
    'fileSystem',
    'kernelFlavor',
    'bootloader',
    'networkingStack',
    'firmwareMode',
    'secureBoot',
    'tpmUsage',
    'virtHost',
    'devicePassthrough'
  ],
  'buildroot-embedded': [
    'fileSystem',
    'kernelFlavor',
    'bootloader',
    'networkingStack',
    'firmwareMode',
    'secureBoot',
    'tpmUsage',
    'virtHost',
    'devicePassthrough'
  ],
  'kiosk-web': [],
  'distroless-docker': [],
  'wasm-browser': [],
  'wsl2-debian': [],
  'proxmox-lxc': []
};

export function computeRecipeWarnings(recipeId: RecipeGeneratorId, criteria: UserCriteria): string[] {
  const warnings: string[] = [];
  const supported = new Set<RecipeOptionKey>(RECIPE_CAPABILITIES[recipeId]);

  for (const key of Object.keys(RECIPE_OPTION_LABELS) as RecipeOptionKey[]) {
    const value = criteria[key];
    if (value && !supported.has(key)) {
      warnings.push(
        `Selected ${RECIPE_OPTION_LABELS[key]} (${value}) is not configured by the ${recipeId} recipe.`
      );
    }
  }

  if (criteria.architecture === 'arm64' && criteria.firmwareMode === 'legacy-bios') {
    warnings.push('Legacy BIOS boot is not supported on ARM64; UEFI is used instead.');
  }

  if (criteria.architecture === 'arm64' && criteria.virtHost === 'xen' && recipeId === 'alpine-chroot') {
    warnings.push('Xen host packages in Alpine are only available for x86_64, not ARM64.');
  }

  if (criteria.guestPlatform === 'virtualbox' && recipeId === 'cloud-init-qcow2') {
    warnings.push(
      'Debian bookworm does not ship virtualbox-guest-utils; install VirtualBox Guest Additions from the host ISO if needed.'
    );
  }

  return warnings;
}
