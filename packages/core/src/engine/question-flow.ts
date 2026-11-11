import { Question, UserCriteria } from '../types.js';
import { QUESTIONS } from '../taxonomy/questions.js';

export class QuestionFlow {
  private questions: Question[];

  constructor(customQuestions: Question[] = QUESTIONS) {
    this.questions = [...customQuestions].sort((a, b) => a.order - b.order);
  }

  /**
   * Returns all questions that are relevant given the current criteria accumulated so far.
   */
  public getEligibleQuestions(criteria: UserCriteria): Question[] {
    return this.questions.filter((q) => {
      if (!q.shouldAsk) return true;
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
    const eligible = this.getEligibleQuestions(criteria);
    return eligible.find((q) => !answeredQuestionIds.has(q.id)) || null;
  }

  /**
   * Retrieves the most recently answered eligible question in the decision tree.
   */
  public getPreviousQuestion(
    criteria: UserCriteria,
    answeredQuestionIds: Set<string>
  ): Question | null {
    const eligible = this.getEligibleQuestions(criteria);
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
    const eligible = this.getEligibleQuestions(criteria);
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
