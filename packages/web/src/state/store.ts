import { UserCriteria, QUESTIONS, QuestionFlow } from '@distro-tailor/core';
import { AppState, AppTab, FlowMode, IAppStore } from '../types.js';

export type { AppState, AppTab, FlowMode, IAppStore };

export function getSavedTheme(): 'dark' | 'light' {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('dt_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
  } catch {}
  return 'dark';
}

export function createDefaultState(): AppState {
  return {
    criteria: {},
    answeredQuestionIds: new Set<string>(),
    answeredQuestionOrder: [],
    viewingQuestionId: null,
    activeTab: 'wizard',
    activeFileIndex: 0,
    unsupportedSchemaNotice: undefined,
    isSharedView: false,
    history: [],
    flowMode: 'smart',
    showShareModal: false,
    showAllContenders: false,
    searchQuery: '',
    selectedDistroId: null,
    theme: getSavedTheme(),
    panelOpen: {}
  };
}

/**
 * Reactive application store extending standard W3C EventTarget.
 * Dispatches 'statechange' CustomEvents upon state transitions.
 */
export class AppStore extends EventTarget implements IAppStore {
  private _state: AppState;

  constructor(initialState?: Partial<AppState>) {
    super();
    this._state = {
      ...createDefaultState(),
      ...(initialState || {})
    };
    if (typeof document !== 'undefined' && this._state.theme) {
      if (this._state.theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    }
  }

  public getState(): Readonly<AppState> {
    return this._state;
  }

  public subscribe(listener: (state: Readonly<AppState>) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<AppState>;
      listener(customEvent.detail || this._state);
    };
    this.addEventListener('statechange', handler);
    return () => this.removeEventListener('statechange', handler);
  }

  private notify(): void {
    this.dispatchEvent(
      new CustomEvent<AppState>('statechange', { detail: this._state })
    );
  }

  public update(patch: Partial<AppState>): void {
    this._state = { ...this._state, ...patch };
    this.notify();
  }

  public setViewingQuestion(questionId: string | null): void {
    this._state.viewingQuestionId = questionId;
    this.notify();
  }

  public pushHistory(): void {
    this._state.history.push({
      criteria: { ...this._state.criteria },
      answeredQuestionIds: new Set(this._state.answeredQuestionIds)
    });
  }

  public popHistory(): boolean {
    if (this._state.history.length === 0) {
      return false;
    }
    const prev = this._state.history.pop()!;
    this._state.criteria = prev.criteria;
    this._state.answeredQuestionIds = prev.answeredQuestionIds;
    this._state.activeTab = 'wizard';
    this.notify();
    return true;
  }

  public stepBackQuestion(): boolean {
    const flow = new QuestionFlow(QUESTIONS);
    const eligible = flow.getEligibleQuestions(this._state.criteria);
    if (eligible.length === 0) return false;

    let currentIdx = -1;
    if (this._state.viewingQuestionId) {
      currentIdx = eligible.findIndex((q) => q.id === this._state.viewingQuestionId);
    }
    if (currentIdx === -1) {
      if (this._state.activeTab === 'results') {
        const answeredEligible = eligible.filter((q) => this._state.answeredQuestionIds.has(q.id));
        currentIdx = answeredEligible.length > 0 ? eligible.indexOf(answeredEligible[answeredEligible.length - 1]) + 1 : eligible.length;
      } else {
        const nextQ = eligible.find((q) => !this._state.answeredQuestionIds.has(q.id));
        currentIdx = nextQ ? eligible.indexOf(nextQ) : eligible.length - 1;
      }
    }

    if (currentIdx > 0) {
      const prevQ = eligible[currentIdx - 1];
      this._state.viewingQuestionId = prevQ.id;
      this._state.activeTab = 'wizard';
      this.notify();
      return true;
    }

    return false;
  }

  public stepForwardQuestion(questionId?: string): boolean {
    const flow = new QuestionFlow(QUESTIONS);
    const qId = questionId || this._state.viewingQuestionId;
    if (qId) {
      this._state.answeredQuestionIds.add(qId);
      const order = this._state.answeredQuestionOrder || (this._state.answeredQuestionOrder = []);
      if (!order.includes(qId)) {
        order.push(qId);
      }
    }

    const eligible = flow.getEligibleQuestions(this._state.criteria);
    let currentIdx = -1;
    if (qId) {
      currentIdx = eligible.findIndex((q) => q.id === qId);
    }
    if (currentIdx === -1) {
      const nextQ = eligible.find((q) => !this._state.answeredQuestionIds.has(q.id));
      currentIdx = nextQ ? eligible.indexOf(nextQ) : 0;
    }

    if (currentIdx !== -1 && currentIdx < eligible.length - 1) {
      const nextQ = eligible[currentIdx + 1];
      this._state.viewingQuestionId = nextQ.id;
      this._state.activeTab = 'wizard';
      this.notify();
      return true;
    }

    // Reached the end of questions -> Go to results
    this._state.viewingQuestionId = null;
    this._state.activeTab = 'results';
    this.notify();
    return false;
  }

