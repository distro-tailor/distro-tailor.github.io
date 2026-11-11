import { store } from '../state/store.js';

/** Persists open / closed state of collapsible panels so re-renders do not reset them. */
export function bindPanelEvents(): void {
  document.querySelectorAll<HTMLDetailsElement>('details[data-panel-id]').forEach((panel) => {
    panel.addEventListener('toggle', () => {
      const panelId = panel.dataset.panelId;
      if (!panelId) return;
      // Freshly rendered open panels also fire "toggle"; only record real changes.
      const current = store.getState().panelOpen?.[panelId] ?? panel.dataset.panelDefault === 'open';
      if (current === panel.open) return;
      store.setPanelOpen(panelId, panel.open);
    });
  });
}
