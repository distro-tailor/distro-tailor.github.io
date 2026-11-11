import { Question, QuestionFlow, RecommendationOutput, UserCriteria } from '@distro-tailor/core';

/**
 * Valid view tabs in the single-page application.
 */
export type AppTab = 'wizard' | 'expert' | 'results';

/**
 * Wizard flow mode: 'smart' (goal-oriented novice) vs 'expert' (low-level architecture/libc/init).
 */
export type FlowMode = 'smart' | 'expert';

/**
 * Immutable snapshot for local undo/history stacks.
 */
export interface HistorySnapshot {
  criteria: UserCriteria;
  answeredQuestionIds: Set<string>;
}

/**
 * Complete immutable application state tree.
 */
export interface AppState {
  criteria: UserCriteria;
  answeredQuestionIds: Set<string>;
  answeredQuestionOrder?: string[];
  viewingQuestionId?: string | null;
  activeTab: AppTab;
  activeFileIndex: number;
  unsupportedSchemaNotice?: string;
  isSharedView: boolean;
  history: HistorySnapshot[];
  flowMode: FlowMode;
  showShareModal: boolean;
  showAllContenders: boolean;
  searchQuery?: string;
  selectedDistroId?: string | null;
  theme?: 'dark' | 'light';
}

/**
 * Contract: Reactive Application Store (Model).
 * Guarantees single source of truth and predictable unidirectional state transitions.
 */
export interface IAppStore {
  /**
   * Retrieves an immutable reference to the current state snapshot.
   */
  getState(): Readonly<AppState>;

  /**
   * Subscribes a listener to state transition events.
   * Returns an unsubscribe callback for automatic cleanup.
   */
  subscribe(listener: (state: Readonly<AppState>) => void): () => void;

  /**
   * Applies a partial state patch and notifies active subscribers.
   */
  update(patch: Partial<AppState>): void;

  /**
   * Pushes a history snapshot for backtracking.
   */
  pushHistory(): void;

  /**
   * Restores the previous state snapshot. Returns true if popped, false if history was empty.
   */
  popHistory(): boolean;

  /**
   * Sets the specific question currently being viewed in the wizard.
   */
  setViewingQuestion(questionId: string | null): void;

  /**
   * Steps back exactly one question in the wizard, falling back to taxonomy backtracking if history is empty.
   */
  stepBackQuestion(): boolean;

  /**
   * Steps forward to the next question in the decision tree, keeping existing criteria for this step.
   */
  stepForwardQuestion(questionId?: string): boolean;

  /**
   * Answers a specific question and stores criteria with compile-time type validation.
   */
  answerQuestion<K extends keyof UserCriteria>(
    questionId: string,
    keyOrCriteria: K | Partial<UserCriteria>,
    answerValue?: UserCriteria[K]
  ): void;

  /**
   * Clears a user choice by criterion key and unmarks corresponding question IDs.
   */
  removeChoice(criteriaKey: string): void;

  /**
   * Toggles flow mode, automatically clearing technical jargon criteria when switching to smart mode.
   */
  setFlowMode(mode: FlowMode): void;

  /**
   * Sets active workspace tab (wizard, expert, results).
   */
  setTab(tab: AppTab): void;

  /**
   * Selects active file tab in generated recipe viewer.
   */
  setActiveFileIndex(index: number): void;

  /**
   * Toggles visibility of the interactive share modal.
   */
  setShareModal(show: boolean): void;

  /**
   * Toggles visibility of all 31 contenders in the live sidebar leaderboard.
   */
  toggleAllContenders(): void;

  /**
   * Sets the live search query for filtering distributions in leaderboard and catalog.
   */
  setSearchQuery(query: string): void;

  /**
   * Sets the selected distro profile to display in the detailed preview modal.
   */
  setSelectedDistro(distroId: string | null): void;

  /**
   * Toggles between dark and light themes and updates DOM and storage.
   */
  toggleTheme(): void;

  /**
   * Completely resets state to initial defaults, optionally applying clean shared criteria.
   */
  reset(cleanCriteria?: UserCriteria): void;
}

/**
 * Decoded result from URL query parameters and hashes.
 */
export interface ParsedUrlResult {
  supported: boolean;
  criteria: UserCriteria;
  answeredQuestionIds: Set<string>;
  answeredQuestionOrder?: string[];
  viewingQuestionId?: string | null;
  activeTab: AppTab;
  activeFileIndex: number;
  unsupportedNotice?: string;
  isSharedView: boolean;
}

/**
 * Contract: Browser URL & History Synchronization (Router).
 * Protects against infinite navigation loops and accidental site ejections.
 */
export interface IAppRouter {
  /**
   * Number of in-app navigation steps performed during the current user session.
   */
  readonly inAppHistoryDepth: number;

  /**
   * Guard flag preventing circular re-triggering during active popstate transitions.
   */
  readonly isSyncing: boolean;

  /**
   * Verifies that state transitions do not exceed safety threshold within the loop window.
   */
  checkLoopSafeguard(): boolean;

  /**
   * Resets transition timestamps back to initial clean state.
   */
  resetLoopGuard(): void;

  /**
   * Synchronizes current application state to window.location without reloading the page.
   */
  saveStateToUrl(state: AppState, push?: boolean): void;

  /**
   * Performs an in-app step back or executes a fallback handler if at the root page.
   */
  stepBack(onFallbackStep: () => void): void;
}

/**
 * Contract: Pure View Function.
 * Accepts input data and returns deterministic, sanitized HTML markup with zero side effects.
 */
export type ViewRenderer<TProps> = (props: TProps) => string;

/**
 * Standard properties passed into top-level screen views.
 */
export interface ScreenViewProps {
  state: AppState;
  evaluation: RecommendationOutput;
  nextQuestion?: Question | null;
  progress: { current: number; total: number; percentage: number };
}

/**
 * Contract: Controller / Action Dispatcher.
 * Binds user DOM events back to typed store and router actions.
 */
export type EventBinder = (
  nextQuestion: Question | null | undefined,
  evaluation: RecommendationOutput,
  flow: QuestionFlow
) => void;
