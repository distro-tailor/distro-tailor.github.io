import { evaluateCriteria, QuestionFlow, QUESTIONS } from '@distro-tailor/core';
import { renderCriteriaChips } from './components/chips.js';
import { renderFooter, renderLeaderboard, renderNavbar } from './components/layout.js';
import { renderShareModal } from './components/share-modal.js';
import { attachEventHandlers } from './handlers/events.js';
import { parseRawUrlParams, router } from './state/router.js';
import { store } from './state/store.js';
import { scrollToQuestionCard, showToast } from './utils/dom.js';
import { renderExpertMatrix } from './views/expert-matrix-view.js';
import { renderResultsView } from './views/results-view.js';
import { renderUnsupportedSchemaFallback, renderWizardQuestion } from './views/wizard-view.js';

const flow = new QuestionFlow(QUESTIONS);

function getAppElement(): HTMLElement {
  const el = document.getElementById('app');
  if (!el) throw new Error('#app root container element not found in DOM');
  return el;
}

function renderPrimaryContent(
  nextQuestion: ReturnType<typeof flow.getNextQuestion>,
  progress: ReturnType<typeof flow.getProgress>,
  evaluation: ReturnType<typeof evaluateCriteria>,
  state: ReturnType<typeof store.getState>
): string {
  if (state.unsupportedSchemaNotice) {
    return renderUnsupportedSchemaFallback(state.unsupportedSchemaNotice);
  }

  if (state.activeTab === 'results' || (!nextQuestion && state.activeTab === 'wizard')) {
    return renderResultsView(evaluation, state);
  }

  if (state.activeTab === 'expert') {
    return renderExpertMatrix(state);
  }

  if (!nextQuestion) {
    return renderResultsView(evaluation, state);
  }

  return renderWizardQuestion(nextQuestion, progress, state, evaluation);
}

function render(): void {
  const app = getAppElement();
  const state = store.getState();
  const evaluation = evaluateCriteria(state.criteria);
  const nextQuestion = flow.getNextQuestion(state.criteria, state.answeredQuestionIds);
  const progress = flow.getProgress(state.criteria, state.answeredQuestionIds);

  app.innerHTML = `
    <!-- Top Navigation Header -->
    ${renderNavbar(state, evaluation)}

    <!-- Main Workspace -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-3.5 py-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 min-w-0 max-w-full overflow-x-clip">
      
      <!-- Primary Left Column: Wizard Cards, Results, or Expert Matrix -->
      <section class="lg:col-span-8 flex flex-col gap-6 min-w-0 w-full max-w-full overflow-x-clip">
        ${renderPrimaryContent(nextQuestion, progress, evaluation, state)}
      </section>

      <!-- Right Column: Live Standings Leaderboard & Selected Chips -->
      <aside class="lg:col-span-4 flex flex-col gap-4 min-w-0 w-full max-w-full">
        <div class="bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 sm:p-5 sticky top-24 shadow-xl min-w-0">
          ${renderLeaderboard(evaluation, state)}
          ${renderCriteriaChips(state.criteria)}
        </div>
      </aside>

    </main>

    <!-- Rich Community & Developer Footer -->
    ${renderFooter()}

    <!-- Interactive Share Modal -->
    ${state.showShareModal ? renderShareModal(evaluation, state.criteria) : ''}
  `;

  attachEventHandlers(nextQuestion, evaluation, flow);
}

function handlePopState(): void {
  if (router.isSyncing) return;
  if (!router.checkLoopSafeguard()) return;

  router.isSyncing = true;
  try {
    if (router.inAppHistoryDepth > 0) {
      router.inAppHistoryDepth--;
    }
    const rawParams = window.location.search || window.location.hash;
    const parsed = parseRawUrlParams(rawParams);

    if (!parsed.supported) {
      store.update({
        unsupportedSchemaNotice: parsed.unsupportedNotice,
        criteria: {},
        answeredQuestionIds: new Set<string>()
      });
      return;
    }

    store.update({
      criteria: parsed.criteria,
      answeredQuestionIds: parsed.answeredQuestionIds,
      activeTab: parsed.activeTab,
      activeFileIndex: parsed.activeFileIndex,
      isSharedView: parsed.isSharedView,
      unsupportedSchemaNotice: undefined
    });

    scrollToQuestionCard();
  } catch (err) {
    console.error('Error handling popstate navigation:', err);
    showToast('Navigation error. Returning to start.', '⚠️');
  } finally {
    router.isSyncing = false;
  }
}

function init(): void {
  // Subscribe UI render to store changes
  store.subscribe(() => {
    render();
  });

  // Browser navigation history listener
  window.addEventListener('popstate', handlePopState);

  // Initial mount from URL
  const rawParams = window.location.search || window.location.hash;
  if (rawParams) {
    const parsed = parseRawUrlParams(rawParams);
    if (parsed.supported) {
      let initialTab = parsed.activeTab;
      if (Object.keys(parsed.criteria).length > 0 && !window.location.search.includes('tab=')) {
        const nextQ = flow.getNextQuestion(parsed.criteria, parsed.answeredQuestionIds);
        if (!nextQ) initialTab = 'results';
      }

      store.update({
        criteria: parsed.criteria,
        answeredQuestionIds: parsed.answeredQuestionIds,
        activeTab: initialTab,
        activeFileIndex: parsed.activeFileIndex,
        isSharedView: parsed.isSharedView,
        unsupportedSchemaNotice: undefined
      });
    } else {
      store.update({
        unsupportedSchemaNotice: parsed.unsupportedNotice,
        criteria: {},
        answeredQuestionIds: new Set<string>()
      });
    }
  }

  render();
}

// Boot application
init();
