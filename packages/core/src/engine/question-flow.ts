import { Question, UserCriteria } from '../types.js';
import { QUESTIONS } from '../taxonomy/questions.js';

export class QuestionFlow {
  private questions: Question[];

  constructor(customQuestions: Question[] = QUESTIONS) {
    this.questions = [...customQuestions].sort((a, b) => a.order - b.order);
  }

  /**
   * Returns all questions that are relevant given the current criteria accumulated so far.
   *
   * When `answeredQuestionIds` is supplied, an answered question is judged with its own
   * option keys removed, so a guard such as `prefersGui === undefined` (meant to skip the
   * question when an earlier answer already decided it) never hides the question's own answer.
   */
  public getEligibleQuestions(criteria: UserCriteria, answeredQuestionIds?: ReadonlySet<string>): Question[] {
    return this.questions.filter((q) => {
      if (!q.shouldAsk) return true;
      if (answeredQuestionIds?.has(q.id)) {
        return q.shouldAsk(withoutOwnKeys(q, criteria));
      }
      return q.shouldAsk(criteria);
    });
  }

  /**
   * Retrieves the next unanswered question based on criteria keys already populated.
   */
  public getNextQuestion(
    criteria: UserCriteria,
    answeredQuestionIds: Set<string>
  ): Question | null {
    const eligible = this.getEligibleQuestions(criteria, answeredQuestionIds);
    return eligible.find((q) => !answeredQuestionIds.has(q.id)) || null;
  }

  /**
   * Retrieves the most recently answered eligible question in the decision tree.
   */
  public getPreviousQuestion(
    criteria: UserCriteria,
    answeredQuestionIds: Set<string>
  ): Question | null {
    const eligible = this.getEligibleQuestions(criteria, answeredQuestionIds);
    const answered = eligible.filter((q) => answeredQuestionIds.has(q.id));
    return answered.length > 0 ? answered[answered.length - 1] : null;
  }

  /**
   * Calculates completion progress percentage.
   */
  public getProgress(
    criteria: UserCriteria,
    answeredQuestionIds: Set<string>
  ): { current: number; total: number; percentage: number } {
    const eligible = this.getEligibleQuestions(criteria, answeredQuestionIds);
    const total = eligible.length;
    const answeredCount = eligible.filter((q) => answeredQuestionIds.has(q.id)).length;
    const percentage = total === 0 ? 100 : Math.round((answeredCount / total) * 100);

    return {
      current: answeredCount,
      total,
      percentage
    };
  }
}

function withoutOwnKeys(question: Question, criteria: UserCriteria): UserCriteria {
  const stripped: Record<string, unknown> = { ...criteria };
  for (const opt of question.options) {
    for (const key of Object.keys(opt.appliesCriteria)) {
      delete stripped[key];
    }
  }
  return stripped as UserCriteria;
}

/**
 * The question with only the options that fit the answers so far (see QuestionOption.showIf).
 * Every option stays when none would be visible, so a question can never render empty.
 */
export function withVisibleOptions(question: Question, criteria: UserCriteria): Question {
  const visible = question.options.filter((opt) => !opt.showIf || opt.showIf(criteria));
  if (visible.length === question.options.length || visible.length === 0) return question;
  return { ...question, options: visible };
}

/** Every criteria key any option of the question can set. */
function optionKeys(question: Question): Set<string> {
  return new Set(question.options.flatMap((opt) => Object.keys(opt.appliesCriteria)));
}

/**
 * The question a criteria key belongs to, for reviewing or removing that one choice. Goal and device
 * questions also infer keys such as releaseCadence or bootMedium, so prefer, among the questions that
 * apply to `criteria`, the most specific one (fewest keys): the dedicated question when it applies,
 * otherwise the goal or device answer the value was inferred from.
 */
export function findQuestionForCriteriaKey(
  key: string,
  criteria: UserCriteria,
  questions: Question[] = QUESTIONS
): Question | undefined {
  const owners = questions.filter((q) => optionKeys(q).has(key));
  const applicable = owners.filter((q) => !q.shouldAsk || q.shouldAsk(criteria));
  const pool = applicable.length > 0 ? applicable : owners;
  return [...pool].sort((a, b) => optionKeys(a).size - optionKeys(b).size)[0];
}

/** True when every option of the question sets the key, i.e. the key is what the question asks. */
export function isQuestionSubject(question: Question, key: string): boolean {
  return question.options.every((opt) => key in opt.appliesCriteria);
}
