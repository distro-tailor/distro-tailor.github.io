import {
  DESKTOP_APPS_REGISTRY,
  DesktopEnvId,
  DOCKER_APPS_REGISTRY,
  DockerAppId,
  getDockerApp,
  UserCriteria
} from '@distro-tailor/core';

export interface AddonCombo {
  title: string;
  icon: string;
  description: string;
  howTo: string;
  appliesDockerApp?: DockerAppId;
  appliesDesktopEnv?: DesktopEnvId;
  appliesDistrobox?: boolean;
}

export function getAddonCombos(distroId: string): AddonCombo[] {
  switch (distroId) {
    case 'libreelec':
      return [
        {
          title: 'Retro Gaming (Arcade, SNES, PS1, N64)',
          icon: '🕹️',
          description: 'Play classic retro games straight from your couch with USB or Bluetooth game controllers.',
          howTo: 'Enable "RetroPlayer" in Kodi Settings → Add-ons → Game Clients, or install the LibreELEC RetroArch addon.'
        },
        {
          title: 'Stream From Home Storage (NAS / Jellyfin)',
          icon: '📦',
          description: 'Access family photos, home videos, and movies stored on your home server or NAS.',
          howTo: 'Add network folder via SMB/NFS, or install the official Jellyfin / Plex add-on from Kodi repository.',
          appliesDockerApp: 'jellyfin'
        }
      ];
    case 'openmediavault':
      return [
        {
          title: 'Smart Home Hub (Home Assistant)',
          icon: '🏡',
          description: 'Run your local private smart home hub alongside family file storage on the same PC.',
          howTo: 'Install "omv-extras" plugin → enable Compose / Docker → 1-click launch Home Assistant container.',
          appliesDockerApp: 'home-assistant'
        },
        {
          title: 'Private Family Photo Cloud (Immich)',
          icon: '📸',
          description: 'Auto-backup phone photos and replace Google Photos / iCloud with AI face & map search.',
          howTo: 'Deploy the Immich Docker Compose template directly inside the OMV web interface.',
          appliesDockerApp: 'immich'
        },
        {
          title: 'Network-Wide Ad Blocker (Pi-hole)',
          icon: '🛡️',
          description: 'Block ads and tracking for every phone, laptop, and smart TV connected to your Wi-Fi.',
          howTo: 'Launch a Pi-hole container and point your home Wi-Fi router DNS to your OMV box IP address.',
          appliesDockerApp: 'pihole'
        }
      ];
    case 'home-assistant-os':
      return [
        {
          title: 'Smart Security Camera NVR (Frigate)',
          icon: '📹',
          description: 'Local video recording with real-time AI object detection (people, packages, vehicles).',
          howTo: 'Install the "Frigate NVR" add-on directly from the Home Assistant Supervisor Add-on Store.'
        },
        {
          title: 'Universal Smart Hub (Zigbee & Matter)',
          icon: '🔌',
          description: 'Connect low-cost smart bulbs and motion sensors with zero proprietary brand bridges.',
          howTo: 'Plug in a Sonoff or SkyConnect USB dongle and enable the Zigbee2MQTT / Matter add-on.'
        },
        {
          title: 'Family Music & Media Server',
          icon: '🎵',
          description: 'Stream music to smart speakers throughout the house with synchronized multi-room audio.',
          howTo: 'Install Music Assistant or Jellyfin from the Home Assistant Community Add-on Store.',
          appliesDockerApp: 'jellyfin'
        }
      ];
    case 'cage-appliance':
      return [
        {
          title: 'Touchscreen Cashier / Point-of-Sale (POS)',
          icon: '💳',
          description: 'Lock screen to your web checkout or local POS with auto-recovery and zero desktop distraction.',
          howTo: 'Point the Kiosk start script directly to your local POS URL in full-screen Wayland mode.'
        },
        {
          title: 'Smart Factory & Workshop Telemetry Display',
          icon: '📊',
          description: 'Show Grafana dashboards, manufacturing metrics, or 3D printer status 24/7 reliably.',
          howTo: 'Set URL to your Grafana or Node-RED dashboard with auto-refresh enabled.'
        }
      ];
    case 'batocera':
      return [
        {
          title: 'Wireless Bluetooth Controller Auto-Pair',
          icon: '🎮',
          description: 'Connect PlayStation, Xbox, 8BitDo, or Switch controllers wirelessly via Bluetooth menu.',
          howTo: 'Press Spacebar on keyboard → Controller Settings → Pair Bluetooth Controller.'
        },
        {
          title: 'RetroAchievements Online Leaderboards',
          icon: '🏆',
          description: 'Earn real achievements and badges for classic NES, SNES, Genesis, and arcade games.',
          howTo: 'Enter your free RetroAchievements.org username in Main Menu → Game Settings.'
        }
      ];
    default:
      return [
        {
          title: 'Self-Hosted Container Apps (Docker)',
          icon: '🐳',
          description: 'Easily launch databases, web servers, Pi-hole, or Nextcloud in lightweight containers.',
          howTo: 'Use the Turnkey Docker App selector below to inject ready-to-run compose files.',
          appliesDockerApp: 'pihole'
        },
        {
          title: 'Universal Linux Packages (Distrobox)',
          icon: '🏛️',
          description: 'Run Arch AUR, Fedora, or Ubuntu software on any base distribution with zero conflicts.',
          howTo: 'Enable Distrobox in the FrankenDistro tuning panel to unlock thousands of community packages.',
          appliesDistrobox: true
        }
      ];
  }
}

export function renderDesktopAppSuite(criteria: UserCriteria, isPrimary: boolean): string {
  const selectedCount = (criteria.desktopApps || []).length;
  const isExpanded = isPrimary || selectedCount > 0;

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

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs min-w-0">
      ${DESKTOP_APPS_REGISTRY.map((app) => {
        const isSelected = (criteria.desktopApps || []).includes(app.id);
        return `
          <div data-app-id="${app.id}" class="btn-toggle-desktop-app p-2.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between min-w-0 ${isSelected ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/30' : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'}">
            <div class="flex items-center justify-between mb-1.5 gap-1.5 min-w-0">
              <span class="text-xl shrink-0">${app.icon}</span>
              <div class="w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-emerald-400 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'}">
                ${isSelected ? '✓' : ''}
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
    <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden transition-all" ${isExpanded ? 'open' : ''}>
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

export function renderDockerServiceSuite(criteria: UserCriteria, isPrimary: boolean): string {
  const hasDockerApp = criteria.dockerApp && criteria.dockerApp !== 'none';
  const isExpanded = isPrimary || !!hasDockerApp;

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
        return `
          <div data-docker-id="${app.id}" class="btn-select-docker-app p-3 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between min-w-0 ${isSelected ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/30' : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'}">
            <div>
              <div class="flex items-center justify-between mb-1 gap-1.5">
                <span class="text-xl shrink-0">${app.icon}</span>
                ${isSelected ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">ACTIVE</span>` : `<span class="text-[10px] text-slate-500 font-mono">Port ${app.defaultPort}</span>`}
              </div>
              <h4 class="font-bold text-slate-200 text-xs">${app.name}</h4>
              <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">${app.description}</p>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-800/80 text-[10px] ${isSelected ? 'text-emerald-400 font-bold' : 'text-slate-500'} font-mono flex items-center justify-between">
              <span>${isSelected ? '✓ In docker-compose.yml' : '+ Deploy with Docker'}</span>
              <span>↗</span>
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
    <details class="group bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden transition-all" ${isExpanded ? 'open' : ''}>
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