  public answerQuestion<K extends keyof UserCriteria>(
    questionId: string,
    keyOrCriteria: K | Partial<UserCriteria>,
    answerValueOrAutoAdvance?: UserCriteria[K] | boolean,
    autoAdvanceParam = true
  ): void {
    this.pushHistory();

    let criteriaPatch: Partial<UserCriteria>;
    let shouldAdvance: boolean;

    if (typeof keyOrCriteria === 'string') {
      criteriaPatch = { [keyOrCriteria]: answerValueOrAutoAdvance as UserCriteria[K] } as Partial<UserCriteria>;
      shouldAdvance = autoAdvanceParam;
    } else {
      criteriaPatch = keyOrCriteria as Partial<UserCriteria>;
      shouldAdvance = typeof answerValueOrAutoAdvance === 'boolean' ? answerValueOrAutoAdvance : true;
    }

    // 1. Clear old criteria keys applied by other options of this question to prevent ghost attributes
    const targetQ = QUESTIONS.find((q) => q.id === questionId);
    if (targetQ) {
      for (const opt of targetQ.options) {
        for (const k of Object.keys(opt.appliesCriteria)) {
          delete (this._state.criteria as Record<string, unknown>)[k];
        }
      }
    }

    // 2. Apply new criteria
    this._state.criteria = {
      ...this._state.criteria,
      ...criteriaPatch
    };
    this._state.answeredQuestionIds.add(questionId);
    const order = this._state.answeredQuestionOrder || (this._state.answeredQuestionOrder = []);
    if (!order.includes(questionId)) {
      order.push(questionId);
    }

    // 3. Reconcile tree: automatically prune any downstream questions that are no longer eligible
    this.reconcileIneligibleCriteria();

    // 4. Handle navigation transition
    if (shouldAdvance) {
      const flow = new QuestionFlow(QUESTIONS);
      const eligible = flow.getEligibleQuestions(this._state.criteria);
      const currentIdx = eligible.findIndex((q) => q.id === questionId);
      if (currentIdx !== -1 && currentIdx < eligible.length - 1) {
        this._state.viewingQuestionId = eligible[currentIdx + 1].id;
        this._state.activeTab = 'wizard';
      } else {
        this._state.viewingQuestionId = null;
        this._state.activeTab = 'results';
      }
    } else {
      // Stay in-place on the current question when reviewing/modifying
      this._state.viewingQuestionId = questionId;
      this._state.activeTab = 'wizard';
    }

    this.notify();
  }

  /**
   * Prunes any answered questions and their applied criteria that are no longer eligible
   * due to upstream criteria changes (e.g. changing platform to container, changing to beginner mode, etc.).
   */
  public reconcileIneligibleCriteria(): void {
    if (this._state.flowMode === 'expert') return;

    const flow = new QuestionFlow(QUESTIONS);
    const eligible = flow.getEligibleQuestions(this._state.criteria);
    const eligibleIds = new Set(eligible.map((q) => q.id));

    // Find answered questions that are no longer eligible
    const ineligibleAnswered = QUESTIONS.filter(
      (q) => !eligibleIds.has(q.id) && this._state.answeredQuestionIds.has(q.id)
    );

    if (ineligibleAnswered.length === 0) return;

    // Determine which criteria keys are still owned by still-eligible answered questions
    const stillEligibleAnswered = QUESTIONS.filter(
      (q) => eligibleIds.has(q.id) && this._state.answeredQuestionIds.has(q.id)
    );
    const preservedKeys = new Set<string>();
    for (const eq of stillEligibleAnswered) {
      for (const opt of eq.options) {
        for (const k of Object.keys(opt.appliesCriteria)) {
          preservedKeys.add(k);
        }
      }
    }

    // Clean up ineligible questions and their orphaned criteria keys
    for (const inelig of ineligibleAnswered) {
      this._state.answeredQuestionIds.delete(inelig.id);
      this._state.answeredQuestionOrder = (this._state.answeredQuestionOrder || []).filter(
        (id) => id !== inelig.id
      );

      for (const opt of inelig.options) {
        for (const key of Object.keys(opt.appliesCriteria)) {
          if (!preservedKeys.has(key)) {
            delete (this._state.criteria as Record<string, unknown>)[key];
          }
        }
      }
    }
  }

