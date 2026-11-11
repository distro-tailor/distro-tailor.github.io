import {
  checkDesktopAppCompatibility,
  checkDockerAppCompatibility,
  checkEmulatorAppCompatibility,
  DESKTOP_APPS_REGISTRY,
  DesktopEnvId,
  DOCKER_APPS_REGISTRY,
  DockerAppId,
  EMULATOR_APPS_REGISTRY,
  EmulatorAppId,
  getDockerApp,
  getEmulatorApp,
  UserCriteria
} from '@distro-tailor/core';
import { type AddonCombo, getAddonCombos } from '../data/addon-combos.js';
import { panelAttributes } from './panel.js';

export type { AddonCombo };
export { getAddonCombos };

export function renderDesktopAppSuite(
  criteria: UserCriteria,
  isPrimary: boolean,
  panelOpen?: Readonly<Record<string, boolean>>
): string {
  const selectedCount = (criteria.desktopApps || []).length;
  const isExpanded = isPrimary || selectedCount > 0;
  const isNommu = criteria.architecture === 'nommu';

  const innerContent = `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 min-w-0">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xl shrink-0">📦</span>
          <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">1-Click Desktop Application Suite</h3>
          ${isPrimary ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Recommended for Workstations</span>` : ''}
        </div>
        <p class="text-xs text-slate-400 mt-1 break-words">
          Select popular GUI applications and developer tools. DistroTailor generates an automated unattended <code class="text-emerald-400">bootstrap-apps.sh</code> script (via APT & Flatpak):
        </p>
      </div>
      <span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0 self-start sm:self-auto">
        ${selectedCount} Selected
      </span>
    </div>

    ${
      isNommu
        ? `
      <div class="p-3 mb-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2.5">
        <span class="text-base shrink-0">⚠️</span>
        <span>Microcontrollers (NOMMU) lack display compositors and memory management. Desktop GUI applications cannot run on this target.</span>
      </div>
    `
        : ''
    }

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs min-w-0">
      ${DESKTOP_APPS_REGISTRY.map((app) => {
        const isSelected = (criteria.desktopApps || []).includes(app.id);
        const compat = checkDesktopAppCompatibility(app, criteria);
        const hasWarning = compat.compatible && compat.warnings.length > 0;

        return `
          <div data-app-id="${app.id}" ${compat.blocker ? `data-incompatible-reason="${compat.blocker}"` : ''} class="btn-toggle-desktop-app p-2.5 rounded-xl border select-none transition-all flex flex-col justify-between min-w-0 ${
            !compat.compatible
              ? 'opacity-50 cursor-not-allowed bg-slate-950/40 border-slate-900'
              : isSelected
              ? 'cursor-pointer bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/30'
              : 'cursor-pointer bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
          }">
            <div class="flex items-center justify-between mb-1.5 gap-1.5 min-w-0">
              <span class="text-xl shrink-0">${app.icon}</span>
              <div class="flex items-center gap-1 shrink-0">
                ${
                  !compat.compatible
                    ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30" title="${compat.blocker}">N/A</span>`
                    : hasWarning
                    ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30" title="${compat.warnings[0]}">⚠️ ${app.minRamMb >= 1024 ? `${(app.minRamMb / 1024).toFixed(0)}G` : `${app.minRamMb}M`}</span>`
                    : ''
                }
                <div class="w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                  isSelected ? 'bg-emerald-400 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
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
      }).join('')}
    </div>
  `;

  if (isPrimary) {
    return `
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 min-w-0 overflow-hidden">
        ${innerContent}
      </div>
    `;
  }

  return `
    <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden transition-all" ${panelAttributes(panelOpen, 'desktop-apps', isExpanded)}>
      <summary class="flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-slate-300">
        <span class="flex items-center gap-2 flex-wrap">
          <span class="text-lg">📦</span>
          <span>Need Desktop GUI Apps on this Server? (Click to view desktop app installer)</span>
          ${selectedCount > 0 ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${selectedCount} active</span>` : ''}
        </span>
        <span class="text-slate-500 group-open:rotate-180 transition-transform text-sm shrink-0">▼</span>
      </summary>
      <div class="mt-4 pt-4 border-t border-slate-800">
        ${innerContent}
      </div>
    </details>
  `;
}

