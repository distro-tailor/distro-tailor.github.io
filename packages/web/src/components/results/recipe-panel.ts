import { escapeHtml } from '../../utils/dom.js';
import { ResultsViewContext } from './context.js';

/** Panel 4: generated build recipe files, dependencies, and quickstart. */
export function renderRecipePanel(ctx: ResultsViewContext): string {
  const { state, best, recipe } = ctx;
  return `
      <!-- 🛠️ Panel 4: Developer Build Harness & Makefile Recipe (Only if available) -->
      ${
        recipe
          ? `
        <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all" ${state.criteria.requiresCustomBuild ? 'open' : ''}>
          <summary class="flex items-center justify-between p-4 sm:p-6 cursor-pointer select-none hover:bg-slate-800/40 transition-colors">
            <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <span class="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">🛠️</span>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-sm sm:text-base font-bold text-slate-100 break-words">${recipe.title}</h3>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">Custom Build Recipe</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5 break-words">
                  Compile a tailored, minimal ${best.distro.name} appliance image from source (~${recipe.estimatedBuildTimeMinutes} min build).
                </p>
              </div>
            </div>
            <span class="text-slate-500 group-open:rotate-180 transition-transform duration-200 text-base ml-2 shrink-0">▼</span>
          </summary>

          <div class="p-4 sm:p-8 pt-0 border-t border-slate-800/60 mt-2">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 min-w-0">
              <p class="text-xs text-slate-400 break-words">${recipe.summary}</p>
              
              <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap shrink-0">
                <button id="btn-share-recipe" class="flex-1 sm:flex-none justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap" title="Share this build recipe permalink">
                  <span>🔗</span> Share
                </button>
                <button id="btn-copy-recipe" class="flex-1 sm:flex-none justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <span>📋</span> Copy File
                </button>
              </div>
            </div>

            <!-- Dependencies & Build Info -->
            <div class="flex flex-wrap gap-2 text-xs mb-4 min-w-0">
              <span class="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800 break-words">
                ⏱️ Build Time: ~${recipe.estimatedBuildTimeMinutes} mins
              </span>
              <span class="px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800 break-words">
                📦 Host Tools: ${recipe.hostDependencies.join(', ')}
              </span>
            </div>

            <!-- File Tabs -->
            <div class="flex items-center gap-1.5 sm:gap-2 border-b border-slate-800 mb-0 overflow-x-auto max-w-full pb-0.5 no-scrollbar">
              ${recipe.files
                .map(
                  (file, idx) => `
                <button data-file-idx="${idx}" class="recipe-tab px-3 py-2 text-xs font-mono font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap shrink-0 ${
                  state.activeFileIndex === idx
                    ? 'border-emerald-500 text-emerald-400 bg-slate-950'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }">
                  ${file.filename}
                </button>
              `
                )
                .join('')}
            </div>

            <!-- Code View -->
            <div class="relative bg-slate-950 border border-slate-800 rounded-b-xl p-3 sm:p-4 overflow-x-auto max-h-96 text-xs font-mono text-slate-300 leading-relaxed max-w-full">
              <pre class="overflow-x-auto min-w-0 max-w-full whitespace-pre font-mono"><code>${escapeHtml(recipe.files[state.activeFileIndex]?.content || '')}</code></pre>
            </div>

            <!-- Quickstart Snippet -->
            <div class="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden min-w-0 max-w-full">
              <span class="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Quickstart Commands:</span>
              <pre class="text-xs font-mono text-emerald-400 overflow-x-auto p-1 max-w-full whitespace-pre"><code>${recipe.quickstartCommands.join('\n')}</code></pre>
            </div>
          </div>
        </details>
      `
          : ''
      }
`;
}
