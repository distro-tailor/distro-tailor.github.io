import {
  checkDesktopAppCompatibility,
  checkDockerAppCompatibility,
  checkEmulatorAppCompatibility,
  checkNavigationAppCompatibility,
  DESKTOP_APPS_REGISTRY,
  DOCKER_APPS_REGISTRY,
  EMULATOR_APPS_REGISTRY,
  NAVIGATION_APPS_REGISTRY,
  getSelectedDockerApps,
  resolveDockerStackPorts,
  UserCriteria
} from '@distro-tailor/core';
import { type AddonCombo, getAddonCombos } from '../data/addon-combos.js';
import {
  type AppCategoryMeta,
  DESKTOP_APP_CATEGORIES,
  DOCKER_APP_CATEGORIES,
  EMULATOR_APP_CATEGORIES,
  getDefaultDesktopCategory,
  getDefaultDockerCategory,
  getDefaultEmulatorCategory
} from '../data/app-categories.js';
import { escapeHtml } from '../utils/dom.js';
import { panelAttributes } from './panel.js';

export type { AddonCombo };
export { getAddonCombos };

type SuiteThemeKey = 'emerald' | 'purple' | 'amber';

interface SuiteThemeClasses {
  primaryBadge: string;
  countPill: string;
  activeSummaryBadge: string;
  selectedCard: string;
  selectedCheckbox: string;
}

const SUITE_THEMES: Record<SuiteThemeKey, SuiteThemeClasses> = {
  emerald: {
    primaryBadge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    countPill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    activeSummaryBadge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    selectedCard: 'cursor-pointer bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/30',
    selectedCheckbox: 'bg-emerald-400 border-emerald-400 text-slate-950'
  },
  purple: {
    primaryBadge: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    countPill: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
    activeSummaryBadge: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    selectedCard: 'cursor-pointer bg-purple-950/20 border-purple-500/60 shadow-md shadow-purple-950/30',
    selectedCheckbox: 'bg-purple-400 border-purple-400 text-slate-950'
  },
  amber: {
    primaryBadge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    countPill: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    activeSummaryBadge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    selectedCard: 'cursor-pointer bg-amber-950/20 border-amber-500/60 shadow-md shadow-amber-950/30',
    selectedCheckbox: 'bg-amber-400 border-amber-400 text-slate-950'
  }
};

interface SuiteShellConfig {
  panelId: string;
  icon: string;
  title: string;
  primaryBadgeText: string;
  descriptionHtml: string;
  statusPillHtml: string;
  nommuWarning?: string;
  summaryText: string;
  summaryActiveBadgeText?: string;
  theme: SuiteThemeKey;
  isPrimary: boolean;
  isExpanded: boolean;
  panelOpen?: Readonly<Record<string, boolean>>;
  bodyHtml: string;
}

