import { DISTRO_REGISTRY, QuestionFlow, QUESTIONS, UserCriteria } from '@distro-tailor/core';
import { escapeHtml } from '../../utils/dom.js';
import { formatConstraint } from '../../utils/formatters.js';
import { ResultsViewContext } from './context.js';

/** How many changed choices the banner lists before summarizing the rest. */
const MAX_LISTED_CHANGES = 4;

export interface CriteriaChange {
  key: string;
  label: string;
  icon: string;
  removed: boolean;
}

/** Choices that differ between two criteria sets, labelled for display (removed ones flagged). */
export function diffCriteria(before: UserCriteria, after: UserCriteria): CriteriaChange[] {
  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  const changes: CriteriaChange[] = [];
  for (const key of keys) {
    if (JSON.stringify(b[key]) === JSON.stringify(a[key])) continue;
    const removed = a[key] === undefined;
    const { label, icon } = formatConstraint(key, removed ? b[key] : a[key]);
    changes.push({ key, label, icon, removed });
  }
  return changes;
}

/** "Your edit unlocked 2 new questions…" vs. "3 questions are still unanswered…". */
export function describeOpenQuestions(unanswered: number, unlocked: number): string {
  const plural = (n: number) => `${n} question${n === 1 ? '' : 's'}`;
  if (unlocked === 0) return `${plural(unanswered)} still unanswered could refine this match.`;
  const others = unanswered - unlocked;
  const rest = others > 0 ? ` (plus ${others} still unanswered)` : '';
  return `Your edit unlocked ${unlocked} new question${unlocked === 1 ? '' : 's'}${rest} that could refine this match.`;
}

/**
 * Shown on results after the user went back and edited answers: whether the top match changed,
 * which choices changed, and any questions the edit unlocked that are still unanswered.
 */
export function renderResultsChangeBanner(ctx: ResultsViewContext): string {
  const { state, best } = ctx;
  const baseline = state.resultsBaseline;
  if (!baseline) return '';

  const changes = diffCriteria(baseline.criteria, state.criteria);
  const flow = new QuestionFlow(QUESTIONS);
  const answered = state.answeredQuestionIds;
  const openNow = flow.getEligibleQuestions(state.criteria, answered).filter((q) => !answered.has(q.id));
  const eligibleBefore = new Set(flow.getEligibleQuestions(baseline.criteria, answered).map((q) => q.id));
  const unanswered = openNow.length;
  const unlocked = openNow.filter((q) => !eligibleBefore.has(q.id)).length;
  if (changes.length === 0 && unanswered === 0) return '';

  const previous = DISTRO_REGISTRY.find((d) => d.id === baseline.distroId);
  const matchChanged = baseline.distroId !== best.distro.id;
  const title = matchChanged
    ? `Top match changed: ${escapeHtml(previous?.name ?? baseline.distroId)} → ${escapeHtml(best.distro.name)}`
    : `Top match unchanged: ${escapeHtml(best.distro.name)}`;

  const listed = changes.slice(0, MAX_LISTED_CHANGES);
  const more = changes.length - listed.length;
  const chips = listed
    .map(
      (c) =>
        `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/70 border border-slate-700/60 ${c.removed ? 'line-through text-slate-500' : 'text-slate-200'}">${c.icon} ${c.label}</span>`
    )
    .join('');

  return `
    <div id="results-change-banner" role="status" class="${matchChanged ? 'bg-amber-950/40 border-amber-700/50' : 'bg-slate-900/60 border-slate-700/50'} border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xl animate-in fade-in min-w-0 overflow-hidden">
      <div class="flex items-start gap-3.5 min-w-0">
        <div class="w-10 h-10 rounded-xl bg-slate-900/60 border border-slate-600/40 flex items-center justify-center text-xl shrink-0">${matchChanged ? '🔄' : '✅'}</div>
        <div class="min-w-0 flex-1 space-y-1.5">
          <h4 class="font-bold text-slate-100 text-sm break-words">${title}</h4>
          ${changes.length > 0 ? `<div class="flex flex-wrap gap-1.5 text-[11px]"><span class="text-slate-400">Your edits:</span>${chips}${more > 0 ? `<span class="text-slate-400">+${more} more</span>` : ''}</div>` : ''}
          ${unanswered > 0 ? `<p class="text-amber-300/90 text-[11px] break-words">${describeOpenQuestions(unanswered, unlocked)}</p>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto min-w-0 max-w-full justify-end">
        ${unanswered > 0 ? `<button id="btn-answer-unlocked" class="flex-auto sm:flex-none px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all shadow-md cursor-pointer">Answer ${unanswered === 1 ? 'it' : 'them'}</button>` : ''}
        <button id="btn-dismiss-change-banner" class="btn-secondary flex-auto sm:flex-none" aria-label="Dismiss change summary">Dismiss</button>
      </div>
    </div>
  `;
}
