import {
  BootloaderPreference,
  BootMedium,
  DesktopWorkflowStyle,
  DeploymentSite,
  DevicePassthrough,
  DistroProfile,
  DriverPhilosophy,
  FileSystemPreference,
  FirmwareMode,
  FormFactor,
  InternetUplink,
  KernelFlavor,
  NetworkingStack,
  PeripheralNeed,
  PowerSupply,
  PrimaryUseCase,
  SecureBootPolicy,
  SecurityProfile,
  TpmUsage,
  UserCriteria,
  VirtualizationHost
} from '../types.js';

/**
 * Curated distro affinities used by the matcher for criteria that cannot be derived from
 * generic DistroProfile attributes (e.g. "which distros handle drawing tablets well").
 *
 * Each criterion value maps to an ordered list of tiers. The first tier that applies to a
 * distro wins, mirroring an if / else-if chain. Positive points count as a match, negative
 * points as a mismatch. Tiers without a `feature` adjust the score silently.
 *
 * Every distroId listed here is verified against DISTRO_REGISTRY in affinities.test.ts.
 */
export interface AffinityTier {
  /** Distros this tier applies to. Omit when `appliesTo` decides instead. */
  distroIds?: readonly string[];
  /** Predicate over generic profile attributes, for tiers not tied to specific distros. */
  appliesTo?: (distro: DistroProfile, criteria: UserCriteria) => boolean;
  points: number;
  feature?: string;
  explanation?: string;
}

export type AffinityTable<K extends string> = Readonly<Record<K, readonly AffinityTier[]>>;

export function findAffinityTier(
  tiers: readonly AffinityTier[] | undefined,
  distro: DistroProfile,
  criteria: UserCriteria
): AffinityTier | undefined {
  return tiers?.find((tier) =>
    tier.distroIds ? tier.distroIds.includes(distro.id) : !!tier.appliesTo?.(distro, criteria)
  );
}

// ---------------------------------------------------------------------------
// Use-case groupings and baseline defaults
// ---------------------------------------------------------------------------

/** Use cases any general-purpose desktop distro can reasonably serve. */
export const DESKTOP_USE_CASES: readonly PrimaryUseCase[] = [
  'education-kids',
  'home-office',
  'creative-studio',
  'gaming',
  'desktop'
];

/** Use cases served by dedicated single-purpose appliances. */
export const SINGLE_PURPOSE_APPLIANCE_USE_CASES: readonly PrimaryUseCase[] = [
  'kiosk-signage',
  'router-networking',
  'smart-home',
  'media-center',
  'nas-storage',
  'hypervisor-vms',
  'k8s-cluster',
  'browser-wasm'
];

/** Mainstream desktop defaults, in preference order, used for baselines and tie-breaking. */
export const UNIVERSAL_DEFAULT_DISTRO_IDS: readonly string[] = ['linux-mint', 'ubuntu', 'fedora'];

/** Scores applied when the user supplied no criteria at all. */
export const UNCONSTRAINED_BASELINE: readonly AffinityTier[] = [
  {
    distroIds: ['linux-mint'],
    points: 100,
    feature: 'Universal Baseline',
    explanation: 'Recommended standard out-of-the-box desktop Linux for everyday PC and laptop use.'
  },
  {
    distroIds: ['ubuntu', 'fedora'],
    points: 90,
    feature: 'Universal Baseline',
    explanation: 'Leading mainstream distribution with extensive community and hardware support.'
  },
  {
    appliesTo: (d) => d.experienceLevel === 'beginner' && d.primaryUseCases.includes('desktop'),
    points: 80
  },
  { appliesTo: () => true, points: 50 }
];

/** Distros with a graphical UI even though they are not listed for the desktop/kiosk platforms. */
export const GUI_CAPABLE_DISTRO_IDS: readonly string[] = ['batocera', 'libreelec', 'raspberry-pi-os'];

export interface HardwareLock {
  /** True when the criteria name hardware this distro can actually boot on. */
  requires: (criteria: UserCriteria) => boolean;
  explanation: string;
}

/**
 * Distros that only boot on one vendor's hardware. Without matching hardware in the criteria they are
 * penalized by HARDWARE_LOCK_PENALTY, so a broad use-case match (e.g. "desktop") never surfaces them.
 */
export const HARDWARE_LOCKED_DISTROS: Readonly<Record<string, HardwareLock>> = {
  'raspberry-pi-os': {
    requires: (c) => (c.platform === 'embedded-sbc' || c.formFactor === 'sbc') && c.formFactor !== 'low-power',
    explanation: 'Only boots on Raspberry Pi boards; other ARM boards and TV boxes need Armbian or DietPi.'
  }
};

/** Larger than a full use-case match (25 + flagship bonus) so a hardware-locked distro cannot win on use case alone. */
export const HARDWARE_LOCK_PENALTY = 45;

/**
 * Specialist builds of a general distro (LibreMesh is OpenWrt for community meshes; Internet-in-a-Box
 * is Debian/Raspberry Pi OS for offline libraries). They lose SPECIALIST_PENALTY points unless the
 * user asked for their specialty, so the general distro wins otherwise-equal requests.
 */
