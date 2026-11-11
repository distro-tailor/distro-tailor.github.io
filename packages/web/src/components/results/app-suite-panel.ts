import { renderDesktopAppSuite, renderDockerServiceSuite } from '../app-suites.js';
import { ResultsViewContext } from './context.js';

/** Panel 1: add-on desktop apps, desktop environments, Docker services, and combos. */
export function renderAppSuitePanel(ctx: ResultsViewContext): string {
  const { state, best, combos, isServer, selectedAppsCount, hasSelectedApps } = ctx;
  return `
      <!-- 📦 Panel 1: Add-On Applications & Desktop Environment Suite -->
      <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all" ${hasSelectedApps ? 'open' : ''}>
        <summary class="flex items-center justify-between p-4 sm:p-6 cursor-pointer select-none hover:bg-slate-800/40 transition-colors">
          <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <span class="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">📦</span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-bold text-slate-100 break-words">Add-On Applications & Turnkey Services</h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${hasSelectedApps ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700/60'}">
                  ${hasSelectedApps ? `${selectedAppsCount} Selected` : 'Optional'}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5 break-words">
                Pre-install popular desktop apps (Firefox, VS Code, VLC) or headless server apps (Plex, Home Assistant, Pi-hole).
              </p>
            </div>
          </div>
          <span class="text-slate-500 group-open:rotate-180 transition-transform duration-200 text-base ml-2 shrink-0">▼</span>
        </summary>

        <div class="p-4 sm:p-8 pt-0 border-t border-slate-800/60 mt-2 space-y-6">
          ${
            isServer
              ? `
            ${renderDockerServiceSuite(state.criteria, true)}
            ${renderDesktopAppSuite(state.criteria, false)}
          `
              : `
            ${renderDesktopAppSuite(state.criteria, true)}
            ${renderDockerServiceSuite(state.criteria, false)}
          `
          }

          <!-- Mix & Match Hybrid Combos -->
          <div class="pt-4 border-t border-slate-800/80">
            <h4 class="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <span>🧩</span> Popular Combos for ${best.distro.name}
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 min-w-0">
              ${combos
                .map((combo, idx) => {
                  const isApplied =
                    (combo.appliesDockerApp && state.criteria.dockerApp === combo.appliesDockerApp) ||
                    (combo.appliesDesktopEnv &&
                      (state.criteria.desktopEnv || (state.criteria.prefersGui ? 'cage' : 'none')) ===
                        combo.appliesDesktopEnv) ||
                    (combo.appliesDistrobox && state.criteria.enableDistrobox);

                  return `
                  <div class="p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between min-w-0 transition-all ${
                    isApplied
                      ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                      : 'bg-slate-950/80 border-slate-800'
                  }">
                    <div>
                      <div class="flex items-center justify-between mb-2 gap-2 min-w-0">
                        <div class="flex items-center gap-2.5 min-w-0">
                          <span class="text-2xl shrink-0">${combo.icon}</span>
                          <h4 class="text-sm font-semibold text-slate-200 break-words">${combo.title}</h4>
                        </div>
                        ${isApplied ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">INCLUDED</span>` : ''}
                      </div>
                      <p class="text-xs text-slate-400 leading-relaxed mb-3 break-words">${combo.description}</p>
                    </div>
                    <div class="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 min-w-0">
                      <span class="text-[11px] text-slate-400 font-mono truncate">👉 ${combo.howTo}</span>
                      ${
                        combo.appliesDockerApp || combo.appliesDesktopEnv || combo.appliesDistrobox
                          ? `
                        <button data-combo-idx="${idx}" class="btn-toggle-combo px-2.5 py-1 rounded text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700'
                        }">
                          ${isApplied ? '✓ Active' : '+ Apply'}
                        </button>
                      `
                          : ''
                      }
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>
        </div>
      </details>
`;
}
