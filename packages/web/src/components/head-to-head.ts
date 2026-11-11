import { RecommendationOutput } from '@distro-tailor/core';
import { escapeHtml } from '../utils/dom.js';

/**
 * Renders the transparent score breakdown and head-to-head comparison card.
 */
export function renderDecidingFactorsAndHeadToHead(evaluation: RecommendationOutput): string {
  const best = evaluation.bestMatch;
  const runnerUps = evaluation.topMatches.slice(1, 3); // Top 2 closest alternatives
  const winningReasons = best.reasons.filter((r) => r.matched);

  return `
    <!-- 🎯 Transparent Match Attribution & Head-to-Head Comparison -->
    <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 min-w-0 overflow-hidden space-y-6">
      
      <!-- Section Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0 border-b border-slate-800/80 pb-4">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xl shrink-0">🎯</span>
            <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">Why ${best.distro.name} Won (Verifiable Decision Factors)</h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Fact-Based Algorithm</span>
          </div>
          <p class="text-xs text-slate-400 mt-1 break-words">
            Scores are mathematically derived from official hardware requirements and your exact answers—zero editorial bias:
          </p>
        </div>
        <a href="https://github.com/distro-tailor/distro-tailor/blob/main/packages/core/src/taxonomy/distros.ts" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0">
          <span>📜</span> Audit Rules on GitHub ↗
        </a>
      </div>

      <!-- Winning Factors Grid -->
      <div>
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          1. Exact Criteria Matched by ${best.distro.name}
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs min-w-0">
          ${winningReasons
            .map(
              (reason) => `
            <div class="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5 min-w-0">
              <span class="text-emerald-400 font-bold text-sm shrink-0">✓</span>
              <div class="min-w-0 flex-1">
                <span class="font-bold text-slate-200 block truncate">${reason.feature}</span>
                <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words">${reason.explanation}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Head-to-Head Comparison with Alternatives -->
      ${
        runnerUps.length > 0
          ? `
        <div class="pt-4 border-t border-slate-800/80">
          <div class="mb-4">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              2. Head-to-Head: Why It Beat The Closest Alternatives
            </h4>
            <p class="text-xs text-slate-500 mt-0.5">
              Objective technical differences that decided the ranking based on your input:
            </p>
          </div>

          <div class="grid grid-cols-1 ${runnerUps.length > 1 ? 'md:grid-cols-2' : ''} gap-4 min-w-0">
            ${runnerUps
              .map((runner) => {
                const unmetReasons = runner.reasons.filter((r) => !r.matched);
                return `
                <div data-distro-id="${runner.distro.id}" class="bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between text-xs min-w-0 cursor-pointer transition-all group" title="Click to preview ${escapeHtml(runner.distro.name)} details">
                  <div>
                    <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80 gap-2">
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="text-2xl p-1 rounded-lg bg-slate-900 border border-slate-800 shrink-0 group-hover:scale-110 transition-transform">${runner.distro.logoEmoji || '🐧'}</span>
                        <div class="min-w-0">
                          <span class="font-bold text-slate-200 text-sm block truncate group-hover:text-emerald-300 transition-colors">${runner.distro.name}</span>
                          <span class="text-[10px] text-slate-400 block truncate">${runner.distro.tagline}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0">
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                          ${runner.score}% Match
                        </span>
                        <span class="text-[10px] text-slate-500 group-hover:text-emerald-400 font-mono transition-colors">↗</span>
                      </div>
                    </div>

                    <!-- Decisive Divergence -->
                    <div class="mb-3">
                      <span class="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                        Deciding Hardware / Spec Difference:
                      </span>
                      ${
                        unmetReasons.length > 0
                          ? `
                        <ul class="space-y-1 text-slate-300">
                          ${unmetReasons
                            .map(
                              (r) => `
                            <li class="flex items-start gap-1.5 text-[11px] break-words">
                              <span class="text-amber-400 font-bold shrink-0">•</span>
                              <span><strong>${r.feature}:</strong> ${r.explanation}</span>
                            </li>
                          `
                            )
                            .join('')}
                        </ul>
                      `
                          : `
                        <p class="text-[11px] text-slate-400">
                          Matched all major constraints, but ${best.distro.name} has deeper specialization for your primary goal.
                        </p>
                      `
                      }
                    </div>

                    <!-- When to Choose Instead -->
                    <div class="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] mb-3">
                      <span class="font-semibold text-slate-300 block mb-0.5">💡 When to choose ${runner.distro.name} instead:</span>
                      <p class="text-slate-400 leading-relaxed break-words">
                        ${runner.distro.highlights[0] || runner.distro.description}
                      </p>
                    </div>
                  </div>

                  <!-- Documentation Citation Link -->
                  <div class="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Min RAM: ${runner.distro.minRamMb} MB</span>
                    <a href="${runner.distro.documentationUrl || runner.distro.website}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline flex items-center gap-1">
                      Official Specs Docs ↗
                    </a>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      `
          : ''
      }

    </div>
  `;
}
