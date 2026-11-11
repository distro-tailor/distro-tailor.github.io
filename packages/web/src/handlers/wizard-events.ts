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

        btn.classList.remove('bg-slate-950/70', 'border-slate-700/60');
        btn.classList.add('bg-emerald-500/20', 'border-emerald-400', 'ring-2', 'ring-emerald-400', 'scale-[0.985]');

        setTimeout(() => {
          store.answerQuestion(nextQuestion.id, opt.appliesCriteria);
          router.saveStateToUrl(store.getState(), false);
          scrollToQuestionCard();
        }, 80);
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
}
