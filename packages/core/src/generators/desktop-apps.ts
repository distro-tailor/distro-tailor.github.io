import { DesktopAppId, UserCriteria } from '../types.js';

export interface DesktopAppDefinition {
  id: DesktopAppId;
  name: string;
  category: 'browsers' | 'development' | 'media' | 'productivity' | 'utilities';
  icon: string;
  description: string;
  aptPackages?: string[];
  flatpakId?: string;
  apkPackages?: string[];
}

export const DESKTOP_APPS_REGISTRY: DesktopAppDefinition[] = [
  // --- BROWSERS ---
  {
    id: 'firefox',
    name: 'Firefox',
    category: 'browsers',
    icon: '🦊',
    description: 'Fast, private, open-source web browser by Mozilla.',
    aptPackages: ['firefox-esr'],
    flatpakId: 'org.mozilla.firefox',
    apkPackages: ['firefox']
  },
  {
    id: 'chromium',
    name: 'Chromium',
    category: 'browsers',
    icon: '🌐',
    description: 'Open-source foundation behind Google Chrome.',
    aptPackages: ['chromium'],
    flatpakId: 'org.chromium.Chromium',
    apkPackages: ['chromium']
  },
  {
    id: 'brave',
    name: 'Brave Browser',
    category: 'browsers',
    icon: '🦁',
    description: 'Privacy-first browser with built-in ad & tracker blocking.',
    flatpakId: 'com.brave.Browser'
  },

  // --- DEVELOPMENT ---
  {
    id: 'vscode',
    name: 'VS Code',
    category: 'development',
    icon: '💻',
    description: 'Modern code editor with Git, debugging & extensions ecosystem.',
    flatpakId: 'com.visualstudio.code'
  },
  {
    id: 'git-dev',
    name: 'Git & Dev Core',
    category: 'development',
    icon: '🛠️',
    description: 'Essential compilers & tooling: git, build-essential, curl, jq, make.',
    aptPackages: ['git', 'build-essential', 'curl', 'wget', 'jq', 'tar', 'unzip'],
    apkPackages: ['git', 'build-base', 'curl', 'jq']
  },
  {
    id: 'neovim',
    name: 'Neovim',
    category: 'development',
    icon: '⚡',
    description: 'Hyperextensible Vim-based modern terminal text editor.',
    aptPackages: ['neovim'],
    flatpakId: 'io.neovim.nvim',
    apkPackages: ['neovim']
  },
  {
    id: 'nodejs',
    name: 'Node.js LTS',
    category: 'development',
    icon: '🟢',
    description: 'Node.js JavaScript runtime engine with npm package manager.',
    aptPackages: ['nodejs', 'npm'],
    apkPackages: ['nodejs', 'npm']
  },
  {
    id: 'python',
    name: 'Python 3 Stack',
    category: 'development',
    icon: '🐍',
    description: 'Python 3, pip package manager, virtualenv, and build headers.',
    aptPackages: ['python3', 'python3-pip', 'python3-venv', 'python3-dev'],
    apkPackages: ['python3', 'py3-pip']
  },

  // --- MEDIA & CREATIVE ---
  {
    id: 'vlc',
    name: 'VLC Media Player',
    category: 'media',
    icon: '🎬',
    description: 'Plays all video/audio formats and DVDs with zero extra codecs needed.',
    aptPackages: ['vlc'],
    flatpakId: 'org.videolan.VLC',
    apkPackages: ['vlc']
  },
  {
    id: 'obs',
    name: 'OBS Studio',
    category: 'media',
    icon: '📹',
    description: 'Free & open-source live streaming and screen recording software.',
    flatpakId: 'com.obsproject.Studio'
  },
  {
    id: 'gimp',
    name: 'GIMP',
    category: 'media',
    icon: '🎨',
    description: 'Advanced image editing and photo retouching (Photoshop alternative).',
    aptPackages: ['gimp'],
    flatpakId: 'org.gimp.GIMP'
  },
  {
    id: 'blender',
    name: 'Blender 3D',
    category: 'media',
    icon: '🧊',
    description: 'Complete 3D creation suite: modeling, rigging, animation, rendering.',
    flatpakId: 'org.blender.Blender'
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'media',
    icon: '🎵',
    description: 'Stream millions of songs and podcasts from your desktop.',
    flatpakId: 'com.spotify.Client'
  },

  // --- PRODUCTIVITY & CHAT ---
  {
    id: 'libreoffice',
    name: 'LibreOffice',
    category: 'productivity',
    icon: '📄',
    description: 'Full office productivity suite: Writer, Calc, Impress (MS Office compatible).',
    aptPackages: ['libreoffice'],
    flatpakId: 'org.libreoffice.LibreOffice'
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'productivity',
    icon: '💬',
    description: 'All-in-one voice and text chat for communities, gaming, and friends.',
    flatpakId: 'com.discordapp.Discord'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Notes',
    category: 'productivity',
    icon: '📓',
    description: 'Sharpen your thinking with private, local-first Markdown knowledge base.',
    flatpakId: 'md.obsidian.Obsidian'
  },
  {
    id: 'telegram',
    name: 'Telegram Desktop',
    category: 'productivity',
    icon: '✈️',
    description: 'Fast and secure desktop messaging app with cloud sync.',
    aptPackages: ['telegram-desktop'],
    flatpakId: 'org.telegram.desktop'
  },

  // --- SYSTEM & UTILITIES ---
  {
    id: 'btop',
    name: 'btop Resource Monitor',
    category: 'utilities',
    icon: '📊',
    description: 'Modern, gorgeous terminal activity monitor for CPU, RAM, disks & network.',
    aptPackages: ['btop'],
    apkPackages: ['btop']
  },
  {
    id: 'fastfetch',
    name: 'Fastfetch',
    category: 'utilities',
    icon: 'ℹ️',
    description: 'Blazing fast system information terminal display with distro logo.',
    aptPackages: ['fastfetch'],
    apkPackages: ['fastfetch']
  }
];

