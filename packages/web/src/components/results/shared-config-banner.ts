import { ResultsViewContext } from './context.js';

/** Notice shown when the results were opened from a shared link. */
export function renderSharedConfigBanner(ctx: ResultsViewContext): string {
  const { state, recipe } = ctx;
  return `
      <!-- Shared Configuration Notice Banner -->
      ${
        state.isSharedView
          ? `
        <div class="bg-indigo-950/40 border border-indigo-700/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xl animate-in fade-in min-w-0 overflow-hidden">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-600/40 flex items-center justify-center text-xl shrink-0">
              🔗
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-bold text-indigo-100 text-sm break-words">You are viewing a shared tailored OS build!</h4>
              <p class="text-slate-400 text-[11px] mt-0.5 break-words">
                Configured with <strong>${Object.keys(state.criteria).length} tailored criteria</strong>. You can inspect the recipe, tweak any choice, or start your own build.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
            <button id="btn-tweak-shared" class="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md cursor-pointer">
              Tweak Choices
            </button>
            <button id="btn-start-fresh" class="btn-secondary flex-1 sm:flex-none">
              Start Fresh
            </button>
          </div>
        </div>
      `
          : ''
      }
`;
}
