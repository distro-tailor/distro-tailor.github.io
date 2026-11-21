import { LegalCaveat } from '@distro-tailor/core';
import { escapeHtml } from '../utils/dom.js';

/**
 * "Before you start" legal notes (ROM ownership, authorized-use-only tools, driver licence limits).
 * Shown on results and in the distro detail modal so nobody hits a legal catch unawares.
 */
export function renderLegalCaveats(caveats: readonly LegalCaveat[], compact = false): string {
  if (caveats.length === 0) return '';

  const items = caveats
    .map(
      (c) => `
        <li class="legal-caveat flex items-start gap-2 min-w-0" data-caveat-id="${escapeHtml(c.id)}">
          <span class="shrink-0 text-sky-300">⚖️</span>
          <span class="break-words">
            <strong class="text-slate-100">${escapeHtml(c.title)}.</strong> ${escapeHtml(c.text)}
            ${c.sourceUrl ? `<a href="${escapeHtml(c.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="text-sky-300 hover:text-sky-200 underline whitespace-nowrap">Source ↗</a>` : ''}
          </span>
        </li>`
    )
    .join('');

  if (compact) {
    return `
      <div class="legal-caveats bg-sky-950/20 border border-sky-900/40 rounded-xl p-3.5 text-xs mb-5">
        <h4 class="font-bold text-sky-300 mb-2">Legal notes</h4>
        <ul class="space-y-2 text-slate-300">${items}</ul>
      </div>`;
  }

  return `
    <section id="legal-caveats" class="bg-sky-950/20 border border-sky-900/40 rounded-2xl p-4 sm:p-5 min-w-0 overflow-hidden shadow-xl">
      <h3 class="text-sm sm:text-base font-bold text-sky-200 mb-1">Before you start: legal notes</h3>
      <p class="text-[11px] text-slate-400 mb-3 break-words">Everything recommended here is free to use. These are the legal catches worth knowing for your setup.</p>
      <ul class="space-y-2.5 text-xs text-slate-300">${items}</ul>
    </section>`;
}
