import { Question, RecommendationOutput } from '@distro-tailor/core';
import { AppState } from '../state/store.js';
import { escapeHtml } from '../utils/dom.js';

export function renderUnsupportedSchemaFallback(notice: string): string {
  return `
    <div class="bg-slate-900/80 border border-amber-500/40 rounded-2xl p-4 sm:p-10 backdrop-blur shadow-2xl text-center max-w-2xl mx-auto my-4 sm:my-6 min-w-0 max-w-full overflow-hidden">
      <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-4 shadow-inner">
        🕰️
      </div>
      <h2 class="text-xl sm:text-2xl font-extrabold text-slate-100 mb-2 break-words">Unsupported Link Schema</h2>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 break-words">
        ${escapeHtml(notice)}
      </p>

      <div class="p-3.5 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 mb-6 sm:mb-8 text-left space-y-2 min-w-0">
        <p class="font-semibold text-slate-200 flex items-center gap-1.5">
          <span>💡</span> Why did this happen?
        </p>
        <p class="leading-relaxed break-words">
          DistroTailor continuously refines hardware targeting, Linux distros, and question taxonomy. When a link from a deprecated or incompatible schema is opened, we protect you from invalid recipes and allow you to restart cleanly.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full">
        <button id="btn-fallback-fresh" class="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer text-center">
          Start Fresh 20 Questions
        </button>
        <button id="btn-fallback-expert" class="w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all cursor-pointer text-center">
          Browse Contenders (Expert Matrix)
        </button>
      </div>
    </div>
  `;
}

export function renderWizardQuestion(
  question: Question,
  progress: { current: number; total: number },
  state: AppState,
  evaluation?: RecommendationOutput
): string {
  const numOptions = question.options.length;
  const isBeginner = state.criteria.experienceLevel === 'beginner' || !state.criteria.experienceLevel;
  // Dynamic balanced grid: 3 options get a clean 3-column row, others get a 2-column grid
  const gridClass =
    numOptions === 3 ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4';

  const showEarlyGuess =
    progress.current >= 3 && evaluation && evaluation.bestMatch && evaluation.bestMatch.score >= 85;

  return `
    <div id="wizard-question-card" class="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-8 backdrop-blur shadow-xl min-w-0 max-w-full overflow-hidden scroll-mt-6 animate-question-forward">
      
      <!-- 🎯 Early High-Confidence Fast-Track Banner (Classic 20-Questions Quick Match) -->
      ${
        showEarlyGuess && evaluation
          ? `
        <div id="early-guess-banner" class="mb-6 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-lg shadow-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0 animate-in fade-in">
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">🎯</span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10px] sm:text-[11px] font-bold font-mono text-emerald-400 uppercase tracking-wider">Fast-Track Match</span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ${evaluation.bestMatch.score}% Match
                </span>
              </div>
              <p class="text-xs text-slate-200 mt-0.5 leading-snug break-words">
                Strong recommendation detected: <strong class="text-white">${evaluation.bestMatch.distro.name}</strong> (${evaluation.bestMatch.distro.tagline}).
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <button id="btn-early-results" class="w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-all cursor-pointer shadow-md shadow-emerald-950/40 text-center flex items-center justify-center gap-1.5 shrink-0">
              <span>View Match Now</span>
              <span>→</span>
            </button>
          </div>
        </div>
      `
          : ''
      }

      <!-- Round & Step Indicator with Flow Mode Toggle -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800/80 gap-3">
        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            Question ${progress.current + 1} of ${progress.total}
          </span>
          <button id="btn-toggle-flow-mode" class="px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            isBeginner
              ? 'bg-slate-800/90 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700/60'
              : 'bg-indigo-950/60 text-indigo-300 hover:text-indigo-200 hover:border-indigo-500/50 border border-indigo-700/60'
          }" title="Switch between Goal-Oriented Mode and Low-Level Technical Mode">
            <span>${isBeginner ? '🌱 Goal Mode' : '⚙️ Technical Mode'}</span>
            <span class="text-[10px] text-slate-400 font-mono">⇄ switch</span>
          </button>
        </div>
        
        <!-- Segmented Step Dots -->
        <div class="flex items-center gap-1 overflow-x-auto max-w-full py-1 no-scrollbar shrink-0">
          ${Array.from({ length: progress.total })
            .map(
              (_, i) => `
            <div class="h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              i < progress.current
                ? 'w-4 sm:w-6 bg-emerald-400'
                : i === progress.current
                  ? 'w-6 sm:w-8 bg-emerald-400 ring-2 ring-emerald-400/30'
                  : 'w-1.5 sm:w-2 bg-slate-800'
            }"></div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Question Prompt -->
      <div class="mb-6 sm:mb-7 min-w-0">
        <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight mb-2 break-words">${question.prompt}</h2>
        ${question.subtext ? `<p class="text-xs sm:text-sm text-slate-400 leading-relaxed break-words">${question.subtext}</p>` : ''}
      </div>

      <!-- Option Cards -->
      <div class="${gridClass}">
        ${question.options
          .map((opt, idx) => {
            const keyNum = idx + 1;
            // Strip any leading emoji from label string to avoid duplicate display
            const cleanLabel = opt.label.replace(/^[\p{Emoji}\s]+/u, '').trim();
            const isSpanFull = numOptions % 2 === 1 && idx === numOptions - 1 && numOptions > 3;
            const spanClass = isSpanFull ? 'sm:col-span-2' : '';

            return `
            <button data-option-id="${opt.id}" class="option-btn group relative text-left p-4 sm:p-5 rounded-xl border border-slate-700/60 bg-slate-950/70 hover:bg-slate-800/90 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/40 transition-all flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-0 w-full overflow-hidden ${spanClass}">
              <div class="min-w-0 w-full">
                <div class="flex items-start justify-between gap-3 mb-3">
                  <span class="text-2xl sm:text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700/60 group-hover:scale-110 transition-transform shrink-0">${opt.icon || '👉'}</span>
                  ${
                    keyNum <= 9
                      ? `
                    <span class="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/50 group-hover:text-emerald-300 group-hover:border-emerald-500/40 transition-colors shrink-0">Press [${keyNum}]</span>
                  `
                      : ''
                  }
                </div>
                <h3 class="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors mb-1.5 leading-snug break-words">${cleanLabel}</h3>
                ${opt.description ? `<p class="text-xs text-slate-400 leading-relaxed break-words">${opt.description}</p>` : ''}
              </div>
            </button>
          `;
          })
          .join('')}
      </div>

      <!-- Contextual Linux Pro-Tip Box -->
      ${
        question.tip
          ? `
        <div class="mt-6 p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 text-xs min-w-0 overflow-hidden">
          <span class="text-lg sm:text-xl p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            ${question.tip.icon || '💡'}
          </span>
          <div class="min-w-0 flex-1">
            <h4 class="font-semibold text-slate-200 mb-0.5 break-words">${question.tip.title}</h4>
            <p class="text-slate-400 leading-relaxed break-words">${question.tip.text}</p>
          </div>
        </div>
      `
          : ''
      }

      <!-- Navigation Controls -->
      <div class="flex items-center justify-between mt-8 pt-6 border-t border-slate-800/80">
        <button id="btn-back" class="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all ${
          state.history.length === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
        }">
          ← Previous Question
        </button>
        <button id="btn-skip" class="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer">
          Skip for now →
        </button>
      </div>

    </div>
  `;
}