  public removeChoice(criteriaKey: string): void {
    this.pushHistory();
    const newCriteria = { ...this._state.criteria };
    delete newCriteria[criteriaKey as keyof UserCriteria];
    this._state.criteria = newCriteria;

    // Remove matching question from answered set
    const q = QUESTIONS.find((question) =>
      question.options.some((opt) => opt.appliesCriteria && criteriaKey in opt.appliesCriteria)
    );
    if (q) {
      this._state.answeredQuestionIds.delete(q.id);
      this._state.answeredQuestionOrder = (this._state.answeredQuestionOrder || []).filter((id) => id !== q.id);
      this._state.viewingQuestionId = q.id;
    }

    // Canonical question ID pairings
    if (criteriaKey === 'useCase') {
      this._state.answeredQuestionIds.delete('beginner_goal');
      this._state.answeredQuestionIds.delete('technical_use_case');
    } else if (criteriaKey === 'platform' || criteriaKey === 'architecture' || criteriaKey === 'formFactor') {
      this._state.answeredQuestionIds.delete('beginner_device');
      this._state.answeredQuestionIds.delete('hardware_architecture');
    } else if (criteriaKey === 'footprint' || criteriaKey === 'maxRamMb') {
      this._state.answeredQuestionIds.delete('beginner_memory');
      this._state.answeredQuestionIds.delete('memory_and_storage');
    } else if (criteriaKey === 'experienceLevel') {
      this._state.answeredQuestionIds.delete('user_familiarity');
    } else if (criteriaKey === 'statePreference') {
      this._state.answeredQuestionIds.delete('system_immutability');
    } else if (criteriaKey === 'cLibPreference' || criteriaKey === 'initPreference') {
      this._state.answeredQuestionIds.delete('c_library_and_init');
    } else if (criteriaKey === 'releaseCadence') {
      this._state.answeredQuestionIds.delete('release_cadence');
    } else if (criteriaKey === 'driverPhilosophy') {
      this._state.answeredQuestionIds.delete('driver_philosophy');
    } else if (criteriaKey === 'bootMedium') {
      this._state.answeredQuestionIds.delete('boot_medium');
    } else if (criteriaKey === 'realtimeAudio') {
      this._state.answeredQuestionIds.delete('audio_latency');
    } else if (criteriaKey === 'peripheralNeed') {
      this._state.answeredQuestionIds.delete('attached_peripherals');
    } else if (criteriaKey === 'prefersGui') {
      this._state.answeredQuestionIds.delete('display_mode');
    } else if (criteriaKey === 'workflowStyle') {
      this._state.answeredQuestionIds.delete('desktop_workflow_style');
    }

    this.notify();
  }

  public setFlowMode(mode: FlowMode): void {
    if (this._state.flowMode === mode) return;

    this._state.flowMode = mode;
    if (mode === 'smart') {
      // Clear advanced technical constraints
      const cleaned = { ...this._state.criteria };
      delete cleaned.cLibPreference;
      delete cleaned.initPreference;
      delete cleaned.statePreference;
      this._state.criteria = cleaned;
      this._state.answeredQuestionIds.delete('c_library_and_init');
      this._state.answeredQuestionIds.delete('system_immutability');
    }
    this.notify();
  }

  public setTab(tab: AppTab): void {
    if (this._state.activeTab === tab) return;
    this._state.activeTab = tab;
    this.notify();
  }

  public setActiveFileIndex(index: number): void {
    if (this._state.activeFileIndex === index) return;
    this._state.activeFileIndex = index;
    this.notify();
  }

  public setShareModal(show: boolean): void {
    if (this._state.showShareModal === show) return;
    this._state.showShareModal = show;
    this.notify();
  }

  public toggleAllContenders(): void {
    this._state.showAllContenders = !this._state.showAllContenders;
    this.notify();
  }

  public setPanelOpen(panelId: string, open: boolean): void {
    if (this._state.panelOpen?.[panelId] === open) return;
    this._state.panelOpen = { ...this._state.panelOpen, [panelId]: open };
    this.notify();
  }

  public setSearchQuery(query: string): void {
    if (this._state.searchQuery === query) return;
    this._state.searchQuery = query;
    this.notify();
  }

  public setSelectedDistro(distroId: string | null): void {
    if (this._state.selectedDistroId === distroId) return;
    this._state.selectedDistroId = distroId;
    this.notify();
  }

  public toggleTheme(): void {
    const nextTheme: 'dark' | 'light' = this._state.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  public setTheme(theme: 'dark' | 'light'): void {
    this._state.theme = theme;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dt_theme', theme);
      }
    } catch {}
    if (typeof document !== 'undefined') {
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    }
    this.notify();
  }

  public reset(cleanCriteria?: UserCriteria): void {
    this._state = {
      ...createDefaultState(),
      criteria: cleanCriteria || {},
      answeredQuestionIds: new Set<string>(),
      answeredQuestionOrder: [],
      viewingQuestionId: null,
      isSharedView: !!cleanCriteria && Object.keys(cleanCriteria).length > 0
    };
    this.notify();
  }
}

export const store = new AppStore();