export const SPECIALIST_DISTRO_USE_CASES: Readonly<Record<string, PrimaryUseCase>> = {
  libremesh: 'community-network',
  'internet-in-a-box': 'offline-library'
};

export const SPECIALIST_PENALTY = 5;

export interface HardwareBootSupport {
  /** True when the criteria describe an install directly on this hardware. */
  applies: (criteria: UserCriteria) => boolean;
  /** The only distros that boot on it; every other distro gets HARDWARE_LOCK_PENALTY. */
  bootableDistroIds: readonly string[];
  explanation: string;
}

/**
 * Hardware that only a few distros can boot on directly. The inverse of HARDWARE_LOCKED_DISTROS:
 * here the hardware, not the distro, is the restriction. Running in a VM on the same machine is
 * not restricted, so `applies` only matches a direct (bare-metal) install.
 */
export const HARDWARE_BOOT_SUPPORT: readonly HardwareBootSupport[] = [
  {
    // Apple M-series Macs: only Asahi's reverse-engineered drivers boot Linux natively today
    applies: (c) =>
      c.formFactor === 'mac' &&
      c.architecture === 'arm64' &&
      (c.platform === undefined || c.platform === 'bare-metal' || c.platform === 'desktop'),
    bootableDistroIds: ['asahi-linux'],
    explanation: 'Does not boot directly on Apple Silicon Macs; run it in a VM there, or install Asahi Linux.'
  }
];

// ---------------------------------------------------------------------------
// Criterion affinity tables
// ---------------------------------------------------------------------------

const offersDesktop = (d: DistroProfile) => d.platforms.includes('desktop');

export const FORM_FACTOR_AFFINITIES: AffinityTable<FormFactor> = {
  chromebook: [
    {
      distroIds: ['linux-mint', 'ubuntu', 'fedora'],
      points: 15,
      feature: 'Chromebook Support',
      explanation: 'Well-tested on Chromebooks after a firmware swap, with community scripts that fix Chromebook audio and keyboard keys.'
    },
    {
      appliesTo: (d) => d.footprint === 'full' || d.minRamMb > 2048,
      points: -10,
      feature: 'Chromebook Support',
      explanation: 'Most Chromebooks have 4 GB of RAM and small eMMC storage, which heavy systems outgrow quickly.'
    }
  ],
  handheld: [
    {
      distroIds: ['bazzite'],
      points: 15,
      feature: 'Handheld Gaming Optimization',
      explanation: 'Built specifically for Steam Deck, ROG Ally, and handheld PCs with custom TDP limiters, controller sleep/wake, and Game Mode.'
    },
    {
      distroIds: ['batocera'],
      points: 10,
      feature: 'Handheld Gaming Optimization',
      explanation: 'Controller-driven arcade interface designed for portable gaming consoles.'
    },
    {
      distroIds: ['proxmox-ve', 'talos', 'openwrt', 'opnsense', 'smartos', 'buildroot', 'cage-appliance'],
      points: -20,
      feature: 'Handheld Gaming Optimization',
      explanation: 'Server/appliance distribution lacks handheld controller support and graphical game UI.'
    }
  ],
  laptop: [
    {
      distroIds: ['fedora', 'pop-os', 'linux-mint', 'ubuntu', 'endless-os'],
      points: 15,
      feature: 'Laptop Power & Battery',
      explanation: 'First-class battery management (power-profiles-daemon), reliable Modern Standby/suspend, and automatic Wi-Fi management.'
    },
    { appliesTo: offersDesktop, points: 8 }
  ],
  desktop: [
    {
      appliesTo: offersDesktop,
      points: 15,
      feature: 'Desktop Performance',
      explanation: 'Optimized for AC wall-powered desktops with uncapped performance governors and multi-monitor setups.'
    }
  ],
  'low-power': [
    {
      distroIds: ['antix', 'dietpi', 'libreelec', 'alpine', 'freedos'],
      points: 15,
      feature: 'Low-Power Hardware',
      explanation: 'Ultra-low CPU and RAM footprint designed specifically to run smoothly on weak or low-power processors.'
    },
    {
      appliesTo: (d) => d.footprint === 'full' || d.minRamMb > 2048,
      points: -15,
      feature: 'Low-Power Hardware',
      explanation: 'Heavy desktop compositor and background services may struggle or lag on low-power processors.'
    }
  ],
  mac: [
    {
      appliesTo: (d, c) => c.architecture === 'arm64' && d.id === 'asahi-linux',
      points: 15,
      feature: 'Apple Silicon Hardware',
      explanation: 'Native upstream kernel support and reverse-engineered GPU drivers for Apple M-series chips.'
    },
    {
      // Intel Macs only: these distros cannot boot directly on Apple Silicon (see HARDWARE_BOOT_SUPPORT)
      appliesTo: (d, c) =>
        c.architecture !== 'arm64' && ['linux-mint', 'fedora', 'pop-os', 'ubuntu', 'endless-os'].includes(d.id),
      points: 15,
      feature: 'Mac Hardware Support',
      explanation: 'Includes out-of-the-box proprietary drivers for Broadcom Wi-Fi and Mac hardware quirks.'
    }
  ],
  sbc: [
    {
      distroIds: ['raspberry-pi-os', 'dietpi', 'armbian', 'postmarketos', 'alpine', 'batocera', 'libreelec'],
      points: 15,
      feature: 'Single-Board Computer',
      explanation: 'Specifically optimized for single-board ARM computers (Raspberry Pi, Rockchip, Allwinner).'
    }
  ],
  server: [
    {
      distroIds: ['proxmox-ve', 'truenas-scale', 'debian', 'ubuntu', 'talos', 'opnsense', 'smartos'],
      points: 15,
      feature: 'Server Hardware',
      explanation: 'Designed for dedicated 24/7 server hardware, IPMI remote management, and rack infrastructure.'
    }
  ]
};

