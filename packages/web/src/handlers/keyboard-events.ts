import { Question } from '@distro-tailor/core';
import { router } from '../state/router.js';
import { store } from '../state/store.js';
import { scrollToQuestionCard } from '../utils/dom.js';
import { closeExpertMatrix } from './expert-events.js';

// The window listener is registered once, so it reads the most recently rendered question
// instead of capturing the question from the first render.
let currentQuestion: Question | null | undefined;
let keyboardHandlerRegistered = false;

/** Global keyboard shortcuts: number keys answer, arrows navigate, Escape closes overlays. */
export function bindKeyboardEvents(nextQuestion: Question | null | undefined): void {
  currentQuestion = nextQuestion;
  if (keyboardHandlerRegistered) return;

  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target?.tagName)) return;

    const currentState = store.getState();
    if (currentState.activeTab === 'wizard') {
      if (currentQuestion) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= currentQuestion.options.length) {
          const opt = currentQuestion.options[num - 1];
          if (opt) {
            store.answerQuestion(currentQuestion.id, opt.appliesCriteria);
            router.saveStateToUrl(store.getState(), false);
            scrollToQuestionCard();
            return;
          }
        }
      }

      if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
        const stepped = store.stepBackQuestion();
        if (stepped) {
          router.saveStateToUrl(store.getState(), false);
          scrollToQuestionCard();
        }
      }

      if (e.key === 'ArrowRight') {
        if (currentQuestion) {
          store.stepForwardQuestion(currentQuestion.id);
          router.saveStateToUrl(store.getState(), false);
          scrollToQuestionCard();
        }
      }
    }

    if (e.key === 'Escape') {
      if (currentState.selectedDistroId) {
        store.setSelectedDistro(null);
        return;
      }
      if (currentState.showShareModal) {
        store.setShareModal(false);
        return;
      }
      if (currentState.activeTab === 'expert') {
        closeExpertMatrix();
        return;
      }
    }
  });
  keyboardHandlerRegistered = true;
}
