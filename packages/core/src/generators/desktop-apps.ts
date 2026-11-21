import { CpuArchitecture, DesktopAppId, UserCriteria } from '../types.js';

export interface DesktopAppDefinition {
  id: DesktopAppId;
  name: string;
  category: 'browsers' | 'development' | 'media' | 'productivity' | 'utilities' | 'gaming';
  icon: string;
  description: string;
  minRamMb: number;
  architectures: CpuArchitecture[];
  aptPackages?: string[];
  flatpakId?: string;
  apkPackages?: string[];
  customInstallBash?: string;
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
  {
    id: 'golang',
    name: 'Go (Golang)',
    category: 'development',
    icon: '🐹',
    description: 'Open-source Go compiler, standard library, and toolchain (BSD-3-Clause).',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['golang-go'],
    apkPackages: ['go']
  },
  {
    id: 'ruby',
    name: 'Ruby & Bundler',
    category: 'development',
    icon: '💎',
    description: 'Ruby interpreter, RubyGems, and Bundler for Rails & scripting (MIT/BSD).',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['ruby-full'],
    apkPackages: ['ruby', 'ruby-bundler']
  },
  {
    id: 'rust',
    name: 'Rust & Cargo',
    category: 'development',
    icon: '🦀',
    description: 'Rust compiler (rustc) and Cargo package manager (MIT/Apache-2.0).',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64', 'riscv64'],
    aptPackages: ['rustc', 'cargo'],
    apkPackages: ['rust', 'cargo']
  },
  {
    id: 'dotnet',
    name: '.NET SDK (LTS)',
    category: 'development',
    icon: '🟣',
    description: 'Free, open-source .NET LTS SDK & CLI for C#, F#, and ASP.NET Core (MIT).',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64'],
    apkPackages: ['dotnet8-sdk'],
    customInstallBash: `if [ "$PKG_MGR" != "apk" ]; then
  echo "[+] Installing .NET LTS SDK via official Microsoft dotnet-install.sh..."
  if ! command -v curl >/dev/null 2>&1; then
    [ "$PKG_MGR" = "apt" ] && apt-get update -y && apt-get install -y --no-install-recommends curl ca-certificates
  fi
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel LTS --install-dir /usr/local/dotnet
  ln -sf /usr/local/dotnet/dotnet /usr/local/bin/dotnet
  rm -f /tmp/dotnet-install.sh
fi`
  },
  {
    id: 'java',
    name: 'OpenJDK (Java)',
    category: 'development',
    icon: '☕',
    description: 'Open-source Java Development Kit (JDK) for JVM, Spring & Android builds (GPL-2.0).',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['default-jdk'],
    apkPackages: ['openjdk21-jdk']
  },
  {
    id: 'php',
    name: 'PHP & Composer',
    category: 'development',
    icon: '🐘',
    description: 'PHP runtime and Composer dependency manager for web & Laravel apps (PHP License).',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['php', 'composer'],
    apkPackages: ['php', 'composer']
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
    aptPackages: ['neofetch'],
    apkPackages: ['fastfetch']
  },
  {
    id: 'syncthing',
    name: 'Syncthing',
    category: 'utilities',
    icon: '🔄',
    description: 'Decentralized, encrypted peer-to-peer file sync across laptops, phones & servers (MPL-2.0).',
    minRamMb: 128,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['syncthing'],
    apkPackages: ['syncthing']
  },
  {
    id: 'wireguard',
    name: 'WireGuard VPN',
    category: 'utilities',
    icon: '🔒',
    description: 'Modern, fast, kernel-space encrypted VPN tunnel tools (GPL-2.0).',
    minRamMb: 64,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['wireguard-tools'],
    apkPackages: ['wireguard-tools']
  },
  {
    id: 'timeshift',
    name: 'Timeshift Snapshots',
    category: 'utilities',
    icon: '⏪',
    description: 'System restore utility using RSYNC or Btrfs snapshots for safe OS rollbacks (GPL-3.0).',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64', 'armv7'],
    aptPackages: ['timeshift']
  },
  {
    id: 'restic',
    name: 'Restic Backup',
    category: 'utilities',
    icon: '🗄️',
    description: 'Fast, deduplicated, end-to-end encrypted backup CLI for local drives & S3 (BSD-2-Clause).',
    minRamMb: 128,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['restic'],
    apkPackages: ['restic']
  },

  // --- GAMING & STORES ---
  {
    id: 'steam',
    name: 'Steam',
    category: 'gaming',
    icon: '🎮',
    description: 'Valve Steam PC gaming client with Proton compatibility layer for Windows games on Linux.',
    minRamMb: 4096,
    architectures: ['x86_64'],
    flatpakId: 'com.valvesoftware.Steam'
  },
  {
    id: 'heroic',
    name: 'Heroic (GOG & Epic)',
    category: 'gaming',
    icon: '⚔️',
    description: 'Open-source launcher for GOG.com, Epic Games Store, and Amazon Prime Gaming with Wine/Proton (GPL-3.0).',
    minRamMb: 2048,
    architectures: ['x86_64'],
    flatpakId: 'com.heroicgameslauncher.hgl'
  },
  {
    id: 'lutris',
    name: 'Lutris Game Manager',
    category: 'gaming',
    icon: '🕹️',
    description: 'Open-source unified game library for GOG, Humble Bundle, EA, Ubisoft, and retro runners (GPL-3.0).',
    minRamMb: 2048,
    architectures: ['x86_64'],
    flatpakId: 'net.lutris.Lutris'
  },
  {
    id: 'prism-launcher',
    name: 'Prism Launcher',
    category: 'gaming',
    icon: '🧱',
    description: 'Free, open-source Minecraft launcher with Modrinth/CurseForge modpack support (GPL-3.0).',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.prismlauncher.PrismLauncher'
  },