export const WORKFLOW_STYLE_AFFINITIES: AffinityTable<DesktopWorkflowStyle> = {
  windows: [
    {
      distroIds: ['linux-mint', 'reactos'],
      points: 10,
      feature: 'Interface Familiarity',
      explanation: 'Provides an intuitive, familiar Windows-style layout with taskbar and start menu.'
    },
    {
      distroIds: ['fedora', 'debian', 'ubuntu-studio'],
      points: 5,
      feature: 'Interface Familiarity',
      explanation: 'Features configurable KDE Plasma or XFCE environments readily styled to a Windows layout.'
    }
  ],
  macos: [
    {
      distroIds: ['pop-os'],
      points: 10,
      feature: 'Interface Familiarity',
      explanation: 'COSMIC desktop features centered dock, top bar, spotlight launcher, and smooth trackpad navigation familiar to macOS users.'
    },
    {
      distroIds: ['fedora', 'fedora-silverblue', 'ubuntu', 'asahi-linux'],
      points: 8,
      feature: 'Interface Familiarity',
      explanation: 'GNOME desktop features macOS-style top bar, smooth multi-touch gestures, and dynamic workspaces.'
    }
  ],
  'mobile-touch': [
    {
      distroIds: ['endless-os'],
      points: 10,
      feature: 'Interface Familiarity',
      explanation: 'Clean, full-screen app grid launcher and touch-friendly design familiar to tablet, iPad, Android, and Chromebook users.'
    },
    {
      distroIds: ['postmarketos'],
      points: 8,
      feature: 'Interface Familiarity',
      explanation: 'Mobile-first Linux environment (Phosh/Plasma Mobile) tailored specifically for touchscreens and portable devices.'
    },
    {
      distroIds: ['fedora', 'fedora-silverblue', 'bazzite'],
      points: 6,
      feature: 'Interface Familiarity',
      explanation: 'Modern Wayland gestures and full-screen app grid suitable for 2-in-1 touchscreen devices.'
    }
  ],
  'traditional-compact': [
    {
      distroIds: ['antix', 'haiku'],
      points: 10,
      feature: 'Interface Familiarity',
      explanation: 'Ultra-fast, low-RAM traditional window manager interface with classic menus and minimal resource usage.'
    },
    {
      distroIds: ['debian', 'dietpi'],
      points: 6,
      feature: 'Interface Familiarity',
      explanation: 'Highly modular base easily paired with lightweight classic desktop environments.'
    }
  ],
  'no-preference': []
};

export const DRIVER_PHILOSOPHY_AFFINITIES: AffinityTable<DriverPhilosophy> = {
  'free-software-only': [
    {
      distroIds: ['debian', 'alpine', 'arch'],
      points: 10,
      feature: 'Open Source Drivers',
      explanation: 'Strictly prioritizes 100% Free/Libre open-source software and clean driver separation.'
    }
  ],
  'seamless-proprietary': [
    {
      distroIds: ['pop-os', 'ubuntu', 'linux-mint', 'ubuntu-studio', 'fedora', 'batocera'],
      points: 10,
      feature: 'Proprietary Drivers',
      explanation: 'Includes out-of-the-box proprietary drivers (NVIDIA GPUs, Broadcom Wi-Fi, media codecs).'
    }
  ],
  'no-preference': []
};

export const BOOT_MEDIUM_AFFINITIES: AffinityTable<BootMedium> = {
  'sd-card-usb': [
    {
      distroIds: ['dietpi', 'libreelec', 'batocera', 'alpine', 'antix', 'raspberry-pi-os'],
      points: 10,
      feature: 'Flash Storage',
      explanation: 'Includes RAM caching and Flash-wear reduction optimized for MicroSD cards and USB thumbdrives.'
    },
    {
      // Any distro shipping SBC images boots from SD/USB fine; partial credit keeps flash tuning from outweighing use-case fit
      appliesTo: (distro) => distro.platforms.includes('embedded-sbc'),
      points: 6,
      feature: 'Flash Storage',
      explanation: 'Ships images that boot directly from MicroSD cards or USB drives on single-board computers.'
    }
  ],
  'pxe-diskless': [
    {
      distroIds: ['talos', 'alpine', 'proxmox-ve', 'smartos'],
      points: 10,
      feature: 'Diskless Boot',
      explanation: 'Native support for diskless PXE network booting and run-from-RAM architectures.'
    }
  ],
  'nvme-ssd': [{ appliesTo: () => true, points: 8 }]
};

