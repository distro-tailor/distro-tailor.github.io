import { SUPPORTED_DESKTOP_ENVS } from '../../utils/context-detector.js';
import { panelAttributes } from '../panel.js';
import { ResultsViewContext } from './context.js';

/** Panel 3: Distrobox, desktop compositor, and Nix / Flatpak package layers. */
export function renderPackageLayersPanel(ctx: ResultsViewContext): string {
  const { state, best, hasFrankenstein, hasFlatpakDefault } = ctx;
  return `
      <!-- 🧪 Panel 3: Supplemental App Layers & Package Overlays -->
      <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all" ${panelAttributes(state.panelOpen, 'package-layers', hasFrankenstein)}>
        <summary class="flex items-center justify-between p-4 sm:p-6 cursor-pointer select-none hover:bg-slate-800/40 transition-colors">
          <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <span class="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 shrink-0">🧪</span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-bold text-slate-100 break-words">Supplemental App Layers & Runtimes</h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800">Optional Overlays</span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5 break-words">
                Base package manager: <strong class="text-slate-200 font-mono">${best.distro.packageManager || 'Native apt/dnf/pacman'}</strong>. Layer Flatpak sandboxes, Nix, or Arch AUR on top without replacing the host OS.
              </p>
            </div>
          </div>
          <span class="text-slate-500 group-open:rotate-180 transition-transform duration-200 text-base ml-2 shrink-0">▼</span>
        </summary>

        <div class="p-4 sm:p-8 pt-0 border-t border-slate-800/60 mt-2">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5 text-xs min-w-0">
            
            <!-- Distrobox Card -->
            <div class="p-3.5 rounded-xl border flex flex-col justify-between min-w-0 transition-all ${
              state.criteria.enableDistrobox
                ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                : 'bg-slate-950/80 border-slate-800'
            }">
              <div>
                <div class="flex items-center justify-between mb-1.5 gap-1.5">
                  <span class="font-semibold text-slate-200 flex items-center gap-1.5 break-words">
                    <span>🏛️ ⇄ 🏹</span> Debian Base + Arch AUR
                  </span>
                  ${
                    state.criteria.enableDistrobox
                      ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">ACTIVE</span>`
                      : ''
                  }
                </div>
                <p class="text-slate-400 leading-relaxed text-[11px] mb-3 break-words">
                  Run Arch's <code class="text-emerald-400">pacman</code> and AUR packages directly on this host base via Distrobox container pods.
                </p>
              </div>
              <button id="btn-toggle-distrobox" class="w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                state.criteria.enableDistrobox
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-emerald-400 border border-slate-700'
              }">
                <span>${state.criteria.enableDistrobox ? '✓ Distrobox In Makefile' : '+ Enable Distrobox in Makefile'}</span>
              </button>
            </div>

            <!-- Desktop Environment / Compositor Card -->
            <div class="p-3.5 rounded-xl border flex flex-col justify-between min-w-0 transition-all bg-slate-950/80 border-slate-800">
              <div>
                <div class="flex items-center justify-between mb-1.5 gap-1.5">
                  <span class="font-semibold text-slate-200 flex items-center gap-1.5 break-words">
                    <span>🖼️</span> Desktop Compositor
                  </span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0 uppercase">
                    ${state.criteria.desktopEnv || (state.criteria.prefersGui ? 'cage' : 'none')}
                  </span>
                </div>
                <p class="text-slate-400 leading-relaxed text-[11px] mb-3 break-words">
                  Select your display server or compositor. Updates <code class="text-emerald-400">DESKTOP_ENV</code> in the Makefile:
                </p>
              </div>
              <div class="grid grid-cols-3 gap-1.5">
                ${SUPPORTED_DESKTOP_ENVS
                  .map(
                    (env) => `
                  <button data-desktop-env="${env}" class="btn-select-desktop-env py-1.5 px-1 rounded text-[10px] font-mono font-medium transition-all text-center cursor-pointer ${
                    (state.criteria.desktopEnv || (state.criteria.prefersGui ? 'cage' : 'none')) === env
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }">
                    ${env}
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Universal Package Layers Card -->
            <div class="p-3.5 rounded-xl border flex flex-col justify-between min-w-0 transition-all ${
              state.criteria.enableNix || state.criteria.enableFlatpak
                ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                : 'bg-slate-950/80 border-slate-800'
            }">
              <div>
                <div class="flex items-center justify-between mb-1.5 gap-1.5">
                  <span class="font-semibold text-slate-200 flex items-center gap-1.5 break-words">
                    <span>❄️ ⇄ 📦</span> Universal Packages
                  </span>
                  ${
                    state.criteria.enableNix || state.criteria.enableFlatpak
                      ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">ACTIVE</span>`
                      : ''
                  }
                </div>
                <p class="text-slate-400 leading-relaxed text-[11px] mb-3 break-words">
                  ${
                    hasFlatpakDefault
                      ? `Flatpak is pre-installed out of the box on ${best.distro.name}. Layer multi-version packages via Nix or additional sandboxes:`
                      : `Keep rootfs clean. Layer sandboxed desktop apps via Flatpak or declarative multi-version CLI packages via Nix:`
                  }
                </p>
              </div>
              <div class="grid grid-cols-2 gap-1.5">
                <button id="btn-toggle-nix" class="py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  state.criteria.enableNix
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }">
                  <span>${state.criteria.enableNix ? '✓ Nix ON' : '+ Nix'}</span>
                </button>
                <button id="btn-toggle-flatpak" class="py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  state.criteria.enableFlatpak || hasFlatpakDefault
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }">
                  <span>${hasFlatpakDefault ? '✓ Flatpak Ready' : state.criteria.enableFlatpak ? '✓ Flatpak ON' : '+ Flatpak'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </details>
`;
}
