import { CpuArchitecture, DesktopAppId, UserCriteria } from '../types.js';

export interface DesktopAppDefinition {
  id: DesktopAppId;
  name: string;
  category: 'browsers' | 'development' | 'media' | 'productivity' | 'utilities';
  icon: string;
  description: string;
  minRamMb: number;
  architectures: CpuArchitecture[];
  aptPackages?: string[];
  flatpakId?: string;
  apkPackages?: string[];
}

export interface DesktopAppCompatibility {
  compatible: boolean;
  warnings: string[];
  blocker?: string;
}

export function checkDesktopAppCompatibility(
  app: DesktopAppDefinition,
  criteria: UserCriteria
): DesktopAppCompatibility {
  const warnings: string[] = [];

  // Hard blocker 1: NOMMU / Microcontrollers
  if (criteria.architecture === 'nommu') {
    return {
      compatible: false,
      warnings: [],
      blocker: 'Microcontrollers (NOMMU) cannot run desktop graphical environments.'
    };
  }

  // Hard blocker 2: Architecture compatibility
  if (criteria.architecture && !app.architectures.includes(criteria.architecture)) {
    return {
      compatible: false,
      warnings: [],
      blocker: `${app.name} does not provide prebuilt binaries for ${criteria.architecture}.`
    };
  }

  // Soft warning: RAM budget
  if (criteria.maxRamMb && criteria.maxRamMb < app.minRamMb) {
    const formatted = app.minRamMb >= 1024 ? `${(app.minRamMb / 1024).toFixed(0)} GB` : `${app.minRamMb} MB`;
    warnings.push(`Exceeds your ${criteria.maxRamMb} MB budget (requires ~${formatted} RAM).`);
  }

  return {
    compatible: true,
    warnings
  };
}

export const DESKTOP_APPS_REGISTRY: DesktopAppDefinition[] = [
  // --- BROWSERS ---
  {
    id: 'firefox',
    name: 'Firefox',
    category: 'browsers',
    icon: '🦊',
    description: 'Fast, private, open-source web browser by Mozilla.',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
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
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
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
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'com.brave.Browser'
  },

  // --- DEVELOPMENT ---
  {
    id: 'vscode',
    name: 'VS Code',
    category: 'development',
    icon: '💻',
    description: 'Modern code editor with Git, debugging & extensions ecosystem.',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'com.visualstudio.code'
  },
  {
    id: 'git-dev',
    name: 'Git & Dev Core',
    category: 'development',
    icon: '🛠️',
    description: 'Essential compilers & tooling: git, build-essential, curl, jq, make.',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['git', 'build-essential', 'curl', 'wget', 'jq', 'tar', 'unzip'],
    apkPackages: ['git', 'build-base', 'curl', 'jq']
  },
  {
    id: 'neovim',
    name: 'Neovim',
    category: 'development',
    icon: '⚡',
    description: 'Hyperextensible Vim-based modern terminal text editor.',
    minRamMb: 128,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
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
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['nodejs', 'npm'],
    apkPackages: ['nodejs', 'npm']
  },
  {
    id: 'python',
    name: 'Python 3 Stack',
    category: 'development',
    icon: '🐍',
    description: 'Python 3, pip package manager, virtualenv, and build headers.',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
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
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
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
    minRamMb: 4096,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'com.obsproject.Studio'
  },
  {
    id: 'gimp',
    name: 'GIMP',
    category: 'media',
    icon: '🎨',
    description: 'Advanced image editing and photo retouching (Photoshop alternative).',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['gimp'],
    flatpakId: 'org.gimp.GIMP'
  },
  {
    id: 'blender',
    name: 'Blender 3D',
    category: 'media',
    icon: '🧊',
    description: 'Complete 3D creation suite: modeling, rigging, animation, rendering.',
    minRamMb: 4096,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.blender.Blender'
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'media',
    icon: '🎵',
    description: 'Stream millions of songs and podcasts from your desktop.',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'com.spotify.Client'
  },

  // --- PRODUCTIVITY & CHAT ---
  {
    id: 'libreoffice',
    name: 'LibreOffice',
    category: 'productivity',
    icon: '📄',
    description: 'Full office productivity suite: Writer, Calc, Impress (MS Office compatible).',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['libreoffice'],
    flatpakId: 'org.libreoffice.LibreOffice'
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'productivity',
    icon: '💬',
    description: 'All-in-one voice and text chat for communities, gaming, and friends.',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'com.discordapp.Discord'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Notes',
    category: 'productivity',
    icon: '📓',
    description: 'Sharpen your thinking with private, local-first Markdown knowledge base.',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'md.obsidian.Obsidian'
  },
  {
    id: 'telegram',
    name: 'Telegram Desktop',
    category: 'productivity',
    icon: '✈️',
    description: 'Fast and secure desktop messaging app with cloud sync.',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
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
    minRamMb: 64,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['btop'],
    apkPackages: ['btop']
  },
  {
    id: 'fastfetch',
    name: 'Fastfetch',
    category: 'utilities',
    icon: 'ℹ️',
    description: 'Blazing fast system information terminal display with distro logo.',
    minRamMb: 32,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
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
# DistroTailor: Desktop Application Suite
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
# DistroTailor: 1-Click Desktop Application Suite
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

# Detect host package manager (supports Debian/Ubuntu, Alpine, Fedora, Arch)
if command -v apk >/dev/null 2>&1; then
  PKG_MGR="apk"
elif command -v apt-get >/dev/null 2>&1; then
  PKG_MGR="apt"
elif command -v dnf >/dev/null 2>&1; then
  PKG_MGR="dnf"
elif command -v pacman >/dev/null 2>&1; then
  PKG_MGR="pacman"
else
  PKG_MGR="unknown"
fi

echo "===================================================================="
echo " DistroTailor: Installing ${selectedApps.length} Selected Desktop Application(s)"
echo " Package Manager: $PKG_MGR | Mode: 100% Unattended"
echo "===================================================================="

${aptList.length > 0 ? `
echo "[+] Step 1: Installing native distribution packages..."
if [ "$PKG_MGR" = "apt" ]; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y --no-install-recommends \\
    ${Array.from(new Set(aptList)).join(' \\\n    ')}
elif [ "$PKG_MGR" = "apk" ]; then
  apk update
  apk add --no-cache \\
    ${Array.from(new Set(aptList)).join(' \\\n    ')}
elif [ "$PKG_MGR" = "dnf" ]; then
  dnf install -y \\
    ${Array.from(new Set(aptList)).join(' \\\n    ')}
fi
echo "[✓] Native packages installed successfully."
` : ''}

${flatpakList.length > 0 ? `
echo "[+] Step 2: Preparing Flatpak universal desktop sandbox..."
if ! command -v flatpak >/dev/null 2>&1; then
  if [ "$PKG_MGR" = "apt" ]; then
    apt-get update -y && apt-get install -y --no-install-recommends flatpak
  elif [ "$PKG_MGR" = "apk" ]; then
    apk update && apk add --no-cache flatpak
  elif [ "$PKG_MGR" = "dnf" ]; then
    dnf install -y flatpak
  fi
fi

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
