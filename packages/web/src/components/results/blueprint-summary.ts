import { formatConstraint } from '../../utils/formatters.js';
import { ResultsViewContext } from './context.js';

/** Summary bar of the criteria that produced this recommendation. */
export function renderBlueprintSummary(ctx: ResultsViewContext): string {
  const { state } = ctx;
  return `
      <!-- 📋 Your Tailored Blueprint Summary Bar -->
      <div class="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xl min-w-0">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap mb-2">
            <span class="font-bold text-slate-100 flex items-center gap-1.5 text-xs sm:text-sm">
              <span>📋</span> Your Tailored Blueprint
            </span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ${Object.keys(state.criteria).length} Constraints Active
            </span>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${Object.entries(state.criteria)
              .filter(([k]) => !['desktopApps', 'dockerApp', 'desktopEnv', 'enableDistrobox', 'enableNix', 'enableFlatpak'].includes(k))
              .map(([k, v]) => {
                const fc = formatConstraint(k, v);
                return `<button class="blueprint-chip-btn group px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 text-[11px] text-slate-300 font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer" data-remove-key="${k}" title="Click to tweak or change ${fc.label}">
                  <span>${fc.icon} ${fc.label}</span>
                  <span class="text-slate-500 group-hover:text-emerald-400 font-bold ml-0.5">✏️</span>
                </button>`;
              })
              .join('')}
          </div>
        </div>
        <button id="btn-tweak-blueprint" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-slate-700 hover:border-emerald-500/40 text-xs transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-md">
          <span>←</span>
          <span>Review & Change Answers</span>
        </button>
      </div>
`;
}