export function renderDockerServiceSuite(
  criteria: UserCriteria,
  isPrimary: boolean,
  panelOpen?: Readonly<Record<string, boolean>>
): string {
  const hasDockerApp = criteria.dockerApp && criteria.dockerApp !== 'none';
  const isExpanded = isPrimary || !!hasDockerApp;
  const isNommu = criteria.architecture === 'nommu';

  const innerContent = `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 min-w-0">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xl shrink-0">🐳</span>
          <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">Turnkey Service Layer (Docker Compose)</h3>
          ${isPrimary ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Recommended for Server & Homelab</span>` : ''}
        </div>
        <p class="text-xs text-slate-400 mt-1 break-words">
          Deploy a turnkey self-hosted containerized app. Injects <code class="text-emerald-400">docker-compose.yml</code> and Makefile targets (<code class="text-emerald-400">make app-up</code>):
        </p>
      </div>
      ${hasDockerApp ? `
        <span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0 self-start sm:self-auto">
          ${getDockerApp(criteria.dockerApp)?.name} Configured
        </span>
      ` : ''}
    </div>

    ${
      isNommu
        ? `
      <div class="p-3 mb-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2.5">
        <span class="text-base shrink-0">⚠️</span>
        <span>Docker containers require a hardware Memory Management Unit (MMU) and Linux cgroups/namespaces, which are not available on NOMMU microcontrollers.</span>
      </div>
    `
        : ''
    }

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs min-w-0">
      
      <!-- None / Pure Minimal OS Card -->
      <div data-docker-id="none" class="btn-select-docker-app p-3 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between min-w-0 ${(!criteria.dockerApp || criteria.dockerApp === 'none') ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/30' : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'}">
        <div>
          <div class="flex items-center justify-between mb-1 gap-1.5">
            <span class="text-xl shrink-0">🚫</span>
            ${(!criteria.dockerApp || criteria.dockerApp === 'none') ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">ACTIVE</span>` : ''}
          </div>
          <h4 class="font-bold text-slate-200 text-xs">None (Pure OS Minimal)</h4>
          <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">No extra background containers. Keep the OS footprint ultra-lean.</p>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
          Pure Native Host
        </div>
      </div>

      ${DOCKER_APPS_REGISTRY.map((app) => {
        const isSelected = criteria.dockerApp === app.id;
        const compat = checkDockerAppCompatibility(app, criteria);
        const hasWarning = compat.compatible && compat.warnings.length > 0;

        return `
          <div data-docker-id="${app.id}" ${compat.blocker ? `data-incompatible-reason="${compat.blocker}"` : ''} class="btn-select-docker-app p-3 rounded-xl border select-none transition-all flex flex-col justify-between min-w-0 ${
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
                  ${
                    !compat.compatible
                      ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30" title="${compat.blocker}">N/A</span>`
                      : hasWarning
                      ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30" title="${compat.warnings[0]}">⚠️ ${app.minRamMb >= 1024 ? `${(app.minRamMb / 1024).toFixed(0)}G` : `${app.minRamMb}M`}</span>`
                      : ''
                  }
                  ${isSelected ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">ACTIVE</span>` : `<span class="text-[10px] text-slate-500 font-mono">Port ${app.defaultPort}</span>`}
                </div>
              </div>
              <h4 class="font-bold text-slate-200 text-xs">${app.name}</h4>
              <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">${app.description}</p>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-800/80 text-[10px] ${!compat.compatible ? 'text-slate-600' : isSelected ? 'text-emerald-400 font-bold' : 'text-slate-500'} font-mono flex items-center justify-between">
              <span>${!compat.compatible ? 'Unsupported Hardware' : isSelected ? '✓ In docker-compose.yml' : '+ Deploy with Docker'}</span>
              <span>${!compat.compatible ? '🚫' : '↗'}</span>
            </div>
          </div>
        `;
      }).join('')}

    </div>
  `;

  if (isPrimary) {
    return `
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 min-w-0 overflow-hidden">
        ${innerContent}
      </div>
    `;
  }

  return `
    <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden transition-all" ${panelAttributes(panelOpen, 'docker-services', isExpanded)}>
      <summary class="flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-slate-300">
        <span class="flex items-center gap-2 flex-wrap">
          <span class="text-lg">🐳</span>
          <span>Also want to run self-hosted Docker services on this desktop? (Click to view options)</span>
          ${hasDockerApp ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${getDockerApp(criteria.dockerApp)?.name} active</span>` : ''}
        </span>
        <span class="text-slate-500 group-open:rotate-180 transition-transform text-sm shrink-0">▼</span>
      </summary>
      <div class="mt-4 pt-4 border-t border-slate-800">
        ${innerContent}
      </div>
    </details>
  `;
}

export function renderEmulatorAppSuite(
  criteria: UserCriteria,
  isPrimary: boolean,
  panelOpen?: Readonly<Record<string, boolean>>
): string {
  const selectedCount = (criteria.emulatorApps || []).length;
  const isExpanded = isPrimary || selectedCount > 0;
  const isNommu = criteria.architecture === 'nommu';

  const innerContent = `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 min-w-0">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xl shrink-0">🎮</span>
          <h3 class="text-base sm:text-lg font-bold text-slate-100 break-words">Gaming & Retro Emulation Suite</h3>
          ${isPrimary ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">Recommended for Gaming</span>` : ''}
        </div>
        <p class="text-xs text-slate-400 mt-1 break-words">
          Install classic console, handheld, and arcade emulators. Generates an automated <code class="text-emerald-400">bootstrap-emulators.sh</code> with gamepad udev rules (Xbox, DualSense, 8BitDo) and ROM folders:
        </p>
      </div>
      <span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 whitespace-nowrap shrink-0 self-start sm:self-auto">
        ${selectedCount} Selected
      </span>
    </div>

    ${
      isNommu
        ? `
      <div class="p-3 mb-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2.5">
        <span class="text-base shrink-0">⚠️</span>
        <span>Microcontrollers (NOMMU) lack display compositors and memory management. Gaming emulators cannot run on this target.</span>
      </div>
    `
        : ''
    }

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs min-w-0">
      ${EMULATOR_APPS_REGISTRY.map((app) => {
        const isSelected = (criteria.emulatorApps || []).includes(app.id);
        const compat = checkEmulatorAppCompatibility(app, criteria);
        const hasWarning = compat.compatible && compat.warnings.length > 0;

        return `
          <div data-app-id="${app.id}" ${compat.blocker ? `data-incompatible-reason="${compat.blocker}"` : ''} class="btn-toggle-emulator-app p-2.5 rounded-xl border select-none transition-all flex flex-col justify-between min-w-0 ${
            !compat.compatible
              ? 'opacity-50 cursor-not-allowed bg-slate-950/40 border-slate-900'
              : isSelected
              ? 'cursor-pointer bg-purple-950/20 border-purple-500/60 shadow-md shadow-purple-950/30'
              : 'cursor-pointer bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
          }">
            <div class="flex items-center justify-between mb-1.5 gap-1.5 min-w-0">
              <span class="text-xl shrink-0">${app.icon}</span>
              <div class="flex items-center gap-1 shrink-0">
                ${
                  !compat.compatible
                    ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30" title="${compat.blocker}">N/A</span>`
                    : hasWarning
                    ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30" title="${compat.warnings[0]}">⚠️ ${app.minRamMb >= 1024 ? `${(app.minRamMb / 1024).toFixed(0)}G` : `${app.minRamMb}M`}</span>`
                    : ''
                }
                <div class="w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${
                  isSelected ? 'bg-purple-400 border-purple-400 text-slate-950' : 'border-slate-700 bg-slate-900'
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
      }).join('')}
    </div>
  `;

  if (isPrimary) {
    return `
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 min-w-0 overflow-hidden">
        ${innerContent}
      </div>
    `;
  }

  return `
    <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden transition-all" ${panelAttributes(panelOpen, 'emulator-apps', isExpanded)}>
      <summary class="flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-slate-300">
        <span class="flex items-center gap-2 flex-wrap">
          <span class="text-lg">🎮</span>
          <span>Add Gaming & Retro Emulators? (RetroArch, DOSBox, Dolphin, PCSX2, etc.)</span>
          ${selectedCount > 0 ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">${selectedCount} active</span>` : ''}
        </span>
        <span class="text-slate-500 group-open:rotate-180 transition-transform text-sm shrink-0">▼</span>
      </summary>
      <div class="mt-4 pt-4 border-t border-slate-800">
        ${innerContent}
      </div>
    </details>
  `;
}
