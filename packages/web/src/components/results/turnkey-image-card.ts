import { ResultsViewContext } from './context.js';

/** Ready-to-flash prebuilt image card (when the distro publishes one). */
export function renderTurnkeyImageCard(ctx: ResultsViewContext): string {
  const { best } = ctx;
  return `
      <!-- Option A: Ready-To-Flash Turnkey Image -->
      ${
        best.distro.prebuiltImage
          ? `
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-7 min-w-0 overflow-hidden shadow-xl">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 min-w-0">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xl shrink-0">🚀</span>
                <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">Official Turnkey Image & Quickstart</h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">Recommended</span>
              </div>
              <p class="text-xs text-slate-400 mt-1 break-words">
                Download the official image directly. Includes universal out-of-the-box hardware drivers and pre-configured defaults—ready to flash in minutes with BalenaEtcher or Raspberry Pi Imager.
              </p>
            </div>
            <a id="btn-download-image" href="${best.distro.prebuiltImage.downloadUrl}" target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shrink-0">
              Download ${best.distro.name} Image ↗
            </a>
          </div>

          ${
            best.distro.prebuiltImage.quickstartCommand
              ? `
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800/90 text-xs font-mono text-emerald-400 flex items-center justify-between gap-2 overflow-x-auto min-w-0">
              <span class="text-slate-500 select-none">Quickstart:</span>
              <code class="text-emerald-300 font-bold select-all">${best.distro.prebuiltImage.quickstartCommand}</code>
            </div>
          `
              : ''
          }
        </div>
      `
          : ''
      }
`;
}
