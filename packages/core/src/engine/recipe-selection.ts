import { DistroProfile, RecipeGeneratorId, UserCriteria } from '../types.js';

/**
 * Ordered recipe selection rules. The first rule whose `when` matches picks the generator,
 * so deployment-target rules (WSL2, VM) take precedence over the best match's own recipe.
 */
interface RecipeSelectionRule {
  description: string;
  when: (criteria: UserCriteria, bestMatch: DistroProfile) => boolean;
  recipe: (bestMatch: DistroProfile) => RecipeGeneratorId | undefined;
}

function hasExplicitRecipeModifiers(criteria: UserCriteria): boolean {
  return !!(
    criteria.requiresCustomBuild ||
    criteria.enableDistrobox ||
    criteria.enableNix ||
    criteria.dockerApp ||
    (criteria.dockerApps && criteria.dockerApps.length > 0) ||
    (criteria.desktopApps && criteria.desktopApps.length > 0) ||
    (criteria.emulatorApps && criteria.emulatorApps.length > 0) ||
    (criteria.navigationApps && criteria.navigationApps.length > 0)
  );
}

export const RECIPE_SELECTION_RULES: readonly RecipeSelectionRule[] = [
  {
    description: 'WSL2 target always builds a WSL rootfs tarball',
    when: (c) => c.platform === 'wsl2',
    recipe: () => 'wsl2-debian'
  },
  {
    description: 'VM target always builds a cloud-init qcow2 image',
    when: (c) => c.platform === 'vm',
    recipe: () => 'cloud-init-qcow2'
  },
  {
    description: 'Hypervisor use case builds a Proxmox LXC template',
    when: (c) => c.useCase === 'hypervisor-vms',
    recipe: () => 'proxmox-lxc'
  },
  {
    description: 'Embedded IoT use case builds a Buildroot image (unless Yocto or Zephyr is the winner)',
    when: (c, best) => c.useCase === 'iot-embedded' && best.id !== 'yocto' && best.id !== 'zephyr',
    recipe: () => 'buildroot-embedded'
  },
  {
    description: "Best match's own recipe generator",
    when: (_c, best) => !!best.recipeGeneratorId,
    recipe: (best) => best.recipeGeneratorId
  },
  {
    description: 'Explicit customizations on Alpine-based distros fall back to an Alpine chroot build',
    when: (c, best) => hasExplicitRecipeModifiers(c) && best.cLibraries.includes('musl') && best.packageManager === 'apk',
    recipe: () => 'alpine-chroot'
  },
  {
    description: 'Explicit customizations on Fedora/RHEL-based distros fall back to a Fedora DNF build',
    when: (c, best) =>
      hasExplicitRecipeModifiers(c) &&
      (best.packageManager?.includes('dnf') || best.packageManager?.includes('rpm-ostree') || false),
    recipe: () => 'fedora-dnf'
  },
  {
    description: 'Explicit customizations on openSUSE distros fall back to an openSUSE Zypper build',
    when: (c, best) => hasExplicitRecipeModifiers(c) && best.packageManager === 'zypper',
    recipe: () => 'opensuse-zypper'
  },
  {
    description: 'Explicit customizations on Void Linux fall back to a Void XBPS build',
    when: (c, best) => hasExplicitRecipeModifiers(c) && best.packageManager === 'xbps',
    recipe: () => 'void-xbps'
  },
  {
    description: 'Explicit customizations on Arch Linux fall back to an Arch pacstrap build',
    when: (c, best) => hasExplicitRecipeModifiers(c) && best.packageManager === 'pacman',
    recipe: () => 'arch-pacstrap'
  },
  {
    description: 'Explicit customizations on Gentoo Linux fall back to a Gentoo Portage build',
    when: (c, best) => hasExplicitRecipeModifiers(c) && (best.packageManager?.includes('portage') || false),
    recipe: () => 'gentoo-portage'
  },
  {
    description: 'Explicit customizations on FreeBSD generate a FreeBSD pkg/PF provisioning recipe',
    when: (c, best) => hasExplicitRecipeModifiers(c) && best.id === 'freebsd',
    recipe: () => 'freebsd-pkg'
  },
  {
    description: 'Explicit customizations on OpenBSD generate an OpenBSD pkg_add/PF provisioning recipe',
    when: (c, best) => hasExplicitRecipeModifiers(c) && best.id === 'openbsd',
    recipe: () => 'openbsd-pkg'
  },
  {
    description: 'Explicit customizations fall back to a Debian debootstrap build',
    when: (c) => hasExplicitRecipeModifiers(c),
    recipe: () => 'debootstrap-debian'
  }
];

export function selectRecipeGenerator(
  criteria: UserCriteria,
  bestMatch: DistroProfile
): RecipeGeneratorId | undefined {
  return RECIPE_SELECTION_RULES.find((rule) => rule.when(criteria, bestMatch))?.recipe(bestMatch);
}