export function getDesktopApp(id: DesktopAppId): DesktopAppDefinition | undefined {
  return DESKTOP_APPS_REGISTRY.find(app => app.id === id);
}

export function generateBootstrapAppsScript(
  selectedAppIds: DesktopAppId[],
  criteria: UserCriteria
): string {
  if (!selectedAppIds || selectedAppIds.length === 0) {
    return `#!/usr/bin/env bash
# ==============================================================================
# DistroTailor: Desktop Application Suite (Ninite Style)
# No desktop applications were selected.
# ==============================================================================
echo "[+] DistroTailor: No desktop applications selected."
exit 0
`;
  }

  const selectedApps = selectedAppIds
    .map(id => getDesktopApp(id))
    .filter((app): app is DesktopAppDefinition => !!app);

  const aptList: string[] = [];
  const flatpakList: string[] = [];

  for (const app of selectedApps) {
    if (app.aptPackages && app.aptPackages.length > 0) {
      aptList.push(...app.aptPackages);
    } else if (app.flatpakId) {
      flatpakList.push(app.flatpakId);
    }
  }

  return `#!/usr/bin/env bash
# ==============================================================================
# DistroTailor: 1-Click Desktop Application Suite (Ninite for Linux)
# Automated unattended setup for ${selectedApps.length} selected desktop application(s):
${selectedApps.map(a => `# - ${a.icon} ${a.name} (${a.category})`).join('\n')}
# ==============================================================================
set -euo pipefail

# Ensure script is run with appropriate privileges
if [ "$(id -u)" -ne 0 ]; then
  echo "[-] Error: Please run this bootstrap script with sudo:"
  echo "    sudo bash bootstrap-apps.sh"
  exit 1
fi

echo "===================================================================="
echo " DistroTailor: Installing ${selectedApps.length} Selected Desktop Application(s)"
echo " Mode: 100% Unattended / Automated (Ninite Style)"
echo "===================================================================="

${aptList.length > 0 ? `
echo "[+] Step 1: Installing native distribution packages via APT..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \\
  ${Array.from(new Set(aptList)).join(' \\\n  ')}
echo "[✓] Native packages installed successfully."
` : ''}

${flatpakList.length > 0 ? `
echo "[+] Step 2: Preparing Flatpak universal desktop sandbox..."
apt-get update -y
apt-get install -y --no-install-recommends flatpak

# Ensure Flathub repository is registered
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo

echo "[+] Step 3: Installing desktop applications from Flathub..."
${flatpakList.map(fId => `echo "[+] Installing ${fId}..."\nflatpak install -y --noninteractive flathub ${fId}`).join('\n\n')}
echo "[✓] Flatpak applications installed successfully."
` : ''}

echo "===================================================================="
echo " [✓] DistroTailor Application Bootstrap Complete!"
echo " All ${selectedApps.length} applications are installed and ready in your application menu."
echo "===================================================================="
`;
}
