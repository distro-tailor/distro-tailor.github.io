import { UserCriteria, QUESTIONS } from '@distro-tailor/core';
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
    theme: getSavedTheme()
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
    if (this.popHistory()) {
      return true;
    }

    if (this._state.answeredQuestionIds.size > 0) {
      const answeredList = QUESTIONS.filter((q) => this._state.answeredQuestionIds.has(q.id));
      const lastQ = answeredList[answeredList.length - 1];
      if (lastQ) {
        const newAnswered = new Set(this._state.answeredQuestionIds);
        newAnswered.delete(lastQ.id);
        const newCriteria = { ...this._state.criteria };
        lastQ.options.forEach((opt) => {
          Object.keys(opt.appliesCriteria).forEach((k) => {
            delete newCriteria[k as keyof UserCriteria];
          });
        });
        this._state.criteria = newCriteria;
        this._state.answeredQuestionIds = newAnswered;
        this._state.activeTab = 'wizard';
        this.notify();
        return true;
      }
    }

    return false;
  }

  public stepForwardQuestion(questionId: string): void {
    this.pushHistory();
    this._state.answeredQuestionIds.add(questionId);
    this._state.activeTab = 'wizard';
    this.notify();
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
      isSharedView: !!cleanCriteria && Object.keys(cleanCriteria).length > 0
    };
    this.notify();
  }
}

export const store = new AppStore();