export const REALTIME_AUDIO_AFFINITIES: readonly AffinityTier[] = [
  {
    distroIds: ['ubuntu-studio'],
    points: 15,
    feature: 'Low-Latency Audio',
    explanation: 'Features an out-of-the-box lowlatency / realtime Linux kernel with PipeWire pro audio and JACK.'
  }
];

export const PERIPHERAL_AFFINITIES: AffinityTable<PeripheralNeed> = {
  touchscreen: [
    {
      distroIds: ['fedora', 'fedora-silverblue', 'endless-os', 'bazzite', 'postmarketos', 'ubuntu', 'asahi-linux'],
      points: 15,
      feature: 'Touch & Tablet Support',
      explanation: 'First-class Wayland touch gestures, auto-screen rotation, and integrated on-screen keyboard.'
    },
    {
      distroIds: ['antix'],
      points: -10,
      feature: 'Touch & Tablet Support',
      explanation: 'Uses traditional X11 window managers with minimal or no touch gesture support.'
    }
  ],
  'printer-scanner': [
    {
      distroIds: ['linux-mint', 'ubuntu', 'fedora'],
      points: 15,
      feature: 'Printers & Scanners',
      explanation: 'Pre-configured CUPS, automatic mDNS Bonjour discovery, and turnkey HP/Brother/Epson driver utilities.'
    },
    {
      distroIds: ['alpine', 'buildroot', 'dietpi'],
      points: -15,
      feature: 'Printers & Scanners',
      explanation: 'Minimal base system requires manual terminal setup and installation of CUPS printing daemons.'
    }
  ],
  'vr-headset': [
    {
      distroIds: ['bazzite', 'pop-os', 'arch'],
      points: 15,
      feature: 'VR & Sim Rigs',
      explanation: 'Cutting-edge Mesa Vulkan drivers, native SteamVR compatibility, Monado/Envision OpenXR runtime, and DRM direct display leasing.'
    },
    {
      distroIds: ['debian', 'antix'],
      points: -15,
      feature: 'VR & Sim Rigs',
      explanation: 'Older LTS kernel and Mesa graphics stack lack DRM leasing for modern VR headsets.'
    }
  ],
  'drawing-tablet': [
    {
      distroIds: ['ubuntu-studio', 'fedora', 'pop-os'],
      points: 15,
      feature: 'Drawing Tablets & Stylus',
      explanation: 'Pre-calibrated Wacom/Huion digitizer drivers, pressure sensitivity curves, and pen mapping tools.'
    }
  ],
  'mixed-dpi': [
    {
      distroIds: ['fedora', 'fedora-silverblue', 'bazzite', 'pop-os', 'ubuntu'],
      points: 15,
      feature: 'High-DPI & Multi-Monitor',
      explanation: 'Native Wayland per-monitor fractional scaling and independent refresh rates (prevents 4K blur).'
    }
  ],
  standard: []
};

// ---------------------------------------------------------------------------
// Low-level Systems-Engineering Affinities
// ---------------------------------------------------------------------------

