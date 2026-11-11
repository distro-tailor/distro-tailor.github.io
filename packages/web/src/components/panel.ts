/**
 * Collapsible <details> panels that remember the user's choice across re-renders.
 * A panel follows its default until the user toggles it; after that the stored choice wins.
 */
export function isPanelOpen(
  panelOpen: Readonly<Record<string, boolean>> | undefined,
  panelId: string,
  openByDefault: boolean
): boolean {
  return panelOpen?.[panelId] ?? openByDefault;
}

/** Attributes for a <details> panel: its id, its default (read by the toggle handler), and open state. */
export function panelAttributes(
  panelOpen: Readonly<Record<string, boolean>> | undefined,
  panelId: string,
  openByDefault: boolean
): string {
  const open = isPanelOpen(panelOpen, panelId, openByDefault) ? ' open' : '';
  return `data-panel-id="${panelId}" data-panel-default="${openByDefault ? 'open' : 'closed'}"${open}`;
}
