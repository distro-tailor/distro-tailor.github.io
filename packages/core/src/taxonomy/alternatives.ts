import { AlternativeComparison } from '../types.js';
import { DISTRO_REGISTRY } from './distros.js';

/**
 * Universal lookup helper to retrieve curated comparative rationales
 * explaining why a specific tailored distribution was chosen over common default household names.
 */
export function getDistroAlternatives(distroId: string): AlternativeComparison[] {
  const distro = DISTRO_REGISTRY.find((d) => d.id === distroId);
  return distro?.alternativeComparisons || [];
}

/**
 * Returns a dictionary mapping all distribution IDs to their comparative alternatives.
 */
export function getAllAlternativeComparisons(): Record<string, AlternativeComparison[]> {
  const map: Record<string, AlternativeComparison[]> = {};
  for (const distro of DISTRO_REGISTRY) {
    if (distro.alternativeComparisons && distro.alternativeComparisons.length > 0) {
      map[distro.id] = distro.alternativeComparisons;
    }
  }
  return map;
}
