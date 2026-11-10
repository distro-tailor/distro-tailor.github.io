import { DISTRO_REGISTRY, RecommendationOutput } from '@distro-tailor/core';
import { AppState } from '../state/store.js';

export function renderNavbar(state: AppState, evaluation: RecommendationOutput): string {
  const hasCriteria = Object.keys(state.criteria).length > 0;

  return `
    <header class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-3.5 py-3 sm:px-8">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 min-w-0">
        
        <!-- Brand Identity -->
        <div class="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none min-w-0 w-full sm:w-auto justify-start" id="nav-brand">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0">
            🐧
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-base sm:text-lg font-bold tracking-tight text-slate-100">DistroTailor</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">20 Questions</span>
              <span class="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Offline Ready
              </span>
            </div>
            <p class="text-[11px] sm:text-xs text-slate-400 truncate sm:whitespace-normal">Think of a project. Find your dream Linux match.</p>
          </div>
        </div>

        <!-- Mode Buttons & GitHub Actions -->
        <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
          <button id="btn-toggle-wizard" class="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            state.activeTab === 'wizard'
              ? 'bg-slate-100 text-slate-950 font-semibold shadow'
              : 'text-slate-300 hover:bg-slate-800/70 border border-transparent'
          }">
            20 Questions
          </button>
          <button id="btn-toggle-expert" class="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            state.activeTab === 'expert'
              ? 'bg-slate-100 text-slate-950 font-semibold shadow'
              : 'text-slate-300 hover:bg-slate-800/70 border border-transparent'
          }">
            Expert Matrix
          </button>
          ${
            hasCriteria
              ? `
            <button id="btn-view-results" class="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              state.activeTab === 'results'
                ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/40'
                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/60 hover:bg-emerald-900/60'
            }">
              🎯 Match (${evaluation.bestMatch.score}%)
            </button>
            <button id="btn-share-header" class="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/50 flex items-center gap-1 transition-all shadow-sm shrink-0" title="Share this configuration via link">
              <span>🔗</span> Share
            </button>
            <button id="btn-reset" class="px-2 py-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors shrink-0" title="Start over">
              Restart
            </button>
          `
              : ''
          }

          <!-- GitHub Star & Fork Widgets -->
          <div class="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-slate-800/80 shrink-0">
            <a href="https://github.com/distro-tailor/distro-tailor" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 transition-all flex items-center gap-1.5 shadow-sm" title="Star DistroTailor on GitHub">
              <svg class="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
              <span>Star</span>
            </a>
            <a href="https://github.com/distro-tailor/distro-tailor/fork" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 border border-slate-800 transition-all flex items-center gap-1.5 shadow-sm" title="Fork DistroTailor on GitHub">
              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h4.5A2.25 2.25 0 0 0 12.5 6.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878ZM12.5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM8 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v-4.5a.75.75 0 0 1 1.5 0v4.5Z"></path></svg>
              <span>Fork</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  `;
}

