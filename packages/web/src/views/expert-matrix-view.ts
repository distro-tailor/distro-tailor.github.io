import { EXPERT_FIELDS } from '../data/expert-options.js';
import { AppState } from '../state/store.js';

export function renderExpertMatrix(state: AppState): string {
  return `
    <div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-8 backdrop-blur space-y-6 shadow-xl min-w-0 max-w-full overflow-hidden">
      <div class="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div class="min-w-0">
          <h2 class="text-lg sm:text-xl font-bold text-slate-100 mb-1 break-words">🛠️ Expert Constraint Matrix</h2>
          <p class="text-xs text-slate-400 break-words">Directly set exact architecture, init system, C library, and footprint flags.</p>
        </div>
        <button id="btn-close-expert" class="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 text-xs font-medium" title="Close and return to Wizard (Esc)">
          <span class="text-base leading-none">✕</span>
          <span class="hidden sm:inline text-xs font-mono text-slate-500">Esc</span>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs min-w-0">
        ${EXPERT_FIELDS.map(
          (field) => `
          <div class="min-w-0">
            <label class="block text-slate-400 font-semibold mb-1.5">${field.label}</label>
            <select id="${field.id}" class="w-full max-w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200">
              <option value="">${field.placeholder}</option>
              ${field.options
                .map(
                  (opt) => `
                <option value="${opt.value}" ${state.criteria[field.criteriaKey] === opt.value ? 'selected' : ''}>
                  ${opt.label}
                </option>
              `
                )
                .join('')}
            </select>
          </div>
        `
        ).join('')}
      </div>

      <div class="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <button id="btn-cancel-expert" class="btn-secondary">
          <span>← Back to 20 Questions</span>
        </button>
        <button id="btn-apply-expert" class="btn-primary w-full sm:w-auto text-center">
          Apply Constraints & View Results →
        </button>
      </div>

    </div>
  `;
}
