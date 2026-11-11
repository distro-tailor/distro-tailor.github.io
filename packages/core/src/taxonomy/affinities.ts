import {
  BootloaderPreference,
  BootMedium,
  DesktopWorkflowStyle,
  DistroProfile,
  DriverPhilosophy,
  FileSystemPreference,
  FormFactor,
  KernelFlavor,
  NetworkingStack,
  PeripheralNeed,
  PrimaryUseCase,
  SecurityProfile,
  UserCriteria
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
export const GUI_CAPABLE_DISTRO_IDS: readonly string[] = ['batocera', 'libreelec'];

// ---------------------------------------------------------------------------
// Criterion affinity tables
// ---------------------------------------------------------------------------

const offersDesktop = (d: DistroProfile) => d.platforms.includes('desktop');

export const FORM_FACTOR_AFFINITIES: AffinityTable<FormFactor> = {
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
      distroIds: ['antix', 'dietpi', 'libreelec', 'alpine', 'porteus-kiosk', 'freedos'],
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
      distroIds: ['linux-mint', 'fedora', 'pop-os', 'ubuntu', 'endless-os'],
      points: 15,
      feature: 'Mac Hardware Support',
      explanation: 'Includes out-of-the-box proprietary drivers for Broadcom Wi-Fi and Mac hardware quirks.'
    }
  ],
  sbc: [
    {
      distroIds: ['dietpi', 'armbian', 'postmarketos', 'alpine', 'batocera', 'libreelec'],
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
      distroIds: ['pop-os', 'linux-mint', 'ubuntu-studio', 'fedora', 'batocera'],
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
      distroIds: ['dietpi', 'libreelec', 'batocera', 'alpine', 'antix'],
      points: 10,
      feature: 'Flash Storage',
      explanation: 'Includes RAM caching and Flash-wear reduction optimized for MicroSD cards and USB thumbdrives.'
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
      distroIds: ['porteus-kiosk', 'alpine'],
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