export const FILESYSTEM_AFFINITIES: AffinityTable<FileSystemPreference> = {
  zfs: [
    {
      distroIds: ['truenas-scale', 'proxmox-ve', 'smartos'],
      points: 15,
      feature: 'Root Filesystem',
      explanation: 'Native ZFS root storage pool with datasets, snapshots, and RAID-Z redundancy.'
    },
    {
      distroIds: ['ubuntu', 'debian', 'arch', 'nixos'],
      points: 5,
      feature: 'Root Filesystem',
      explanation: 'Supports OpenZFS via kernel modules and zfsutils.'
    },
    {
      distroIds: ['freedos', 'openwrt', 'buildroot'],
      points: -10,
      feature: 'Root Filesystem',
      explanation: 'Does not support OpenZFS root filesystem.'
    }
  ],
  btrfs: [
    {
      distroIds: ['fedora', 'fedora-silverblue', 'bazzite', 'arch'],
      points: 15,
      feature: 'Root Filesystem',
      explanation: 'Default or native Btrfs root filesystem with transparent zstd compression and subvolume snapshots.'
    },
    {
      distroIds: ['ubuntu', 'debian', 'linux-mint'],
      points: 5,
      feature: 'Root Filesystem',
      explanation: 'Standard Linux support for Btrfs formatted partitions.'
    },
    {
      distroIds: ['freedos'],
      points: -15,
      feature: 'Root Filesystem',
      explanation: 'Incompatible with Btrfs Linux filesystem.'
    }
  ],
  f2fs: [
    {
      distroIds: ['postmarketos', 'dietpi', 'armbian'],
      points: 15,
      feature: 'Root Filesystem',
      explanation: 'Flash-Friendly File System (F2FS) optimized for flash memory, SD cards, and eMMC.'
    },
    {
      distroIds: ['freedos'],
      points: -15,
      feature: 'Root Filesystem',
      explanation: 'Incompatible with F2FS Linux filesystem.'
    }
  ],
  xfs: [
    {
      distroIds: ['fedora', 'proxmox-ve'],
      points: 12,
      feature: 'Root Filesystem',
      explanation: 'High-performance scalable XFS enterprise filesystem with parallel allocation groups.'
    },
    {
      distroIds: ['freedos'],
      points: -15,
      feature: 'Root Filesystem',
      explanation: 'Incompatible with XFS Linux filesystem.'
    }
  ],
  fat32: [
    {
      distroIds: ['freedos'],
      points: 25,
      feature: 'Root Filesystem',
      explanation: 'Native FAT32 / FAT16 MS-DOS compatible filesystem architecture.'
    },
    {
      distroIds: ['linux-mint', 'ubuntu', 'debian', 'arch', 'dietpi'],
      points: 5,
      feature: 'Root Filesystem',
      explanation: 'Standard EFI system partition and FAT32 removable drive compatibility.'
    }
  ],
  ext4: [
    {
      distroIds: ['linux-mint', 'ubuntu', 'debian', 'dietpi', 'armbian', 'arch', 'openmediavault'],
      points: 10,
      feature: 'Root Filesystem',
      explanation: 'Rock-solid standard fourth extended filesystem (ext4) with journaling.'
    },
    {
      distroIds: ['freedos'],
      points: -15,
      feature: 'Root Filesystem',
      explanation: 'Incompatible with ext4 Linux filesystem.'
    }
  ]
};

export const KERNEL_FLAVOR_AFFINITIES: AffinityTable<KernelFlavor> = {
  'realtime-rt': [
    {
      distroIds: ['ubuntu-studio'],
      points: 20,
      feature: 'Kernel Flavor',
      explanation: 'Includes pre-configured PREEMPT_RT deterministic low-latency audio/video realtime kernel.'
    },
    {
      distroIds: ['debian', 'arch', 'alpine'],
      points: 10,
      feature: 'Kernel Flavor',
      explanation: 'Provides official real-time (RT) kernel package variants.'
    },
    {
      distroIds: ['freedos', 'smartos'],
      points: -15,
      feature: 'Kernel Flavor',
      explanation: 'Non-Linux architecture without Linux PREEMPT_RT kernel.'
    }
  ],
  hardened: [
    {
      distroIds: ['alpine', 'talos'],
      points: 15,
      feature: 'Kernel Flavor',
      explanation: 'Hardened kernel build with stack-clash protection, ASLR, and minimized attack surface.'
    },
    {
      distroIds: ['arch', 'debian', 'fedora'],
      points: 8,
      feature: 'Kernel Flavor',
      explanation: 'Supports hardened kernel builds or security policies.'
    }
  ],
  'zen-liquorix': [
    {
      distroIds: ['bazzite', 'pop-os', 'arch'],
      points: 15,
      feature: 'Kernel Flavor',
      explanation: 'Zen/Liquorix scheduler tuned for desktop interactivity, high frame rates, and low-latency multitasking.'
    }
  ],
  'lts-stable': [
    {
      distroIds: ['debian', 'ubuntu', 'linux-mint', 'proxmox-ve', 'truenas-scale', 'openmediavault'],
      points: 10,
      feature: 'Kernel Flavor',
      explanation: 'Rock-solid upstream Long Term Support (LTS) kernel tree.'
    }
  ]
};

export const BOOTLOADER_AFFINITIES: AffinityTable<BootloaderPreference> = {
  'systemd-boot': [
    {
      distroIds: ['pop-os', 'arch', 'nixos'],
      points: 15,
      feature: 'Bootloader',
      explanation: 'Modern lightweight UEFI bootloader (systemd-boot) with zero configuration overhead.'
    },
    {
      distroIds: ['freedos', 'buildroot', 'openwrt'],
      points: -15,
      feature: 'Bootloader',
      explanation: 'Lacks systemd / UEFI systemd-boot support.'
    }
  ],
  'u-boot': [
    {
      distroIds: ['armbian', 'dietpi', 'postmarketos', 'buildroot'],
      points: 15,
      feature: 'Bootloader',
      explanation: 'Universal Bootloader (Das U-Boot) tailored for ARM, RISC-V, and embedded SoC hardware.'
    }
  ],
  efistub: [
    {
      distroIds: ['arch', 'alpine'],
      points: 15,
      feature: 'Bootloader',
      explanation: 'Direct UEFI EFISTUB kernel boot without intermediary bootloader stages.'
    },
    {
      distroIds: ['freedos'],
      points: -15,
      feature: 'Bootloader',
      explanation: 'Incompatible with UEFI EFISTUB booting.'
    }
  ],
  'grub-hybrid': [
    {
      distroIds: ['ubuntu', 'debian', 'linux-mint', 'fedora', 'proxmox-ve'],
      points: 10,
      feature: 'Bootloader',
      explanation: 'GRUB 2 bootloader supporting both legacy BIOS MBR and UEFI dual-booting.'
    }
  ]
};