/** Shared outer shell, header, NOMMU warning, and collapsible accordion for all app suites. */
function renderSuiteShell(cfg: SuiteShellConfig): string {
  const theme = SUITE_THEMES[cfg.theme];
  const innerContent = `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 min-w-0">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xl shrink-0">${cfg.icon}</span>
          <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">${cfg.title}</h3>
          ${cfg.isPrimary ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold ${theme.primaryBadge}">${cfg.primaryBadgeText}</span>` : ''}
        </div>
        <p class="text-xs text-slate-400 mt-1 break-words">${cfg.descriptionHtml}</p>
      </div>
      ${cfg.statusPillHtml}
    </div>

    ${
      cfg.nommuWarning
        ? `
      <div class="p-3 mb-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2.5">
        <span class="text-base shrink-0">⚠️</span>
        <span>${cfg.nommuWarning}</span>
      </div>
    `
        : ''
    }

    ${cfg.bodyHtml}
  `;

  if (cfg.isPrimary) {
    return `
      <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden transition-all" ${panelAttributes(cfg.panelOpen, cfg.panelId, true)}>
        <summary class="flex items-center justify-between cursor-pointer select-none gap-2 min-w-0">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xl shrink-0">${cfg.icon}</span>
              <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">${cfg.title}</h3>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${theme.primaryBadge}">${cfg.primaryBadgeText}</span>
              ${cfg.statusPillHtml}
            </div>
          </div>
          <span class="text-slate-500 group-open:rotate-180 transition-transform text-sm shrink-0">▼</span>
        </summary>
        <div class="mt-4 pt-4 border-t border-slate-800/80">
          <p class="text-xs text-slate-400 mb-4 break-words">${cfg.descriptionHtml}</p>
          ${
            cfg.nommuWarning
              ? `
            <div class="p-3 mb-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2.5">
              <span class="text-base shrink-0">⚠️</span>
              <span>${cfg.nommuWarning}</span>
            </div>
          `
              : ''
          }
          ${cfg.bodyHtml}
        </div>
      </details>
    `;
  }

  return `
    <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden transition-all" ${panelAttributes(cfg.panelOpen, cfg.panelId, cfg.isExpanded)}>
      <summary class="flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-slate-300">
        <span class="flex items-center gap-2 flex-wrap">
          <span class="text-lg">${cfg.icon}</span>
          <span>${cfg.summaryText}</span>
          ${cfg.summaryActiveBadgeText ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${theme.activeSummaryBadge}">${cfg.summaryActiveBadgeText}</span>` : ''}
        </span>
        <span class="text-slate-500 group-open:rotate-180 transition-transform text-sm shrink-0">▼</span>
      </summary>
      <div class="mt-4 pt-4 border-t border-slate-800">
        ${innerContent}
      </div>
    </details>
  `;
}

interface ToggleableSuiteItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  minRamMb: number;
}

interface CompatibilityStatus {
  compatible: boolean;
  blocker?: string;
  warnings: string[];
}

function formatCompatBadge(minRamMb: number, compat: CompatibilityStatus): string {
  if (!compat.compatible) {
    return `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30" title="${compat.blocker}">N/A</span>`;
  }
  if (compat.warnings.length > 0) {
    const ramLabel = minRamMb >= 1024 ? `${(minRamMb / 1024).toFixed(0)}G` : `${minRamMb}M`;
    return `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30" title="${compat.warnings[0]}">⚠️ ${ramLabel}</span>`;
  }
  return '';
}

/** Shared toggleable card grid for multi-select application suites. */
function renderMultiSelectAppGrid<T extends ToggleableSuiteItem>(opts: {
  items: readonly T[];
  selectedIds: readonly string[];
  buttonClass: string;
  gridColsClass: string;
  theme: SuiteThemeKey;
  checkCompatibility: (item: T) => CompatibilityStatus;
}): string {
  const theme = SUITE_THEMES[opts.theme];
  return `
    <div class="grid ${opts.gridColsClass} gap-2.5 text-xs min-w-0">
      ${opts.items
        .map((app) => {
          const isSelected = opts.selectedIds.includes(app.id);
          const compat = opts.checkCompatibility(app);
          const searchText = escapeHtml(`${app.name} ${app.category}`.toLowerCase());

          return `
          <div data-app-card data-app-id="${app.id}" data-app-category="${app.category}" data-app-selected="${isSelected ? '1' : '0'}" data-app-search="${searchText}" ${compat.blocker ? `data-incompatible-reason="${compat.blocker}"` : ''} class="${opts.buttonClass} p-2.5 rounded-xl border select-none transition-all flex flex-col justify-between min-w-0 ${
            !compat.compatible
              ? 'opacity-50 cursor-not-allowed bg-slate-950/40 border-slate-900'
              : isSelected
              ? theme.selectedCard
              : 'cursor-pointer bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
          }">
            <div class="flex items-center justify-between mb-1.5 gap-1.5 min-w-0">
              <span class="text-xl shrink-0">${app.icon}</span>
              <div class="flex items-center gap-1 shrink-0">
                ${formatCompatBadge(app.minRamMb, compat)}
                <div class="w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                  isSelected ? theme.selectedCheckbox : 'border-slate-700 bg-slate-900'
                }">
                  ${isSelected ? '✓' : ''}
                </div>
              </div>
            </div>
            <div class="min-w-0">
              <span class="font-bold text-slate-200 block truncate text-xs">${app.name}</span>
              <span class="text-[10px] text-slate-400 block truncate">${app.category}</span>
            </div>
          </div>
        `;
        })
        .join('')}
    </div>
  `;
}

