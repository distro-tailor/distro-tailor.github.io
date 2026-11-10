import { DistroProfile } from '@distro-tailor/core';
import { escapeHtml } from '../utils/dom.js';

/**
 * Renders data-driven comparative rationales explaining why a tailored distribution
 * was selected over common household defaults (e.g. Linux Mint over Vanilla Ubuntu, Fedora over RHEL).
 */
export function renderAlternativeComparisons(distro: DistroProfile): string {
  const comparisons = distro.alternativeComparisons;
  if (!comparisons || comparisons.length === 0) {
    return '';
  }

  return `
    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-7 min-w-0 overflow-hidden shadow-xl">
      <div class="mb-4 sm:mb-5 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xl sm:text-2xl p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">💡</span>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">
              Why ${escapeHtml(distro.name)} over popular alternatives?
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 break-words">
              DistroTailor pinpoints the ideal tool for your specific workload. Here is why this tailored choice outperforms household defaults:
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3.5 sm:gap-4 text-xs min-w-0">
        ${comparisons
          .map(
            (comp) => `
          <div class="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 sm:p-5 flex flex-col justify-between min-w-0 space-y-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-2">
                <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                  vs. ${escapeHtml(comp.popularAlternative)}
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase text-slate-400 bg-slate-900 border border-slate-800 shrink-0">
                  ${escapeHtml(comp.relation)}
                </span>
              </div>
              <h4 class="text-sm sm:text-base font-semibold text-slate-200 mb-1.5 leading-snug break-words">
                ${escapeHtml(comp.headline)}
              </h4>
              <p class="text-xs text-slate-300 leading-relaxed break-words">
                ${escapeHtml(comp.whyThisInstead)}
              </p>
            </div>

            ${
              comp.tradeoffNotice
                ? `
              <div class="pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5 min-w-0">
                <span class="shrink-0 text-slate-500">⚖️</span>
                <span class="break-words">
                  <strong class="text-slate-300">When the alternative may be preferred:</strong> ${escapeHtml(comp.tradeoffNotice)}
                </span>
              </div>
            `
                : ''
            }
          </div>
        `
          )
          .join('')}
      </div>
    </section>
  `;
}
