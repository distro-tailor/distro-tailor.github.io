import { DistroProfile } from '../types.js';

export const DISTRO_REGISTRY: DistroProfile[] = [
  // --- RETRO & MODERN GAMING ---
  {
    id: 'batocera',
    name: 'Batocera.linux',
    tagline: 'Turn any old PC, laptop, or Raspberry Pi into a dedicated retro gaming console',
    description:
      'A specialized retro-gaming distribution that boots directly into EmulationStation with zero configuration. It supports hundreds of console emulators out of the box (PS1, PS2, N64, GameCube, Arcade) and can run entirely from a USB flash drive without touching your internal hard drive.',
    website: 'https://batocera.org',
    documentationUrl: 'https://wiki.batocera.org',
    logoEmoji: '🕹️',
    platforms: ['bare-metal', 'embedded-sbc'],
    architectures: ['x86_64', 'arm64', 'armv7'],
    footprint: 'lean',
    minRamMb: 1024,
    initSystems: ['busybox'],
    cLibraries: ['glibc'],
    stateModel: 'stateless-ram',
    experienceLevel: 'beginner',
    primaryUseCases: ['gaming'],
    rollingRelease: false,
    highlights: [
      'Turnkey retro console: boots straight to controller-friendly menu',
      'Supports Xbox, PlayStation, 8BitDo, and generic USB controllers out of the box',
      'Runs off a bootable USB flash drive—no hard drive partitioning required',
      'Breathes new life into obsolete PCs by turning them into arcade machines'
    ],
    tradeoffs: [
      'Dedicated gaming appliance—not meant for general desktop or web browsing'
    ],
    prebuiltImage: {
      downloadUrl: 'https://batocera.org/download'
    }
  },
  {
    id: 'libreelec',
    name: 'LibreELEC',
    tagline: 'Just enough OS for Kodi: Turn any old PC, TV box, or Raspberry Pi into a dedicated media center',
    description:
      'A purpose-built, ultra-lightweight Linux appliance designed purely to run the Kodi entertainment center on your TV. Boots in seconds directly into a 10-foot TV user interface, fully controllable by TV remotes (HDMI-CEC), gamepads, or smartphones. Hardware-accelerated 4K/1080p playback even on ancient hardware.',
    website: 'https://libreelec.tv',
    documentationUrl: 'https://wiki.libreelec.tv',
    logoEmoji: '📺',
    platforms: ['bare-metal', 'embedded-sbc'],
    architectures: ['x86_64', 'arm64', 'armv7'],
    footprint: 'minimal',
    minRamMb: 512,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'read-only-rootfs',
    experienceLevel: 'beginner',
    primaryUseCases: ['media-center'],
    rollingRelease: false,
    highlights: [
      'Turnkey living room media center: boots straight to Kodi 10-foot TV interface',
      'Supports TV remotes automatically via HDMI-CEC (no keyboard or mouse needed)',
      'Hardware-accelerated video decoding (H.264, HEVC, AV1) on low-spec hardware',
      'Read-only atomic system: impervious to accidental file deletion or kid tampering',
      'Runs effortlessly on ancient laptops, thrifted office PCs, and Raspberry Pis'
    ],
    tradeoffs: [
      'Appliance design: cannot install generic Linux desktop apps or web browsers outside Kodi add-ons'
    ],
    prebuiltImage: {
      downloadUrl: 'https://libreelec.tv/downloads/'
    }
  },
  // --- KIDS, EDUCATION & FAMILY ---
  {
    id: 'endless-os',
    name: 'Endless OS',
    tagline: 'The ultimate kid-friendly, educational operating system for school, coding, and family learning',
    description:
      'A simple, iPad-like operating system designed for children, students, and families. Features an immutable, kid-proof root filesystem that cannot be accidentally broken, built-in parental controls, and hundreds of preloaded educational apps (Scratch coding, Khan Academy, Wikipedia, GCompris math & science games, and LibreOffice) that work both online and completely offline without internet.',
    website: 'https://endlessos.org',
    documentationUrl: 'https://support.endlessos.org',
    logoEmoji: '🎓',
    platforms: ['bare-metal', 'desktop'],
    architectures: ['x86_64', 'arm64'],
    footprint: 'standard',
    minRamMb: 2048,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'immutable-ostree',
    experienceLevel: 'beginner',
    primaryUseCases: ['education-kids', 'desktop'],
    packageManager: 'flatpak',
    rollingRelease: false,
    highlights: [
      'Simple iPad-style desktop interface that any child can navigate effortlessly',
      'Kid-proof atomic filesystem: children cannot delete critical OS files or get viruses',
      'Preloaded with 100+ educational tools: Scratch coding, math games, typing, and typing tutors',
      'Massive offline encyclopedia: kids can do school research even without an internet connection',
      'Built-in parental controls and safe app ecosystem (Flatpak)'
    ],
    tradeoffs: [
      'Uses an immutable OSTree base; software installation is strictly managed through the App Center (Flatpaks)'
    ],
    prebuiltImage: {
      downloadUrl: 'https://endlessos.org/download/'
    }
  },
  {
    id: 'bazzite',
    name: 'Bazzite',
    tagline: 'The next-generation SteamOS alternative for PC gaming and handhelds',
    description:
      'An immutable gaming-focused operating system built on Fedora Atomic. Features Steam Big Picture Mode out of the box, ready-to-play Proton gaming, and pre-installed GPU drivers for NVIDIA and AMD.',
    website: 'https://bazzite.gg',
    documentationUrl: 'https://universal-blue.discourse.group/docs?topic=30',
    logoEmoji: '🎮',
    platforms: ['bare-metal', 'desktop'],
    architectures: ['x86_64'],
    footprint: 'full',
    minRamMb: 4096,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'immutable-ostree',
    experienceLevel: 'beginner',
    primaryUseCases: ['gaming', 'desktop'],
    packageManager: 'rpm-ostree / flatpak',
    rollingRelease: false,
    highlights: [
      'Console-style TV gaming experience directly from boot',
      'Flawless support for Steam Deck, ASUS ROG Ally, Lenovo Legion Go, and living room PCs',
      'Automatic HDR, GameMode, and modern GPU driver setup'
    ],
    tradeoffs: [
      'Requires modern x86_64 hardware with Vulkan-compatible GPU'
    ],
    prebuiltImage: {
      downloadUrl: 'https://bazzite.gg/#download'
    }
  },

  // --- REVIVING OBSOLETE HARDWARE ---
  {
    id: 'antix',
    name: 'antiX Linux',
    tagline: 'Ultra-lightweight lifesaver for ancient, obsolete computers',
    description:
      'A fast, lightweight, systemd-free desktop operating system designed specifically to revive old computers with as little as 256MB RAM and 15-20 year old processors that modern operating systems have abandoned.',
    website: 'https://antixlinux.com',
    documentationUrl: 'https://antixlinux.com/the-most/',
    logoEmoji: '💨',
    platforms: ['bare-metal', 'desktop'],
    architectures: ['x86_64', 'armv7'],
    footprint: 'minimal',
    minRamMb: 256,
    initSystems: ['runit', 'busybox'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'beginner',
    primaryUseCases: ['desktop'],
    packageManager: 'apt',
    rollingRelease: false,
    highlights: [
      'Runs effortlessly on ancient computers with 256MB - 512MB RAM',
      'Ultra-responsive desktop environment (IceWM/Fluxbox)',
      'Debian-compatible repository with thousands of lightweight applications'
    ],
    tradeoffs: [
      'Visual aesthetic is retro/classic rather than modern translucent eye candy'
    ],
    prebuiltImage: {
      downloadUrl: 'https://antixlinux.com/download/'
    }
  },
  {
    id: 'linux-mint',
    name: 'Linux Mint',
    tagline: 'The most welcoming, elegant desktop for Linux newcomers',
    description:
      'The gold standard distribution for people transitioning from Windows or macOS. Everything works out of the box: media codecs, office suites, web browsers, and hardware drivers with zero terminal knowledge required.',
    website: 'https://linuxmint.com',
    documentationUrl: 'https://linuxmint-user-guide.readthedocs.io',
    logoEmoji: '🍃',
    platforms: ['bare-metal', 'desktop', 'vm'],
    architectures: ['x86_64'],
    footprint: 'full',
    minRamMb: 2048,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'beginner',
    primaryUseCases: ['desktop'],
    packageManager: 'apt',
    rollingRelease: false,
    highlights: [
      'Familiar, comfortable Windows-like desktop layout (Cinnamon)',
      'One-click Software Manager app store with zero command-line needed',
      'Exceptional stability based on Ubuntu Long Term Support (LTS)'
    ],
    tradeoffs: [
      'Needs at least 2GB RAM—not suitable for ancient 512MB PCs'
    ],
    prebuiltImage: {
      downloadUrl: 'https://linuxmint.com/download.php'
    }
  },

  // --- EMBEDDED & MICROCONTROLLER ---
  {
    id: 'buildroot',
    name: 'Buildroot',
    tagline: 'Simple, efficient, and easy-to-use embedded Linux generation',
    description:
      'Buildroot is not a distribution; it is a tool that compiles a cross-compilation toolchain, a Linux kernel, and a tiny tailored root filesystem (under 10MB) for constrained embedded boards.',
    website: 'https://buildroot.org',
    documentationUrl: 'https://buildroot.org/docs.html',
    logoEmoji: '⚙️',
    platforms: ['embedded-sbc', 'microcontroller', 'router-firewall'],
    architectures: ['arm64', 'armv7', 'riscv64', 'mips', 'nommu', 'x86_64'],
    footprint: 'micro',
    minRamMb: 8,
    initSystems: ['busybox', 'systemd', 'openrc'],
    cLibraries: ['uclibc-ng', 'musl', 'glibc'],
    stateModel: 'read-only-rootfs',
    experienceLevel: 'systems-engineer',
    primaryUseCases: ['iot-embedded', 'router-networking'],
    rollingRelease: false,
    highlights: [
      'Generates root filesystems under 10MB',
      'Supports MMU-less (NOMMU) microcontrollers',
      'No package manager on target—everything is baked at compile time',
      'Fast boot times (<1 second to userspace)'
    ],
    tradeoffs: [
      'Requires compiling from source on host machine',
      'Updating software requires reflashing or custom OTA'
    ],
    recipeGeneratorId: 'buildroot-embedded'
  },
  {
    id: 'openwrt',
    name: 'OpenWrt',
    tagline: 'The premier Linux distribution for routers and embedded network devices',
    description:
      'An extensible Linux distribution targeting network routers and gateways with an ultra-lightweight web interface (LuCI) and opkg package management.',
    website: 'https://openwrt.org',
    documentationUrl: 'https://openwrt.org/docs/start',
    logoEmoji: '📡',
    platforms: ['router-firewall', 'embedded-sbc'],
    architectures: ['mips', 'arm64', 'armv7', 'x86_64', 'riscv64'],
    footprint: 'minimal',
    minRamMb: 32,
    initSystems: ['busybox'],
    cLibraries: ['musl'],
    stateModel: 'read-only-rootfs',
    experienceLevel: 'intermediate',
    primaryUseCases: ['router-networking', 'iot-embedded'],
    packageManager: 'opkg',
    rollingRelease: false,
    highlights: [
      'Comprehensive network stack (VLAN, WireGuard, firewall, mesh)',
      'Fits comfortably on 16MB SPI flash memory',
      'Web GUI (LuCI) out of the box'
    ],
    tradeoffs: [
      'Specialized for routing, not suited for general computing'
    ],
    prebuiltImage: {
      downloadUrl: 'https://firmware-selector.openwrt.org'
    }
  },
  {
    id: 'dietpi',
    name: 'DietPi',
    tagline: 'Ultra-lightweight, high-performance OS for single-board computers',
    description:
      'A heavily optimized, stripped-down Debian derivative designed to squeeze maximum performance out of Raspberry Pis and SBCs with an automated menu-driven software installer.',
    website: 'https://dietpi.com',
    documentationUrl: 'https://dietpi.com/docs/',
    logoEmoji: '🥧',
    platforms: ['embedded-sbc', 'vm', 'bare-metal'],
    architectures: ['arm64', 'armv7', 'x86_64', 'riscv64'],
    footprint: 'lean',
    minRamMb: 64,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'beginner',
    primaryUseCases: ['server', 'iot-embedded', 'kiosk-signage'],
    packageManager: 'apt',
    rollingRelease: false,
    highlights: [
      'Debian binary compatibility with 3x less RAM usage',
      'Built-in dietpi-software one-click application launcher',
      'RAM logging system reduces SD card flash wear'
    ],
    tradeoffs: [
      'Optimized for headless SBCs, not desktop gaming'
    ],
    prebuiltImage: {
      downloadUrl: 'https://dietpi.com/#download'
    }
  },

  // --- CONTAINERS & ULTRA-LEAN ---
  {
    id: 'alpine',
    name: 'Alpine Linux',
    tagline: 'Small. Simple. Secure.',
    description:
      'A security-oriented, lightweight Linux distribution based on musl libc and BusyBox. Famous as the gold standard for minimal container base images and diskless routers.',
    website: 'https://alpinelinux.org',
    documentationUrl: 'https://wiki.alpinelinux.org',
    logoEmoji: '🏔️',
    platforms: ['container', 'vm', 'bare-metal', 'kiosk', 'router-firewall'],
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    footprint: 'minimal',
    minRamMb: 64,
    initSystems: ['openrc', 'none-container', 'busybox'],
    cLibraries: ['musl'],
    stateModel: 'stateless-ram',
    experienceLevel: 'intermediate',
    primaryUseCases: ['container-base', 'server', 'kiosk-signage'],
    packageManager: 'apk',
    rollingRelease: false,
    highlights: [
      'Base container is ~5MB',
      'Can run completely out of RAM (diskless mode)',
      'Extremely fast package manager (apk)'
    ],
    tradeoffs: [
      'Uses musl libc, which can require recompilation for glibc-only binaries'
    ],
    prebuiltImage: {
      downloadUrl: 'https://alpinelinux.org/downloads/',
      dockerPull: 'docker pull alpine:latest'
    },
    recipeGeneratorId: 'alpine-chroot'
  },
  {
    id: 'chainguard-distroless',
    name: 'Chainguard / Distroless',
    tagline: 'Zero-CVE, minimal container images without shells or package managers',
    description:
      'Ultra-hardened container images containing only your application and its direct runtime dependencies—no package manager, no shell (`/bin/sh`), and virtually no attack surface.',
    website: 'https://www.chainguard.dev/chainguard-images',
    documentationUrl: 'https://edu.chainguard.dev/chainguard/chainguard-images/overview/',
    logoEmoji: '🛡️',
    platforms: ['container'],
    architectures: ['x86_64', 'arm64'],
    footprint: 'micro',
    minRamMb: 16,
    initSystems: ['none-container'],
    cLibraries: ['glibc', 'musl'],
    stateModel: 'read-only-rootfs',
    experienceLevel: 'intermediate',
    primaryUseCases: ['container-base'],
    rollingRelease: true,
    highlights: [
      'Zero unnecessary binaries (no curl, no bash, no apt)',
      'Substantially reduced CVE alerts in vulnerability scanners',
      'Compliant with federal and enterprise zero-trust mandates'
    ],
    tradeoffs: [
      'Debugging requires ephemeral debug containers since there is no shell'
    ],
    prebuiltImage: {
      downloadUrl: 'https://images.chainguard.dev',
      dockerPull: 'docker pull cgr.dev/chainguard/static:latest'
    },
    recipeGeneratorId: 'distroless-docker'
  },

  // --- IMMUTABLE & MODERN DECLARATIVE ---
  {
    id: 'talos',
    name: 'Talos Linux',
    tagline: 'The modern Linux OS for Kubernetes',
    description:
      'Talos Linux is a modern, immutable, security-focused Linux OS built from the ground up purely to run Kubernetes. It has no shell, no SSH, and is 100% managed via gRPC API and YAML configurations.',
    website: 'https://www.talos.dev',
    documentationUrl: 'https://www.talos.dev/latest/introduction/',
    logoEmoji: '☸️',
    platforms: ['k8s-node', 'bare-metal', 'vm'],
    architectures: ['x86_64', 'arm64'],
    footprint: 'lean',
    minRamMb: 1024,
    initSystems: ['custom'],
    cLibraries: ['musl'],
    stateModel: 'read-only-rootfs',
    experienceLevel: 'advanced',
    primaryUseCases: ['k8s-cluster'],
    rollingRelease: false,
    highlights: [
      'Completely immutable; ephemeral root filesystem',
      'No interactive shell or SSH daemon (immune to credential stuffing)',
      'Zero-drift Kubernetes cluster management via `talosctl`'
    ],
    tradeoffs: [
      'Exclusively for Kubernetes; cannot run general workloads directly'
    ],
    prebuiltImage: {
      downloadUrl: 'https://github.com/siderolabs/talos/releases'
    }
  },
  {
    id: 'nixos',
    name: 'NixOS',
    tagline: 'The purely functional, declarative Linux distribution',
    description:
      'NixOS is built around the Nix package manager. The entire operating system—packages, configuration files, users, and system services—is declared in a single declarative file with atomic upgrades and instant rollbacks.',
    website: 'https://nixos.org',
    documentationUrl: 'https://nixos.org/learn/',
    logoEmoji: '❄️',
    platforms: ['bare-metal', 'vm', 'desktop', 'server', 'container'],
    architectures: ['x86_64', 'arm64', 'riscv64'],
    footprint: 'standard',
    minRamMb: 2048,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'declarative',
    experienceLevel: 'advanced',
    primaryUseCases: ['server', 'desktop', 'gaming'],
    packageManager: 'nix',
    rollingRelease: false,
    highlights: [
      '100% reproducible environments across multiple machines',
      'Atomic system updates with instant bootloader rollback',
      'Largest and most up-to-date package repository in open source (nixpkgs)'
    ],
    tradeoffs: [
      'Steep learning curve due to the Nix expression language and non-FHS directory layout'
    ],
    prebuiltImage: {
      downloadUrl: 'https://nixos.org/download/'
    }
  },
  {
    id: 'fedora-silverblue',
    name: 'Fedora Silverblue / Atomic',
    tagline: 'Immutable desktop operating system powered by rpm-ostree',
    description:
      'An immutable desktop variant of Fedora where the core OS filesystem (`/usr`) is mounted read-only and version-controlled like a Git commit using rpm-ostree. Applications run inside Flatpak and Toolbx/Distrobox containers.',
    website: 'https://fedoraproject.org/atomic-desktops/silverblue/',
    documentationUrl: 'https://docs.fedoraproject.org/en-US/fedora-silverblue/',
    logoEmoji: '🔵',
    platforms: ['bare-metal', 'vm', 'desktop'],
    architectures: ['x86_64', 'arm64'],
    footprint: 'full',
    minRamMb: 4096,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'immutable-ostree',
    experienceLevel: 'intermediate',
    primaryUseCases: ['desktop', 'gaming'],
    packageManager: 'rpm-ostree / flatpak',
    rollingRelease: false,
    highlights: [
      'Root filesystem is read-only and tamper-proof',
      'Updates are staged in the background and applied atomically on next boot',
      'Containerized development via Toolbx keeps host clean'
    ],
    tradeoffs: [
      'Layering packages onto the OS requires reboots'
    ],
    prebuiltImage: {
      downloadUrl: 'https://fedoraproject.org/atomic-desktops/silverblue/download'
    }
  },

  // --- KIOSK & IN-BROWSER WASM ---
  {
    id: 'porteus-kiosk',
    name: 'Porteus Kiosk',
    tagline: 'Locked-down, lightweight web terminal for digital signage & public PCs',
    description:
      'A stripped-down Gentoo-based distribution that boots directly into an unclosable full-screen web browser (Chrome or Firefox). Every session is completely ephemeral and resets to defaults upon reboot.',
    website: 'https://porteus-kiosk.org',
    documentationUrl: 'https://porteus-kiosk.org/documentation.html',
    logoEmoji: '🖥️',
    platforms: ['kiosk', 'bare-metal', 'vm'],
    architectures: ['x86_64'],
    footprint: 'lean',
    minRamMb: 512,
    initSystems: ['busybox'],
    cLibraries: ['glibc'],
    stateModel: 'stateless-ram',
    experienceLevel: 'beginner',
    primaryUseCases: ['kiosk-signage'],
    rollingRelease: false,
    highlights: [
      'Zero maintenance: resets cache, history, and downloads on reboot',
      'Tamper-proof browser terminal preventing user escape to desktop',
      'Instant configuration wizard during first boot'
    ],
    tradeoffs: [
      'Single-purpose only (web kiosk / digital signage)'
    ],
    prebuiltImage: {
      downloadUrl: 'https://porteus-kiosk.org/download.html'
    },
    recipeGeneratorId: 'kiosk-web'
  },
  {
    id: 'webvm-v86',
    name: 'WebVM / v86 (Linux in WebAssembly)',
    tagline: 'Full Linux virtual machine running client-side inside a web browser tab',
    description:
      'Uses x86 emulation compiled to WebAssembly (v86 / CheerpOS) to run a genuine Linux kernel and userspace directly in your web browser with zero server backends.',
    website: 'https://webvm.io',
    documentationUrl: 'https://github.com/copy/v86',
    logoEmoji: '🌐',
    platforms: ['browser-wasm'],
    architectures: ['wasm32', 'x86_64'],
    footprint: 'minimal',
    minRamMb: 128,
    initSystems: ['busybox'],
    cLibraries: ['glibc', 'musl'],
    stateModel: 'stateless-ram',
    experienceLevel: 'beginner',
    primaryUseCases: ['browser-wasm'],
    rollingRelease: false,
    highlights: [
      'Zero installation: runs inside any modern browser tab',
      'Client-side sandboxing prevents any threat to host computer',
      'Instant state save and load via browser IndexedDB'
    ],
    tradeoffs: [
      'Slower execution speed than native hardware due to WASM CPU emulation'
    ],
    prebuiltImage: {
      downloadUrl: 'https://webvm.io'
    },
    recipeGeneratorId: 'wasm-browser'
  },

  // --- TRADITIONAL GENERAL PURPOSE ---
  {
    id: 'debian',
    name: 'Debian',
    tagline: 'The Universal Operating System',
    description:
      'The bedrock of the Linux world. Known for unparalleled stability, vast package repositories, strict free software guidelines, and multi-architecture hardware support.',
    website: 'https://www.debian.org',
    documentationUrl: 'https://www.debian.org/doc/',
    logoEmoji: '🌀',
    platforms: ['bare-metal', 'vm', 'server', 'desktop'],
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64', 'mips'],
    footprint: 'standard',
    minRamMb: 512,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'intermediate',
    primaryUseCases: ['server', 'desktop'],
    packageManager: 'apt',
    rollingRelease: false,
    highlights: [
      'Legendary production stability with 2-year release cadence',
      'Supports virtually every CPU architecture known',
      'Parent distribution to Ubuntu, Raspberry Pi OS, and Mint'
    ],
    tradeoffs: [
      'Software packages in the stable branch favor reliability over latest versions'
    ],
    prebuiltImage: {
      downloadUrl: 'https://www.debian.org/distrib/'
    },
    recipeGeneratorId: 'debootstrap-debian'
  },
  {
    id: 'arch',
    name: 'Arch Linux',
    tagline: 'A lightweight and flexible Linux distribution that tries to Keep It Simple',
    description:
      'A rolling-release distribution for tinkerers and power users who want complete control over every single package installed on their machine.',
    website: 'https://archlinux.org',
    documentationUrl: 'https://wiki.archlinux.org',
    logoEmoji: '🏹',
    platforms: ['bare-metal', 'vm', 'desktop'],
    architectures: ['x86_64'],
    footprint: 'lean',
    minRamMb: 1024,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'advanced',
    primaryUseCases: ['desktop', 'gaming'],
    packageManager: 'pacman',
    rollingRelease: true,
    highlights: [
      'Arch User Repository (AUR) gives access to virtually any Linux program',
      'Bleeding-edge vanilla packages directly from upstream',
      'The Arch Wiki is the most comprehensive technical Linux documentation on earth'
    ],
    tradeoffs: [
      'Manual DIY installation; user must maintain and troubleshoot package upgrades'
    ],
    prebuiltImage: {
      downloadUrl: 'https://archlinux.org/download/'
    }
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu',
    tagline: 'Enterprise open source that is easy to deploy and use',
    description:
      'The most popular desktop and cloud Linux distribution with 5-year LTS releases, commercial support from Canonical, and widespread hardware vendor certification.',
    website: 'https://ubuntu.com',
    documentationUrl: 'https://help.ubuntu.com',
    logoEmoji: '🟠',
    platforms: ['bare-metal', 'vm', 'server', 'desktop'],
    architectures: ['x86_64', 'arm64', 'riscv64'],
    footprint: 'full',
    minRamMb: 2048,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'beginner',
    primaryUseCases: ['desktop', 'server', 'gaming'],
    packageManager: 'apt / snap',
    rollingRelease: false,
    highlights: [
      'Extensive out-of-the-box driver support (NVIDIA, Wi-Fi, audio)',
      'Ubiquitous cloud support (standard AMI across AWS, GCP, Azure)',
      'Vast beginner-friendly support forums and community tutorials'
    ],
    tradeoffs: [
      'Snap package system can cause slower startup times for desktop apps'
    ],
    prebuiltImage: {
      downloadUrl: 'https://ubuntu.com/download'
    }
  }
];