export function renderLeaderboard(evaluation: RecommendationOutput, state: AppState): string {
  const isExpanded = state.showAllContenders;
  const displayMatches = isExpanded ? evaluation.topMatches : evaluation.topMatches.slice(0, 6);
  const totalCount = DISTRO_REGISTRY.length;

  return `
    <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 gap-2">
      <div class="min-w-0">
        <h3 class="text-sm font-bold text-slate-200 truncate">The Contenders</h3>
        <p class="text-[11px] text-slate-400 truncate">Updates live as you answer</p>
      </div>
      <button id="btn-header-distros-count" class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-slate-300 hover:text-emerald-300 hover:bg-slate-700 transition-colors shrink-0 cursor-pointer" title="Click to view all ${totalCount} distros">
        ${isExpanded ? `All ${totalCount} distros` : `Top 6 of ${totalCount}`}
      </button>
    </div>

    <!-- Contender Cards (Scrollable when expanded) -->
    <div class="space-y-2.5 ${isExpanded ? 'max-h-[520px] overflow-y-auto pr-1 select-none' : ''}">
      ${displayMatches
        .map(
          (m, idx) => `
        <div class="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all min-w-0">
          <div class="flex items-center justify-between text-sm mb-1.5 gap-2">
            <div class="flex items-center gap-2 font-medium text-slate-200 min-w-0 flex-1">
              <span class="text-base shrink-0">${m.distro.logoEmoji || '🐧'}</span>
              <span class="text-[11px] font-mono font-bold text-slate-500 shrink-0">#${idx + 1}</span>
              <span class="truncate">${m.distro.name}</span>
            </div>
            <span class="font-mono text-xs font-bold shrink-0 ${
              m.score >= 80 ? 'text-emerald-400' : m.score >= 50 ? 'text-yellow-400' : 'text-slate-500'
            }">
              ${m.score}%
            </span>
          </div>

          <!-- Match Bar -->
          <div class="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div class="h-1.5 rounded-full transition-all duration-300 ${
              m.score >= 80 ? 'bg-emerald-400' : m.score >= 50 ? 'bg-yellow-400' : 'bg-slate-600'
            }" style="width: ${m.score}%"></div>
          </div>

          <p class="text-[11px] text-slate-400 mt-2 line-clamp-1 break-words">${m.distro.tagline}</p>
        </div>
      `
        )
        .join('')}
    </div>

    <!-- Toggle All 31 Contenders Action Bar -->
    <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
      <button id="btn-toggle-all-contenders" class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer transition-colors">
        <span>${isExpanded ? '▲ Show Top 6 Only' : `▼ View All ${totalCount} Distros (${evaluation.topMatches.length} Ranked)`}</span>
      </button>
      <button id="btn-quick-matrix" class="text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer" title="Open full comparison matrix">
        <span>Matrix</span> ↗
      </button>
    </div>
  `;
}

export function renderFooter(): string {
  return `
    <footer class="border-t border-slate-800/80 bg-slate-950/80 py-8 px-4 sm:px-8 text-xs text-slate-400">
      <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- Top Row: CLI Widget & GitHub Community -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center border-b border-slate-800/80 pb-6">
          
          <!-- Terminal CLI Runner Widget -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 min-w-0 shadow-inner">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <span class="text-lg shrink-0">💻</span>
              <div class="min-w-0 flex-1">
                <span class="text-[11px] font-semibold text-slate-300 block">Run DistroTailor in your Terminal:</span>
                <code class="font-mono text-emerald-400 text-xs truncate block select-all">npx @distro-tailor/cli</code>
              </div>
            </div>
            <button id="btn-copy-cli" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors flex items-center gap-1 shrink-0 cursor-pointer" title="Copy CLI Command">
              <span>📋</span> Copy
            </button>
          </div>

          <!-- GitHub Community Action Cluster -->
          <div class="flex items-center justify-start md:justify-end gap-2 flex-wrap">
            <a href="https://github.com/distro-tailor/distro-tailor" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 transition-all flex items-center gap-1.5 font-medium shadow-sm">
              <svg class="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
              <span>Star on GitHub</span>
            </a>
            <a href="https://github.com/distro-tailor/distro-tailor/fork" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 border border-slate-800 transition-all flex items-center gap-1.5 font-medium shadow-sm">
              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h4.5A2.25 2.25 0 0 0 12.5 6.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878ZM12.5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM8 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v-4.5a.75.75 0 0 1 1.5 0v4.5Z"></path></svg>
              <span>Fork & Contribute</span>
            </a>
            <a href="https://github.com/distro-tailor/distro-tailor/blob/main/packages/core/src/taxonomy/distros.ts" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 transition-all flex items-center gap-1.5 font-medium shadow-sm">
              <span>➕</span> Add a Distro
            </a>
          </div>
        </div>

        <!-- Bottom Row: Privacy Invariant & Credits -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div class="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <span class="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 100% Client-Side
            </span>
            <span>·</span>
            <span>Zero Tracking / No Cookies</span>
            <span>·</span>
            <span>31 Linux Distros Indexed</span>
            <span>·</span>
            <span>MIT Licensed</span>
          </div>
          <p class="text-center sm:text-right text-slate-500">
            Crafted for curious humans, homelabbers, families, and systems tinkerers.
          </p>
        </div>

      </div>
    </footer>
  `;
}