export const SECURITY_PROFILE_AFFINITIES: AffinityTable<SecurityProfile> = {
  selinux: [
    {
      distroIds: ['fedora', 'fedora-silverblue', 'talos'],
      points: 15,
      feature: 'Security Hardening',
      explanation: 'Enforcing Security-Enhanced Linux (SELinux) Mandatory Access Control architecture.'
    },
    {
      distroIds: ['freedos', 'smartos'],
      points: -15,
      feature: 'Security Hardening',
      explanation: 'Does not support Linux SELinux MAC subsystem.'
    }
  ],
  apparmor: [
    {
      distroIds: ['ubuntu', 'linux-mint', 'debian', 'openmediavault', 'ubuntu-studio'],
      points: 15,
      feature: 'Security Hardening',
      explanation: 'AppArmor pathname-based mandatory access control profiles.'
    },
    {
      distroIds: ['freedos', 'smartos'],
      points: -15,
      feature: 'Security Hardening',
      explanation: 'Does not support Linux AppArmor MAC subsystem.'
    }
  ],
  'amnesic-ram': [
    {
      distroIds: ['tails', 'alpine'],
      points: 20,
      feature: 'Security Hardening',
      explanation: 'Runs entirely in volatile RAM disk with zero persistent traces on local storage.'
    }
  ],
  'standard-dac': [
    {
      distroIds: ['arch', 'dietpi', 'buildroot', 'armbian', 'antix'],
      points: 10,
      feature: 'Security Hardening',
      explanation: 'Standard POSIX Discretionary Access Control (users, groups, and permissions).'
    }
  ]
};

export const NETWORKING_STACK_AFFINITIES: AffinityTable<NetworkingStack> = {
  'systemd-networkd': [
    {
      distroIds: ['arch', 'nixos', 'talos', 'chainguard-distroless'],
      points: 15,
      feature: 'Networking Stack',
      explanation: 'Declarative systemd-networkd lightweight network service daemon.'
    },
    {
      distroIds: ['alpine', 'buildroot', 'freedos', 'opnsense'],
      points: -15,
      feature: 'Networking Stack',
      explanation: 'Non-systemd architecture without systemd-networkd.'
    }
  ],
  networkmanager: [
    {
      distroIds: ['linux-mint', 'ubuntu', 'fedora', 'bazzite', 'pop-os', 'ubuntu-studio', 'endless-os'],
      points: 15,
      feature: 'Networking Stack',
      explanation: 'Full-featured NetworkManager with GUI applets, Wi-Fi, VPN, and cellular modems.'
    },
    {
      distroIds: ['buildroot', 'freedos', 'openwrt'],
      points: -15,
      feature: 'Networking Stack',
      explanation: 'Minimal or non-Linux architecture without desktop NetworkManager daemon.'
    }
  ],
  'nftables-pf': [
    {
      distroIds: ['opnsense', 'openwrt', 'alpine', 'debian'],
      points: 15,
      feature: 'Networking Stack',
      explanation: 'Advanced packet filtering with nftables or BSD Packet Filter (pf).'
    }
  ],
  'busybox-minimal': [
    {
      distroIds: ['buildroot', 'dietpi', 'alpine'],
      points: 15,
      feature: 'Networking Stack',
      explanation: 'Minimal BusyBox networking utilities (ifupdown, udhcpc) with zero overhead.'
    }
  ]
};

// ---------------------------------------------------------------------------
// Firmware & Trust-Chain Affinities (scored only when explicitly selected)
// ---------------------------------------------------------------------------

export const FIRMWARE_MODE_AFFINITIES: AffinityTable<FirmwareMode> = {
  'legacy-bios': [
    {
      distroIds: ['antix', 'freedos', 'alpine', 'debian', 'linux-mint', 'ubuntu'],
      points: 15,
      feature: 'Firmware Mode',
      explanation: 'Ships images that boot on legacy BIOS / CSM (MBR) hardware as well as UEFI.'
    },
    {
      distroIds: ['bazzite', 'asahi-linux', 'postmarketos'],
      points: -15,
      feature: 'Firmware Mode',
      explanation: 'UEFI-only or non-BIOS firmware; cannot boot on legacy BIOS machines.'
    }
  ],
  uefi: [
    {
      distroIds: ['fedora', 'fedora-silverblue', 'pop-os', 'arch', 'nixos', 'bazzite', 'talos', 'ubuntu'],
      points: 10,
      feature: 'Firmware Mode',
      explanation: 'First-class native UEFI boot with GPT and an EFI System Partition.'
    },
    {
      distroIds: ['freedos', 'reactos'],
      points: -15,
      feature: 'Firmware Mode',
      explanation: 'Real-mode or legacy-oriented boot path with little or no native UEFI support.'
    }
  ]
};

