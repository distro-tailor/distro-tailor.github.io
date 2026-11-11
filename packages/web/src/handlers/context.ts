import { Question, QuestionFlow, RecommendationOutput } from '@distro-tailor/core';
import { AppState } from '../state/store.js';

/** Per-render inputs shared by every handler group bound in attachEventHandlers. */
export interface HandlerContext {
  nextQuestion: Question | null | undefined;
  evaluation: RecommendationOutput;
  flow: QuestionFlow;
  /** State snapshot at render time (use store.getState() for values that change after binding). */
  state: AppState;
  resetAll: (notice?: string) => void;
}
