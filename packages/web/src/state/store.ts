import { UserCriteria, QUESTIONS } from '@distro-tailor/core';

export type AppTab = 'wizard' | 'expert' | 'results';
export type FlowMode = 'smart' | 'expert';

export interface AppState {
  criteria: UserCriteria;
  answeredQuestionIds: Set<string>;
  activeTab: AppTab;
  activeFileIndex: number;
  unsupportedSchemaNotice?: string;
  isSharedView: boolean;
  history: Array<{ criteria: UserCriteria; answeredQuestionIds: Set<string> }>;
  flowMode: FlowMode;
  showShareModal: boolean;
}

export function createDefaultState(): AppState {
  return {
    criteria: {},
    answeredQuestionIds: new Set<string>(),
    activeTab: 'wizard',
    activeFileIndex: 0,
    unsupportedSchemaNotice: undefined,
    isSharedView: false,
    history: [],
    flowMode: 'smart',
    showShareModal: false
  };
}

/**
 * Reactive application store extending standard W3C EventTarget.
 * Dispatches 'statechange' CustomEvents upon state transitions.
 */
export class AppStore extends EventTarget {
  private _state: AppState;

  constructor(initialState?: Partial<AppState>) {
    super();
    this._state = {
      ...createDefaultState(),
      ...(initialState || {})
    };
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
    this.notify();
    return true;
  }

  public answerQuestion<K extends keyof UserCriteria>(
    questionId: string,
    answerKey: K,
    answerValue: UserCriteria[K]
  ): void {
    this.pushHistory();
    this._state.criteria = {
      ...this._state.criteria,
      [answerKey]: answerValue
    };
    this._state.answeredQuestionIds.add(questionId);
    this.notify();
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
    }

    // Canonical question ID pairings
    if (criteriaKey === 'useCase') {
      this._state.answeredQuestionIds.delete('beginner_goal');
      this._state.answeredQuestionIds.delete('technical_use_case');
    } else if (criteriaKey === 'platform' || criteriaKey === 'architecture') {
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

  public reset(cleanCriteria?: UserCriteria): void {
    this._state = {
      ...createDefaultState(),
      criteria: cleanCriteria || {},
      isSharedView: !!cleanCriteria && Object.keys(cleanCriteria).length > 0
    };
    this.notify();
  }
}

export const store = new AppStore();