export const SECURE_BOOT_AFFINITIES: AffinityTable<SecureBootPolicy> = {
  required: [
    {
      distroIds: ['ubuntu', 'ubuntu-studio', 'linux-mint', 'debian', 'fedora', 'fedora-silverblue', 'pop-os', 'bazzite', 'proxmox-ve'],
      points: 20,
      feature: 'Secure Boot',
      explanation: 'Boots out of the box with a Microsoft-signed shim and signed kernel under UEFI Secure Boot.'
    },
    {
      distroIds: ['arch', 'alpine', 'buildroot', 'openwrt', 'opnsense', 'freedos', 'haiku', 'reactos', 'antix'],
      points: -15,
      feature: 'Secure Boot',
      explanation: 'No signed shim by default; Secure Boot must be disabled or configured manually.'
    }
  ],
  'own-keys': [
    {
      distroIds: ['nixos', 'talos', 'arch'],
      points: 20,
      feature: 'Secure Boot',
      explanation: 'Supports enrolling your own keys with signed unified kernel images (lanzaboote, sbctl, Talos secure boot).'
    },
    {
      distroIds: ['freedos', 'haiku', 'reactos'],
      points: -15,
      feature: 'Secure Boot',
      explanation: 'No custom-key Secure Boot or signed kernel image workflow.'
    }
  ]
};

const TPM_AFFINITY_TIERS: readonly AffinityTier[] = [
  {
    distroIds: ['fedora', 'fedora-silverblue', 'ubuntu', 'talos', 'nixos', 'arch'],
    points: 15,
    feature: 'TPM',
    explanation: 'TPM 2.0 integration for measured boot and sealed disk keys (systemd-cryptenroll, Clevis, Talos TPM encryption).'
  },
  {
    distroIds: ['freedos', 'haiku', 'reactos'],
    points: -15,
    feature: 'TPM',
    explanation: 'No TPM 2.0 measured boot or sealed-key disk unlock support.'
  }
];

export const TPM_USAGE_AFFINITIES: AffinityTable<TpmUsage> = {
  'measured-boot': TPM_AFFINITY_TIERS,
  'disk-unlock': TPM_AFFINITY_TIERS
};

// ---------------------------------------------------------------------------
// Virtualization Host & Device Passthrough Affinities (scored only when selected)
// ---------------------------------------------------------------------------

const NON_VIRT_HOST_IDS = ['freedos', 'haiku', 'reactos'] as const;

export const VIRT_HOST_AFFINITIES: AffinityTable<VirtualizationHost> = {
  'kvm-qemu': [
    {
      distroIds: ['proxmox-ve', 'truenas-scale', 'smartos'],
      points: 20,
      feature: 'Virtualization Host',
      explanation: 'Purpose-built KVM/QEMU hypervisor host with VM management, storage and networking built in.'
    },
    {
      distroIds: ['fedora', 'ubuntu', 'debian', 'arch', 'nixos', 'pop-os', 'linux-mint', 'alpine'],
      points: 10,
      feature: 'Virtualization Host',
      explanation: 'Mainline Linux KVM with QEMU and libvirt available from the standard package repositories.'
    },
    {
      distroIds: [...NON_VIRT_HOST_IDS, 'openwrt', 'buildroot'],
      points: -15,
      feature: 'Virtualization Host',
      explanation: 'No KVM kernel support or QEMU/libvirt stack for hosting virtual machines.'
    }
  ],
  xen: [
    {
      distroIds: ['debian', 'alpine'],
      points: 15,
      feature: 'Virtualization Host',
      explanation: 'Maintained Xen dom0 packages and boot support in the official repositories.'
    },
    {
      distroIds: ['fedora', 'ubuntu', 'nixos'],
      points: 8,
      feature: 'Virtualization Host',
      explanation: 'Xen dom0 is available, though not the primary supported hypervisor path.'
    },
    {
      distroIds: [...NON_VIRT_HOST_IDS, 'openwrt', 'buildroot'],
      points: -15,
      feature: 'Virtualization Host',
      explanation: 'No Xen dom0 support.'
    }
  ],
  bhyve: [
    {
      distroIds: ['opnsense'],
      points: 15,
      feature: 'Virtualization Host',
      explanation: 'FreeBSD base includes the bhyve hypervisor and vmm kernel module.'
    },
    {
      distroIds: ['smartos'],
      points: 10,
      feature: 'Virtualization Host',
      explanation: 'illumos zones plus a bhyve brand for hardware virtual machines.'
    },
    {
      appliesTo: (d) => d.osFamily === 'linux',
      points: -10,
      feature: 'Virtualization Host',
      explanation: 'bhyve is a FreeBSD / illumos hypervisor; Linux hosts use KVM or Xen instead.'
    }
  ],
  'container-only': [
    {
      distroIds: ['talos', 'chainguard-distroless', 'alpine', 'fedora-silverblue', 'nixos'],
      points: 12,
      feature: 'Virtualization Host',
      explanation: 'Minimal or immutable base built around OCI containers without a full VM hypervisor stack.'
    }
  ]
};

