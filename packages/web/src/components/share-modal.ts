import { RecommendationOutput, UserCriteria } from '@distro-tailor/core';
import { copyToClipboard, escapeHtml, showToast } from '../utils/dom.js';
import { generateMarkdownSummary } from '../utils/formatters.js';

export async function triggerDeviceShare(
  evaluation: RecommendationOutput,
  criteria: UserCriteria = {}
): Promise<void> {
  const best = evaluation.bestMatch;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://distrotailor.dev';
  const shareData = {
    title: `DistroTailor: ${best.distro.name} (${best.score}% Match)`,
    text: `Found my tailored Linux match: ${best.distro.name} - ${best.distro.tagline}`,
    url: shareUrl
  };

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      showToast('Shared successfully!', '🚀');
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === 'AbortError')) {
        copyToClipboard(shareUrl, 'Link copied to clipboard!', '🔗');
      }
    }
  } else {
    copyToClipboard(shareUrl, 'Link copied to clipboard!', '🔗');
  }
}

export function renderShareModal(evaluation: RecommendationOutput, criteria: UserCriteria = {}): string {
  const best = evaluation.bestMatch;
  const url = typeof window !== 'undefined' ? window.location.href : 'https://distrotailor.dev';
  const markdownSummary = generateMarkdownSummary(evaluation, criteria, url);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return `
    <div id="share-modal-backdrop" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 min-w-0 max-w-full overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 shrink-0 min-w-0 gap-2">
          <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span class="text-2xl sm:text-3xl p-1.5 sm:p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">${best.distro.logoEmoji || '🐧'}</span>
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-bold text-slate-100 truncate">Share Tailored Linux Build</h3>
              <p class="text-xs text-slate-400 truncate">${best.distro.name} (${best.score}% Match)</p>
            </div>
          </div>
          <button id="btn-close-share-modal" class="text-slate-400 hover:text-slate-200 text-base sm:text-lg p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0" title="Close">
            ✕
          </button>
        </div>

        <div class="overflow-y-auto flex-1 pr-0.5 space-y-4 min-w-0">
          <!-- Direct Shareable URL -->
          <div class="min-w-0">
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Direct Shareable Link (Preserves All Criteria)</label>
            <div class="flex items-center gap-2 min-w-0">
              <input type="text" readonly id="share-link-input" value="${escapeHtml(url)}" class="min-w-0 flex-1 bg-slate-950 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-mono select-all focus:outline-none focus:border-emerald-500" />
              <button id="btn-copy-share-url" class="px-3.5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer">
                <span>📋</span> Copy
              </button>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Anyone with this link sees the exact recommendations and tailored recipes you generated.</p>
          </div>

          <!-- Markdown Summary Export -->
          <div class="min-w-0">
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-semibold text-slate-300">Markdown Summary (Reddit, Discord & GitHub)</label>
              <button id="btn-copy-markdown-summary" class="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1 cursor-pointer">
                <span>📋</span> Copy Markdown
              </button>
            </div>
            <textarea readonly id="share-markdown-preview" rows="4" class="w-full max-w-full bg-slate-950 border border-slate-800 text-slate-400 p-2.5 rounded-lg text-[11px] font-mono select-all focus:outline-none resize-none break-all">${escapeHtml(markdownSummary)}</textarea>
          </div>

          <!-- Social Share Buttons -->
          <div class="pt-2 border-t border-slate-800/80 min-w-0">
            <span class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Share</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              ${
                canNativeShare
                  ? `
                <button id="btn-native-share" class="col-span-2 sm:col-span-1 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer">
                  <span>📤</span> Device
                </button>
              `
                  : ''
              }
              <a href="https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`Tailored Linux Distro Match: ${best.distro.name} (${best.score}%)`)}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-orange-950/40 hover:bg-orange-900/40 text-orange-300 border border-orange-800/50 flex items-center justify-center gap-1.5 font-medium transition-colors text-center">
                <span>🤖</span> Reddit
              </a>
              <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`Found my Linux match with DistroTailor: ${best.distro.name} (${best.score}% Match)!`)}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-sky-950/40 hover:bg-sky-900/40 text-sky-300 border border-sky-800/50 flex items-center justify-center gap-1.5 font-medium transition-colors text-center">
                <span>🐦</span> X
              </a>
              <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my tailored Linux distro match: ${best.distro.name} (${best.score}%) - ${url}`)}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 flex items-center justify-center gap-1.5 font-medium transition-colors text-center">
                <span>💬</span> WhatsApp
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
