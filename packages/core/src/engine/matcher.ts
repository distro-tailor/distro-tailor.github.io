import {
  DistroProfile,
  DistroScore,
  MatchReason,
  RecommendationOutput,
  UserCriteria
} from '../types.js';
import { DISTRO_REGISTRY } from '../taxonomy/distros.js';
import {
  AffinityTier,
  BOOT_MEDIUM_AFFINITIES,
  DESKTOP_USE_CASES,
  DRIVER_PHILOSOPHY_AFFINITIES,
  FORM_FACTOR_AFFINITIES,
  GUI_CAPABLE_DISTRO_IDS,
  PERIPHERAL_AFFINITIES,
  REALTIME_AUDIO_AFFINITIES,
  SINGLE_PURPOSE_APPLIANCE_USE_CASES,
  UNCONSTRAINED_BASELINE,
  UNIVERSAL_DEFAULT_DISTRO_IDS,
  WORKFLOW_STYLE_AFFINITIES,
  findAffinityTier
} from '../taxonomy/affinities.js';
import { resolveRecipeGenerator } from '../generators/index.js';
import { selectRecipeGenerator } from './recipe-selection.js';

const FOOTPRINT_ORDER = ['micro', 'minimal', 'lean', 'standard', 'full'];
const FLAGSHIP_USE_CASE_BONUS = 2; // Use case is the distro's primary focus
const EXACT_FOOTPRINT_BONUS = 2; // Distro sits exactly in the requested footprint tier

