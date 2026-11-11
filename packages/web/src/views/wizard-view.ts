import { Question, RecommendationOutput, UserCriteria } from '@distro-tailor/core';
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
          DistroTailor continuously refines hardware targeting, open-source distros, and question taxonomy. When a link from a deprecated or incompatible schema is opened, we protect you from invalid recipes and allow you to restart cleanly.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full">
        <button id="btn-fallback-fresh" class="btn-primary w-full sm:w-auto text-center">
          Start Fresh 20 Questions
        </button>
        <button id="btn-fallback-expert" class="btn-secondary w-full sm:w-auto text-center">
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

  const canGoBack = progress.current > 0;
  const hasDefault = question.options.some((o) => o.isDefault);
  const hasUnlockedResults = !!(
    evaluation &&
    evaluation.bestMatch &&
    evaluation.bestMatch.score >= 50 &&
    (state.answeredQuestionIds.size > 0 || Object.keys(state.criteria).length > 0)
  );
  const resultsScore = evaluation?.bestMatch?.score ?? 0;

  const hasSelectedAnswer = question.options.some((opt) => {
    if (question.isMultiSelect) {
      const selected = state.criteria.peripherals || (state.criteria.peripheralNeed ? [state.criteria.peripheralNeed] : []);
      return opt.appliesCriteria.peripherals?.some((p) => selected.includes(p));
    }
    return (
      Object.entries(opt.appliesCriteria).length > 0 &&
      Object.entries(opt.appliesCriteria).every(
        ([k, v]) => (state.criteria as Record<string, unknown>)[k] === v
      )
    );
  });

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
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-3">
        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            Question ${progress.current + 1} of ${progress.total}
          </span>
          ${
            question.isOptional
              ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">Optional</span>`
              : ''
          }
          ${
            question.isMultiSelect
              ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-700/60 shrink-0">Multi-Select</span>`
              : ''
          }
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

      <!-- Top Quick Navigation Bar (Skip / Back / Confirm on top) -->
      <div class="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/40 text-xs gap-2 min-w-0">
        <button id="btn-back-top" class="btn-secondary !px-3 !py-1.5 rounded-lg flex items-center gap-1 ${
          !canGoBack ? 'opacity-30 cursor-not-allowed' : ''
        }">
          <span>←</span> Previous
        </button>

        <div class="flex items-center gap-2 shrink-0">
          ${
            hasUnlockedResults
              ? `
            <button id="btn-jump-results-top" class="px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-700/60 hover:bg-emerald-900/60 transition-colors shadow-sm cursor-pointer" title="Jump straight back to your tailored match results">
              <span>🎯 Results (${resultsScore}%)</span>
              <span>↗</span>
            </button>
          `
              : ''
          }
          ${
            question.isMultiSelect
              ? `
            <button id="btn-multiselect-confirm-top" class="btn-primary !px-3.5 !py-1.5 rounded-lg flex items-center gap-1.5">
              <span>Confirm & Next</span>
              <span>→</span>
            </button>
          `
              : hasSelectedAnswer
                ? `
            <button id="btn-next-top" class="btn-primary !px-3.5 !py-1.5 rounded-lg flex items-center gap-1.5">
              <span>${progress.current === progress.total - 1 ? 'View Final Results' : 'Next Question'}</span>
              <span>→</span>
            </button>
          `
                : hasDefault
                  ? `
            <button id="btn-skip-top" class="btn-secondary !px-3 !py-1.5 rounded-lg flex items-center gap-1">
              <span>Next (Use Default)</span>
              <span>→</span>
            </button>
          `
                  : `
            <button id="btn-skip-top" class="btn-secondary !px-3 !py-1.5 rounded-lg flex items-center gap-1">
              <span>Next Question</span>
              <span>→</span>
            </button>
          `
          }
        </div>
      </div>

      <!-- Question Prompt -->
      <div class="mb-6 sm:mb-7 min-w-0">
        <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight mb-2 break-words">${question.prompt}</h2>
        ${question.subtext ? `<p class="text-xs sm:text-sm text-slate-400 leading-relaxed break-words">${question.subtext}</p>` : ''}
      </div>

      <!-- Option Cards -->
      <div class="${gridClass}">
        ${(() => {
          // Check if option is currently selected for multi-select questions
          const selectedPeripherals = (
            state.criteria.peripherals ||
            (state.criteria.peripheralNeed && state.criteria.peripheralNeed !== 'standard'
              ? [state.criteria.peripheralNeed]
              : ['standard'])
          );

          const checkOptionSelected = (opt: (typeof question.options)[0]): boolean => {
            if (question.isMultiSelect) {
              return !!(
                opt.appliesCriteria.peripherals &&
                opt.appliesCriteria.peripherals.some((p) => selectedPeripherals.includes(p))
              );
            }

            // 1. Strict exact match: all criteria applied by this option are defined and match state
            const exactMatches = question.options.filter(
              (o) =>
                Object.entries(o.appliesCriteria).length > 0 &&
                Object.entries(o.appliesCriteria).every(
                  ([k, v]) => (state.criteria as Record<string, unknown>)[k] === v
                )
            );
            if (exactMatches.length > 0) {
              const best = exactMatches.sort(
                (a, b) => Object.keys(b.appliesCriteria).length - Object.keys(a.appliesCriteria).length
              )[0];
              return opt.id === best.id;
            }

            // 2. Resilient partial match: options with no conflicts whose defined keys match state
            const partialMatches = question.options.filter((o) => {
              const entries = Object.entries(o.appliesCriteria);
              if (entries.length === 0) return false;
              const hasConflict = entries.some(
                ([k, v]) =>
                  (state.criteria as Record<string, unknown>)[k] !== undefined &&
                  (state.criteria as Record<string, unknown>)[k] !== v
              );
              if (hasConflict) return false;
              return entries.some(
                ([k, v]) => (state.criteria as Record<string, unknown>)[k] === v
              );
            });

            if (partialMatches.length > 0) {
              const best = partialMatches.sort((a, b) => {
                const aMatches = Object.entries(a.appliesCriteria).filter(
                  ([k, v]) => (state.criteria as Record<string, unknown>)[k] === v
                ).length;
                const bMatches = Object.entries(b.appliesCriteria).filter(
                  ([k, v]) => (state.criteria as Record<string, unknown>)[k] === v
                ).length;
                if (bMatches !== aMatches) return bMatches - aMatches;
                return Object.keys(b.appliesCriteria).length - Object.keys(a.appliesCriteria).length;
              })[0];
              return opt.id === best.id;
            }

            return false;
          };

          const hasAnySelection = question.options.some((opt) => checkOptionSelected(opt));

          return question.options
            .map((opt, idx) => {
              const keyNum = idx + 1;
              // Strip any leading emoji from label string to avoid duplicate display
              const cleanLabel = opt.label.replace(/^[\p{Emoji}\s]+/u, '').trim();
              const isSpanFull = numOptions % 2 === 1 && idx === numOptions - 1 && numOptions > 3;
              const spanClass = isSpanFull ? 'sm:col-span-2' : '';

              const isSelected = checkOptionSelected(opt);
              const isPlaceholderDefault = !hasAnySelection && !!opt.isDefault;

              return `
            <button data-option-id="${opt.id}" class="option-btn group relative text-left p-4 sm:p-5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-w-0 w-full overflow-hidden ${spanClass} ${
                isSelected
                  ? 'border-emerald-400 bg-emerald-950/30 ring-1 ring-emerald-400/50 shadow-md shadow-emerald-950/30'
                  : 'border-slate-700/60 bg-slate-950/70 [@media(hover:hover)]:hover:bg-slate-800/90 [@media(hover:hover)]:hover:border-emerald-400 [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:shadow-emerald-950/40 active:border-emerald-400 active:bg-slate-800/90'
              }">
                <div class="min-w-0 w-full">
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="flex items-center gap-2 min-w-0 flex-wrap">
                      <span class="text-2xl sm:text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700/60 group-hover:scale-110 transition-transform shrink-0">${opt.icon || '👉'}</span>
                      ${
                        isSelected && !question.isMultiSelect
                          ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">✓ Selected</span>`
                          : ''
                      }
                      ${
                        opt.isDefault
                          ? isPlaceholderDefault
                            ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/50 shrink-0" title="Standard distribution default choice (active fallback)">★ Standard Default</span>`
                            : `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700/80 shrink-0" title="Standard distribution default choice">★ Standard Default</span>`
                          : ''
                      }
                    </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    ${
                      question.isMultiSelect
                        ? `
                      <span class="w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-emerald-400 text-slate-950 border border-emerald-300'
                          : 'border border-slate-600 bg-slate-900 text-transparent'
                      }">
                        ✓
                      </span>
                    `
                        : keyNum <= 9
                          ? `
                      <span class="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/50 group-hover:text-emerald-300 group-hover:border-emerald-500/40 transition-colors shrink-0">Press [${keyNum}]</span>
                    `
                          : ''
                    }
                  </div>
                </div>
                <h3 class="text-sm sm:text-base font-semibold ${
                  isSelected ? 'text-emerald-300' : 'text-slate-100 group-hover:text-emerald-300'
                } transition-colors mb-1.5 leading-snug break-words">${cleanLabel}</h3>
                ${opt.description ? `<p class="text-xs text-slate-400 leading-relaxed break-words">${opt.description}</p>` : ''}
              </div>
            </button>
              `;
            })
            .join('');
        })()}
      </div>

      <!-- Contextual Pro-Tip Box -->
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
      <div class="flex items-center justify-between mt-8 pt-6 border-t border-slate-800/80 gap-2 min-w-0">
        <button id="btn-back" class="btn-secondary ${
          !canGoBack ? 'opacity-30 cursor-not-allowed' : ''
        }">
          ← Previous Question
        </button>

        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          ${
            hasUnlockedResults
              ? `
            <button id="btn-jump-results" class="px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-700/60 hover:bg-emerald-900/60 transition-colors shadow-sm cursor-pointer" title="Jump straight back to your tailored match results">
              <span>🎯 Return to Results (${resultsScore}%)</span>
              <span>↗</span>
            </button>
          `
              : ''
          }
          ${
            question.isMultiSelect
              ? `
            <button id="btn-multiselect-confirm" class="btn-primary">
              <span>Confirm Choices & Continue</span>
              <span>→</span>
            </button>
          `
              : hasSelectedAnswer
                ? `
            <button id="btn-next" class="btn-primary">
              <span>${progress.current === progress.total - 1 ? 'View Final Results' : 'Next Question'}</span>
              <span>→</span>
            </button>
          `
                : hasDefault
                  ? `
            <button id="btn-skip" class="btn-secondary">
              Next (Use Default) →
            </button>
          `
                  : `
            <button id="btn-skip" class="btn-secondary">
              Next Question →
            </button>
          `
          }
        </div>
      </div>

    </div>
  `;
}
