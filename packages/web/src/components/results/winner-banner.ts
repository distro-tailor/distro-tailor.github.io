import { ResultsViewContext } from './context.js';

/** Top match hero card with technical attributes, strengths, and tradeoffs. */
export function renderWinnerBanner(ctx: ResultsViewContext): string {
  const { best } = ctx;
  return `
      <!-- Top Match Winner Banner -->
      <div class="bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 sm:p-8 relative overflow-hidden shadow-2xl min-w-0">
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 min-w-0">
          <div class="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <span class="text-3xl sm:text-5xl p-2 rounded-2xl bg-slate-900 border border-slate-700/60 shrink-0">${best.distro.logoEmoji || '🐧'}</span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h2 class="text-xl sm:text-3xl font-extrabold text-slate-100 break-words">${best.distro.name}</h2>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                  ${best.score}% Match
                </span>
              </div>
              <p class="text-xs sm:text-sm text-emerald-300 font-medium mt-1 break-words">${best.distro.tagline}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full lg:w-auto flex-wrap shrink-0 justify-start sm:justify-end">
            <button id="btn-modify-answers" class="flex-1 sm:flex-none justify-center px-3.5 py-2 sm:py-2.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500 transition-all flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap" title="Return to questions to review or adjust choices">
              <span>←</span> Modify Choices
            </button>
            <button id="btn-share-match" class="flex-1 sm:flex-none justify-center px-3.5 py-2 sm:py-2.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/50 transition-all flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap" title="Share this tailored match permalink">
              <span>🔗</span> Share Match
            </button>
            <a id="btn-official-site" href="${best.distro.website}" target="_blank" rel="noopener noreferrer" class="flex-1 sm:flex-none justify-center px-3.5 py-2 sm:py-2.5 text-xs font-bold rounded-lg bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 whitespace-nowrap">
              Official Site ↗
            </a>
          </div>
        </div>

        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 break-words">${best.distro.description}</p>

        <!-- Technical Attributes Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs mb-6 min-w-0">
          <div class="bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 min-w-0 overflow-hidden">
            <span class="text-slate-500 block text-[10px] sm:text-[11px] uppercase font-semibold">Typical Footprint</span>
            <span class="font-medium text-slate-200 capitalize mt-0.5 block truncate">${best.distro.footprint}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 min-w-0 overflow-hidden">
            <span class="text-slate-500 block text-[10px] sm:text-[11px] uppercase font-semibold">Init System</span>
            <span class="font-medium text-slate-200 mt-0.5 block truncate" title="${best.distro.initSystems.join(', ')}">${best.distro.initSystems.join(', ')}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 min-w-0 overflow-hidden">
            <span class="text-slate-500 block text-[10px] sm:text-[11px] uppercase font-semibold">C Library</span>
            <span class="font-medium text-slate-200 mt-0.5 block truncate" title="${best.distro.cLibraries.join(', ')}">${best.distro.cLibraries.join(', ')}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 min-w-0 overflow-hidden">
            <span class="text-slate-500 block text-[10px] sm:text-[11px] uppercase font-semibold">State Model</span>
            <span class="font-medium text-slate-200 capitalize mt-0.5 block truncate" title="${best.distro.stateModel}">${best.distro.stateModel}</span>
          </div>
        </div>

        <!-- Strengths vs Tradeoffs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs min-w-0">
          <div class="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-3.5 sm:p-4 min-w-0">
            <h4 class="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
              <span>✨</span> Key Strengths
            </h4>
            <ul class="space-y-1.5 text-slate-300">
              ${best.distro.highlights.map((h) => `<li class="break-words">• ${h}</li>`).join('')}
            </ul>
          </div>
          <div class="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3.5 sm:p-4 min-w-0">
            <h4 class="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <span>⚖️</span> Trade-offs
            </h4>
            <ul class="space-y-1.5 text-slate-300">
              ${best.distro.tradeoffs.map((t) => `<li class="break-words">• ${t}</li>`).join('')}
            </ul>
          </div>
        </div>

      </div>
`;
}
