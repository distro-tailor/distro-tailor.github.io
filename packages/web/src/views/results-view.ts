import { DesktopEnvId, RecommendationOutput } from '@distro-tailor/core';
import { renderAlternativeComparisons } from '../components/alternatives.js';
import { getAddonCombos, renderDesktopAppSuite, renderDockerServiceSuite } from '../components/app-suites.js';
import { renderDecidingFactorsAndHeadToHead } from '../components/head-to-head.js';
import { AppState } from '../state/store.js';
import { isServerContext, SUPPORTED_DESKTOP_ENVS } from '../utils/context-detector.js';
import { escapeHtml } from '../utils/dom.js';
import { formatConstraint } from '../utils/formatters.js';

export function renderResultsView(evaluation: RecommendationOutput, state: AppState): string {
  const best = evaluation.bestMatch;
  const recipe = evaluation.recommendedRecipe;
  const combos = getAddonCombos(best.distro.id);
  const isServer = isServerContext(state.criteria);

  const selectedAppsCount =
    (state.criteria.desktopApps?.length || 0) +
    (state.criteria.dockerApp ? 1 : 0) +
    (state.criteria.desktopEnv ? 1 : 0);
  const hasSelectedApps = selectedAppsCount > 0;

  const hasFrankenstein = !!(
    state.criteria.enableDistrobox ||
    state.criteria.enableNix ||
    state.criteria.enableFlatpak
  );

  const hasFlatpakDefault = ['fedora', 'linux-mint', 'pop-os', 'ubuntu-studio', 'endless-os'].includes(
    best.distro.id
  );

  return `
    <div class="space-y-6 min-w-0 max-w-full overflow-hidden">

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
              <h4 class="font-bold text-indigo-100 text-sm break-words">You are viewing a shared tailored Linux build!</h4>
              <p class="text-slate-400 text-[11px] mt-0.5 break-words">
                Configured with <strong>${Object.keys(state.criteria).length} tailored criteria</strong>. You can inspect the recipe, tweak any choice, or start your own build.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
            <button id="btn-tweak-shared" class="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md cursor-pointer">
              Tweak Choices
            </button>
            <button id="btn-start-fresh" class="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-medium transition-all cursor-pointer">
              Start Fresh
            </button>
          </div>
        </div>
      `
          : ''
      }
      
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
            <a href="${best.distro.website}" target="_blank" rel="noopener noreferrer" class="flex-1 sm:flex-none justify-center px-3.5 py-2 sm:py-2.5 text-xs font-bold rounded-lg bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 whitespace-nowrap">
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
                return `<span class="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono flex items-center gap-1.5 shadow-sm">${fc.icon} ${fc.label}</span>`;
              })
              .join('')}
          </div>
        </div>
        <button id="btn-tweak-blueprint" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-slate-700 hover:border-emerald-500/40 text-xs transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-md">
          <span>←</span>
          <span>Review & Change Answers</span>
        </button>
      </div>

      <!-- 💡 Data-Driven Comparison: Why This Over Common Alternatives (e.g. Mint vs Ubuntu, Fedora vs RHEL) -->
      ${renderAlternativeComparisons(best.distro)}

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
            <a href="${best.distro.prebuiltImage.downloadUrl}" target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md shrink-0">
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

      <!-- ========================================================================= -->
      <!-- PROGRESSIVE DISCLOSURE: OPTIONAL / ADVANCED SYSTEM CUSTOMIZATION PANELS   -->
      <!-- ========================================================================= -->

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

      <!-- ⚔️ Panel 2: Head-to-Head Comparison with #2 Contender -->
      <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all">
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

      <!-- 🧪 Panel 3: Supplemental App Layers & Package Overlays -->
      <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all" ${hasFrankenstein ? 'open' : ''}>
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

      <!-- 🧪 Panel 5: 3-Tier Verification & Testing Ladder -->
      <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all">
        <summary class="flex items-center justify-between p-4 sm:p-6 cursor-pointer select-none hover:bg-slate-800/40 transition-colors">
          <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <span class="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 shrink-0">🧪</span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-bold text-slate-100 break-words">3-Tier Verification & Testing Ladder</h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800">Deployment Guide</span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5 break-words">
                Test and verify your tailored build across three levels of hardware access—from zero-risk browser sandboxes to physical silicon.
              </p>
            </div>
          </div>
          <span class="text-slate-500 group-open:rotate-180 transition-transform duration-200 text-base ml-2 shrink-0">▼</span>
        </summary>

        <div class="p-4 sm:p-8 pt-0 border-t border-slate-800/60 mt-2">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 min-w-0">
            <!-- Tier 1: In-Browser Instant Sandbox -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
              <div>
                <div class="flex items-center gap-2 mb-2 min-w-0">
                  <span class="text-base shrink-0">🌐</span>
                  <h4 class="text-sm font-bold text-sky-400 break-words">Tier 1: Instant In-Browser</h4>
                </div>
                <p class="text-xs text-slate-400 mb-3 leading-relaxed break-words">
                  Zero installation, zero risk. Emulate x86 boot and interactive terminal commands directly in your browser tab via WebAssembly (v86 PC emulator).
                </p>
                <div class="text-[11px] font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300 break-words">
                  <span class="text-slate-500 uppercase tracking-wider block mb-1 text-[10px] font-semibold">How to test:</span>
                  Select WASM in questions or open the generated HTML WebVM file in Chrome/Firefox.
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span class="text-[11px] text-sky-400 font-medium">⚡ 0% Drive Risk</span>
                <span class="text-[11px] text-slate-500">WASM Sandbox</span>
              </div>
            </div>

            <!-- Tier 2: Safe VM Sandbox -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
              <div>
                <div class="flex items-center gap-2 mb-2 min-w-0">
                  <span class="text-base shrink-0">🖧</span>
                  <h4 class="text-sm font-bold text-emerald-400 break-words">Tier 2: Safe VM Sandbox</h4>
                </div>
                <p class="text-xs text-slate-400 mb-3 leading-relaxed break-words">
                  Safe desktop hypervisor testing before touching physical drives. Test GUI desktop, networking, and systemd services in complete isolation.
                </p>
                <div class="text-[11px] font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300 space-y-1.5 overflow-x-auto min-w-0 max-w-full">
                  <span class="text-slate-500 uppercase tracking-wider block text-[10px] font-semibold">QEMU Command:</span>
                  <pre class="text-emerald-400 block text-[10px] overflow-x-auto p-0.5 max-w-full whitespace-pre font-mono"><code>qemu-system-x86_64 -cdrom output/*.iso -m 2048 -enable-kvm</code></pre>
                  <span class="text-slate-500 block text-[10px] break-words">macOS: replace -enable-kvm with -accel hvf</span>
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span class="text-[11px] text-emerald-400 font-medium">🛡️ Isolated Sandbox</span>
                <span class="text-[11px] text-slate-500">QEMU / UTM / VBox</span>
              </div>
            </div>

            <!-- Tier 3: Direct Bare-Metal Hardware -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
              <div>
                <div class="flex items-center gap-2 mb-2 min-w-0">
                  <span class="text-base shrink-0">⚡</span>
                  <h4 class="text-sm font-bold text-amber-400 break-words">Tier 3: Bare-Metal Live USB</h4>
                </div>
                <p class="text-xs text-slate-400 mb-3 leading-relaxed break-words">
                  Flash bootable ISO to physical USB. Boot real silicon to verify Wi-Fi, GPU acceleration, and pro audio with zero hard drive changes.
                </p>
                <div class="text-[11px] font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-300 space-y-1 min-w-0">
                  <span class="text-slate-500 uppercase tracking-wider block text-[10px] font-semibold">Flash & Boot Keys:</span>
                  <span class="block text-slate-300 break-words">1. Flash via <strong>BalenaEtcher</strong> or <strong>Rufus</strong></span>
                  <span class="block text-slate-300 break-words">2. Boot: Tap <strong>F12</strong> (Dell/Lenovo), <strong>Del/F8</strong> (Asus), or <strong>Option ⌥</strong> (Mac)</span>
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span class="text-[11px] text-amber-400 font-medium">🚀 Native Silicon Speed</span>
                <span class="text-[11px] text-slate-500">UEFI USB Boot</span>
              </div>
            </div>
          </div>
        </div>
      </details>

    </div>
  `;
}