const PASSTHROUGH_TIERS: readonly AffinityTier[] = [
  {
    distroIds: ['proxmox-ve', 'truenas-scale', 'fedora', 'arch', 'nixos', 'ubuntu', 'pop-os', 'debian'],
    points: 15,
    feature: 'Device Passthrough',
    explanation: 'Well-documented IOMMU / VFIO passthrough with current kernels and libvirt or Proxmox tooling.'
  },
  {
    distroIds: [...NON_VIRT_HOST_IDS, 'openwrt', 'buildroot', 'chainguard-distroless'],
    points: -15,
    feature: 'Device Passthrough',
    explanation: 'No IOMMU / VFIO device passthrough support.'
  }
];

export const DEVICE_PASSTHROUGH_AFFINITIES: AffinityTable<DevicePassthrough> = {
  'gpu-vfio': PASSTHROUGH_TIERS,
  'pci-devices': PASSTHROUGH_TIERS
};

/** Systems that keep a site working with no upstream internet. */
const OFFLINE_FIRST_DISTRO_IDS: readonly string[] = ['internet-in-a-box', 'libremesh'];

/** Off-grid and unreliable power: light systems and ones that survive sudden power loss. */
export const POWER_SUPPLY_AFFINITIES: AffinityTable<PowerSupply> = {
  mains: [],
  unreliable: [
    {
      appliesTo: (d) =>
        ['read-only-rootfs', 'stateless-ram', 'immutable-ostree'].includes(d.stateModel) || d.id === 'dietpi',
      points: 10,
      feature: 'Survives Power Cuts',
      explanation: 'Read-only, image-based, or RAM-logging system that comes back cleanly after sudden power loss.'
    }
  ],
  'solar-battery': [
    {
      appliesTo: (d) => d.footprint === 'micro' || d.footprint === 'minimal' || d.minRamMb <= 512,
      points: 10,
      feature: 'Low Power Draw',
      explanation: 'Runs on low-power hardware that a small solar panel or battery can keep running.'
    },
    {
      appliesTo: (d) => d.footprint === 'full' || d.minRamMb > 2048,
      points: -10,
      feature: 'Low Power Draw',
      explanation: 'Needs heavier hardware that drains a solar or battery supply quickly.'
    }
  ]
};

/** No or slow internet: offline-first systems and long-term releases that rarely need big updates. */
export const UPLINK_AFFINITIES: AffinityTable<InternetUplink> = {
  fast: [],
  slow: [
    {
      appliesTo: (d) => d.rollingRelease,
      points: -5,
      feature: 'Update Size',
      explanation: 'Rolling releases push large, frequent updates over a slow or metered link.'
    },
    {
      appliesTo: (d) => d.footprint === 'micro' || d.footprint === 'minimal',
      points: 5,
      feature: 'Update Size',
      explanation: 'Small system with small updates that fit a slow or metered link.'
    }
  ],
  none: [
    {
      appliesTo: (d) => OFFLINE_FIRST_DISTRO_IDS.includes(d.id),
      points: 10,
      feature: 'Offline-First',
      explanation: 'Keeps serving the local network with no upstream internet.'
    },
    {
      appliesTo: (d) => d.rollingRelease,
      points: -10,
      feature: 'Offline-First',
      explanation: 'Rolling releases expect frequent online updates; they break more easily when updates are rare.'
    }
  ]
};

/** Machines that serve others; shared with the "Where will this machine run?" question. */
export const SERVER_SITE_USE_CASES: ReadonlySet<PrimaryUseCase> = new Set<PrimaryUseCase>([
  'server',
  'game-server',
  'nas-storage',
  'smart-home',
  'hypervisor-vms',
  'k8s-cluster',
  'router-networking',
  'community-network',
  'offline-library',
  'ai-gpu-compute'
]);

const PRODUCTION_STABILITY_TIER = {
  // Servers only: a workstation at an office (e.g. a pentest laptop) may still want a rolling distro
  appliesTo: (d: DistroProfile, c: UserCriteria) =>
    d.rollingRelease && (!c.useCase || SERVER_SITE_USE_CASES.has(c.useCase)),
  points: -5,
  feature: 'Production Stability',
  explanation: 'Rolling releases need frequent hands-on updates; shared and remote sites usually run long-term releases.'
} as const;

/** Sites that serve others favour long-term releases; a home rig has no preference. */
export const DEPLOYMENT_SITE_AFFINITIES: AffinityTable<DeploymentSite> = {
  home: [],
  office: [PRODUCTION_STABILITY_TIER],
  datacenter: [PRODUCTION_STABILITY_TIER],
  community: [PRODUCTION_STABILITY_TIER]
};

/** Everyday privacy: distros with no telemetry by default and encryption offered in the installer. */
export const PRIVACY_FOCUS_AFFINITIES: readonly AffinityTier[] = [
  {
    distroIds: ['fedora', 'fedora-silverblue', 'linux-mint', 'debian'],
    points: 10,
    feature: 'Privacy by Default',
    explanation: 'No telemetry by default, full-disk encryption offered in the installer, and privacy-respecting defaults.'
  }
];
