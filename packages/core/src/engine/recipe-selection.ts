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
    (criteria.desktopApps && criteria.desktopApps.length > 0) ||
    (criteria.emulatorApps && criteria.emulatorApps.length > 0)
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
    description: 'Embedded IoT use case builds a Buildroot image',
    when: (c) => c.useCase === 'iot-embedded',
    recipe: () => 'buildroot-embedded'
  },
  {
    description: "Best match's own recipe generator",
    when: (_c, best) => !!best.recipeGeneratorId,
    recipe: (best) => best.recipeGeneratorId
  },
  {
    description: 'Explicit customizations fall back to a Debian debootstrap build (Arch has no Debian base)',
    when: (c, best) => hasExplicitRecipeModifiers(c) && best.id !== 'arch',
    recipe: () => 'debootstrap-debian'
  }
];

export function selectRecipeGenerator(
  criteria: UserCriteria,
  bestMatch: DistroProfile
): RecipeGeneratorId | undefined {
  return RECIPE_SELECTION_RULES.find((rule) => rule.when(criteria, bestMatch))?.recipe(bestMatch);
}
