import { PERSONA_PRESETS } from '../data/persona-presets.js';
import { escapeHtml } from '../utils/dom.js';

export function renderPersonaPresetsPanel(): string {
  const cardsHtml = PERSONA_PRESETS.map((p) => {
    return `
      <div class="persona-preset-card bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-lg group">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <h4 class="font-semibold text-slate-100 text-sm group-hover:text-emerald-400 transition-colors">
              ${escapeHtml(p.name)}
            </h4>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              ${escapeHtml(p.badge)}
            </span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed mb-3">
            ${escapeHtml(p.tagline)}
          </p>
          <div class="flex flex-wrap items-center gap-1.5 mb-3">
            <span class="persona-winner-badge text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md">
              🥇 ${escapeHtml(p.winnerDistroName)}
            </span>
            <span class="persona-target-badge text-[10px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded-md">
              ⚡ ${escapeHtml(p.buildTargetDescription)}
            </span>
          </div>
        </div>
        <div class="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 mt-auto">
          <a
            href="${escapeHtml(p.urlQuery)}"
            data-preset-id="${escapeHtml(p.id)}"
            class="persona-preset-btn w-full text-center text-xs font-semibold py-2 px-3 rounded-lg bg-emerald-500/25 hover:bg-emerald-400 text-emerald-200 hover:text-slate-950 border border-emerald-400/50 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400/50 shadow-sm"
          >
            Test Persona in VM & Recipe →
          </a>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="mt-8 pt-6 border-t border-slate-800/80">
      <div class="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 class="text-base font-semibold text-slate-200 flex items-center gap-2">
            <span>🎯</span> Example Personas & Deterministic VM Test Builds
          </h3>
          <p class="text-xs text-slate-400">
            Instant deterministic recipes and VM test-drives derived from URL state. Click any persona to inspect its match, Makefile, and build targets.
          </p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        ${cardsHtml}
      </div>
    </div>
  `;
}
