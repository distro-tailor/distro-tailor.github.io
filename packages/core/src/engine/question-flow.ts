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
