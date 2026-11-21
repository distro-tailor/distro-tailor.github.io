import { DISTRO_REGISTRY, PaidAlternative } from '@distro-tailor/core';
import { escapeHtml } from '../utils/dom.js';

/**
 * Lists paid or closed-source systems known for the chosen use case. They are never the
 * recommendation: each card states what must be paid for, and points to the free options here.
 */
export function renderPaidAlternatives(alternatives: readonly PaidAlternative[]): string {
  if (alternatives.length === 0) return '';

  const freeNames = (ids: readonly string[]) =>
    ids
      .map((id) => DISTRO_REGISTRY.find((d) => d.id === id)?.name)
      .filter((name): name is string => !!name)
      .map(escapeHtml)
      .join(', ');

  return `
    <section id="paid-alternatives" class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-7 min-w-0 overflow-hidden shadow-xl">
      <div class="mb-4 sm:mb-5 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xl sm:text-2xl p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">💳</span>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">Paid alternatives (not recommended)</h3>
            <p class="text-xs text-slate-400 mt-0.5 break-words">
              DistroTailor only recommends free and open-source systems. These well-known options charge for, or close the source of, the feature you chose. They're listed for comparison only; prices and terms are summarised for information and may change.
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3.5 sm:gap-4 text-xs min-w-0">
        ${alternatives
          .map(
            (alt) => `
          <div class="paid-alternative-card bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 sm:p-5 min-w-0 space-y-2.5">
            <div class="flex items-center gap-2 flex-wrap">
              <a href="${escapeHtml(alt.website)}" target="_blank" rel="noopener noreferrer" class="text-sm sm:text-base font-semibold text-slate-200 hover:text-slate-100 underline decoration-slate-600 break-words">${escapeHtml(alt.name)}</a>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase text-rose-300 bg-rose-500/10 border border-rose-500/30 shrink-0">${escapeHtml(alt.licensing.license)}</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed break-words">${escapeHtml(alt.pitch)}</p>
            <div class="text-[11px] text-rose-200/90 flex items-start gap-1.5 min-w-0">
              <span class="shrink-0">⚠️</span>
              <span class="break-words"><strong>Caveat:</strong> ${escapeHtml(alt.caveat)}</span>
            </div>
            <div class="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5 min-w-0">
              <span class="shrink-0">🆓</span>
              <span class="break-words"><strong class="text-slate-300">Free options here:</strong> ${freeNames(alt.freeOptionIds)}</span>
            </div>
          </div>`
          )
          .join('')}
      </div>
    </section>
  `;
}