  // --- PRIVACY, TOR, IRC & FILE SHARING ---
  {
    id: 'tor-browser',
    name: 'Tor Browser',
    category: 'browsers',
    icon: '🧅',
    description: 'Anonymous, fingerprint-resistant web browser routing all traffic through the Tor network.',
    minRamMb: 1024,
    architectures: ['x86_64'],
    flatpakId: 'org.torproject.torbrowser-launcher'
  },
  {
    id: 'onionshare',
    name: 'OnionShare',
    category: 'utilities',
    icon: '🧅',
    description: 'Securely and anonymously share files, host websites, and chat over Tor onion services (GPL-3.0).',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.onionshare.OnionShare'
  },
  {
    id: 'qbittorrent',
    name: 'qBittorrent',
    category: 'utilities',
    icon: '🧲',
    description: 'Free, ad-free open-source BitTorrent client with RSS, IP filtering, and web UI (GPL-2.0).',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64', 'armv7'],
    aptPackages: ['qbittorrent'],
    apkPackages: ['qbittorrent']
  },
  {
    id: 'weechat',
    name: 'WeeChat (IRC)',
    category: 'productivity',
    icon: '💬',
    description: 'Fast, extensible terminal IRC & chat client with relay/bouncer support (GPL-3.0).',
    minRamMb: 64,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['weechat'],
    apkPackages: ['weechat']
  },
  {
    id: 'halloy',
    name: 'Halloy (GUI IRC)',
    category: 'productivity',
    icon: '💬',
    description: 'Modern, Rust-powered open-source desktop IRC client with IRCv3 & theme support (GPL-3.0).',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.squidowl.halloy'
  },

  // --- VIDEO, IMAGES & SOUND ---
  {
    id: 'handbrake',
    name: 'HandBrake',
    category: 'media',
    icon: '🎞️',
    description: 'Open-source video transcoder for converting MKV/MP4/H.265/AV1 with hardware acceleration (GPL-2.0).',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'fr.handbrake.ghb'
  },
  {
    id: 'kdenlive',
    name: 'Kdenlive Video Editor',
    category: 'media',
    icon: '🎬',
    description: 'Full-featured open-source multi-track non-linear video editor (GPL-3.0).',
    minRamMb: 4096,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.kde.kdenlive'
  },
  {
    id: 'inkscape',
    name: 'Inkscape',
    category: 'media',
    icon: '✒️',
    description: 'Professional open-source vector graphics & SVG editor (Adobe Illustrator alternative, GPL-2.0).',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['inkscape'],
    flatpakId: 'org.inkscape.Inkscape'
  },
  {
    id: 'krita',
    name: 'Krita',
    category: 'media',
    icon: '🖌️',
    description: 'Open-source digital painting, concept art, and 2D animation studio (GPL-3.0).',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.kde.krita'
  },
  {
    id: 'darktable',
    name: 'Darktable (RAW Photos)',
    category: 'media',
    icon: '📷',
    description: 'Open-source photography workflow & non-destructive RAW developer (Lightroom alternative, GPL-3.0).',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.darktable.Darktable'
  },
  {
    id: 'gthumb',
    name: 'gThumb (Fast Image Viewer)',
    category: 'media',
    icon: '🖼️',
    description: 'Fast open-source image viewer, organizer, and batch crop/resize/convert tool (IrfanView alternative, GPL-2.0).',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7'],
    aptPackages: ['gthumb']
  },
  {
    id: 'audacity',
    name: 'Audacity',
    category: 'media',
    icon: '🎙️',
    description: 'Open-source multi-track audio recorder, waveform editor, and podcasting suite (GPL-2.0).',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.audacityteam.Audacity'
  },
  {
    id: 'ardour',
    name: 'Ardour DAW',
    category: 'media',
    icon: '🎚️',
    description: 'Professional open-source Digital Audio Workstation for recording, mixing, and mastering (GPL-2.0).',
    minRamMb: 4096,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.ardour.Ardour'
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
  const apkList: string[] = [];
  const flatpakList: string[] = [];
  const customScripts: string[] = [];

  for (const app of selectedApps) {
    if (app.aptPackages && app.aptPackages.length > 0) {
      aptList.push(...app.aptPackages);
    } else if (app.flatpakId) {
      flatpakList.push(app.flatpakId);
    }
    if (app.apkPackages && app.apkPackages.length > 0) {
      apkList.push(...app.apkPackages);
    }
    if (app.customInstallBash) {
      customScripts.push(app.customInstallBash);
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
${apkList.length > 0 ? `  apk update
  apk add --no-cache \\
    ${Array.from(new Set(apkList)).join(' \\\n    ')}` : '  echo "[+] No native Alpine packages required for selected apps."'}
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

${customScripts.length > 0 ? `
echo "[+] Installing specialized runtime toolchains..."
${customScripts.join('\n\n')}
echo "[✓] Specialized toolchains installed successfully."
` : ''}

echo "===================================================================="
echo " [✓] DistroTailor Application Bootstrap Complete!"
echo " All ${selectedApps.length} applications are installed and ready in your application menu."
echo "===================================================================="
`;
}