function renderCategorizedSuiteBody<T extends { id: string; category: string }>(opts: {
  suiteId: string;
  categories: readonly AppCategoryMeta[];
  items: readonly T[];
  selectedIds: readonly string[];
  defaultCategory: string;
  searchPlaceholder: string;
  renderGroupItems: (groupItems: readonly T[]) => string;
  topHtml?: string;
}): string {
  const orderedCategories = [...opts.categories].sort((a, b) => {
    if (a.id === opts.defaultCategory) return -1;
    if (b.id === opts.defaultCategory) return 1;
    return 0;
  });

  const groupsHtml = orderedCategories
    .map((cat) => {
      const groupItems = opts.items.filter((item) => item.category === cat.id);
      if (groupItems.length === 0) return '';
      const selectedInGroup = groupItems.filter((item) => opts.selectedIds.includes(item.id)).length;

      return `
        <div data-category-group="${cat.id}" class="space-y-2">
          <div class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>${cat.icon}</span>
            <span>${cat.label}</span>
            <span class="text-slate-600 font-mono font-normal">(${groupItems.length})</span>
            ${
              selectedInGroup > 0
                ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold normal-case tracking-normal bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">${selectedInGroup} selected</span>`
                : ''
            }
          </div>
          ${opts.renderGroupItems(groupItems)}
        </div>
      `;
    })
    .filter(Boolean)
    .join('');

  const pillsHtml = orderedCategories
    .map((cat) => {
      const count = opts.items.filter((item) => item.category === cat.id).length;
      if (count === 0) return '';
      return `
        <button type="button" data-suite-pill="${cat.id}" class="px-2 py-1 rounded-lg text-[11px] font-medium bg-transparent text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/40 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1">
          <span>${cat.icon}</span>
          <span>${cat.label}</span>
          <span class="text-slate-500 font-mono">${count}</span>
        </button>
      `;
    })
    .filter(Boolean)
    .join('');

  return `
    <div data-suite-container="${opts.suiteId}" class="space-y-3 min-w-0">
      <div class="pb-2.5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
        <div class="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0 min-w-0 flex-1">
          <button type="button" data-suite-pill="all" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer whitespace-nowrap">
            All (${opts.items.length})
          </button>
          ${
            opts.selectedIds.length > 0
              ? `<button type="button" data-suite-pill="selected" class="px-2 py-1 rounded-lg text-[11px] font-semibold bg-transparent text-emerald-300 border border-transparent hover:bg-slate-800/40 transition-colors cursor-pointer whitespace-nowrap">✓ Selected (${opts.selectedIds.length})</button>`
              : ''
          }
          ${pillsHtml}
        </div>
        <div class="relative shrink-0 sm:w-52 sm:border-l border-slate-800/80 sm:pl-2.5">
          <input
            type="text"
            data-suite-search="${opts.suiteId}"
            placeholder="${escapeHtml(opts.searchPlaceholder)}"
            class="w-full px-2.5 py-1 pl-7 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
          <span class="absolute left-2.5 sm:left-5 top-1.5 text-[10px] text-slate-500 pointer-events-none">🔍</span>
        </div>
      </div>

      ${opts.topHtml || ''}

      <div class="max-h-[420px] overflow-y-auto pr-1 space-y-4 min-w-0">
        ${groupsHtml}
        <p data-suite-empty class="hidden text-center text-xs text-slate-400 py-4">No matching items in this view.</p>
      </div>
    </div>
  `;
}

export function renderDesktopAppSuite(
  criteria: UserCriteria,
  isPrimary: boolean,
  panelOpen?: Readonly<Record<string, boolean>>
): string {
  const selectedIds = criteria.desktopApps || [];
  const selectedCount = selectedIds.length;
  const theme = SUITE_THEMES.emerald;

  const bodyHtml = renderCategorizedSuiteBody({
    suiteId: 'desktop-apps',
    categories: DESKTOP_APP_CATEGORIES,
    items: DESKTOP_APPS_REGISTRY,
    selectedIds,
    defaultCategory: getDefaultDesktopCategory(criteria),
    searchPlaceholder: `Filter ${DESKTOP_APPS_REGISTRY.length} apps...`,
    renderGroupItems: (items) =>
      renderMultiSelectAppGrid({
        items,
        selectedIds,
        buttonClass: 'btn-toggle-desktop-app',
        gridColsClass: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
        theme: 'emerald',
        checkCompatibility: (app) => checkDesktopAppCompatibility(app, criteria)
      })
  });

  return renderSuiteShell({
    panelId: 'desktop-apps',
    icon: '📦',
    title: '1-Click Desktop Application Suite',
    primaryBadgeText: 'Recommended for Workstations',
    descriptionHtml:
      'Select popular GUI applications, developer toolchains, and backup/networking tools. DistroTailor generates an automated unattended <code class="text-emerald-400">bootstrap-apps.sh</code> script (via APT & Flatpak):',
    statusPillHtml: `<span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${theme.countPill} whitespace-nowrap shrink-0 self-start sm:self-auto">${selectedCount} Selected</span>`,
    nommuWarning:
      criteria.architecture === 'nommu'
        ? 'Microcontrollers (NOMMU) lack display compositors and memory management. Desktop GUI applications cannot run on this target.'
        : undefined,
    summaryText: 'Need Desktop GUI Apps on this Server? (Click to view desktop app installer)',
    summaryActiveBadgeText: selectedCount > 0 ? `${selectedCount} active` : undefined,
    theme: 'emerald',
    isPrimary,
    isExpanded: isPrimary || selectedCount > 0,
    panelOpen,
    bodyHtml
  });
}

