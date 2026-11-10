/**
 * DOM and browser helper utilities for DistroTailor Web.
 */

/**
 * Escapes unsafe characters in strings before interpolation into HTML.
 * Neutralizes reflected XSS in dynamic URL parameters, labels, and code previews.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Displays a transient floating toast notification.
 */
export function showToast(message: string, icon = '✅'): void {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.className =
    'fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/95 text-slate-100 border border-emerald-500/50 shadow-2xl backdrop-blur text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200';
  toast.innerHTML = `<span class="text-base">${icon}</span><span>${escapeHtml(message)}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/**
 * Copies plain text to user clipboard with a floating success toast.
 */
export async function copyToClipboard(
  text: string,
  successMessage = 'Copied to clipboard!',
  icon = '📋'
): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, icon);
      return;
    } catch {
      // Fallback to legacy document.execCommand if clipboard API permission is blocked
    }
  }

  if (typeof document !== 'undefined') {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      showToast(successMessage, icon);
    } catch {
      showToast('Press Ctrl+C / Cmd+C to copy', '⚠️');
    } finally {
      document.body.removeChild(el);
    }
  }
}

/**
 * Smoothly scrolls the viewport to the active wizard question card.
 * Clears active button focus to prevent sticky iOS Safari focus/hover state highlights.
 */
export function scrollToQuestionCard(): void {
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  if (typeof requestAnimationFrame === 'undefined' || typeof window === 'undefined') return;

  requestAnimationFrame(() => {
    const card = document.getElementById('wizard-question-card');
    if (card) {
      const rect = card.getBoundingClientRect();
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = Math.max(0, currentScroll + rect.top - 16);
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }
  });
}
