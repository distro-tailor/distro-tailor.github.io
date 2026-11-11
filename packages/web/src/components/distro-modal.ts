import { DistroProfile, getDistroTargetUrl, RecommendationOutput } from '@distro-tailor/core';
import { AppState } from '../types.js';
import { escapeHtml } from '../utils/dom.js';
import { formatOsEcosystem } from '../utils/formatters.js';

export function renderDistroDetailModal(
  distro: DistroProfile,
  evaluation?: RecommendationOutput,
  _state?: AppState
): string {
  const match = evaluation?.allMatches?.find((m) => m.distro.id === distro.id);
  const score = match ? match.score : undefined;

  return `
    <div id="distro-modal-backdrop" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div id="distro-modal-card" class="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-4 sm:p-7 shadow-2xl relative my-auto min-w-0 max-h-[92vh] overflow-y-auto select-text">
        
        <!-- Close Button -->
        <button id="btn-close-distro-modal" class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center text-sm transition-colors cursor-pointer" title="Close (Esc)">
          ✕
        </button>

        <!-- Header -->
        <div class="flex items-start gap-3.5 sm:gap-4 pr-10 mb-4">
          <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-inner">
            ${distro.logoEmoji || '🐧'}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">${escapeHtml(distro.name)}</h2>
              ${
                score !== undefined
                  ? `
                <span class="px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                  score >= 80
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : score >= 50
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                }">
                  ${score}% Match
                </span>
              `
                  : ''
              }
              <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
                ${escapeHtml(distro.experienceLevel)}
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                ${formatOsEcosystem(distro)}
              </span>
            </div>
            <p class="text-xs sm:text-sm text-emerald-400 font-medium mt-1 leading-snug">${escapeHtml(distro.tagline)}</p>
          </div>
        </div>

        <!-- Description -->
        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          ${escapeHtml(distro.description)}
        </p>

        <!-- Technical Specs Matrix -->
        <h3 class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <span>⚙️</span> Technical Specifications
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5 text-xs">
          <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-semibold">Min RAM</span>
            <span class="font-medium text-slate-200 mt-0.5 block truncate">${distro.minRamMb} MB</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-semibold">Footprint</span>
            <span class="font-medium text-slate-200 capitalize mt-0.5 block truncate">${distro.footprint}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-semibold">Package Mgr</span>
            <span class="font-medium text-slate-200 mt-0.5 block truncate">${escapeHtml(distro.packageManager || 'Custom / Embedded')}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-semibold">Release Model</span>
            <span class="font-medium text-slate-200 mt-0.5 block truncate">${distro.rollingRelease ? 'Rolling' : 'Point Release'}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-semibold">Init System</span>
            <span class="font-medium text-slate-200 mt-0.5 block truncate" title="${distro.initSystems.join(', ')}">${distro.initSystems.join(', ')}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-semibold">C Library</span>
            <span class="font-medium text-slate-200 mt-0.5 block truncate" title="${distro.cLibraries.join(', ')}">${distro.cLibraries.join(', ')}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-semibold">State Model</span>
            <span class="font-medium text-slate-200 capitalize mt-0.5 block truncate">${distro.stateModel}</span>
          </div>
          <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span class="text-slate-500 block text-[10px] uppercase font-semibold">CPUs</span>
            <span class="font-medium text-slate-200 mt-0.5 block truncate" title="${distro.architectures.join(', ')}">${distro.architectures.join(', ')}</span>
          </div>
        </div>

        <!-- Strengths vs Tradeoffs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs mb-5">
          <div class="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3.5">
            <h4 class="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
              <span>✨</span> Key Strengths
            </h4>
            <ul class="space-y-1.5 text-slate-300">
              ${distro.highlights.map((h) => `<li class="flex items-start gap-1.5"><span class="text-emerald-400 shrink-0">✓</span><span>${escapeHtml(h)}</span></li>`).join('')}
            </ul>
          </div>
          <div class="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3.5">
            <h4 class="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <span>⚠️</span> Trade-offs to Consider
            </h4>
            <ul class="space-y-1.5 text-slate-300">
              ${distro.tradeoffs.map((t) => `<li class="flex items-start gap-1.5"><span class="text-amber-400 shrink-0">•</span><span>${escapeHtml(t)}</span></li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Official Links and Footer -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <a
              id="btn-modal-load-distro"
              href="${getDistroTargetUrl(distro.id)}"
              data-load-distro="${distro.id}"
              class="btn-accent flex-1 sm:flex-none"
              title="Apply criteria that makes ${escapeHtml(distro.name)} the #1 match"
            >
              <span>🎯 Load Match</span>
            </a>
            <a id="btn-modal-official-site" href="${distro.website}" target="_blank" rel="noopener noreferrer" class="btn-primary flex-1 sm:flex-none">
              <span>Official Site</span>
              <span>↗</span>
            </a>
            ${
              distro.documentationUrl
                ? `
              <a id="btn-modal-docs" href="${distro.documentationUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary flex-1 sm:flex-none">
                <span>Docs</span>
                <span>↗</span>
              </a>
            `
                : ''
            }
          </div>
          <button id="btn-modal-dismiss" class="btn-secondary w-full sm:w-auto">
            Close Preview
          </button>
        </div>

      </div>
    </div>
  `;
}