export function renderDockerServiceSuite(
  criteria: UserCriteria,
  isPrimary: boolean,
  panelOpen?: Readonly<Record<string, boolean>>
): string {
  const selectedApps = getSelectedDockerApps(criteria);
  const resolvedPorts = new Map(resolveDockerStackPorts(selectedApps).map((r) => [r.app.id, r]));
  const selectedIds = selectedApps.map((a) => a.id);
  const hasDockerApp = selectedIds.length > 0;
  const activeSummary =
    selectedApps.length === 1
      ? `${selectedApps[0].name} Configured`
      : selectedApps.length > 1
        ? `${selectedApps.length} Stacks`
        : undefined;
  const theme = SUITE_THEMES.emerald;

  const renderDockerCard = (app: (typeof DOCKER_APPS_REGISTRY)[number]) => {
    const isSelected = selectedIds.includes(app.id);
    const compat = checkDockerAppCompatibility(app, criteria);
    const searchText = escapeHtml(`${app.name} ${app.tagline} ${app.description} ${app.category}`.toLowerCase());

    return `
      <div data-app-card data-app-category="${app.category}" data-app-selected="${isSelected ? '1' : '0'}" data-app-search="${searchText}" data-docker-id="${app.id}" ${compat.blocker ? `data-incompatible-reason="${compat.blocker}"` : ''} class="btn-select-docker-app p-3 rounded-xl border select-none transition-all flex flex-col justify-between min-w-0 ${
        !compat.compatible
          ? 'opacity-50 cursor-not-allowed bg-slate-950/40 border-slate-900'
          : isSelected
          ? 'cursor-pointer bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/30'
          : 'cursor-pointer bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
      }">
        <div>
          <div class="flex items-center justify-between mb-1 gap-1.5">
            <span class="text-xl shrink-0">${app.icon}</span>
            <div class="flex items-center gap-1 shrink-0">
              ${formatCompatBadge(app.minRamMb, compat)}
              ${(() => {
                const resolved = resolvedPorts.get(app.id);
                if (!isSelected) return `<span class="text-[10px] text-slate-500 font-mono">Port ${app.defaultPort}</span>`;
                if (resolved?.reassignedFrom) {
                  return `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0" title="Auto-adjusted from ${resolved.reassignedFrom} to avoid port clash with ${resolved.conflictWith}">Port ${resolved.hostPort}</span>`;
                }
                return `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">ACTIVE</span>`;
              })()}
            </div>
          </div>
          <h4 class="font-bold text-slate-200 text-xs">${app.name}</h4>
          <p class="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">${app.description}</p>
        </div>
        <div class="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] ${!compat.compatible ? 'text-slate-600' : isSelected ? 'text-emerald-400 font-bold' : 'text-slate-500'} font-mono flex items-center justify-between">
          <span>${!compat.compatible ? 'Unsupported Hardware' : isSelected ? (selectedIds.length > 1 ? `✓ stacks/${app.id}/docker-compose.yml` : '✓ In docker-compose.yml') : '+ Add Docker Stack'}</span>
          <span>${!compat.compatible ? '🚫' : isSelected ? '✓' : '+'}</span>
        </div>
      </div>
    `;
  };

  const noneCardHtml = `
    <div data-docker-id="none" class="btn-select-docker-app p-2.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs min-w-0 ${
      !hasDockerApp
        ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/30'
        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
    }">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="text-lg shrink-0">🚫</span>
        <div class="min-w-0">
          <h4 class="font-bold text-slate-200 text-xs">None (Pure OS Minimal)</h4>
          <p class="text-[11px] text-slate-400">No extra background containers. Keep the OS footprint ultra-lean.</p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        ${!hasDockerApp ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">ACTIVE</span>` : `<span class="text-[10px] text-slate-500 font-mono">Pure Native Host</span>`}
      </div>
    </div>
  `;

  const bodyHtml = renderCategorizedSuiteBody({
    suiteId: 'docker-services',
    categories: DOCKER_APP_CATEGORIES,
    items: DOCKER_APPS_REGISTRY,
    selectedIds,
    defaultCategory: getDefaultDockerCategory(criteria),
    searchPlaceholder: `Filter ${DOCKER_APPS_REGISTRY.length} services...`,
    topHtml: noneCardHtml,
    renderGroupItems: (items) => `
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs min-w-0">
        ${items.map(renderDockerCard).join('')}
      </div>
    `
  });

  return renderSuiteShell({
    panelId: 'docker-services',
    icon: '🐳',
    title: 'Turnkey Service Layer (Docker Compose)',
    primaryBadgeText: 'Recommended for Server & Homelab',
    descriptionHtml:
      'Select one or more self-hosted stacks. Single stack generates <code class="text-emerald-400">docker-compose.yml</code>; multiple stacks generate isolated <code class="text-emerald-400">stacks/&lt;app&gt;/docker-compose.yml</code> folders (Dockge/Portainer ready):',
    statusPillHtml: activeSummary
      ? `<span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${theme.countPill} whitespace-nowrap shrink-0 self-start sm:self-auto">${activeSummary}</span>`
      : '',
    nommuWarning:
      criteria.architecture === 'nommu'
        ? 'Docker containers require a hardware Memory Management Unit (MMU) and Linux cgroups/namespaces, which are not available on NOMMU microcontrollers.'
        : undefined,
    summaryText: 'Want to bundle self-hosted Docker stacks? (Immich, Jellyfin, Vaultwarden, etc.)',
    summaryActiveBadgeText: activeSummary ? `${activeSummary} active` : undefined,
    theme: 'emerald',
    isPrimary,
    isExpanded: isPrimary || hasDockerApp,
    panelOpen,
    bodyHtml
  });
}

