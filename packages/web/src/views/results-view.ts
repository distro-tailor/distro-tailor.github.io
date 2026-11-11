import { RecommendationOutput } from '@distro-tailor/core';
import { renderAlternativeComparisons } from '../components/alternatives.js';
import { getAddonCombos } from '../components/app-suites.js';
import { renderAppSuitePanel } from '../components/results/app-suite-panel.js';
import { renderBlueprintSummary } from '../components/results/blueprint-summary.js';
import { ResultsViewContext } from '../components/results/context.js';
import { renderHeadToHeadPanel } from '../components/results/head-to-head-panel.js';
import { renderPackageLayersPanel } from '../components/results/package-layers-panel.js';
import { renderRecipePanel } from '../components/results/recipe-panel.js';
import { renderSharedConfigBanner } from '../components/results/shared-config-banner.js';
import { renderTurnkeyImageCard } from '../components/results/turnkey-image-card.js';
import { renderVerificationLadder } from '../components/results/verification-ladder.js';
import { renderWinnerBanner } from '../components/results/winner-banner.js';
import { FLATPAK_PREINSTALLED_DISTRO_IDS } from '../data/flatpak-defaults.js';
import { AppState } from '../state/store.js';
import { isServerContext } from '../utils/context-detector.js';

export function renderResultsView(evaluation: RecommendationOutput, state: AppState): string {
  const best = evaluation.bestMatch;
  const recipe = evaluation.recommendedRecipe;
  const combos = getAddonCombos(best.distro.id);
  const isServer = isServerContext(state.criteria);

  const selectedAppsCount =
    (state.criteria.desktopApps?.length || 0) +
    (state.criteria.emulatorApps?.length || 0) +
    (state.criteria.dockerApp ? 1 : 0) +
    (state.criteria.desktopEnv ? 1 : 0);
  const hasSelectedApps = selectedAppsCount > 0;

  const hasFrankenstein = !!(
    state.criteria.enableDistrobox ||
    state.criteria.enableNix ||
    state.criteria.enableFlatpak
  );

  const hasFlatpakDefault = FLATPAK_PREINSTALLED_DISTRO_IDS.includes(best.distro.id);

  const ctx: ResultsViewContext = {
    evaluation,
    state,
    best,
    recipe,
    combos,
    isServer,
    selectedAppsCount,
    hasSelectedApps,
    hasFrankenstein,
    hasFlatpakDefault
  };

  return `
    <div class="space-y-6 min-w-0 max-w-full overflow-hidden">

      ${renderSharedConfigBanner(ctx)}

      ${renderWinnerBanner(ctx)}

      ${renderBlueprintSummary(ctx)}

      <!-- 💡 Data-Driven Comparison: Why This Over Common Alternatives (e.g. Mint vs Ubuntu, Fedora vs RHEL) -->
      ${renderAlternativeComparisons(best.distro)}

      ${renderTurnkeyImageCard(ctx)}

      <!-- ========================================================================= -->
      <!-- PROGRESSIVE DISCLOSURE: OPTIONAL / ADVANCED SYSTEM CUSTOMIZATION PANELS   -->
      <!-- ========================================================================= -->

      ${renderAppSuitePanel(ctx)}

      ${renderHeadToHeadPanel(ctx)}

      ${renderPackageLayersPanel(ctx)}

      ${renderRecipePanel(ctx)}

      ${renderVerificationLadder(ctx)}

    </div>
  `;
}
