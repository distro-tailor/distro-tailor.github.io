import {
  UserCriteria,
  QUESTIONS,
  QuestionFlow,
  evaluateCriteria,
  applyAnswer,
  criteriaValueEquals,
  findQuestionForCriteriaKey,
  isQuestionSubject
} from '@distro-tailor/core';
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
    answerPatches: {},
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
    wizardFilterQuery: '',
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
    // Replacing the answered set (e.g. loading a URL) invalidates per-question patches from the old
    // state; a direct criteria edit (Expert tab) keeps only the recorded values it did not change.
    if (patch.answeredQuestionIds && !patch.answerPatches) {
      this._state.answerPatches = {};
    } else if (patch.criteria && !patch.answerPatches) {
      this.syncPatchesToCriteria();
    }
    this.notify();
  }

  public setViewingQuestion(questionId: string | null): void {
    this._state.viewingQuestionId = questionId;
    this.notify();
  }

  public pushHistory(): void {
    this._state.history.push({
      criteria: { ...this._state.criteria },
      answeredQuestionIds: new Set(this._state.answeredQuestionIds),
      answeredQuestionOrder: [...(this._state.answeredQuestionOrder || [])],
      flowMode: this._state.flowMode,
      answerPatches: { ...(this._state.answerPatches || {}) }
    });
  }

  public popHistory(): boolean {
    if (this._state.history.length === 0) {
      return false;
    }
    const prev = this._state.history.pop()!;
    this._state.criteria = prev.criteria;
    this._state.answeredQuestionIds = prev.answeredQuestionIds;
    if (prev.answeredQuestionOrder) {
      this._state.answeredQuestionOrder = prev.answeredQuestionOrder;
    }
    if (prev.flowMode) {
      this._state.flowMode = prev.flowMode;
    }
    this._state.answerPatches = { ...(prev.answerPatches || {}) };
    this._state.activeTab = 'wizard';
    this.notify();
    return true;
  }

  public stepBackQuestion(): boolean {
    const flow = new QuestionFlow(QUESTIONS);
    const eligible = flow.getEligibleQuestions(this._state.criteria, this._state.answeredQuestionIds);
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
      if (this._state.activeTab === 'results') this.captureResultsBaseline();
      this._state.viewingQuestionId = prevQ.id;
      this._state.wizardFilterQuery = '';
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

    const nextId = this.nextQuestionIdAfter(qId || null);
    if (nextId) {
      this._state.viewingQuestionId = nextId;
      this._state.wizardFilterQuery = '';
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

    // 1. An earlier answer to this question whose patch is unknown (e.g. after a URL load) has its
    //    option keys cleared directly, so no ghost attributes survive the re-answer.
    const previousPatches = this._state.answerPatches || {};

    // 2. Record the answer and replay every recorded answer in question order. Later questions win:
    //    the device replaces the goal's hardware guesses, and changing the goal re-derives its
    //    inferences without overwriting explicit answers to the questions after it.
    this._state.answeredQuestionIds.add(questionId);
    const order = this._state.answeredQuestionOrder || (this._state.answeredQuestionOrder = []);
    if (!order.includes(questionId)) {
      order.push(questionId);
    }
    const next = applyAnswer(
      { criteria: this._state.criteria, patches: previousPatches, answeredIds: this._state.answeredQuestionIds },
      questionId,
      criteriaPatch
    );
    this._state.answerPatches = { ...next.patches };
    this._state.criteria = next.criteria;

    // 3. Reconcile tree: automatically prune any downstream questions that are no longer eligible
    this.reconcileIneligibleCriteria();

    // 4. Handle navigation transition
    if (shouldAdvance) {
      const nextId = this.nextQuestionIdAfter(questionId);
      if (nextId) {
        this._state.viewingQuestionId = nextId;
        this._state.wizardFilterQuery = '';
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
   * Where Next goes from `fromId`: the following eligible question (answered ones included, so a
   * review walks through them). At the end of the flow it falls back to any eligible question still
   * unanswered, e.g. one an edited answer just unlocked, before results. Null means go to results.
   */
  public nextQuestionIdAfter(fromId: string | null): string | null {
    const flow = new QuestionFlow(QUESTIONS);
    const answered = this._state.answeredQuestionIds;
    const eligible = flow.getEligibleQuestions(this._state.criteria, answered);
    const idx = fromId ? eligible.findIndex((q) => q.id === fromId) : -1;
    if (idx === -1) {
      // Not on an eligible question (none yet, or it no longer applies): go to the first open one,
      // or to results when everything is answered
      return eligible.find((q) => !answered.has(q.id))?.id ?? null;
    }
    if (idx + 1 < eligible.length) return eligible[idx + 1].id;
    return this.firstUnansweredQuestionId();
  }

  /** The first eligible question not yet answered, or null when the flow is complete. */
  public firstUnansweredQuestionId(): string | null {
    const flow = new QuestionFlow(QUESTIONS);
    return flow.getNextQuestion(this._state.criteria, this._state.answeredQuestionIds)?.id ?? null;
  }

  /**
   * Drops recorded answer values that no longer match the criteria after a direct edit (mode
   * switch, removed choice, Expert tab), so a later replay never resurrects them.
   */
  private syncPatchesToCriteria(): void {
    const criteria = this._state.criteria as Record<string, unknown>;
    const synced: Record<string, Partial<UserCriteria>> = {};
    for (const [id, patch] of Object.entries(this._state.answerPatches || {})) {
      synced[id] = Object.fromEntries(
        Object.entries(patch).filter(([k, v]) => criteriaValueEquals(criteria[k], v))
      ) as Partial<UserCriteria>;
    }
    this._state.answerPatches = synced;
  }

  /** Drops recorded patches for questions that are no longer answered. */
  private prunePatches(): void {
    const patches = this._state.answerPatches || {};
    this._state.answerPatches = Object.fromEntries(
      Object.entries(patches).filter(([id]) => this._state.answeredQuestionIds.has(id))
    );
  }

  /**
   * Prunes any answered questions and their applied criteria that are no longer eligible
   * due to upstream criteria changes (e.g. changing platform to container, changing to beginner mode, etc.).
   */
  public reconcileIneligibleCriteria(): void {
    if (this._state.activeTab === 'expert') return;

    const flow = new QuestionFlow(QUESTIONS);
    const eligible = flow.getEligibleQuestions(this._state.criteria, this._state.answeredQuestionIds);
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
    this.prunePatches();
  }

  public removeChoice(criteriaKey: string): void {
    this.pushHistory();
    const newCriteria = { ...this._state.criteria };
    delete newCriteria[criteriaKey as keyof UserCriteria];
    this._state.criteria = newCriteria;

    // Re-open the question this choice belongs to. Only un-answer it when the key is what it asks
    // (e.g. release_cadence), not when the value was merely inferred by a goal or device answer.
    const q = findQuestionForCriteriaKey(criteriaKey, newCriteria);
    if (q) {
      if (isQuestionSubject(q, criteriaKey)) {
        this._state.answeredQuestionIds.delete(q.id);
        this._state.answeredQuestionOrder = (this._state.answeredQuestionOrder || []).filter((id) => id !== q.id);
      }
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
    } else if (criteriaKey === 'fileSystem') {
      this._state.answeredQuestionIds.delete('filesystem_and_storage');
    }

    // An explicitly removed choice must not come back when another question is re-answered later
    this.syncPatchesToCriteria();
    this.prunePatches();

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
      delete cleaned.fileSystem;
      delete cleaned.kernelFlavor;
      delete cleaned.bootloader;
      delete cleaned.securityProfile;
      delete cleaned.networkingStack;
      delete cleaned.firmwareMode;
      delete cleaned.secureBoot;
      delete cleaned.tpmUsage;
      delete cleaned.virtHost;
      delete cleaned.devicePassthrough;
      delete cleaned.guestPlatform;
      this._state.criteria = cleaned;
      this._state.answeredQuestionIds.delete('c_library_and_init');
      this._state.answeredQuestionIds.delete('system_immutability');
      this._state.answeredQuestionIds.delete('filesystem_and_storage');
    }
    this.notify();
  }

  public toggleWizardMode(): void {
    this.pushHistory();
    const isBeginner = this._state.criteria.experienceLevel === 'beginner' || !this._state.criteria.experienceLevel;
    const newMode: FlowMode = isBeginner ? 'expert' : 'smart';
    const nextExp = isBeginner ? 'intermediate' : 'beginner';

    const pairMap: ReadonlyArray<readonly [string, string]> = [
      ['beginner_goal', 'technical_use_case'],
      ['beginner_device', 'hardware_architecture'],
      ['beginner_memory', 'memory_and_storage']
    ];

    // Remap answeredQuestionIds and viewingQuestionId across Goal <-> Technical equivalents
    const nextAnswered = new Set(this._state.answeredQuestionIds);
    let nextOrder = [...(this._state.answeredQuestionOrder || [])];
    const nextPatches: Record<string, Partial<UserCriteria>> = { ...(this._state.answerPatches || {}) };
    let nextViewing = this._state.viewingQuestionId || null;

    for (const [begId, techId] of pairMap) {
      const fromId = isBeginner ? begId : techId;
      const toId = isBeginner ? techId : begId;
      if (nextAnswered.delete(fromId)) {
        nextAnswered.add(toId);
      }
      nextOrder = nextOrder.map((id) => (id === fromId ? toId : id));
      if (nextPatches[fromId]) {
        nextPatches[toId] = nextPatches[fromId];
        delete nextPatches[fromId];
      }
      if (nextViewing === fromId) {
        nextViewing = toId;
      }
    }

    this._state.answeredQuestionIds = nextAnswered;
    this._state.answerPatches = nextPatches;
    this._state.answeredQuestionOrder = nextOrder.filter((id, i) => nextOrder.indexOf(id) === i);
    this._state.criteria = {
      ...this._state.criteria,
      experienceLevel: nextExp
    };

    if (newMode === 'smart') {
      // Clear expert-only criteria when returning to Goal Mode
      const cleaned = { ...this._state.criteria };
      delete cleaned.cLibPreference;
      delete cleaned.initPreference;
      delete cleaned.statePreference;
      delete cleaned.fileSystem;
      delete cleaned.kernelFlavor;
      delete cleaned.bootloader;
      delete cleaned.securityProfile;
      delete cleaned.networkingStack;
      delete cleaned.firmwareMode;
      delete cleaned.secureBoot;
      delete cleaned.tpmUsage;
      delete cleaned.virtHost;
      delete cleaned.devicePassthrough;
      delete cleaned.guestPlatform;
      this._state.criteria = cleaned;
      const expertOnlyIds = new Set(['c_library_and_init', 'system_immutability', 'filesystem_and_storage']);
      for (const id of expertOnlyIds) {
        this._state.answeredQuestionIds.delete(id);
      }
      this._state.answeredQuestionOrder = this._state.answeredQuestionOrder.filter((id) => !expertOnlyIds.has(id));
    }

    this._state.flowMode = newMode;
    this.syncPatchesToCriteria();

    // Prune remapped answers that are not eligible in the target mode (e.g. beginner_device for browser-wasm)
    this.reconcileIneligibleCriteria();

    // Ensure viewingQuestionId points to an eligible question in the target mode
    const flow = new QuestionFlow(QUESTIONS);
    const eligible = flow.getEligibleQuestions(this._state.criteria, this._state.answeredQuestionIds);
    if (nextViewing && !eligible.some((q) => q.id === nextViewing)) {
      nextViewing = null;
    }
    this._state.viewingQuestionId = nextViewing;
    this._state.wizardFilterQuery = '';
    this.notify();
  }

  public setTab(tab: AppTab): void {
    if (this._state.activeTab === tab) return;
    if (this._state.activeTab === 'results' && tab === 'wizard') this.captureResultsBaseline();
    this._state.activeTab = tab;
    this.notify();
  }

  public clearResultsBaseline(): void {
    this._state.resultsBaseline = null;
    this.notify();
  }

  /**
   * Remembers the top match before the user goes back to edit answers. Kept until dismissed, so
   * several round trips report the cumulative change since results were first left.
   */
  private captureResultsBaseline(): void {
    if (this._state.resultsBaseline) return;
    this._state.resultsBaseline = {
      distroId: evaluateCriteria(this._state.criteria).bestMatch.distro.id,
      criteria: { ...this._state.criteria }
    };
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

  public setWizardFilter(query: string, notify = true): void {
    if (this._state.wizardFilterQuery === query) return;
    this._state.wizardFilterQuery = query;
    if (notify) {
      this.notify();
    }
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