export function evaluateCriteria(
  criteria: UserCriteria,
  distros: DistroProfile[] = DISTRO_REGISTRY
): RecommendationOutput {
  // Calculate total maximum weight of criteria actually specified by the user.
  // Includes alignment bonuses so a perfect match lands at exactly 100% instead of saturating.
  let maxWeight = 0;
  if (criteria.useCase) maxWeight += 25 + FLAGSHIP_USE_CASE_BONUS;
  if (criteria.platform) maxWeight += 20;
  if (criteria.architecture) maxWeight += 20;
  if (criteria.footprint) maxWeight += 15 + EXACT_FOOTPRINT_BONUS;
  if (criteria.maxRamMb) maxWeight += 15;
  if (criteria.formFactor) maxWeight += 15;
  if (criteria.statePreference && criteria.statePreference !== 'no-preference') maxWeight += 10;
  if (criteria.cLibPreference && criteria.cLibPreference !== 'no-preference') maxWeight += 5;
  if (criteria.initPreference && criteria.initPreference !== 'no-preference') maxWeight += 5;
  if (criteria.experienceLevel) maxWeight += 5;
  if (criteria.releaseCadence) maxWeight += 10;
  if (criteria.driverPhilosophy && criteria.driverPhilosophy !== 'no-preference') maxWeight += 10;
  if (criteria.bootMedium) maxWeight += 10;
  if (criteria.prefersGui !== undefined) maxWeight += 10;
  if (criteria.workflowStyle && criteria.workflowStyle !== 'no-preference') maxWeight += 10;
  if (criteria.realtimeAudio) maxWeight += 15;
  const selectedPeripherals = (
    criteria.peripherals ||
    (criteria.peripheralNeed && criteria.peripheralNeed !== 'standard' ? [criteria.peripheralNeed] : [])
  ).filter((p) => p !== 'standard');
  if (selectedPeripherals.length > 0) {
    maxWeight += selectedPeripherals.length * 15;
  }

  // Criteria may arrive with explicitly undefined keys (e.g. a skipped question); only supplied values count.
  const isUnconstrained = Object.values(criteria).every((value) => value === undefined);

  if (maxWeight === 0) {
    maxWeight = 100; // Default baseline if nothing specified
  }

  const scoredDistros: DistroScore[] = distros.map((distro) => {
    let earned = 0;
    let isHardDisqualified = false;
    let hardDisqualificationReason = '';
    const reasons: MatchReason[] = [];

    // Applies the first matching curated affinity tier (see taxonomy/affinities.ts).
    const applyAffinity = (tiers: readonly AffinityTier[] | undefined): void => {
      const tier = findAffinityTier(tiers, distro, criteria);
      if (!tier) return;
      earned += tier.points;
      if (tier.feature) {
        reasons.push({
          feature: tier.feature,
          matched: tier.points > 0,
          explanation: tier.explanation ?? ''
        });
      }
    };

    // 0. Unconstrained Baseline (Zero Constraints Specified)
    if (isUnconstrained) {
      applyAffinity(UNCONSTRAINED_BASELINE);
    }

    // 1. Use Case Alignment (Weight: 25)
    if (criteria.useCase) {
      if (distro.primaryUseCases.includes(criteria.useCase)) {
        earned += 25;
        if (distro.primaryUseCases[0] === criteria.useCase) {
          earned += FLAGSHIP_USE_CASE_BONUS;
        }
        reasons.push({
          feature: 'Use Case',
          matched: true,
          explanation: `Specifically built or recognized for ${criteria.useCase}.`
        });
      } else {
        // Is the candidate a dedicated single-purpose appliance?
        const isDedicatedAppliance = distro.primaryUseCases.every((uc) =>
          SINGLE_PURPOSE_APPLIANCE_USE_CASES.includes(uc)
        );

        if (isDedicatedAppliance) {
          earned -= 25; // Severe penalty: dedicated appliance completely incompatible with target use case
          reasons.push({
            feature: 'Use Case',
            matched: false,
            explanation: `Dedicated appliance (${distro.primaryUseCases.join(', ')}) not suitable for ${criteria.useCase}.`
          });
        } else if (
          DESKTOP_USE_CASES.includes(criteria.useCase) &&
          distro.primaryUseCases.includes('desktop')
        ) {
          earned += 8; // Capable desktop fallback (e.g. Mint, Debian, Arch, Fedora)
          reasons.push({
            feature: 'Use Case',
            matched: true,
            explanation: `Versatile desktop distribution capable of ${criteria.useCase}.`
          });
        } else {
          earned -= 10; // Moderate deduction for generic mismatch
          reasons.push({
            feature: 'Use Case',
            matched: false,
            explanation: `Not primarily designed for ${criteria.useCase}.`
          });
        }
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
      const targetIdx = FOOTPRINT_ORDER.indexOf(criteria.footprint);
      const distroIdx = FOOTPRINT_ORDER.indexOf(distro.footprint);

      if (distroIdx <= targetIdx) {
        earned += 15;
        if (distroIdx === targetIdx) {
          earned += EXACT_FOOTPRINT_BONUS;
        }
        reasons.push({
          feature: 'Footprint',
          matched: true,
          explanation: `Fits within your ${criteria.footprint} size budget.`
        });
      } else {
        // If distro is larger than target footprint:
        // If machine has sufficient RAM (minRamMb <= maxRamMb), scale penalty proportionally
        const tierDiff = distroIdx - targetIdx;
        const ramFits = !criteria.maxRamMb || distro.minRamMb <= criteria.maxRamMb;
        const penalty = ramFits ? Math.min(15, tierDiff * 5) : 15;
        earned -= penalty;
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

    // 4B. Form Factor & Thermal / Power Envelope (Weight: 15)
    if (criteria.formFactor) {
      applyAffinity(FORM_FACTOR_AFFINITIES[criteria.formFactor]);
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
      } else {
        earned -= 10;
        reasons.push({
          feature: 'State Model',
          matched: false,
          explanation: `Uses ${distro.stateModel} rather than ${criteria.statePreference} architecture.`
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

    // 8. Release Cadence (Weight: 10)
    if (criteria.releaseCadence) {
      if (criteria.releaseCadence === 'rolling' && distro.rollingRelease) {
        earned += 10;
        reasons.push({
          feature: 'Release Cadence',
          matched: true,
          explanation: 'Continuous rolling release model provides the latest software packages without full OS upgrades.'
        });
      } else if (criteria.releaseCadence === 'lts' && !distro.rollingRelease) {
        earned += 10;
        reasons.push({
          feature: 'Release Cadence',
          matched: true,
          explanation: 'Predictable long-term enterprise point releases with rock-solid stability.'
        });
      } else if (criteria.releaseCadence === 'standard') {
        earned += 7;
        reasons.push({
          feature: 'Release Cadence',
          matched: true,
          explanation: 'Standard scheduled release cycle with modern stable packages.'
        });
      } else {
        reasons.push({
          feature: 'Release Cadence',
          matched: false,
          explanation: distro.rollingRelease ? 'Uses rolling updates rather than LTS releases.' : 'Uses fixed point releases rather than continuous rolling updates.'
        });
      }
    }

    // 9. GUI vs Headless Interface (Weight: 10)
    if (criteria.prefersGui !== undefined) {
      const isGuiDistro =
        distro.platforms.includes('desktop') ||
        distro.platforms.includes('kiosk') ||
        GUI_CAPABLE_DISTRO_IDS.includes(distro.id);
      if (criteria.prefersGui && isGuiDistro) {
        earned += 10;
        reasons.push({
          feature: 'Display Server',
          matched: true,
          explanation: 'First-class support for graphical desktop interfaces and Wayland/X11 compositors.'
        });
      } else if (!criteria.prefersGui && !isGuiDistro) {
        earned += 10;
        reasons.push({
          feature: 'Headless Mode',
          matched: true,
          explanation: 'Optimized for headless server, container, or terminal-first operations.'
        });
      }
    }

    // 9B. Desktop Workflow & Interface Familiarity (Weight: 10)
    if (criteria.workflowStyle) {
      applyAffinity(WORKFLOW_STYLE_AFFINITIES[criteria.workflowStyle]);
    }

    // 10. Driver Philosophy (Weight: 10)
    if (criteria.driverPhilosophy) {
      applyAffinity(DRIVER_PHILOSOPHY_AFFINITIES[criteria.driverPhilosophy]);
    }

    // 11. Boot Medium (Weight: 10)
    if (criteria.bootMedium) {
      applyAffinity(BOOT_MEDIUM_AFFINITIES[criteria.bootMedium]);
    }

    // 12. Realtime Pro Audio (Weight: 15)
    if (criteria.realtimeAudio) {
      applyAffinity(REALTIME_AUDIO_AFFINITIES);
    }

    // 13. Specialized Hardware & Peripherals (Weight: 15 per selected peripheral)
    for (const p of selectedPeripherals) {
      applyAffinity(PERIPHERAL_AFFINITIES[p]);
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
  // 5. Universal desktop defaults (Mint, Ubuntu, Fedora)
  // 6. Alphabetical by name
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
    const aDefIndex = UNIVERSAL_DEFAULT_DISTRO_IDS.indexOf(a.distro.id);
    const bDefIndex = UNIVERSAL_DEFAULT_DISTRO_IDS.indexOf(b.distro.id);
    if (aDefIndex !== -1 || bDefIndex !== -1) {
      if (aDefIndex === -1) return 1;
      if (bDefIndex === -1) return -1;
      return aDefIndex - bDefIndex;
    }
    return a.distro.name.localeCompare(b.distro.name);
  });

  const bestMatch = scoredDistros[0];

  const targetGeneratorId = selectRecipeGenerator(criteria, bestMatch.distro);
  const recommendedRecipe = targetGeneratorId
    ? resolveRecipeGenerator(targetGeneratorId, criteria)
    : undefined;

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
