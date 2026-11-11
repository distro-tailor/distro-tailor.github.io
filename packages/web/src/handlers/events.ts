import { router } from '../state/router.js';
import { store } from '../state/store.js';
import { EventBinder } from '../types.js';
import { showToast } from '../utils/dom.js';
import { HandlerContext } from './context.js';
import { bindExpertEvents } from './expert-events.js';
import { bindKeyboardEvents } from './keyboard-events.js';
import { bindModalEvents } from './modal-events.js';
import { bindNavigationEvents } from './navigation-events.js';
import { bindPanelEvents } from './panel-events.js';
import { bindRecipeEvents } from './recipe-events.js';
import { bindWizardEvents } from './wizard-events.js';

/**
 * Centralized event binding (Controller). Called after every render; delegates to one
 * binder per UI area so each handler group stays small and focused.
 */
export const attachEventHandlers: EventBinder = (nextQuestion, evaluation, flow) => {
  const resetAll = (notice?: string) => {
    store.reset();
    router.resetLoopGuard();
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err) {
      console.warn('Failed to clean URL on reset:', err);
    }
    if (notice) showToast(notice, '⚠️');
  };

  const ctx: HandlerContext = { nextQuestion, evaluation, flow, state: store.getState(), resetAll };

  bindNavigationEvents(ctx);
  bindModalEvents(ctx);
  bindWizardEvents(ctx);
  bindRecipeEvents(ctx);
  bindExpertEvents();
  bindPanelEvents();
  bindKeyboardEvents(nextQuestion);
};
