import {
  DistroProfile,
  DistroScore,
  MatchReason,
  RecommendationOutput,
  UserCriteria
} from '../types.js';
import { DISTRO_REGISTRY } from '../taxonomy/distros.js';
import { resolveRecipeGenerator } from '../generators/index.js';

export function evaluateCriteria(
  criteria: UserCriteria,
  distros: DistroProfile[] = DISTRO_REGISTRY
): RecommendationOutput {
  // Calculate total maximum weight of criteria actually specified by the user
  let maxWeight = 0;
  if (criteria.useCase) maxWeight += 25;
  if (criteria.platform) maxWeight += 20;
  if (criteria.architecture) maxWeight += 20;
  if (criteria.footprint) maxWeight += 15;
  if (criteria.maxRamMb) maxWeight += 15;
  if (criteria.statePreference && criteria.statePreference !== 'no-preference') maxWeight += 10;
  if (criteria.cLibPreference && criteria.cLibPreference !== 'no-preference') maxWeight += 5;
  if (criteria.initPreference && criteria.initPreference !== 'no-preference') maxWeight += 5;
  if (criteria.experienceLevel) maxWeight += 5;

  if (maxWeight === 0) {
    maxWeight = 100; // Default baseline if nothing specified
  }

  const scoredDistros: DistroScore[] = distros.map((distro) => {
    let earned = 0;
    let isHardDisqualified = false;
    let hardDisqualificationReason = '';
    const reasons: MatchReason[] = [];

    // 1. Use Case Alignment (Weight: 25)
    if (criteria.useCase) {
      if (distro.primaryUseCases.includes(criteria.useCase)) {
        earned += 25;
        if (distro.primaryUseCases[0] === criteria.useCase) {
          earned += 2; // Bonus for flagship primary focus
        }
        reasons.push({
          feature: 'Use Case',
          matched: true,
          explanation: `Specifically built or recognized for ${criteria.useCase}.`
        });
      } else {
        reasons.push({
          feature: 'Use Case',
          matched: false,
          explanation: `Not primarily designed for ${criteria.useCase}.`
        });
      }
    }

    // 2. Platform Target (Weight: 20)
    if (criteria.platform) {
      if (distro.platforms.includes(criteria.platform)) {
        earned += 20;
        reasons.push({
          feature: 'Platform',
          matched: true,
          explanation: `First-class support for ${criteria.platform}.`
        });
      } else {
        earned -= 10;
        reasons.push({
          feature: 'Platform',
          matched: false,
          explanation: `Not optimized for ${criteria.platform}.`
        });
      }
    }

    // 3. CPU Architecture (Weight: 20 - Hard Physical Disqualifier Gate)
    if (criteria.architecture) {
      if (distro.architectures.includes(criteria.architecture)) {
        earned += 20;
        reasons.push({
          feature: 'Architecture',
          matched: true,
          explanation: `Supports ${criteria.architecture} hardware.`
        });
      } else {
        isHardDisqualified = true;
        hardDisqualificationReason = `Cannot run on ${criteria.architecture} hardware (unsupported CPU architecture).`;
        reasons.push({
          feature: 'Architecture',
          matched: false,
          explanation: hardDisqualificationReason
        });
      }
    }

    // 4. Storage Footprint & RAM Budget (Weight: 15 + 15)
    if (criteria.footprint) {
      const footprintOrder = ['micro', 'minimal', 'lean', 'standard', 'full'];
      const targetIdx = footprintOrder.indexOf(criteria.footprint);
      const distroIdx = footprintOrder.indexOf(distro.footprint);

      if (distroIdx <= targetIdx) {
        earned += 15;
        // Bonus for exact footprint tier alignment
        if (distroIdx === targetIdx) {
          earned += 2;
        }
        reasons.push({
          feature: 'Footprint',
          matched: true,
          explanation: `Fits within your ${criteria.footprint} size budget.`
        });
      } else {
        earned -= 15;
        reasons.push({
          feature: 'Footprint',
          matched: false,
          explanation: `Exceeds your ${criteria.footprint} size budget (requires ${distro.footprint}).`
        });
      }
    }

    if (criteria.maxRamMb) {
      if (distro.minRamMb <= criteria.maxRamMb) {
        earned += 15;
        reasons.push({
          feature: 'RAM Budget',
          matched: true,
          explanation: `Requires ${distro.minRamMb} MB RAM, fits within your ${criteria.maxRamMb} MB budget.`
        });
      } else {
        earned -= 30; // Heavy penalty: exceeds physically installed RAM
        reasons.push({
          feature: 'RAM Budget',
          matched: false,
          explanation: `Requires minimum ${distro.minRamMb} MB RAM, which exceeds your ${criteria.maxRamMb} MB hardware budget.`
        });
      }
    }

    // 5. State Model & Immutability (Weight: 10)
    if (criteria.statePreference && criteria.statePreference !== 'no-preference') {
      if (distro.stateModel === criteria.statePreference) {
        earned += 10;
        reasons.push({
          feature: 'State Model',
          matched: true,
          explanation: `Employs ${criteria.statePreference} state model.`
        });
      }
    }

    // 6. C-Library / Init (Weight: 10)
    if (criteria.cLibPreference && criteria.cLibPreference !== 'no-preference') {
      if (distro.cLibraries.includes(criteria.cLibPreference)) {
        earned += 5;
        reasons.push({
          feature: 'C Library',
          matched: true,
          explanation: `Supports ${criteria.cLibPreference} libc.`
        });
      }
    }
    if (criteria.initPreference && criteria.initPreference !== 'no-preference') {
      if (distro.initSystems.includes(criteria.initPreference)) {
        earned += 5;
        reasons.push({
          feature: 'Init System',
          matched: true,
          explanation: `Supports ${criteria.initPreference} init system.`
        });
      }
    }

    // 7. Experience Level Alignment (Weight: 5)
    if (criteria.experienceLevel) {
      if (distro.experienceLevel === criteria.experienceLevel) {
        earned += 5;
        reasons.push({
          feature: 'Experience Level',
          matched: true,
          explanation: `Matches your ${criteria.experienceLevel} comfort zone.`
        });
      } else if (criteria.experienceLevel === 'beginner' && distro.experienceLevel === 'systems-engineer') {
        earned -= 15; // Don't recommend a source-compilation distro to a beginner
        reasons.push({
          feature: 'Experience Level',
          matched: false,
          explanation: `Requires advanced low-level source compilation (not ideal for beginners).`
        });
      }
    }

    // Normalized relative compatibility score (0 - 100%). Hard disqualifications are locked to 0%.
    const normalizedScore = isHardDisqualified ? 0 : Math.max(0, Math.min(100, Math.round((earned / maxWeight) * 100)));

    return {
      distro,
      score: normalizedScore,
      reasons
    };
  });

  // Deterministic, fact-based tie breaking:
  // 1. Primary score descending
  // 2. Flagship use-case alignment
  // 3. Lower minimum RAM footprint
  // 4. Exact experience level match
  // 5. Alphabetical by name
  scoredDistros.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (criteria.useCase) {
      const aFlagship = a.distro.primaryUseCases[0] === criteria.useCase;
      const bFlagship = b.distro.primaryUseCases[0] === criteria.useCase;
      if (aFlagship !== bFlagship) return aFlagship ? -1 : 1;
    }
    if (criteria.maxRamMb && a.distro.minRamMb !== b.distro.minRamMb) {
      return a.distro.minRamMb - b.distro.minRamMb;
    }
    if (criteria.experienceLevel) {
      const aExp = a.distro.experienceLevel === criteria.experienceLevel;
      const bExp = b.distro.experienceLevel === criteria.experienceLevel;
      if (aExp !== bExp) return aExp ? -1 : 1;
    }
    return a.distro.name.localeCompare(b.distro.name);
  });

  const bestMatch = scoredDistros[0];

  // Resolve recipe generator if requested or available
  let recommendedRecipe;
  const targetGeneratorId =
    criteria.platform === 'wsl2'
      ? 'wsl2-debian'
      : criteria.platform === 'vm'
      ? 'cloud-init-qcow2'
      : criteria.useCase === 'hypervisor-vms'
      ? 'proxmox-lxc'
      : criteria.useCase === 'iot-embedded'
      ? 'buildroot-embedded'
      : bestMatch.distro.recipeGeneratorId || 'debootstrap-debian';

  if (targetGeneratorId) {
    recommendedRecipe = resolveRecipeGenerator(targetGeneratorId, criteria);
  }

  const summary = `Evaluated ${distros.length} distributions. Top match is ${bestMatch.distro.name} with a ${bestMatch.score}% compatibility score.`;

  return {
    topMatches: scoredDistros.slice(0, 5),
    allMatches: scoredDistros,
    bestMatch,
    customRecipeAvailable: !!recommendedRecipe,
    recommendedRecipe,
    summaryText: summary
  };
}
