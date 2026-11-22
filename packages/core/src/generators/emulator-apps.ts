import { CpuArchitecture, EmulatorAppId, UserCriteria } from '../types.js';
import { FLATPAK_INSTALL_SNIPPET, PKG_MGR_DETECT_SCRIPT } from './pkg-manager-shell.js';

export interface EmulatorAppDefinition {
  id: EmulatorAppId;
  name: string;
  category: 'multi-system' | 'console' | 'retro-pc' | 'handheld' | 'arcade' | 'compatibility' | 'system';
  icon: string;
  description: string;
  minRamMb: number;
  architectures: CpuArchitecture[];
  aptPackages?: string[];
  flatpakId?: string;
  apkPackages?: string[];
  customInstallBash?: string;
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

  // Soft warning: Waydroid requires Wayland + kernel binder support
  if (app.id === 'waydroid') {
    if (criteria.desktopEnv === 'xfce') {
      warnings.push('Waydroid requires Wayland; on XFCE (X11), launch it inside a nested "weston" window.');
    }
    if (criteria.platform === 'wsl2') {
      warnings.push('Waydroid requires the Linux kernel binder_linux module, which is not enabled in default WSL2 kernels.');
    }
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
  {
    id: 'mednafen',
    name: 'Mednafen',
    category: 'multi-system',
    icon: '🎯',
    description: 'Low-latency multi-system emulator for Saturn, PS1, GBA, SNES, NES, and PC Engine (GPL-2.0).',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64', 'armv7'],
    aptPackages: ['mednafen']
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
    flatpakId: 'org.ppsspp.PPSSPP'
  },
  {
    id: 'mgba',
    name: 'mGBA (Game Boy Advance)',
    category: 'handheld',
    icon: '🟣',
    description: 'High-accuracy Game Boy, GBC, and GBA emulator with link cable and shader support (MPL-2.0).',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'io.mgba.mGBA'
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
  },
  {
    id: 'flycast',
    name: 'Flycast (Dreamcast/NAOMI)',
    category: 'arcade',
    icon: '🌀',
    description: 'Multi-platform Sega Dreamcast, NAOMI, and Atomiswave arcade emulator with rollback netcode (GPL-2.0).',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64'],
    flatpakId: 'org.flycast.Flycast'
  },

  // --- WINDOWS COMPATIBILITY & CROSS-ARCH SYSTEM EMULATION ---
  {
    id: 'wine',
    name: 'Wine (Windows Layer)',
    category: 'compatibility',
    icon: '🍷',
    description: 'Run Windows x86/x64 desktop applications natively on Linux without a full VM (LGPL-2.1).',
    minRamMb: 1024,
    architectures: ['x86_64'],
    aptPackages: ['wine'],
    apkPackages: ['wine']
  },
  {
    id: 'bottles',
    name: 'Bottles (Windows Apps)',
    category: 'compatibility',
    icon: '🍾',
    description: 'Sandboxed Wine prefix manager for running Windows productivity apps & installers (GPL-3.0).',
    minRamMb: 2048,
    architectures: ['x86_64'],
    flatpakId: 'com.usebottles.bottles'
  },
  {
    id: 'qemu-user',
    name: 'QEMU User-Mode (Cross-Arch)',
    category: 'system',
    icon: '🧬',
    description: 'Run ARM64, ARMv7, RISC-V, and x86_64 Linux binaries transparently across CPU architectures (GPL-2.0).',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['qemu-user-static'],
    apkPackages: ['qemu-x86_64', 'qemu-aarch64']
  },
  {
    id: 'qemu-system',
    name: 'QEMU Full System VM',
    category: 'system',
    icon: '🖥️',
    description: 'Full-system hardware emulator & KVM hypervisor for booting OS images and testing ISOs (GPL-2.0).',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64'],
    aptPackages: ['qemu-system-x86', 'qemu-utils'],
    apkPackages: ['qemu-system-x86_64', 'qemu-img']
  },
  {
    id: 'rpcs3',
    name: 'RPCS3 (PlayStation 3)',
    category: 'console',
    icon: '🕹️',
    description: 'Open-source Sony PlayStation 3 emulator & debugger; requires Vulkan GPU and user-supplied PS3 firmware.',
    minRamMb: 4096,
    architectures: ['x86_64'],
    flatpakId: 'net.rpcs3.RPCS3'
  },
  {
    id: 'waydroid',
    name: 'Waydroid (Android Apps)',
    category: 'compatibility',
    icon: '🤖',
    description: 'Container-based full Android environment on Wayland with near-native GPU performance (GPL-3.0).',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    customInstallBash: `echo "[+] Setting up Waydroid (Android on Wayland)..."
if [ "$PKG_MGR" = "apt" ]; then
  apt-get update -y && apt-get install -y --no-install-recommends curl ca-certificates lsb-release
  curl -fsSL https://repo.waydro.id/ | bash
  WAYDROID_PKG="waydroid"
  apt-get install -y --no-install-recommends "$WAYDROID_PKG"
  echo "[i] Run 'sudo waydroid init' inside a Wayland session to download the Android system image."
elif [ "$PKG_MGR" = "dnf" ]; then
  dnf install -y waydroid
elif [ "$PKG_MGR" = "pacman" ]; then
  pacman -S --noconfirm waydroid
fi`
  },
  {
    id: 'box64',
    name: 'Box64 (x86_64 on ARM64)',
    category: 'system',
    icon: '📦',
    description: 'Run x86_64 Linux programs and Wine/Steam games on 64-bit ARM boards & laptops (MIT).',
    minRamMb: 1024,
    architectures: ['arm64'],
    customInstallBash: `echo "[+] Installing Box64 (x86_64 translation for ARM64)..."
if [ "$PKG_MGR" = "apt" ]; then
  apt-get update -y && apt-get install -y --no-install-recommends wget gpg ca-certificates
  wget -qO- https://ryanfortner.github.io/box64-debs/KEY.gpg | gpg --dearmor -o /usr/share/keyrings/box64-archive-keyring.gpg
  echo "Types: deb\\nURIs: https://ryanfortner.github.io/box64-debs/debian\\nSuites: ./\\nSigned-By: /usr/share/keyrings/box64-archive-keyring.gpg" > /etc/apt/sources.list.d/box64.sources
  BOX64_PKG="box64-generic-arm"
  apt-get update -y && apt-get install -y --no-install-recommends "$BOX64_PKG"
fi`
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

${PKG_MGR_DETECT_SCRIPT}

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
${apkList.length > 0 ? `  apk update
  apk add --no-cache \\
    ${Array.from(new Set(apkList)).join(' \\\n    ')}` : '  echo "[+] No native Alpine packages required for selected emulators."'}
elif [ "$PKG_MGR" = "dnf" ]; then
  dnf install -y \\
    ${Array.from(new Set(aptList)).join(' \\\n    ')}
elif [ "$PKG_MGR" = "zypper" ]; then
  zypper --non-interactive install \\
    ${Array.from(new Set(aptList)).join(' \\\n    ')}
elif [ "$PKG_MGR" = "xbps" ]; then
  xbps-install -Sy \\
    ${Array.from(new Set(aptList)).join(' \\\n    ')}
elif [ "$PKG_MGR" = "pacman" ]; then
  pacman -S --noconfirm --needed \\
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
${FLATPAK_INSTALL_SNIPPET}

# Ensure Flathub repository is registered
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo

echo "[+] Step 4: Installing emulators from Flathub..."
${flatpakList.map((fId) => `echo "[+] Installing ${fId}..."\nflatpak install -y --noninteractive flathub ${fId}`).join('\n\n')}
echo "[✓] Flatpak emulators installed successfully."
`
    : ''
}

${
  customScripts.length > 0
    ? `
echo "[+] Installing specialized emulation runtimes..."
${customScripts.join('\n\n')}
echo "[✓] Specialized emulation runtimes installed."
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
