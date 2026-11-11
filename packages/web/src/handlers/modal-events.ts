import { getDistroTargetCriteria } from '@distro-tailor/core';
import { triggerDeviceShare } from '../components/share-modal.js';
import { router } from '../state/router.js';
import { store } from '../state/store.js';
import { copyToClipboard, showToast } from '../utils/dom.js';
import { generateMarkdownSummary } from '../utils/formatters.js';
import { HandlerContext } from './context.js';

/** Distro preview modal, leaderboard search, and share modal. */
export function bindModalEvents(ctx: HandlerContext): void {
  const { evaluation, state } = ctx;

  // Distro Preview Modal Trigger (Leaderboard cards and catalog badges)
  document.querySelectorAll<HTMLElement>('[data-distro-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button, a')) return;
      const id = el.getAttribute('data-distro-id');
      if (id) {
        store.setSelectedDistro(id);
      }
    });
  });

  const closeDistroModal = () => {
    store.setSelectedDistro(null);
  };
  document.getElementById('btn-close-distro-modal')?.addEventListener('click', closeDistroModal);
  document.getElementById('btn-modal-dismiss')?.addEventListener('click', closeDistroModal);
  document.getElementById('distro-modal-backdrop')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'distro-modal-backdrop') {
      closeDistroModal();
    }
  });

  // Load Winning Match button in Distro Modal
  document.querySelectorAll<HTMLElement>('[data-load-distro]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const distroId = el.getAttribute('data-load-distro');
      if (!distroId) return;
      const targetCriteria = getDistroTargetCriteria(distroId);
      if (!targetCriteria) return;

      store.reset(targetCriteria);
      store.setSelectedDistro(null);
      store.setTab('results');
      router.saveStateToUrl(store.getState(), true);
      showToast(`Loaded winning criteria for ${distroId}!`, '🎯');
    });
  });

  // Live Search in Leaderboard
  const searchInput = document.getElementById('input-search-leaderboard') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      store.setSearchQuery(val);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        store.setSearchQuery('');
      }
    });
  }
  document.getElementById('btn-clear-search')?.addEventListener('click', () => {
    store.setSearchQuery('');
  });
  document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
    store.setSearchQuery('');
  });

  // Share actions
  const openShareModal = () => {
    store.setShareModal(true);
  };

  document.getElementById('btn-share-header')?.addEventListener('click', openShareModal);
  document.getElementById('btn-share-match')?.addEventListener('click', openShareModal);
  document.getElementById('btn-share-sidebar')?.addEventListener('click', openShareModal);
  document.getElementById('btn-share-recipe')?.addEventListener('click', openShareModal);

  // Close Share Modal
  document.getElementById('btn-close-share-modal')?.addEventListener('click', () => {
    store.setShareModal(false);
  });

  document.getElementById('share-modal-backdrop')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'share-modal-backdrop') {
      store.setShareModal(false);
    }
  });

  // Share Modal copy buttons
  document.getElementById('btn-copy-share-url')?.addEventListener('click', () => {
    copyToClipboard(window.location.href, 'Direct permalink copied to clipboard!', '🔗');
  });

  document.getElementById('btn-copy-markdown-summary')?.addEventListener('click', () => {
    const md = generateMarkdownSummary(evaluation, state.criteria, window.location.href);
    copyToClipboard(md, 'Markdown summary copied! Ready to paste into Reddit, Discord, or GitHub.', '📋');
  });

  document.getElementById('btn-native-share')?.addEventListener('click', () => {
    triggerDeviceShare(evaluation, state.criteria);
  });
}