export function renderEmulatorAppSuite(
  criteria: UserCriteria,
  isPrimary: boolean,
  panelOpen?: Readonly<Record<string, boolean>>
): string {
  const selectedIds = criteria.emulatorApps || [];
  const selectedCount = selectedIds.length;
  const theme = SUITE_THEMES.purple;

  return renderSuiteShell({
    panelId: 'emulator-apps',
    icon: '🎮',
    title: 'Gaming & Retro Emulation Suite',
    primaryBadgeText: 'Recommended for Gaming',
    descriptionHtml:
      'Install classic console/arcade emulators, Windows compatibility layers (Wine/Bottles), and cross-arch QEMU emulators. Generates <code class="text-emerald-400">bootstrap-emulators.sh</code> with gamepad udev rules and ROM folders:',
    statusPillHtml: `<span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${theme.countPill} whitespace-nowrap shrink-0 self-start sm:self-auto">${selectedCount} Selected</span>`,
    nommuWarning:
      criteria.architecture === 'nommu'
        ? 'Microcontrollers (NOMMU) lack display compositors and memory management. Gaming emulators cannot run on this target.'
        : undefined,
    summaryText: 'Add Gaming & Retro Emulators? (RetroArch, DOSBox, Dolphin, PCSX2, etc.)',
    summaryActiveBadgeText: selectedCount > 0 ? `${selectedCount} active` : undefined,
    theme: 'purple',
    isPrimary,
    isExpanded: isPrimary || selectedCount > 0,
    panelOpen,
    bodyHtml: renderCategorizedSuiteBody({
      suiteId: 'emulator-apps',
      categories: EMULATOR_APP_CATEGORIES,
      items: EMULATOR_APPS_REGISTRY,
      selectedIds,
      defaultCategory: getDefaultEmulatorCategory(criteria),
      searchPlaceholder: `Filter ${EMULATOR_APPS_REGISTRY.length} emulators...`,
      renderGroupItems: (items) =>
        renderMultiSelectAppGrid({
          items,
          selectedIds,
          buttonClass: 'btn-toggle-emulator-app',
          gridColsClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          theme: 'purple',
          checkCompatibility: (app) => checkEmulatorAppCompatibility(app, criteria)
        })
    })
  });
}

