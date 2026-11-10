import { DesktopEnvId, DockerAppId } from '@distro-tailor/core';

export interface AddonCombo {
  title: string;
  icon: string;
  description: string;
  howTo: string;
  appliesDockerApp?: DockerAppId;
  appliesDesktopEnv?: DesktopEnvId;
  appliesDistrobox?: boolean;
}

/**
 * Curated catalog of popular mix-and-match combos keyed by distro ID.
 */
export const DISTRO_ADDON_CATALOG: Record<string, AddonCombo[]> = {
  libreelec: [
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
  ],
  openmediavault: [
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
  ],
  'home-assistant-os': [
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
  ],
  'cage-appliance': [
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
  ],
  batocera: [
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
  ]
};

export const DEFAULT_ADDON_COMBOS: AddonCombo[] = [
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

export function getAddonCombos(distroId: string): AddonCombo[] {
  return DISTRO_ADDON_CATALOG[distroId] || DEFAULT_ADDON_COMBOS;
}
