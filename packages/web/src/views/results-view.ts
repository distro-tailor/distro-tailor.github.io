import { RecommendationOutput } from '@distro-tailor/core';
import { renderAlternativeComparisons } from '../components/alternatives.js';
import { renderPaidAlternatives } from '../components/paid-alternatives.js';
import { renderLegalCaveats } from '../components/legal-caveats.js';
import { getAddonCombos } from '../components/app-suites.js';
import { renderAppSuitePanel } from '../components/results/app-suite-panel.js';
import { renderBlueprintSummary } from '../components/results/blueprint-summary.js';
import { ResultsViewContext } from '../components/results/context.js';
import { renderDiyHeader } from '../components/results/diy-header.js';
import { renderHeadToHeadPanel } from '../components/results/head-to-head-panel.js';
import { renderPackageLayersPanel } from '../components/results/package-layers-panel.js';
import { renderRecipePanel } from '../components/results/recipe-panel.js';
import { renderSharedConfigBanner } from '../components/results/shared-config-banner.js';
import { renderResultsChangeBanner } from '../components/results/results-change-banner.js';
import { renderTurnkeyImageCard } from '../components/results/turnkey-image-card.js';
import { renderVerificationLadder } from '../components/results/verification-ladder.js';
import { renderWinnerBanner } from '../components/results/winner-banner.js';
import { FLATPAK_PREINSTALLED_DISTRO_IDS } from '../data/flatpak-defaults.js';
import { AppState } from '../state/store.js';
import { isServerContext, supportsAddOnApps } from '../utils/context-detector.js';

export function renderResultsView(evaluation: RecommendationOutput, state: AppState): string {
  const best = evaluation.bestMatch;
  const recipe = evaluation.recommendedRecipe;
  const combos = getAddonCombos(best.distro.id);
  const isServer = isServerContext(state.criteria);

  const dockerCount = new Set([
    ...(state.criteria.dockerApps || []),
    ...(state.criteria.dockerApp && state.criteria.dockerApp !== 'none' ? [state.criteria.dockerApp] : [])
  ]).size;
  const selectedAppsCount =
    (state.criteria.desktopApps?.length || 0) +
    (state.criteria.emulatorApps?.length || 0) +
    (state.criteria.navigationApps?.length || 0) +
    dockerCount +
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

  const hasPrebuiltOption = !!best.distro.prebuiltImage;
  const isNativeOnlyDistro =
    best.distro.id === 'yocto' ||
    best.distro.id === 'zephyr' ||
    (!!best.distro.osFamily && best.distro.osFamily !== 'linux');
  const showDiyTab = hasPrebuiltOption && !isNativeOnlyDistro;
  const hasCustomSelections = hasSelectedApps || hasFrankenstein || !!state.criteria.requiresCustomBuild;
  const activeMode: 'recommended' | 'diy' =
    state.resultsMode || (hasCustomSelections ? 'diy' : 'recommended');
  const prebuiltCtx: ResultsViewContext = { ...ctx, recipe: undefined };
  const recommendedCaveats = evaluation.legalCaveats.filter(
    (c) => c.id !== 'game-roms-and-bios' || c.distroIds?.includes(best.distro.id)
  );
  const diyCaveats = evaluation.legalCaveats.filter(
    (c) => c.id === 'game-roms-and-bios' && !c.distroIds?.includes(best.distro.id)
  );

  if (!showDiyTab) {
    return `
      <div class="space-y-6 min-w-0 max-w-full overflow-x-clip">

        ${renderSharedConfigBanner(ctx)}

        ${renderResultsChangeBanner(ctx)}

        ${renderWinnerBanner(ctx)}

        ${renderBlueprintSummary(ctx)}

        ${renderLegalCaveats(evaluation.legalCaveats)}

        ${renderAlternativeComparisons(best.distro)}

        ${renderPaidAlternatives(evaluation.paidAlternatives)}

        ${renderTurnkeyImageCard(ctx)}

        ${renderHeadToHeadPanel(ctx)}

        ${!isNativeOnlyDistro && supportsAddOnApps(state.criteria) ? renderAppSuitePanel(ctx) : ''}

        ${!isNativeOnlyDistro ? renderPackageLayersPanel(ctx) : ''}

        ${renderRecipePanel(ctx)}

        ${renderVerificationLadder(ctx)}

      </div>
    `;
  }

  return `
    <div class="space-y-6 min-w-0 max-w-full overflow-x-clip">

      ${renderSharedConfigBanner(ctx)}

      ${renderResultsChangeBanner(ctx)}

      ${renderBlueprintSummary(ctx)}

      <!-- 2-Tab Switcher: Official Recommended OS vs DIY Custom Build -->
      <div class="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg" role="tablist" aria-label="Results view mode">
        <button
          id="tab-results-recommended"
          type="button"
          role="tab"
          aria-selected="${activeMode === 'recommended'}"
          aria-controls="results-panel-recommended"
          data-results-mode="recommended"
          class="btn-results-mode flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeMode === 'recommended'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }"
        >
          <span>${best.distro.logoEmoji || '🐧'}</span>
          <span>${best.distro.name} (Recommended)</span>
        </button>
        <button
          id="tab-results-diy"
          type="button"
          role="tab"
          aria-selected="${activeMode === 'diy'}"
          aria-controls="results-panel-diy"
          data-results-mode="diy"
          class="btn-results-mode flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeMode === 'diy'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }"
        >
          <span>🛠️</span>
          <span>DIY Custom OS (From Scratch)</span>
          ${hasCustomSelections ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/30 text-indigo-200">Active</span>' : ''}
        </button>
      </div>

      <!-- Tab 1: Recommended Prebuilt OS -->
      <div id="results-panel-recommended" role="tabpanel" aria-labelledby="tab-results-recommended" class="space-y-6 min-w-0" ${activeMode === 'recommended' ? '' : 'hidden'}>
        ${renderWinnerBanner(prebuiltCtx)}

        ${renderLegalCaveats(recommendedCaveats)}

        <!-- 💡 Data-Driven Comparison: Why This Over Common Alternatives (e.g. Mint vs Ubuntu, Fedora vs RHEL) -->
        ${renderAlternativeComparisons(best.distro)}

        ${renderPaidAlternatives(evaluation.paidAlternatives)}

        ${renderTurnkeyImageCard(prebuiltCtx)}

        ${renderHeadToHeadPanel(prebuiltCtx)}

        ${renderVerificationLadder(prebuiltCtx)}
      </div>

      <!-- Tab 2: DIY Custom OS Builder -->
      <div id="results-panel-diy" role="tabpanel" aria-labelledby="tab-results-diy" class="space-y-6 min-w-0" ${activeMode === 'diy' ? '' : 'hidden'}>
        ${renderDiyHeader(ctx)}

        ${supportsAddOnApps(state.criteria) ? renderAppSuitePanel(ctx) : ''}

        ${renderLegalCaveats(diyCaveats)}

        ${renderPackageLayersPanel(ctx)}

        ${renderRecipePanel(ctx)}

        ${recipe ? renderVerificationLadder(ctx) : ''}
      </div>

    </div>
  `;
}
