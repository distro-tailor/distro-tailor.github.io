import { QUESTIONS } from '../taxonomy/questions.js';
import { Question, UserCriteria } from '../types.js';

/** Criteria recorded per answered question, keyed by question id. */
export type AnswerPatches = Readonly<Record<string, Partial<UserCriteria>>>;

/** Equality for criteria values (strings, booleans, numbers, and string lists). */
export function criteriaValueEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => item === b[i]);
  }
  return false;
}

/** Every criteria key any option of the question can set (empty for unknown ids). */
export function questionOptionKeys(questionId: string, questions: readonly Question[] = QUESTIONS): Set<string> {
  const q = questions.find((x) => x.id === questionId);
  return new Set((q?.options || []).flatMap((opt) => Object.keys(opt.appliesCriteria)));
}

/**
 * Rebuilds criteria from recorded wizard answers. Values the previous answers contributed are
 * removed from `current`, then every answered question's patch is applied in flow order. A later
 * question also drops keys it owns but did not set when an earlier answer supplied them (the device
 * replaces the goal's platform/footprint guesses). Values no recorded answer supplied, such as
 * Expert tab edits or criteria from a shared URL, are kept.
 */
export function replayAnswers(
  current: Readonly<Record<string, unknown>>,
  previousPatches: AnswerPatches,
  patches: AnswerPatches,
  answeredIds: ReadonlySet<string>,
  questions: readonly Question[] = QUESTIONS
): UserCriteria {
  const criteria: Record<string, unknown> = { ...current };
  for (const patch of Object.values(previousPatches)) {
    for (const [k, v] of Object.entries(patch)) {
      if (criteriaValueEquals(criteria[k], v)) delete criteria[k];
    }
  }

  const fromAnswers = new Set<string>();
  for (const q of [...questions].sort((a, b) => a.order - b.order)) {
    const patch = patches[q.id];
    if (!patch || !answeredIds.has(q.id)) continue;
    for (const k of questionOptionKeys(q.id, questions)) {
      if (!(k in patch) && fromAnswers.has(k)) {
        delete criteria[k];
        fromAnswers.delete(k);
      }
    }
    for (const [k, v] of Object.entries(patch)) {
      criteria[k] = v;
      fromAnswers.add(k);
    }
  }
  // Answers recorded under ids outside the question catalog are applied last
  const known = new Set(questions.map((q) => q.id));
  for (const [id, patch] of Object.entries(patches)) {
    if (answeredIds.has(id) && !known.has(id)) Object.assign(criteria, patch);
  }
  return criteria as UserCriteria;
}

export interface AnswerState {
  criteria: UserCriteria;
  patches: AnswerPatches;
  answeredIds: ReadonlySet<string>;
}

/**
 * Records one wizard answer and returns the rebuilt criteria. Shared by the web store and the CLI
 * wizard so both turn the same answers into the same criteria. An earlier answer to the same
 * question whose patch is unknown (e.g. criteria loaded from a URL) has its option keys cleared first.
 */
export function applyAnswer(
  state: AnswerState,
  questionId: string,
  patch: Partial<UserCriteria>,
  questions: readonly Question[] = QUESTIONS
): AnswerState {
  const base: Record<string, unknown> = { ...state.criteria };
  if (!state.patches[questionId]) {
    for (const k of questionOptionKeys(questionId, questions)) delete base[k];
  }
  const answeredIds = new Set(state.answeredIds).add(questionId);
  const patches = { ...state.patches, [questionId]: { ...patch } };
  return {
    criteria: replayAnswers(base, state.patches, patches, answeredIds, questions),
    patches,
    answeredIds
  };
}
