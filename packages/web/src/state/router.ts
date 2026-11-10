import {
  CURRENT_SCHEMA_VERSION,
  deserializeCriteriaFromParams,
  migrateUrlParameters,
  UserCriteria
} from '@distro-tailor/core';
import { AppState, AppTab } from './store.js';

export const LOOP_WINDOW_MS = 2000;
export const MAX_TRANSITIONS_IN_WINDOW = 50;

export interface ParsedUrlResult {
  supported: boolean;
  criteria: UserCriteria;
  answeredQuestionIds: Set<string>;
  activeTab: AppTab;
  activeFileIndex: number;
  unsupportedNotice?: string;
  isSharedView: boolean;
}

/**
 * Serializes application state into URL search parameters.
 */
export function serializeStateToParams(state: AppState): URLSearchParams {
  const params = new URLSearchParams();

  // Always write schema version first to guarantee backward-compatibility across releases
  params.set('v', String(CURRENT_SCHEMA_VERSION));

  if (state.activeTab !== 'wizard') {
    params.set('tab', state.activeTab);
  }

  if (state.activeFileIndex > 0) {
    params.set('file', String(state.activeFileIndex));
  }

  if (state.answeredQuestionIds.size > 0) {
    params.set('ans', Array.from(state.answeredQuestionIds).join(','));
  }

  // Serialize criteria keys into clean query parameters
  for (const [key, value] of Object.entries(state.criteria)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }

  return params;
}

/**
 * Pure parser for URL queries/hashes with schema migration and alias normalization.
 */
export function parseRawUrlParams(rawInput: string): ParsedUrlResult {
  const cleanInput = rawInput.trim();
  if (!cleanInput || cleanInput === '?' || cleanInput === '#' || cleanInput === '#/?') {
    return {
      supported: true,
      criteria: {},
      answeredQuestionIds: new Set<string>(),
      activeTab: 'wizard',
      activeFileIndex: 0,
      isSharedView: false
    };
  }

  const queryPart = cleanInput.includes('?')
    ? cleanInput.slice(cleanInput.indexOf('?') + 1)
    : cleanInput.replace(/^[#?]\/?/, '');

  const urlSearchParams = new URLSearchParams(queryPart);
  const rawRecord: Record<string, string> = {};
  for (const [k, v] of urlSearchParams.entries()) {
    rawRecord[k] = v;
  }

  const migration = migrateUrlParameters(rawRecord);

  if (!migration.supported) {
    return {
      supported: false,
      criteria: {},
      answeredQuestionIds: new Set<string>(),
      activeTab: 'wizard',
      activeFileIndex: 0,
      unsupportedNotice: migration.fallbackNotice,
      isSharedView: false
    };
  }

  const params = new Map(Object.entries(migration.params));
  const tab = params.get('tab');
  const activeTab: AppTab = tab === 'wizard' || tab === 'expert' || tab === 'results' ? tab : 'wizard';

  const file = params.get('file');
  const activeFileIndex = file && !isNaN(Number(file)) ? Number(file) : 0;

  const answeredQuestionIds = new Set<string>();
  const ans = params.get('ans');
  if (ans) {
    ans.split(',').filter(Boolean).forEach((id) => answeredQuestionIds.add(id));
  }

  const criteria = deserializeCriteriaFromParams(migration.params);
  const isSharedView = Object.keys(criteria).length > 0;

  return {
    supported: true,
    criteria,
    answeredQuestionIds,
    activeTab,
    activeFileIndex,
    isSharedView
  };
}

/**
 * Stateful browser router managing window.history, in-app history depth, and loop protection.
 */
export class AppRouter {
  private transitionTimestamps: number[] = [];
  public inAppHistoryDepth = 0;
  public isSyncing = false;

  public checkLoopSafeguard(): boolean {
    const now = Date.now();
    this.transitionTimestamps = this.transitionTimestamps.filter((t) => now - t < LOOP_WINDOW_MS);
    this.transitionTimestamps.push(now);

    if (this.transitionTimestamps.length > MAX_TRANSITIONS_IN_WINDOW) {
      console.error('[DistroTailor Safeguard] Excessive state transitions detected. Stabilizing.');
      return false;
    }
    return true;
  }

  public resetLoopGuard(): void {
    this.transitionTimestamps = [];
  }

  public saveStateToUrl(state: AppState, push = false): void {
    if (this.isSyncing) return;
    if (!this.checkLoopSafeguard()) return;
    if (typeof window === 'undefined') return;

    const params = serializeStateToParams(state);
    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl === newUrl) {
      return;
    }

    try {
      if (push) {
        window.history.pushState({ ...state.criteria }, '', newUrl);
        this.inAppHistoryDepth++;
      } else {
        window.history.replaceState({ ...state.criteria }, '', newUrl);
      }
    } catch (err) {
      console.warn('Failed to update browser history:', err);
    }
  }

  public stepBack(onFallbackStep: () => void): void {
    if (this.inAppHistoryDepth > 0 && typeof window !== 'undefined') {
      window.history.back();
    } else {
      onFallbackStep();
    }
  }
}

export const router = new AppRouter();
