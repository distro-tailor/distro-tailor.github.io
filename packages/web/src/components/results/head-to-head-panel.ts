import { renderDecidingFactorsAndHeadToHead } from '../head-to-head.js';
import { panelAttributes } from '../panel.js';
import { ResultsViewContext } from './context.js';

/** Panel 2: head-to-head comparison with the runner-up. */
export function renderHeadToHeadPanel(ctx: ResultsViewContext): string {
  const { evaluation, best, state } = ctx;
  return `
      <!-- ⚔️ Panel 2: Head-to-Head Comparison with #2 Contender -->
      <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all" ${panelAttributes(state.panelOpen, 'head-to-head', false)}>
        <summary class="flex items-center justify-between p-4 sm:p-6 cursor-pointer select-none hover:bg-slate-800/40 transition-colors">
          <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <span class="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">⚔️</span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-bold text-slate-100 break-words">Head-to-Head Comparison</h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800">Deciding Factors</span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5 break-words">
                See why ${best.distro.name} outranked the runner-up contender on your specific criteria.
              </p>
            </div>
          </div>
          <span class="text-slate-500 group-open:rotate-180 transition-transform duration-200 text-base ml-2 shrink-0">▼</span>
        </summary>

        <div class="p-4 sm:p-8 pt-0 border-t border-slate-800/60 mt-2">
          ${renderDecidingFactorsAndHeadToHead(evaluation)}
        </div>
      </details>
`;
}
