import { QUESTIONS } from '@distro-tailor/core';
import { router } from '../state/router.js';
import { store } from '../state/store.js';
import { scrollToQuestionCard, showToast } from '../utils/dom.js';
import { HandlerContext } from './context.js';

/** Header navigation, tab switching, resets, blueprint chips, and flow mode. */
export function bindNavigationEvents(ctx: HandlerContext): void {
  const { flow, state, resetAll } = ctx;

  // Brand click -> reset
  document.getElementById('nav-brand')?.addEventListener('click', () => {
    resetAll();
  });

  // Navigation tabs
  document.getElementById('btn-toggle-wizard')?.addEventListener('click', () => {
    store.setTab('wizard');
    router.saveStateToUrl(store.getState(), false);
    scrollToQuestionCard();
  });

  document.getElementById('btn-toggle-expert')?.addEventListener('click', () => {
    store.setTab('expert');
    router.saveStateToUrl(store.getState(), false);
  });

  document.getElementById('btn-view-results')?.addEventListener('click', () => {
    store.setTab('results');
    router.saveStateToUrl(store.getState(), false);
  });

  // Early high-confidence match fast-track button
  document.getElementById('btn-early-results')?.addEventListener('click', () => {
    store.setTab('results');
    router.saveStateToUrl(store.getState(), false);
  });

  // Return to wizard from results to review or modify choices
  const returnToWizard = () => {
    const eligible = flow.getEligibleQuestions(store.getState().criteria);
    const answeredEligible = eligible.filter((q) => store.getState().answeredQuestionIds.has(q.id));
    const targetQ = answeredEligible.length > 0 ? answeredEligible[answeredEligible.length - 1] : eligible[0];
    if (targetQ) {
      store.setViewingQuestion(targetQ.id);
    }
    store.setTab('wizard');
    router.saveStateToUrl(store.getState(), false);
    scrollToQuestionCard();
  };
  document.getElementById('btn-modify-answers')?.addEventListener('click', returnToWizard);
  document.getElementById('btn-tweak-blueprint')?.addEventListener('click', returnToWizard);

  // Individual blueprint chip click to directly modify a specific constraint
  document.querySelectorAll<HTMLButtonElement>('.blueprint-chip-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.getAttribute('data-remove-key');
      if (key) {
        const q = QUESTIONS.find((question) =>
          question.options.some((opt) => opt.appliesCriteria && key in opt.appliesCriteria)
        );
        if (q) {
          store.setViewingQuestion(q.id);
        }
        store.setTab('wizard');
        router.saveStateToUrl(store.getState(), false);
        showToast(`Review choice: ${key}`, '✏️');
        scrollToQuestionCard();
      }
    });
  });

  // Track download interactions and record client-side metrics counter
  document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]').forEach((el) => {
    el.addEventListener('click', () => {
      try {
        const count = Number(localStorage.getItem('dt_downloads_count') || '0') + 1;
        localStorage.setItem('dt_downloads_count', String(count));
      } catch {}
    });
  });

  // Toggle Theme (Dark / Light)
  document.getElementById('btn-toggle-theme')?.addEventListener('click', () => {
    store.toggleTheme();
  });

  // Toggle All 31 Contenders in Leaderboard
  document.getElementById('btn-toggle-all-contenders')?.addEventListener('click', () => {
    store.toggleAllContenders();
  });
  document.getElementById('btn-header-distros-count')?.addEventListener('click', () => {
    store.toggleAllContenders();
  });
  document.getElementById('btn-quick-matrix')?.addEventListener('click', () => {
    store.setTab('expert');
    router.saveStateToUrl(store.getState(), true);
  });

  // Reset triggers
  document.getElementById('btn-reset')?.addEventListener('click', () => resetAll('Reset to fresh start'));
  document.getElementById('btn-start-fresh')?.addEventListener('click', () => resetAll('Reset to fresh start'));
  document.getElementById('btn-fallback-fresh')?.addEventListener('click', () => resetAll());
  document.getElementById('btn-fallback-expert')?.addEventListener('click', () => {
    store.update({ unsupportedSchemaNotice: undefined, activeTab: 'expert' });
    router.saveStateToUrl(store.getState(), true);
  });

  // Tweak choices from shared banner: recipients never answered the wizard, so open the
  // expert matrix where every criterion of the shared build can be edited at once.
  document.getElementById('btn-tweak-shared')?.addEventListener('click', () => {
    store.setTab('expert');
    router.saveStateToUrl(store.getState(), true);
  });

  // Remove choice chip
  document.querySelectorAll<HTMLButtonElement>('.btn-remove-choice').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.getAttribute('data-remove-key');
      if (key) {
        store.removeChoice(key);
        router.saveStateToUrl(store.getState(), true);
        showToast(`Removed filter: ${key}`, '🗑️');
      }
    });
  });

  // Toggle Flow Mode
  document.getElementById('btn-toggle-flow-mode')?.addEventListener('click', () => {
    const isBeginner = state.criteria.experienceLevel === 'beginner' || !state.criteria.experienceLevel;
    const newMode = isBeginner ? 'expert' : 'smart';
    store.setFlowMode(newMode);
    store.update({
      criteria: {
        ...store.getState().criteria,
        experienceLevel: isBeginner ? 'intermediate' : 'beginner'
      }
    });
    router.saveStateToUrl(store.getState(), true);
  });
}
