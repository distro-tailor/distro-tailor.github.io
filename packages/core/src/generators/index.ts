import { GeneratedRecipe, RecipeGeneratorId, UserCriteria } from '../types.js';
import { generateDebootstrapRecipe } from './debootstrap.js';
import { generateAlpineRecipe } from './alpine.js';
import { generateBuildrootRecipe } from './buildroot.js';
import { generateKioskRecipe } from './kiosk.js';
import { generateContainerRecipe } from './container.js';
import { generateWasmRecipe } from './wasm.js';

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
    default:
      return generateDebootstrapRecipe(criteria);
  }
}
