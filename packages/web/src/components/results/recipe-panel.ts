import { supportsAddOnApps } from '../../utils/context-detector.js';
import { escapeHtml } from '../../utils/dom.js';
import { panelAttributes } from '../panel.js';
import { ResultsViewContext } from './context.js';

/** Panel 4: generated build recipe files, dependencies, and quickstart. */
export function renderRecipePanel(ctx: ResultsViewContext): string {
  const { state, best, recipe } = ctx;
  return `
      <!-- 🛠️ Panel 4: Developer Build Harness & Makefile Recipe (Only if available) -->
      ${
        recipe
          ? `
        <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all" ${panelAttributes(state.panelOpen, 'build-recipe', !!state.criteria.requiresCustomBuild)}>
          <summary class="flex items-center justify-between p-4 sm:p-6 cursor-pointer select-none hover:bg-slate-800/40 transition-colors">
            <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <span class="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">🛠️</span>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-sm sm:text-base font-bold text-slate-100 break-words">Custom Build Recipe (Makefile)</h3>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">Custom Build Recipe</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5 break-words">
                  ${escapeHtml(recipe.title)} (~${recipe.estimatedBuildTimeMinutes} min build)
                </p>
              </div>
            </div>
            <span class="text-slate-500 group-open:rotate-180 transition-transform duration-200 text-base ml-2 shrink-0">▼</span>
          </summary>

          <div class="p-4 sm:p-8 pt-0 border-t border-slate-800/60 mt-2">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 min-w-0">
              <p class="text-xs text-slate-400 break-words">${recipe.summary}</p>
              
              <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap min-w-0 max-w-full sm:shrink-0">
                <button id="btn-download-recipe-bundle" class="flex-auto sm:flex-none justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap" title="Download a ready-to-run shell script that extracts all recipe files">
                  <span>⬇️</span> Download All (.sh)
                </button>
                <button id="btn-share-recipe" class="flex-auto sm:flex-none justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap" title="Share this build recipe permalink">
                  <span>🔗</span> Share
                </button>
                <button id="btn-copy-recipe" class="flex-auto sm:flex-none justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap" title="Copy currently selected file tab">
                  <span>📋</span> Copy Tab
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
${
  recipe.warnings && recipe.warnings.length > 0
    ? `
            <!-- Capability Warnings -->
            <div class="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              <div class="font-semibold text-amber-300 flex items-center gap-1.5">
                <span>⚠️</span> Recipe Compatibility Notes
              </div>
              <ul class="list-disc list-inside space-y-0.5 text-amber-200/90">
                ${recipe.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}
              </ul>
            </div>
`
    : ''
}

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
            <div data-copy-box class="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden min-w-0 max-w-full">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Quickstart Commands:</span>
                <button type="button" class="btn-copy-command px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors cursor-pointer shrink-0">📋 Copy</button>
              </div>
              <pre class="text-xs font-mono text-emerald-400 overflow-x-auto p-1 max-w-full whitespace-pre"><code>${escapeHtml(recipe.quickstartCommands.join('\n'))}</code></pre>
            </div>
          </div>
        </details>
      `
          : `
        <details class="group bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl transition-all" ${panelAttributes(state.panelOpen, 'build-recipe', false)}>
          <summary class="flex items-center justify-between p-4 sm:p-6 cursor-pointer select-none hover:bg-slate-800/40 transition-colors">
            <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <span class="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 shrink-0">🛠️</span>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-sm sm:text-base font-bold text-slate-200 break-words">Custom Build Recipe (Makefile)</h3>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20">Prebuilt Recommended</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5 break-words">
                  No custom Makefile is needed — ${escapeHtml(best.distro.name)} already ships a prebuilt image for your requirements.
                </p>
              </div>
            </div>
            <span class="text-slate-500 group-open:rotate-180 transition-transform duration-200 text-base ml-2 shrink-0">▼</span>
          </summary>

          <div class="p-4 sm:p-6 pt-0 border-t border-slate-800/60 mt-2 space-y-3 text-xs text-slate-300">
            <p class="leading-relaxed">
              ${
                best.distro.id === 'arch'
                  ? 'Arch Linux uses its own rolling base install (<code class="px-1 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono">archinstall</code>) rather than a generated Debian build Makefile.'
                  : best.distro.id === 'yocto'
                  ? 'Yocto Project uses BitBake and OpenEmbedded layers (<code class="px-1 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono">poky</code>) rather than a generated Buildroot or Debian Makefile.'
                  : best.distro.id === 'zephyr'
                  ? 'Zephyr RTOS uses its own <code class="px-1 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono">west</code> build toolchain rather than a generated Linux rootfs Makefile.'
                  : best.distro.osFamily && best.distro.osFamily !== 'linux'
                  ? `<strong>${escapeHtml(best.distro.name)}</strong> uses its own native installation and packaging workflow rather than a generated Linux build Makefile.`
                  : `For your selected use case, <strong>${escapeHtml(best.distro.name)}</strong> provides a ready-to-boot prebuilt image, which is faster and better tested than compiling a custom rootfs from scratch.`
              }
            </p>
            ${
              best.distro.id !== 'arch' &&
              best.distro.id !== 'yocto' &&
              best.distro.id !== 'zephyr' &&
              (!best.distro.osFamily || best.distro.osFamily === 'linux')
                ? `<p class="text-slate-400">
              Want a custom build <code class="px-1 py-0.5 rounded bg-slate-950 text-slate-300 font-mono">Makefile</code> anyway? ${
                supportsAddOnApps(state.criteria)
                  ? 'Select an app or Docker stack under <strong>Add-On Applications &amp; Services</strong>, or enable an overlay under <strong>Supplemental App Layers &amp; Runtimes</strong>, to generate a tailored image recipe.'
                  : 'Enable an overlay under <strong>Supplemental App Layers &amp; Runtimes</strong> above to generate a tailored image recipe.'
              }
            </p>`
                : ''
            }
            <div>
              <a href="${escapeHtml(best.distro.website)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 font-semibold transition-colors">
                <span>⬇️</span> Download Prebuilt ${escapeHtml(best.distro.name)} Image
              </a>
            </div>
          </div>
        </details>
      `
      }
`;
}
