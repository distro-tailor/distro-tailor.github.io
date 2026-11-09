import { GeneratedRecipe, RecipeGeneratorId, UserCriteria } from '../types.js';
import { generateDebootstrapRecipe } from './debootstrap.js';
import { generateAlpineRecipe } from './alpine.js';
import { generateBuildrootRecipe } from './buildroot.js';
import { generateKioskRecipe } from './kiosk.js';
import { generateContainerRecipe } from './container.js';
import { generateWasmRecipe } from './wasm.js';
import { generateCloudInitRecipe } from './cloud-init.js';
import { generateWslRecipe } from './wsl.js';
import { generateLxcRecipe } from './lxc.js';

export function resolveRecipeGenerator(
  generatorId: RecipeGeneratorId,
  criteria: UserCriteria
): GeneratedRecipe {
  switch (generatorId) {
    case 'debootstrap-debian':
      return generateDebootstrapRecipe(criteria);
    case 'alpine-chroot':
      return generateAlpineRecipe(criteria);
    case 'buildroot-embedded':
      return generateBuildrootRecipe(criteria);
    case 'kiosk-web':
      return generateKioskRecipe(criteria);
    case 'distroless-docker':
      return generateContainerRecipe(criteria);
    case 'wasm-browser':
      return generateWasmRecipe(criteria);
    case 'cloud-init-qcow2':
      return generateCloudInitRecipe(criteria);
    case 'wsl2-debian':
      return generateWslRecipe(criteria);
    case 'proxmox-lxc':
      return generateLxcRecipe(criteria);
    default:
      return generateDebootstrapRecipe(criteria);
  }
}
