import { UserCriteria } from '@distro-tailor/core';
import { escapeHtml } from '../utils/dom.js';
import { formatConstraint } from '../utils/formatters.js';

/**
 * Renders the active criteria chips with removal buttons and share triggers.
 */
export function renderCriteriaChips(criteria: UserCriteria): string {
  const entries = Object.entries(criteria);

  return `
    <div class="mt-5 pt-4 border-t border-slate-800">
      <div class="flex items-center justify-between mb-2.5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Choices So Far</h4>
        ${
          entries.length > 0
            ? `
          <button id="btn-share-sidebar" class="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors" title="Share this configuration link">
            <span>🔗</span> Share Link
          </button>
        `
            : ''
        }
      </div>
      ${
        entries.length === 0
          ? `
        <p class="text-xs text-slate-500 italic">No constraints yet. Select an option to start narrowing down!</p>
      `
          : `
        <div class="flex flex-wrap gap-1.5 min-w-0">
          ${entries
            .map(([k, v]) => {
              const c = formatConstraint(k, v);
              return `
              <span class="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700/60 shadow-sm group hover:border-slate-600 transition-colors max-w-full min-w-0">
                <span class="shrink-0">${c.icon}</span>
                <span class="truncate">${escapeHtml(c.label)}</span>
                <button data-remove-key="${escapeHtml(k)}" class="btn-remove-choice text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors text-[10px] leading-none shrink-0" title="Remove this choice">✕</button>
              </span>
            `;
            })
            .join('')}
        </div>
      `
      }
    </div>
  `;
}