export function renderNavigationAppSuite(
  criteria: UserCriteria,
  isPrimary: boolean,
  panelOpen?: Readonly<Record<string, boolean>>
): string {
  const selectedIds = criteria.navigationApps || [];
  const selectedCount = selectedIds.length;
  const theme = SUITE_THEMES.amber;

  return renderSuiteShell({
    panelId: 'navigation-apps',
    icon: '🧭',
    title: 'Offline GPS & In-Car Navigation Suite',
    primaryBadgeText: 'Recommended for In-Car & Field Use',
    descriptionHtml:
      'Turn your build into a standalone offline road navigator, marine chartplotter, or telemetry station (ideal for in-car touchscreens, Raspberry Pi, or repurposed vintage GPS/TomTom devices). Generates an automated <code class="text-emerald-400">bootstrap-navigation.sh</code> with GPSd serial auto-detection and OpenStreetMap vector data:',
    statusPillHtml: `<span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${theme.countPill} whitespace-nowrap shrink-0 self-start sm:self-auto">${selectedCount} Selected</span>`,
    nommuWarning:
      criteria.architecture === 'nommu'
        ? 'Microcontrollers (NOMMU) lack graphical subsystems for map rendering. Only telemetry daemons (GPSd) can run on this target.'
        : undefined,
    summaryText: 'Add Offline GPS & In-Car Navigation? (Navit, GPSd, OpenStreetMap, OpenCPN, etc.)',
    summaryActiveBadgeText: selectedCount > 0 ? `${selectedCount} active` : undefined,
    theme: 'amber',
    isPrimary,
    isExpanded: isPrimary || selectedCount > 0,
    panelOpen,
    bodyHtml: renderMultiSelectAppGrid({
      items: NAVIGATION_APPS_REGISTRY,
      selectedIds,
      buttonClass: 'btn-toggle-navigation-app',
      gridColsClass: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
      theme: 'amber',
      checkCompatibility: (app) => checkNavigationAppCompatibility(app, criteria)
    })
  });
}
