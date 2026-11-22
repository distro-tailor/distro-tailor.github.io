import { GeneratedRecipe, RecipeGeneratorId, UserCriteria } from '../types.js';
import { generateDebootstrapRecipe } from './debootstrap.js';
import { generateFedoraRecipe } from './fedora.js';
import { generateAlpineRecipe } from './alpine.js';
import { generateBuildrootRecipe } from './buildroot.js';
import { generateKioskRecipe } from './kiosk.js';
import { generateContainerRecipe } from './container.js';
import { generateWasmRecipe } from './wasm.js';
import { generateCloudInitRecipe } from './cloud-init.js';
import { generateWslRecipe } from './wsl.js';
import { generateLxcRecipe } from './lxc.js';
import { generateNixosRecipe } from './nixos.js';
import { sanitizeCriteria } from '../taxonomy/criteria-schema.js';
import { computeRecipeWarnings } from './capabilities.js';

export * from './docker-apps.js';
export * from './desktop-apps.js';
export * from './emulator-apps.js';
export * from './navigation-apps.js';
export * from './nixos.js';
export * from './capabilities.js';

/** Every recipe generator by id. Typed as a Record so adding a RecipeGeneratorId requires a generator. */
export const RECIPE_GENERATORS: Readonly<Record<RecipeGeneratorId, (criteria: UserCriteria) => GeneratedRecipe>> = {
  'debootstrap-debian': generateDebootstrapRecipe,
  'fedora-dnf': generateFedoraRecipe,
  'alpine-chroot': generateAlpineRecipe,
  'buildroot-embedded': generateBuildrootRecipe,
  'kiosk-web': generateKioskRecipe,
  'distroless-docker': generateContainerRecipe,
  'wasm-browser': generateWasmRecipe,
  'cloud-init-qcow2': generateCloudInitRecipe,
  'wsl2-debian': generateWslRecipe,
  'proxmox-lxc': generateLxcRecipe,
  'nixos-flake': generateNixosRecipe
};

export function isRecipeGeneratorId(value: unknown): value is RecipeGeneratorId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(RECIPE_GENERATORS, value);
}

export function resolveRecipeGenerator(
  generatorId: RecipeGeneratorId,
  untrustedCriteria: UserCriteria
): GeneratedRecipe {
  // Generators interpolate criteria into shell scripts; re-validate regardless of caller.
  const criteria = sanitizeCriteria(untrustedCriteria);
  const id: RecipeGeneratorId = isRecipeGeneratorId(generatorId) ? generatorId : 'debootstrap-debian';
  const recipe = RECIPE_GENERATORS[id](criteria);
  const warnings = computeRecipeWarnings(id, criteria);
  return warnings.length > 0 ? { ...recipe, warnings } : recipe;
}
