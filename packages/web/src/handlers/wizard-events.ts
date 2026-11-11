import { PeripheralNeed } from '@distro-tailor/core';
import { router } from '../state/router.js';
import { store } from '../state/store.js';
import { scrollToQuestionCard, showToast } from '../utils/dom.js';
import { HandlerContext } from './context.js';

/** Wizard option selection, multi-select toggles, and back / next / skip controls. */
export function bindWizardEvents(ctx: HandlerContext): void {
  const { nextQuestion } = ctx;

  // Wizard option selection buttons
  document.querySelectorAll<HTMLButtonElement>('.option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const optId = btn.getAttribute('data-option-id');
      const opt = nextQuestion?.options.find((o) => o.id === optId);
      if (opt && nextQuestion) {
        if (nextQuestion.isMultiSelect) {
          // Toggle item in multi-select list
          const { peripherals, peripheralNeed } = store.getState().criteria;
          const currentPeripherals: PeripheralNeed[] = [
            ...(peripherals || (peripheralNeed && peripheralNeed !== 'standard' ? [peripheralNeed] : []))
          ];

          if (opt.id === 'standard_peripherals') {
            store.update({
              criteria: {
                ...store.getState().criteria,
                peripherals: ['standard'],
                peripheralNeed: 'standard'
              }
            });
          } else {
            const pKey = opt.appliesCriteria.peripherals?.[0] ?? opt.appliesCriteria.peripheralNeed;
            if (!pKey) return;
            const withoutStandard: PeripheralNeed[] = currentPeripherals.filter((p) => p !== 'standard');
            const exists = withoutStandard.includes(pKey);
            const nextList = exists
              ? withoutStandard.filter((p) => p !== pKey)
              : [...withoutStandard, pKey];

            if (nextList.length === 0) {
              store.update({
                criteria: {
                  ...store.getState().criteria,
                  peripherals: ['standard'],
                  peripheralNeed: 'standard'
                }
              });
            } else {
              store.update({
                criteria: {
                  ...store.getState().criteria,
                  peripherals: nextList,
                  peripheralNeed: nextList[0]
                }
              });
            }
          }
          router.saveStateToUrl(store.getState(), false);
          return;
        }

        const isAlreadyAnswered = store.getState().answeredQuestionIds.has(nextQuestion.id);

        if (isAlreadyAnswered) {
          // Review / Modify mode: update selection in-place without auto-advancing
          store.answerQuestion(nextQuestion.id, opt.appliesCriteria, false);
          router.saveStateToUrl(store.getState(), false);
        } else {
          // First-time forward play: auto-advance with smooth ~140ms visual pulse
          btn.classList.remove('bg-slate-950/70', 'border-slate-700/60');
          btn.classList.add('bg-emerald-500/20', 'border-emerald-400', 'ring-2', 'ring-emerald-400', 'scale-[0.985]');

          setTimeout(() => {
            store.answerQuestion(nextQuestion.id, opt.appliesCriteria, true);
            router.saveStateToUrl(store.getState(), false);
            scrollToQuestionCard();
          }, 140);
        }
      }
    });
  });

  // Back button (top and bottom)
  const handleBack = () => {
    const stepped = store.stepBackQuestion();
    if (stepped) {
      router.saveStateToUrl(store.getState(), false);
      scrollToQuestionCard();
    }
  };
  document.getElementById('btn-back')?.addEventListener('click', handleBack);
  document.getElementById('btn-back-top')?.addEventListener('click', handleBack);

  // Next Question forward button (top and bottom)
  const handleNext = () => {
    if (nextQuestion) {
      store.stepForwardQuestion(nextQuestion.id);
      router.saveStateToUrl(store.getState(), false);
      scrollToQuestionCard();
    }
  };
  document.getElementById('btn-next')?.addEventListener('click', handleNext);
  document.getElementById('btn-next-top')?.addEventListener('click', handleNext);

  // Skip question button (top and bottom)
  const handleSkip = () => {
    if (nextQuestion) {
      const defaultOpt = nextQuestion.options.find((o) => o.isDefault);
      if (nextQuestion.isOptional && defaultOpt && Object.keys(defaultOpt.appliesCriteria).length > 0) {
        store.answerQuestion(nextQuestion.id, defaultOpt.appliesCriteria);
      }
      store.stepForwardQuestion(nextQuestion.id);
      router.saveStateToUrl(store.getState(), false);
      scrollToQuestionCard();
    }
  };
  document.getElementById('btn-skip')?.addEventListener('click', handleSkip);
  document.getElementById('btn-skip-top')?.addEventListener('click', handleSkip);

  // Multi-select confirm & next (top and bottom)
  const handleMultiSelectConfirm = () => {
    if (nextQuestion) {
      store.stepForwardQuestion(nextQuestion.id);
      router.saveStateToUrl(store.getState(), false);
      scrollToQuestionCard();
    }
  };
  document.getElementById('btn-multiselect-confirm')?.addEventListener('click', handleMultiSelectConfirm);
  document.getElementById('btn-multiselect-confirm-top')?.addEventListener('click', handleMultiSelectConfirm);

  // Jump back to match results (top and bottom)
  const handleJumpResults = () => {
    store.setTab('results');
    router.saveStateToUrl(store.getState(), false);
  };
  document.getElementById('btn-jump-results')?.addEventListener('click', handleJumpResults);
  document.getElementById('btn-jump-results-top')?.addEventListener('click', handleJumpResults);

  // Live DOM-local filter for long question option lists (100% flicker-free)
  const filterInput = document.getElementById('input-filter-wizard-options') as HTMLInputElement | null;
  const clearBtn = document.getElementById('btn-clear-wizard-filter');
  const emptyState = document.getElementById('wizard-empty-filter-state');
  const emptyQuerySpan = document.getElementById('wizard-empty-filter-query');
  const optionButtons = document.querySelectorAll<HTMLButtonElement>('.option-btn');

  const applyLiveFilter = (rawQuery: string) => {
    const query = rawQuery.trim().toLowerCase();
    // Keep store state in sync without firing a full-page re-render
    store.setWizardFilter(rawQuery, false);

    if (clearBtn) {
      clearBtn.classList.toggle('hidden', query.length === 0);
    }

    let matchCount = 0;
    optionButtons.forEach((btn) => {
      const text = btn.getAttribute('data-search-text') || '';
      const isMatch = query.length === 0 || text.includes(query);
      btn.classList.toggle('hidden', !isMatch);
      if (isMatch) matchCount++;
    });

    if (emptyState) {
      emptyState.classList.toggle('hidden', matchCount > 0);
      if (emptyQuerySpan) {
        emptyQuerySpan.textContent = `"${rawQuery}"`;
      }
    }
  };

  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      applyLiveFilter(val);
    });

    filterInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        filterInput.value = '';
        applyLiveFilter('');
      }
    });
  }

  const clearFilterAction = () => {
    if (filterInput) {
      filterInput.value = '';
      filterInput.focus();
    }
    applyLiveFilter('');
  };

  clearBtn?.addEventListener('click', clearFilterAction);
  document.getElementById('btn-reset-wizard-filter')?.addEventListener('click', clearFilterAction);
}
