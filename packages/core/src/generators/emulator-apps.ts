import { CpuArchitecture, EmulatorAppId, UserCriteria } from '../types.js';

export interface EmulatorAppDefinition {
  id: EmulatorAppId;
  name: string;
  category: 'multi-system' | 'console' | 'retro-pc' | 'handheld' | 'arcade';
  icon: string;
  description: string;
  minRamMb: number;
  architectures: CpuArchitecture[];
  aptPackages?: string[];
  flatpakId?: string;
  apkPackages?: string[];
}

export interface EmulatorAppCompatibility {
  compatible: boolean;
  warnings: string[];
  blocker?: string;
}

export function checkEmulatorAppCompatibility(
  app: EmulatorAppDefinition,
  criteria: UserCriteria
): EmulatorAppCompatibility {
  const warnings: string[] = [];

  // Hard blocker 1: NOMMU / Microcontrollers
  if (criteria.architecture === 'nommu') {
    return {
      compatible: false,
      warnings: [],
      blocker: 'Microcontrollers (NOMMU) cannot run gaming emulators.'
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

export const EMULATOR_APPS_REGISTRY: EmulatorAppDefinition[] = [
  // --- MULTI-SYSTEM & FRONTENDS ---
  {
    id: 'retroarch',
    name: 'RetroArch',
    category: 'multi-system',
    icon: '🕹️',
    description: 'Cross-platform multi-system frontend for 80+ console cores (NES, SNES, Genesis, GBA).',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7'],
    aptPackages: ['retroarch'],
    flatpakId: 'org.libretro.RetroArch'
  },

  // --- RETRO PC & ADVENTURE ---
  {
    id: 'dosbox-staging',
    name: 'DOSBox-Staging',
    category: 'retro-pc',
    icon: '💾',
    description: 'Modernized MS-DOS emulator with pixel-perfect integer scaling, MIDI, and controller support.',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64', 'armv7'],
    aptPackages: ['dosbox'],
    flatpakId: 'io.github.dosbox-staging'
  },
  {
    id: 'scummvm',
    name: 'ScummVM',
    category: 'retro-pc',
    icon: '📜',
    description: 'Adventure game engine recreating classic LucasArts, Sierra, and Humongous point-and-click games.',
    minRamMb: 128,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['scummvm'],
    flatpakId: 'org.scummvm.ScummVM',
    apkPackages: ['scummvm']
  },

  // --- CONSOLE EMULATION ---
  {
    id: 'dolphin',
    name: 'Dolphin',
    category: 'console',
    icon: '🐬',
    description: 'GameCube & Wii emulator with high-definition texture packs, widescreen hacks, and netplay.',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.DolphinEmu.dolphin-emu'
  },
  {
    id: 'pcsx2',
    name: 'PCSX2',
    category: 'console',
    icon: '🎮',
    description: 'Sony PlayStation 2 emulator featuring upscaled rendering, savestates, and custom gamepad mappings.',
    minRamMb: 4096,
    architectures: ['x86_64'],
    flatpakId: 'net.pcsx2.PCSX2'
  },
  {
    id: 'duckstation',
    name: 'DuckStation',
    category: 'console',
    icon: '🦆',
    description: 'Sony PlayStation 1 (PSX) emulator focusing on speed, accuracy, and graphical enhancements.',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.duckstation.DuckStation'
  },

  // --- HANDHELD & ARCADE ---
  {
    id: 'ppsspp',
    name: 'PPSSPP',
    category: 'handheld',
    icon: '📟',
    description: 'Sony PlayStation Portable (PSP) emulator with full-HD rendering and cross-platform save states.',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7'],
    aptPackages: ['ppsspp'],
    flatpakId: 'org.ppsspp.PPSSPP'
  },
  {
    id: 'mame',
    name: 'MAME',
    category: 'arcade',
    icon: '🕹️',
    description: 'Multiple Arcade Machine Emulator dedicated to preserving historic arcade game software.',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    aptPackages: ['mame'],
    flatpakId: 'org.mamedev.MAME'
  }
];

export function getEmulatorApp(id: EmulatorAppId): EmulatorAppDefinition | undefined {
  return EMULATOR_APPS_REGISTRY.find((app) => app.id === id);
}

export function generateBootstrapEmulatorsScript(
  selectedAppIds: EmulatorAppId[],
  criteria: UserCriteria
): string {
  if (!selectedAppIds || selectedAppIds.length === 0) {
    return `#!/usr/bin/env bash
# ==============================================================================
# DistroTailor: Emulator Application Suite
# No emulators were selected.
# ==============================================================================
echo "[+] DistroTailor: No emulators selected."
exit 0
`;
  }

  const selectedApps = selectedAppIds
    .map((id) => getEmulatorApp(id))
    .filter((app): app is EmulatorAppDefinition => !!app);

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
# DistroTailor: Turnkey Gaming & Retro Emulation Suite
# Automated unattended setup for ${selectedApps.length} selected emulator(s):
${selectedApps.map((a) => `# - ${a.icon} ${a.name} (${a.category})`).join('\n')}
# ==============================================================================
set -euo pipefail

# Ensure script is run with appropriate privileges
if [ "$(id -u)" -ne 0 ]; then
  echo "[-] Error: Please run this bootstrap script with sudo:"
  echo "    sudo bash bootstrap-emulators.sh"
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
echo " DistroTailor: Installing ${selectedApps.length} Retro Emulator(s)"
echo " Package Manager: $PKG_MGR | Mode: 100% Unattended"
echo "===================================================================="

# Step 1: Install Gamepad Udev Rules for Controller Hotplug
echo "[+] Step 1: Configuring gamepad udev permissions (Xbox, DualSense, 8BitDo, Switch Pro)..."
cat << 'EOF' > /etc/udev/rules.d/99-distrotailor-gamepads.rules
# Xbox 360 / Xbox One / Series X
KERNEL=="uinput", MODE="0660", GROUP="input", OPTIONS+="static_node=uinput"
KERNEL=="event*", ATTRS{idVendor}=="045e", MODE="0666"
# Sony DualShock 4 / DualSense
KERNEL=="event*", ATTRS{idVendor}=="054c", MODE="0666"
# Nintendo Switch Pro Controller
KERNEL=="event*", ATTRS{idVendor}=="057e", MODE="0666"
# 8BitDo Controllers
KERNEL=="event*", ATTRS{idVendor}=="2dc8", MODE="0666"
EOF
if command -v udevadm >/dev/null 2>&1; then
  udevadm control --reload-rules || true
  udevadm trigger || true
fi
echo "[✓] Gamepad udev rules installed."

${
  aptList.length > 0
    ? `
echo "[+] Step 2: Installing native distribution packages..."
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
`
    : ''
}

${
  flatpakList.length > 0
    ? `
echo "[+] Step 3: Preparing Flatpak universal desktop sandbox..."
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

echo "[+] Step 4: Installing emulators from Flathub..."
${flatpakList.map((fId) => `echo "[+] Installing ${fId}..."\nflatpak install -y --noninteractive flathub ${fId}`).join('\n\n')}
echo "[✓] Flatpak emulators installed successfully."
`
    : ''
}

# Step 5: Scaffolding user ROM & BIOS directories
TARGET_USER="\${SUDO_USER:-\$USER}"
TARGET_HOME=\$(getent passwd "\$TARGET_USER" 2>/dev/null | cut -d: -f6 || echo "/home/\$TARGET_USER")
if [ -d "\$TARGET_HOME" ]; then
  echo "[+] Step 5: Scaffolding ROM and BIOS directories in \$TARGET_HOME/Games/..."
  mkdir -p "\$TARGET_HOME/Games/bios" \\
           "\$TARGET_HOME/Games/roms/snes" \\
           "\$TARGET_HOME/Games/roms/genesis" \\
           "\$TARGET_HOME/Games/roms/psx" \\
           "\$TARGET_HOME/Games/roms/ps2" \\
           "\$TARGET_HOME/Games/roms/n64" \\
           "\$TARGET_HOME/Games/roms/gamecube" \\
           "\$TARGET_HOME/Games/roms/wii" \\
           "\$TARGET_HOME/Games/roms/psp" \\
           "\$TARGET_HOME/Games/roms/arcade" \\
           "\$TARGET_HOME/Games/roms/dos"
  chown -R "\$TARGET_USER:" "\$TARGET_HOME/Games" 2>/dev/null || true
  echo "[✓] Directory tree initialized: \$TARGET_HOME/Games/roms/"
fi

echo "===================================================================="
echo " [✓] DistroTailor Retro Emulation Suite Complete!"
echo " All ${selectedApps.length} emulator(s) installed and controllers configured."
echo "===================================================================="
`;
}
