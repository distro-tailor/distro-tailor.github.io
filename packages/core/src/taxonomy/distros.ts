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
    alternativeComparisons: [
      {
        popularAlternative: 'RetroPie / Raspberry Pi OS',
        relation: 'competitor',
        headline: 'Why Batocera instead of RetroPie?',
        whyThisInstead:
          'Batocera is a 100% turnkey, bootable firmware appliance that boots straight into a controller-driven UI with hundreds of emulators pre-configured. RetroPie requires manually configuring a base Debian / Raspberry Pi OS first and manual controller script mapping.',
        tradeoffNotice:
          'RetroPie runs on top of a standard Raspberry Pi desktop OS, allowing users to exit to a shell and run arbitrary background utilities.'
      }
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
    alternativeComparisons: [
      {
        popularAlternative: 'Android TV / Fire TV Stick',
        relation: 'competitor',
        headline: 'Why LibreELEC instead of an Android TV or Fire Stick?',
        whyThisInstead:
          'Zero ads, zero corporate tracking telemetry, and boots in under 3 seconds directly into Kodi. Works with standard TV remotes over HDMI-CEC and effortlessly plays local 4K HDR video files over home Samba/NFS shares without hardware lag.',
        tradeoffNotice:
          'Cannot run proprietary DRM-heavy mobile apps like native Netflix or Disney+ apps without third-party Kodi community add-ons.'
      }
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
  // --- HOME NAS & FAMILY BACKUPS ---
  {
    id: 'openmediavault',
    name: 'OpenMediaVault (OMV)',
    tagline: 'Turn any old PC into a private home NAS for phone photo backups, media, and shared family storage',
    description:
      'A Debian-based turnkey Network Attached Storage (NAS) operating system that lets families ditch iCloud and Google Photos monthly storage fees. Controlled entirely through a clean web browser interface with 1-click support for phone photo & video auto-backup (Immich/Nextcloud), Mac Time Machine, Windows file shares (SMB/CIFS), and disk health monitoring.',
    website: 'https://www.openmediavault.org',
    documentationUrl: 'https://docs.openmediavault.org',
    logoEmoji: '📦',
    platforms: ['bare-metal', 'embedded-sbc', 'server'],
    architectures: ['x86_64', 'arm64'],
    footprint: 'lean',
    minRamMb: 1024,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'beginner',
    primaryUseCases: ['nas-storage', 'server'],
    packageManager: 'apt',
    rollingRelease: false,
    highlights: [
      'Simple web browser dashboard: manage family storage from your phone or laptop with no Linux commands',
      'Auto-backup photos and videos from iPhones and Androids (replaces iCloud & Google Photos)',
      'Automated background backups for Mac (Time Machine) and Windows laptops',
      'Shared family drive: easily access photos, movies, and documents from any device in the home',
      'Lightweight Debian core: runs smoothly on 10-15 year old computers with as little as 1GB RAM'
    ],
    tradeoffs: [
      'Headless server design: managed through your web browser, not a desktop monitor UI'
    ],
    prebuiltImage: {
      downloadUrl: 'https://www.openmediavault.org/?page_id=77'
    }
  },
  // --- SMART HOME AUTOMATION ---
  {
    id: 'home-assistant-os',
    name: 'Home Assistant OS (HAOS)',
    tagline: 'Dedicated, privacy-first local smart home hub OS with zero cloud subscriptions',
    description:
      'An all-in-one, turnkey operating system built specifically to turn a Raspberry Pi, mini PC, or VM into a private smart home automation hub. Runs Home Assistant Core, Supervisor, and hundreds of local add-ons (Zigbee2MQTT, ESPHome, Frigate NVR, Node-RED, Matter/Thread) with atomic dual-boot A/B updates, plug-and-play USB dongle pass-through, and web dashboard configuration accessible from any phone or browser.',
    website: 'https://www.home-assistant.io',
    documentationUrl: 'https://www.home-assistant.io/installation/',
    logoEmoji: '🏡',
    platforms: ['embedded-sbc', 'bare-metal', 'vm'],
    architectures: ['arm64', 'x86_64', 'armv7'],
    footprint: 'lean',
    minRamMb: 1024,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'read-only-rootfs',
    experienceLevel: 'beginner',
    primaryUseCases: ['smart-home', 'iot-embedded', 'server'],
    packageManager: 'Docker / Add-on Store',
    rollingRelease: false,
    highlights: [
      '100% private local control: automations run instantly even if your home internet is down',
      'Integrates with 2,500+ device brands: Philips Hue, IKEA, Matter, Zigbee, Z-Wave, ESP32, Apple HomeKit',
      'Turnkey web & mobile dashboard ready out of the box at homeassistant.local:8123',
      'Atomic dual-rootfs A/B updates with automatic rollback if a system update ever fails'
    ],
    tradeoffs: [
      'Locked-down appliance: designed exclusively for home automation, not general-purpose computing',
      'Requires dedicated hardware (Raspberry Pi 4/5, Intel NUC / Mini PC, or Proxmox VM)'
    ],
    prebuiltImage: {
      downloadUrl: 'https://www.home-assistant.io/installation/'
    }
  },
  // --- HOMELAB & ENTERPRISE RACK VIRTUALIZATION ---
  {
    id: 'proxmox-ve',
    name: 'Proxmox Virtual Environment (PVE)',
    tagline: 'Enterprise Type-1 Hypervisor (KVM + LXC) with web GUI, ZFS, and cluster management',
    description:
      'The undisputed champion for repurposed enterprise server racks (Dell PowerEdge, HP ProLiant, Supermicro) and homelab servers. Combines enterprise KVM virtualization and lightweight LXC containers on a solid Debian base. Includes native OpenZFS storage pools, software-defined Ceph clustering, live VM migration, automated backups, and complete hardware monitoring accessible via a slick web dashboard.',
    website: 'https://www.proxmox.com/en/proxmox-virtual-environment',
    documentationUrl: 'https://pve.proxmox.com/pve-docs/',
    logoEmoji: '🖧',
    platforms: ['bare-metal', 'server'],
    architectures: ['x86_64'],
    footprint: 'standard',
    minRamMb: 2048,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'intermediate',
    primaryUseCases: ['hypervisor-vms', 'server'],
    packageManager: 'apt (Debian)',
    rollingRelease: false,
    highlights: [
      'Type-1 Bare-Metal Hypervisor: Run dozens of Linux & Windows VMs and lightweight LXC containers simultaneously',
      'Native OpenZFS & Ceph integration: Built-in support for multi-drive SAS/SATA backplanes and software RAID',
      'Multi-Node High Availability: Group multiple cheap Craigslist rack servers into a unified cluster with live VM migration',
      'Enterprise Hardware Support: Out-of-the-box drivers for Dell PERC/HBA, HP SmartArray, 10GbE SFP+ NICs, and IPMI monitoring',
      'Browser Web GUI: Full graphical management console with web-based VNC/SPICE consoles and backup scheduling'
    ],
    tradeoffs: [
      'Headless hypervisor: Designed to run without a local desktop monitor; managed entirely through the web network port',
      'Noisy fan curve tuning: Enterprise rack fans can be loud in a home room until tuned via ipmitool BMC scripts'
    ],
    prebuiltImage: {
      downloadUrl: 'https://www.proxmox.com/en/downloads/proxmox-virtual-environment/iso'
    }
  },
  {
    id: 'truenas-scale',
    name: 'TrueNAS SCALE',
    tagline: 'Enterprise OpenZFS storage appliance and Docker/K8s application host on Debian',
    description:
      'The premier open-source network-attached storage (NAS) and storage area network (SAN) operating system for multi-drive chassis and rack servers. Built on Debian Linux, it pairs bulletproof OpenZFS with a polished web GUI for RAID-Z disk arrays, snapshots, cloud sync, SMB/NFS file shares, and containerized homelab apps.',
    website: 'https://www.truenas.com/truenas-scale/',
    documentationUrl: 'https://www.truenas.com/docs/scale/',
    logoEmoji: '🦈',
    platforms: ['bare-metal', 'server'],
    architectures: ['x86_64'],
    footprint: 'full',
    minRamMb: 8192,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'read-only-rootfs',
    experienceLevel: 'beginner',
    primaryUseCases: ['nas-storage', 'server'],
    packageManager: 'TrueNAS Catalog / Docker',
    rollingRelease: false,
    highlights: [
      'Bulletproof OpenZFS: RAID-Z1/Z2/Z3 protects petabytes of data against silent bit rot and multi-drive hardware failures',
      'Enterprise Chassis Management: Graphical disk visualization for 8 to 36-bay hot-swap SAS/SATA backplanes',
      'One-Click Homelab Apps: Deploy Nextcloud, Plex, Jellyfin, Immich, and Tailscale directly from the integrated catalog',
      'High-Speed Networking: Native support for dual 10GbE/25GbE/40GbE SFP+ optical NICs and iSCSI block storage'
    ],
    tradeoffs: [
      'Memory Intensive: ZFS Adaptive Replacement Cache (ARC) works best with at least 8GB to 16GB+ of ECC RAM',
      'Dedicated Appliance: Operating system rootfs is locked down; all user workloads run inside isolated containers'
    ],
    prebuiltImage: {
      downloadUrl: 'https://www.truenas.com/download-truenas-scale/'
    }
  },
  {
    id: 'smartos',
    name: 'SmartOS',
    osFamily: 'independent',
    kernelModel: 'illumos',
    tagline: 'Converged stateless hypervisor combining Solaris Zones, KVM/bhyve, and native OpenZFS',
    description:
      'A specialized, stateless type-1 hypervisor derived from OpenSolaris and Illumos. Boots entirely into RAM from USB or PXE, combining enterprise OpenZFS storage, DTrace kernel tracing, Crossbow network virtualization, and ultra-secure lightweight Solaris Zones.',
    website: 'https://www.smartos.org',
    documentationUrl: 'https://docs.smartos.org',
    logoEmoji: '☀️',
    platforms: ['server', 'bare-metal'],
    architectures: ['x86_64'],
    footprint: 'standard',
    minRamMb: 4096,
    initSystems: ['custom'],
    cLibraries: ['none'],
    stateModel: 'stateless-ram',
    experienceLevel: 'systems-engineer',
    primaryUseCases: ['hypervisor-vms', 'server', 'container-base'],
    packageManager: 'pkgsrc',
    rollingRelease: false,
    highlights: [
      'Stateless RAM boot architecture: pristine immutable OS boots fresh from USB/PXE every time',
      'Solaris Zones: zero-overhead operating-system-level virtualization older and more secure than Docker',
      'First-class upstream OpenZFS with integrated ARC cache, snapshots, and replication',
      'Crossbow network virtualization: create virtual switches, VNICs, and bandwidth-capped VLANs dynamically',
      'Deep dynamic kernel tracing via DTrace for real-time latency and syscall diagnostics'
    ],
    tradeoffs: [
      'Strictly headless server and hypervisor: no local desktop environment or graphical display server',
      'Illumos kernel requires enterprise server hardware with Intel VT-x/AMD-V and supported NICs'
    ],
    alternativeComparisons: [
      {
        popularAlternative: 'Proxmox VE',
        relation: 'competitor',
        headline: 'Why SmartOS instead of Proxmox VE for Hypervisors?',
        whyThisInstead:
          'SmartOS boots completely into RAM as an immutable hypervisor, meaning host disk failure never corrupts the base OS. Its Solaris Zones offer hardware-level multi-tenant security isolation superior to Linux LXC containers.',
        tradeoffNotice:
          'Proxmox VE has a much friendlier consumer Web GUI, broader consumer PC hardware support, and a massive community.'
      },
      {
        popularAlternative: 'Oracle Solaris',
        relation: 'upstream',
        headline: 'Why SmartOS instead of Oracle Solaris?',
        whyThisInstead:
          'SmartOS is 100% open-source community Illumos software with zero Oracle licensing fees, combined with modern bhyve/KVM virtualization and Triton datacenter orchestration.',
        tradeoffNotice:
          'Oracle Solaris retains enterprise support contracts for legacy SPARC server hardware.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://smartos.org/install-smartos/'
    }
  },
  // --- APPLE SILICON & ARM64 LAPTOPS ---
  {
    id: 'asahi-linux',
    name: 'Fedora Asahi Remix (Apple Silicon)',
    tagline: 'Native bare-metal Linux for Apple Silicon (M1/M2/M3/M4) with conformant Rust GPU drivers',
    description:
      'The premier Linux distribution for Apple Silicon MacBooks (Air/Pro), Mac Mini, and Mac Studio. A collaboration between the Asahi Linux reverse-engineering team and the Fedora Project, featuring custom Apple M-series kernel patches, m1n1 bootloader, open-source Rust OpenGL 4.6 & Vulkan 1.3 GPU drivers, and calibrated speaker DSP protection.',
    website: 'https://asahilinux.org',
    documentationUrl: 'https://docs.fedoraproject.org/en-US/fedora-asahi-remix/',
    logoEmoji: '🍎',
    platforms: ['bare-metal', 'desktop'],
    architectures: ['arm64'],
    footprint: 'full',
    minRamMb: 4096,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'intermediate',
    primaryUseCases: ['desktop', 'gaming'],
    packageManager: 'dnf / Flatpak',
    rollingRelease: false,
    highlights: [
      'Native Apple Silicon execution: Runs bare-metal on M1, M2, M3 hardware with zero virtualization overhead',
      'Open-source Rust GPU drivers: Fully conformant Vulkan 1.3 and OpenGL 4.6 drivers reverse-engineered for Apple AGX silicon',
      'Calibrated Audio DSP: Built-in speaker equalization and software limiters preventing physical damage to Mac tweeters',
      'Safe APFS Coexistence: Dual-boots alongside macOS without breaking Apple recovery partition or FileVault'
    ],
    tradeoffs: [
      'Hardware specific: Strictly built for Apple Silicon ARM Macs (not for standard x86 PCs or Raspberry Pi)',
      'Evolving hardware support: Newer chips (M3 Max / M4) may have experimental external display or webcam features'
    ],
    prebuiltImage: {
      downloadUrl: 'https://fedora-asahi-remix.org'
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
  // --- GPU WORKSTATIONS, AI & DATA SCIENCE ---
  {
    id: 'pop-os',
    name: 'Pop!_OS (System76)',
    tagline: 'The premier Linux workstation OS for AI, machine learning, and GPU compute',
    description:
      'Developed by System76, Pop!_OS features dedicated out-of-the-box NVIDIA ISOs with pre-baked GPU drivers, CUDA/cuDNN support, and seamless hybrid graphics switching. The standard choice for data scientists, ML engineers, and local AI development (PyTorch, TensorFlow, Ollama, Stable Diffusion) without DKMS or driver breakage.',
    website: 'https://pop.system76.com',
    documentationUrl: 'https://support.system76.com',
    logoEmoji: '🧠',
    platforms: ['bare-metal', 'desktop'],
    architectures: ['x86_64'],
    footprint: 'full',
    minRamMb: 4096,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'beginner',
    primaryUseCases: ['ai-gpu-compute', 'desktop', 'gaming'],
    packageManager: 'apt / flatpak',
    rollingRelease: false,
    highlights: [
      'Dedicated NVIDIA ISO: GPU drivers and CUDA kernel modules pre-compiled out of the box',
      'Zero-friction PyTorch & TensorFlow: apt install pytorch-cuda without driver version mismatch',
      'System76 Power management: 1-click switching between Integrated, Hybrid, and Dedicated GPU',
      'Auto-tiling COSMIC desktop window manager for efficient multi-monitor data workflows'
    ],
    tradeoffs: [
      'Heavier workstation footprint (~4GB ISO, requires 4GB+ RAM and dedicated disk space)'
    ],
    alternativeComparisons: [
      {
        popularAlternative: 'Vanilla Ubuntu',
        relation: 'fork',
        headline: 'Why Pop!_OS instead of Vanilla Ubuntu for AI & Gaming?',
        whyThisInstead:
          'Pop!_OS ships dedicated NVIDIA ISOs with pre-compiled proprietary GPU drivers and CUDA kernel modules. It provides seamless hybrid graphics switching for laptops, native COSMIC window auto-tiling, and Flatpaks out of the box without Canonical\'s slow Snap sandboxing.',
        tradeoffNotice:
          'Vanilla Ubuntu has broader enterprise hardware certification from commercial OEMs like Dell and Lenovo.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://pop.system76.com'
    }
  },
  // --- MULTI-GPU MINING & DISTRIBUTED COMPUTE ---
  {
    id: 'hiveos',
    name: 'HiveOS',
    tagline: 'Dedicated Linux management platform for multi-GPU mining rigs and distributed compute',
    description:
      'An Ubuntu-based, headless Linux operating system engineered specifically for multi-GPU crypto mining and GPU compute rigs. Features a centralized web/mobile dashboard, automated GPU overclocking/undervolting profiles, hardware watchdog rebooting, thermal throttling management, and remote bulk rig flashing from USB/SSD.',
    website: 'https://hiveon.com/os/',
    documentationUrl: 'https://hiveon.com/knowledge-base/',
    logoEmoji: '⛏️',
    platforms: ['bare-metal', 'server'],
    architectures: ['x86_64'],
    footprint: 'lean',
    minRamMb: 4096,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'beginner',
    primaryUseCases: ['ai-gpu-compute', 'server'],
    packageManager: 'apt',
    rollingRelease: false,
    highlights: [
      'Multi-GPU plug-and-play: auto-detects up to 12+ mixed NVIDIA and AMD GPUs per motherboard',
      'Web & mobile app telemetry: real-time hashrate, wattage, fan speeds, and core/memory clocks',
      'Built-in hardware watchdog: automatically restarts miner or reboots OS if a GPU hangs',
      'Individual VRAM/core clock tuning to maximize efficiency and minimize electricity draw'
    ],
    tradeoffs: [
      'Specialized utility OS: intended strictly for headless GPU compute and crypto mining'
    ],
    prebuiltImage: {
      downloadUrl: 'https://hiveon.com/install/'
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
    alternativeComparisons: [
      {
        popularAlternative: 'Lubuntu / Puppy Linux',
        relation: 'competitor',
        headline: 'Why antiX Linux instead of Lubuntu or Puppy Linux?',
        whyThisInstead:
          'antiX is completely systemd-free and idles below 80MB of RAM, making 15-to-20-year-old laptops with 512MB-1GB of RAM snappy and responsive. Unlike Puppy Linux, antiX provides a standard multi-user Debian apt repository base.',
        tradeoffNotice:
          'Lubuntu provides a more modern Qt/LXQt graphical interface with standard systemd services.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://antixlinux.com/download/'
    }
  },
  {
    id: 'freedos',
    name: 'FreeDOS',
    osFamily: 'independent',
    kernelModel: 'realmode-dos',
    tagline: 'Complete, open-source MS-DOS compatible operating system for legacy hardware and retro gaming',
    description:
      'A 100% open-source, GPL-compatible DOS operating system capable of running classic 16-bit real-mode software, vintage PC games, and industrial hardware controllers directly on bare metal with virtually zero memory overhead.',
    website: 'https://www.freedos.org',
    documentationUrl: 'https://www.freedos.org/help/',
    logoEmoji: '💾',
    platforms: ['bare-metal', 'vm'],
    architectures: ['x86_64'],
    footprint: 'micro',
    minRamMb: 2,
    initSystems: ['custom'],
    cLibraries: ['none'],
    stateModel: 'mutable',
    experienceLevel: 'intermediate',
    primaryUseCases: ['appliance-product', 'gaming'],
    rollingRelease: false,
    highlights: [
      'Boots in under 1 second and runs comfortably in 2MB RAM (640KB conventional memory)',
      '100% binary compatibility with classic MS-DOS software and 16-bit real-mode DOS games',
      'Perfect for reviving vintage 386/486/Pentium PCs or industrial CNC controllers',
      'Free and open source under the GNU GPL with a comprehensive package repository'
    ],
    tradeoffs: [
      '16-bit real-mode OS without memory protection, modern multi-core multitasking, or native modern Wi-Fi',
      'Cannot run modern 64-bit Linux GUI applications or modern web browsers'
    ],
    alternativeComparisons: [
      {
        popularAlternative: 'MS-DOS',
        relation: 'upstream',
        headline: 'Why FreeDOS instead of MS-DOS?',
        whyThisInstead:
          'FreeDOS is 100% free and open-source (GPL) with modern FAT32 large-disk support, CD/DVD drivers, and active community maintenance, whereas MS-DOS is obsolete proprietary software locked to FAT16.',
        tradeoffNotice:
          'A tiny fraction of highly timing-sensitive 1980s copy-protected PC booter games expect original IBM BIOS timings.'
      },
      {
        popularAlternative: 'Batocera / DOSBox',
        relation: 'competitor',
        headline: 'Why FreeDOS instead of Batocera or DOSBox?',
        whyThisInstead:
          'FreeDOS runs natively on bare-metal vintage x86 hardware without emulator CPU overhead or input lag, making it the ideal OS for physical vintage rigs and industrial machinery.',
        tradeoffNotice:
          'On modern multi-core PCs with HDMI displays and USB controllers, Batocera or DOSBox provides convenient gamepad mapping and graphic shaders.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://www.freedos.org/download/'
    }
  },
  {
    id: 'reactos',
    name: 'ReactOS',
    osFamily: 'independent',
    kernelModel: 'hybrid-nt',
    tagline: 'Open-source clean-room reimplementation of the Windows NT architecture',
    description:
      'A free, open-source operating system written from scratch to be binary-compatible with Microsoft Windows NT/2000/XP applications and device drivers, running Win32 software natively on bare metal without a Windows license.',
    website: 'https://reactos.org',
    documentationUrl: 'https://reactos.org/wiki',
    logoEmoji: '⚛️',
    platforms: ['bare-metal', 'desktop', 'vm'],
    architectures: ['x86_64'],
    footprint: 'lean',
    minRamMb: 256,
    initSystems: ['custom'],
    cLibraries: ['none'],
    stateModel: 'mutable',
    experienceLevel: 'intermediate',
    primaryUseCases: ['appliance-product', 'desktop'],
    packageManager: 'ReactOS Applications Manager (RAPPS)',
    rollingRelease: false,
    highlights: [
      'Clean-room open-source Windows NT kernel, HAL, Win32k subsystem, and Explorer shell',
      'Native compatibility with thousands of 32-bit Windows XP/2000 applications and drivers',
      'Runs comfortably on ancient hardware with just 256MB–512MB RAM',
      'Zero Microsoft proprietary code or telemetry—100% open source under GPL/LGPL'
    ],
    tradeoffs: [
      'Alpha-stage software: not yet recommended for mission-critical daily production or modern web banking',
      'Lacks support for modern 64-bit DirectX 12 AAA games and Windows 10/11-only applications'
    ],
    alternativeComparisons: [
      {
        popularAlternative: 'Windows XP / 7',
        relation: 'upstream',
        headline: 'Why ReactOS instead of legacy Windows XP or 7?',
        whyThisInstead:
          'ReactOS is 100% free and open-source with no license keys, activation, or telemetry. It allows keeping legacy Win32 control software and industrial equipment running legally without unpatched security risks of abandoned proprietary Windows.',
        tradeoffNotice:
          'Proprietary Windows XP has 100% complete hardware driver compatibility on period-accurate PCs.'
      },
      {
        popularAlternative: 'Linux + Wine',
        relation: 'competitor',
        headline: 'Why ReactOS instead of Linux with Wine?',
        whyThisInstead:
          'ReactOS runs Windows NT kernel-mode drivers (.sys) natively on bare metal, allowing proprietary hardware interfaces (automotive OBD scanners, legacy serial/parallel instruments) that user-space Wine on Linux cannot drive.',
        tradeoffNotice:
          'Modern Linux with Wine/Proton offers superior stability and performance for modern desktop apps and web browsing.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://reactos.org/download/'
    }
  },
  {
    id: 'haiku',
    name: 'Haiku',
    osFamily: 'independent',
    kernelModel: 'beos-modular',
    tagline: 'Fast, responsive personal desktop operating system inspired by BeOS',
    description:
      'A completely independent, open-source personal computer operating system built from the ground up for desktop responsiveness. Features per-thread multithreading, modular C++ architecture, an indexed database filesystem (BFS), and boots to a full desktop in under 3 seconds.',
    website: 'https://www.haiku-os.org',
    documentationUrl: 'https://www.haiku-os.org/docs/',
    logoEmoji: '⚡',
    platforms: ['bare-metal', 'desktop', 'vm'],
    architectures: ['x86_64'],
    footprint: 'lean',
    minRamMb: 1024,
    initSystems: ['custom'],
    cLibraries: ['none'],
    stateModel: 'mutable',
    experienceLevel: 'intermediate',
    primaryUseCases: ['desktop'],
    packageManager: 'pkgman',
    rollingRelease: false,
    highlights: [
      'Blazing desktop responsiveness: per-thread preemptive multitasking ensures the UI never stutters',
      'Database-backed OpenBFS filesystem allows tagging, querying, and instant indexing of file attributes',
      'Boots into a full graphical desktop in under 3 seconds on older PCs or laptops',
      'Cohesive native C++ API: consistent UI and zero bloat compared to modern heavy web-wrapped desktop apps'
    ],
    tradeoffs: [
      'Independent OS ecosystem: cannot run native Linux binaries directly (uses ports or native apps)',
      'Hardware Wi-Fi and modern GPU acceleration drivers are more limited than standard Linux'
    ],
    alternativeComparisons: [
      {
        popularAlternative: 'BeOS',
        relation: 'upstream',
        headline: 'Why Haiku instead of BeOS?',
        whyThisInstead:
          'Haiku is a modern, 100% open-source (MIT licensed) continuation of the BeOS dream, updated for 64-bit multi-core CPUs, modern WebKit browsing, and active community package management.',
        tradeoffNotice:
          'Original BeOS R5 runs only on vintage 1990s hardware.'
      },
      {
        popularAlternative: 'Lubuntu / Xubuntu',
        relation: 'competitor',
        headline: 'Why Haiku instead of a lightweight Linux desktop?',
        whyThisInstead:
          'Haiku is not Linux with a lightweight window manager slapped on top; it was architected from the kernel up purely for personal desktop computing with unified C++ APIs and zero Unix multi-user overhead.',
        tradeoffNotice:
          'Lightweight Linux distros have vastly wider hardware compatibility, Wi-Fi drivers, and can run Google Chrome, Steam, and Spotify.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://www.haiku-os.org/get-haiku/'
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
    primaryUseCases: ['home-office', 'desktop'],
    packageManager: 'apt',
    rollingRelease: false,
    highlights: [
      'Familiar, comfortable Windows-like desktop layout (Cinnamon)',
      'Turnkey LibreOffice & Microsoft 365 compatibility: pre-installed office suite, PDF tools, and printer/scanner drivers',
      'Timeshift snapshot restore: complete peace of mind with automatic system snapshots that undo mistakes in one click',
      'One-click Software Manager app store with zero command-line needed',
      'Exceptional stability based on Ubuntu Long Term Support (LTS)'
    ],
    tradeoffs: [
      'Needs at least 2GB RAM—not suitable for ancient 512MB PCs'
    ],
    alternativeComparisons: [
      {
        popularAlternative: 'Vanilla Ubuntu',
        relation: 'fork',
        headline: 'Why Linux Mint instead of Vanilla Ubuntu for Home / Office?',
        whyThisInstead:
          'Mint is built on Ubuntu\'s rock-solid LTS base, but removes Canonical\'s slow Snap desktop packages in favor of fast native .debs and Flatpaks. It provides a familiar Windows-like Cinnamon desktop with zero Ubuntu Pro subscription upsells and includes pre-installed media codecs and Timeshift system rollbacks.',
        tradeoffNotice:
          'Vanilla Ubuntu offers 10-year commercial SLA phone support contracts from Canonical for enterprise corporate fleets.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://linuxmint.com/download.php'
    }
  },
  // --- FREELANCER WORKSTATIONS & CREATIVE PROS ---
  {
    id: 'fedora',
    name: 'Fedora Workstation',
    tagline: 'Leading-edge, rock-solid Linux desktop for developers, freelancers, and creative pros',
    description:
      'The premier Linux workstation for professional creators, developers, and remote knowledge workers. Featuring an unadulterated GNOME desktop, industry-leading Wayland fractional scaling, PipeWire pro-audio routing, Flatpak sandboxing, and modern developer toolchains. Linus Torvalds personal daily driver.',
    website: 'https://fedoraproject.org/workstation/',
    documentationUrl: 'https://docs.fedoraproject.org/en-US/fedora/latest/',
    logoEmoji: '🎩',
    platforms: ['bare-metal', 'desktop', 'vm'],
    architectures: ['x86_64', 'arm64'],
    footprint: 'full',
    minRamMb: 2048,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'intermediate',
    primaryUseCases: ['home-office', 'desktop', 'creative-studio'],
    packageManager: 'dnf / Flatpak',
    rollingRelease: false,
    highlights: [
      'Polished GNOME Wayland desktop: Smooth fractional scaling for 4K displays and multi-monitor setups',
      'First-class developer toolchains: Native Podman, Toolbx, Rust, Node.js, and Python with zero friction',
      'PipeWire audio & Wayland color management: Color-calibrated display profiles for graphic design and photography',
      'Enterprise-grade security: SELinux enabled out of the box with Flatpak application sandboxing'
    ],
    tradeoffs: [
      'Rapid 6-month release cadence requires upgrading versions every 6–13 months',
      'Requires enabling third-party RPM Fusion repository for proprietary NVIDIA drivers and patent-encumbered codecs'
    ],
    alternativeComparisons: [
      {
        popularAlternative: 'Red Hat Enterprise Linux (RHEL)',
        relation: 'upstream',
        headline: 'Why Fedora Workstation instead of Red Hat (RHEL)?',
        whyThisInstead:
          'Fedora is Red Hat\'s official modern upstream workstation (Linus Torvalds\' personal daily driver). It delivers Red Hat\'s enterprise SELinux security and RPM stability without RHEL\'s commercial subscription paywall, and includes fresh LibreOffice 24.x, smooth Wayland 4K fractional scaling, and modern PipeWire audio routing.',
        tradeoffNotice:
          'RHEL provides certified 10-year binary freezes and 24/7 corporate enterprise phone support for corporate data centers.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://fedoraproject.org/workstation/download/'
    }
  },
  {
    id: 'ubuntu-studio',
    name: 'Ubuntu Studio',
    tagline: 'Turnkey creative multimedia operating system for graphic artists, 3D animators, and video editors',
    description:
      'The definitive open-source operating system for freelance creatives, designers, and video producers. Built on Ubuntu LTS with a low-latency kernel, real-time PipeWire/JACK audio routing, and the complete creative suite pre-installed: Krita, Blender, Inkscape, Darktable, GIMP, OBS Studio, and Kdenlive.',
    website: 'https://ubuntustudio.org',
    documentationUrl: 'https://ubuntustudio.org/manual/',
    logoEmoji: '🎨',
    platforms: ['bare-metal', 'desktop'],
    architectures: ['x86_64'],
    footprint: 'full',
    minRamMb: 4096,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'beginner',
    primaryUseCases: ['creative-studio', 'desktop'],
    packageManager: 'apt / snap / Flatpak',
    rollingRelease: false,
    highlights: [
      'Turnkey Creative Suite: Blender 3D, Krita digital painting, Inkscape vector design, and Darktable RAW photo editing ready on boot',
      'Low-Latency Linux Kernel: Tuned for real-time video previewing, high-framerate animation rendering, and zero-drop audio',
      'Color management & drawing tablet calibration: Plug-and-play Wacom, Huion, and XP-Pen drawing tablet support',
      'Ubuntu LTS foundation: Rock-solid stability with 5 years of security updates'
    ],
    tradeoffs: [
      'Heavy initial ISO download (~5GB) due to bundling the complete creative application suite'
    ],
    alternativeComparisons: [
      {
        popularAlternative: 'Standard Ubuntu',
        relation: 'fork',
        headline: 'Why Ubuntu Studio instead of Standard Ubuntu?',
        whyThisInstead:
          'Standard Ubuntu uses a generic throughput kernel and standard audio. Ubuntu Studio includes the low-latency / realtime Linux kernel, PipeWire-JACK pro audio routing, drawing tablet pressure calibration, and a complete creative suite (Ardour, Krita, Blender, Darktable) configured out of the box.',
        tradeoffNotice:
          'Standard Ubuntu has a lighter default install size if you do not perform music, video, or 3D production.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://ubuntustudio.org/download/'
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
    primaryUseCases: ['iot-embedded', 'router-networking', 'appliance-product'],
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
    alternativeComparisons: [
      {
        popularAlternative: 'OPNsense / pfSense',
        relation: 'competitor',
        headline: 'Why OpenWrt instead of OPNsense / pfSense?',
        whyThisInstead:
          'OpenWrt runs on constrained ARM, MIPS, and SBC routers with under 128MB RAM and has world-class Wi-Fi access point drivers. OPNsense requires standard x86 PC hardware and at least 2GB RAM.',
        tradeoffNotice:
          'OPNsense provides more advanced multi-gigabit routing, Suricata IDS/IPS, and enterprise traffic shaping on dedicated x86 server hardware.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://firmware-selector.openwrt.org'
    }
  },
  {
    id: 'opnsense',
    name: 'OPNsense',
    osFamily: 'bsd',
    kernelModel: 'monolithic-bsd',
    tagline: 'Open source, easy-to-use security-oriented FreeBSD firewall & routing platform',
    description:
      'A high-performance, FreeBSD-based firewall and routing platform featuring an intuitive web interface, stateful packet filtering (pf), multi-gigabit throughput, WireGuard VPN, and Suricata intrusion detection.',
    website: 'https://opnsense.org',
    documentationUrl: 'https://docs.opnsense.org',
    logoEmoji: '🛡️',
    platforms: ['router-firewall', 'bare-metal', 'vm'],
    architectures: ['x86_64'],
    footprint: 'standard',
    minRamMb: 2048,
    initSystems: ['bsd-rc', 'custom'],
    cLibraries: ['bsd-libc'],
    stateModel: 'mutable',
    experienceLevel: 'intermediate',
    primaryUseCases: ['router-networking'],
    packageManager: 'pkg',
    rollingRelease: false,
    highlights: [
      'Stateful Packet Filter (pf) with high-throughput multi-core packet scheduling',
      'Built-in Suricata Intrusion Detection & Prevention (IDS/IPS)',
      'Turnkey WireGuard, OpenVPN, and IPsec VPN gateways',
      'Rich Web GUI with live traffic graphs, NetFlow monitoring, and granular firewall rules',
      '100% open-source (2-Clause BSD license) with zero telemetry or artificial feature gates'
    ],
    tradeoffs: [
      'Requires dedicated 64-bit x86 PC with at least 2GB RAM and dual network interfaces (NICs)',
      'Limited support for consumer Wi-Fi access point mode compared to OpenWrt'
    ],
    alternativeComparisons: [
      {
        popularAlternative: 'pfSense / Netgate',
        relation: 'competitor',
        headline: 'Why OPNsense instead of pfSense?',
        whyThisInstead:
          'OPNsense is 100% open-source under the 2-Clause BSD license with an open API, regular bi-weekly security updates, and no proprietary lock-in. Netgate focuses on closed-source pfSense Plus, while OPNsense remains community-first.',
        tradeoffNotice:
          'pfSense is pre-installed on Netgate hardware appliances with commercial TAC support contracts.'
      },
      {
        popularAlternative: 'OpenWrt',
        relation: 'competitor',
        headline: 'Why OPNsense instead of OpenWrt for Home / Office Routing?',
        whyThisInstead:
          'OPNsense is built for high-throughput x86 hardware with enterprise-grade deep packet inspection (Suricata IDS/IPS), advanced traffic shaping, and extensive reporting. OpenWrt is tailored for low-resource flash routers and Wi-Fi access points.',
        tradeoffNotice:
          'OpenWrt runs on cheap $40 ARM/MIPS routers and single-board computers with world-class Wi-Fi AP drivers, whereas OPNsense requires standard x86 PC hardware.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://opnsense.org/download/'
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
    primaryUseCases: ['server', 'iot-embedded', 'kiosk-signage', 'appliance-product'],
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
    alternativeComparisons: [
      {
        popularAlternative: 'Raspberry Pi OS (Raspbian)',
        relation: 'fork',
        headline: 'Why DietPi instead of Raspberry Pi OS?',
        whyThisInstead:
          'DietPi consumes up to 5x less RAM (idles at ~60MB vs ~300MB), moves logs and temp files into RAM (zram) to prevent MicroSD card wear/corruption, and includes the automated dietpi-software menu for 1-click home server deployments.',
        tradeoffNotice:
          'Raspberry Pi OS comes with the official Raspberry Pi Foundation desktop GUI and camera module tools pre-installed.'
      }
    ],
    prebuiltImage: {
      downloadUrl: 'https://dietpi.com/#download'
    }
  },
  {
    id: 'armbian',
    name: 'Armbian',
    tagline: 'Optimized Linux for ARM TV boxes and single-board computers',
    description:
      'A purpose-built Debian and Ubuntu derivative optimized specifically for ARM single-board computers (Orange Pi, Banana Pi, Odroid) and cheap Android TV boxes/sticks (Amlogic S905/S912, Rockchip, Allwinner). Features custom hardware device trees (FDT/DTB), GPU/VPU hardware acceleration, and automated configuration tools.',
    website: 'https://www.armbian.com',
    documentationUrl: 'https://docs.armbian.com',
    logoEmoji: '🦎',
    platforms: ['embedded-sbc', 'server', 'bare-metal'],
    architectures: ['arm64', 'armv7', 'riscv64'],
    footprint: 'lean',
    minRamMb: 256,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'beginner',
    primaryUseCases: ['server', 'iot-embedded', 'media-center', 'router-networking'],
    packageManager: 'apt',
    rollingRelease: false,
    highlights: [
      'Breathes new life into cheap $25 Android TV boxes (Amlogic, Allwinner, Rockchip)',
      'Pre-configured hardware device trees for HDMI video, Wi-Fi, and Ethernet',
      'Built-in armbian-config tool for 1-click Docker, Samba, and Pi-hole setup',
      'Extremely energy efficient: runs 24/7 consuming only 3W to 5W of power'
    ],
    tradeoffs: [
      'Booting Android TV boxes requires flashing an SD card and copying the matching device tree (.dtb) file'
    ],
    prebuiltImage: {
      downloadUrl: 'https://www.armbian.com/download/'
    }
  },
  {
    id: 'postmarketos',
    name: 'postmarketOS (pmOS)',
    tagline: 'True Alpine Linux extending the lifespan of old smartphones and gadgets',
    description:
      'A touch-friendly and server-capable distribution built on Alpine Linux designed to reclaim abandoned consumer hardware (old smartphones, tablets, Ouya, and handhelds). Features mainline Linux kernel drivers, avoids Android battery drain and vendor lock-in, and turns idle phones with built-in battery UPS into zero-cost home servers.',
    website: 'https://postmarketos.org',
    documentationUrl: 'https://wiki.postmarketos.org',
    logoEmoji: '📱',
    platforms: ['embedded-sbc', 'bare-metal'],
    architectures: ['arm64', 'armv7', 'x86_64'],
    footprint: 'minimal',
    minRamMb: 256,
    initSystems: ['openrc', 'systemd'],
    cLibraries: ['musl'],
    stateModel: 'mutable',
    experienceLevel: 'intermediate',
    primaryUseCases: ['server', 'iot-embedded', 'desktop'],
    packageManager: 'apk',
    rollingRelease: true,
    highlights: [
      'Reclaims 250+ abandoned smartphone and tablet models with clean mainline Linux',
      'Ultra-light Alpine base (musl libc): idles at only 40MB RAM in server mode',
      'Built-in Battery UPS: old phones never shut down during home power blips',
      'Supports Phosh/Plasma Mobile touchscreens or headless SSH server'
    ],
    tradeoffs: [
      'Flashing requires unlocking the device bootloader and using fastboot or recovery'
    ],
    prebuiltImage: {
      downloadUrl: 'https://postmarketos.org/download/'
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
    alternativeComparisons: [
      {
        popularAlternative: 'Ubuntu Server + K3s',
        relation: 'competitor',
        headline: 'Why Talos Linux instead of Ubuntu Server + K3s?',
        whyThisInstead:
          'Talos is an immutable, purpose-built Kubernetes appliance with zero SSH, zero bash shell, and zero package manager. Its attack surface is 95% smaller than Ubuntu Server, and node upgrades are atomic and managed entirely via declarative API.',
        tradeoffNotice:
          'Cannot SSH in to inspect raw node files or run ad-hoc shell scripts on the host.'
      }
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
    },
    recipeGeneratorId: 'nixos-flake'
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
  // --- SINGLE-APP PRODUCT & WAYLAND APPLIANCE ---
  {
    id: 'cage-appliance',
    name: 'Cage Wayland Appliance',
    tagline: 'Boots directly into a single GUI application with zero desktop clutter',
    description:
      'A dedicated single-app appliance stack built on Alpine or Debian with Cage (Wayland kiosk compositor). Designed for custom hardware products (touchscreens, POS, media controllers, industrial dashboards, or custom Flutter/Qt/Web/Python apps) that boot straight into one full-screen app in under 4 seconds with silent boot, auto-restart on crash, and safe power-off.',
    website: 'https://github.com/cage-kiosk/cage',
    documentationUrl: 'https://github.com/cage-kiosk/cage#readme',
    logoEmoji: '🛠️',
    platforms: ['kiosk', 'bare-metal', 'embedded-sbc', 'vm'],
    architectures: ['x86_64', 'arm64', 'armv7'],
    footprint: 'minimal',
    minRamMb: 256,
    initSystems: ['openrc', 'systemd', 'busybox'],
    cLibraries: ['musl', 'glibc'],
    stateModel: 'stateless-ram',
    experienceLevel: 'beginner',
    primaryUseCases: ['appliance-product', 'kiosk-signage', 'iot-embedded'],
    packageManager: 'apk / apt',
    rollingRelease: false,
    highlights: [
      'Single-app focus: maximizes GPU and CPU exclusively for your application',
      'Auto-restart watchdog: if your app exits or crashes, Cage relaunches it instantly',
      'Silent splash boot: users see your product brand from power button to UI',
      'OverlayFS safe: can be pulled from wall power without disk corruption'
    ],
    tradeoffs: [
      'Single application only: no desktop multitasking or window controls',
      'Requires Wayland-compatible GUI backend (Flutter, Qt Wayland, GTK, Chromium, SDL2)'
    ],
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
    platforms: ['bare-metal', 'vm', 'server', 'desktop', 'wsl2'],
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
      downloadUrl: 'https://archlinux.org/download/',
      quickstartCommand: 'archinstall'
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
    platforms: ['bare-metal', 'vm', 'server', 'desktop', 'wsl2'],
    architectures: ['x86_64', 'arm64', 'riscv64'],
    footprint: 'full',
    minRamMb: 2048,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'beginner',
    primaryUseCases: ['desktop', 'server', 'gaming', 'ai-gpu-compute'],
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

/** Returns the OS family of a distribution, defaulting to 'linux'. */
export function getDistroOsFamily(distro: DistroProfile): 'linux' | 'bsd' | 'independent' {
  return distro.osFamily ?? 'linux';
}

/** Returns the architectural kernel model of a distribution, defaulting to 'monolithic-linux'. */
export function getDistroKernelModel(distro: DistroProfile): import('../types.js').KernelModel {
  return distro.kernelModel ?? 'monolithic-linux';
}

