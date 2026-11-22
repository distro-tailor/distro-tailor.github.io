import { escapeHtml } from '../../utils/dom.js';
import { ResultsViewContext } from './context.js';

/** Header card shown at the top of the DIY Custom OS tab so users know it builds independently from the prebuilt distro. */
export function renderDiyHeader(ctx: ResultsViewContext): string {
  const { best, recipe } = ctx;
  const targetName = recipe ? escapeHtml(recipe.title) : 'Custom Minimal Linux Image';
  return `
      <!-- 🛠️ DIY Custom OS Header -->
      <div class="bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-950 border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-xl min-w-0">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div class="flex items-start gap-3 min-w-0">
            <span class="text-2xl sm:text-3xl p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 shrink-0">🛠️</span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-base sm:text-xl font-extrabold text-slate-100 break-words">DIY Custom OS Builder</h2>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Independent Build
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-300 mt-1 break-words">
                Generates a clean minimal build (<strong>${targetName}</strong>) from your blueprint and only the apps/layers you select below.
                It does <strong>not</strong> modify the official prebuilt ${escapeHtml(best.distro.name)} ISO.
              </p>
            </div>
          </div>
          <button type="button" data-results-mode="recommended" class="btn-results-mode btn-secondary text-xs whitespace-nowrap shrink-0">
            ← Back to ${escapeHtml(best.distro.name)}
          </button>
        </div>
      </div>
  `;
}
