import { Question } from '../types.js';

export const QUESTIONS: Question[] = [
  // --- STEP 1: EXPERIENCE & JARGON LEVEL ---
  {
    id: 'user_familiarity',
    order: 1,
    prompt: 'How much Linux experience do you have?',
    subtext: 'No wrong answers! We tailor all remaining questions to speak your language.',
    category: 'preferences',
    options: [
      {
        id: 'beginner',
        label: 'New to Linux / Just have a project in mind',
        description: 'Keep it simple in plain English (e.g. turn an old PC into a gaming console, media player, or school station)',
        icon: '🌱',
        appliesCriteria: { experienceLevel: 'beginner' }
      },
      {
        id: 'intermediate',
        label: 'Comfortable Tinkerer / Everyday User',
        description: 'I know basic terminal commands, package managers, and ISOs, and want a practical recommendation',
        icon: '🌿',
        appliesCriteria: { experienceLevel: 'intermediate' }
      },
      {
        id: 'systems-engineer',
        label: 'Systems Hacker / Embedded Engineer',
        description: 'Hit me with low-level kernel configs, NOMMU, init systems, libc choices, or custom Buildroot compilation',
        icon: '🌳',
        appliesCriteria: { experienceLevel: 'systems-engineer' }
      }
    ]
  },

  // --- STEP 2A: BEGINNER GOAL ---
  {
    id: 'beginner_goal',
    order: 2,
    prompt: 'What do you want to build or accomplish?',
    subtext: 'Pick the outcome you want to see running on your screen.',
    category: 'platform',
    shouldAsk: (criteria) => criteria.experienceLevel === 'beginner',
    options: [
      {
        id: 'retro_gaming_console',
        label: 'Retro Gaming Console',
        description: 'Play arcade, PS1, N64, SNES, and retro classics on your TV with game controllers',
        icon: '🕹️',
        appliesCriteria: { useCase: 'gaming', footprint: 'lean', platform: 'bare-metal' }
      },
      {
        id: 'kids_education',
        label: 'Kid-Safe School & Coding Computer',
        description: 'An iPad-simple computer for children: school homework, Scratch coding, offline Wikipedia, and educational games',
        icon: '🎓',
        appliesCriteria: { useCase: 'education-kids', footprint: 'standard', platform: 'bare-metal' }
      },
      {
        id: 'media_center',
        label: 'Living Room Media Center / TV Box (Kodi)',
        description: 'Turn an old PC or TV box into a dedicated media player controlled with a regular TV remote',
        icon: '📺',
        appliesCriteria: { useCase: 'media-center', footprint: 'minimal', platform: 'bare-metal' }
      },
      {
        id: 'nas_photo_backup',
        label: 'Family Photo/Video Backup & Home Storage (NAS)',
        description: 'Auto-backup family phone photos and videos over Wi-Fi, share files at home, and ditch monthly cloud fees',
        icon: '📦',
        appliesCriteria: { useCase: 'nas-storage', footprint: 'lean', platform: 'bare-metal' }
      },
      {
        id: 'smart_home',
        label: 'Smart Home Automation Hub (Home Assistant)',
        description: 'Turn a Raspberry Pi or mini PC into a private smart home controller for Zigbee, Matter, lights, and sensors with zero cloud fees',
        icon: '🏡',
        appliesCriteria: { useCase: 'smart-home', footprint: 'lean', platform: 'embedded-sbc' }
      },
      {
        id: 'appliance_product',
        label: 'Dedicated Single-App Appliance / Custom Product',
        description: 'Building a product where your app is the ONLY thing running (like Kodi or RetroPie, but for your custom Flutter, Qt, Web, or Python app)',
        icon: '🛠️',
        appliesCriteria: { useCase: 'appliance-product', footprint: 'minimal', platform: 'kiosk' }
      },
      {
        id: 'cheap_router',
        label: 'Home Router & Wi-Fi Firewall',
        description: 'Turn an old PC or box into a fast home router, ditch ISP rental fees, and block ads network-wide',
        icon: '📡',
        appliesCriteria: { useCase: 'router-networking', footprint: 'micro', platform: 'router-firewall' }
      },
      {
        id: 'shop_kiosk',
        label: 'Store Display, Digital Menu Board, or Shop Kiosk',
        description: 'Boot directly into a full-screen website, digital price menu, or dashboard with no desktop clutter',
        icon: '🏪',
        appliesCriteria: { useCase: 'kiosk-signage', footprint: 'lean', platform: 'kiosk' }
      },
      {
        id: 'revive_old_pc',
        label: 'Revive an Ancient, Slow Computer',
        description: 'Make an ancient 10-20 year old PC or laptop with low RAM (512MB-2GB) snappy and fast again',
        icon: '💨',
        appliesCriteria: { useCase: 'desktop', footprint: 'minimal', platform: 'bare-metal' }
      },
      {
        id: 'home_server',
        label: 'Simple Home Server & Private Cloud',
        description: 'Run Plex/Jellyfin, backup family photos, or run a 24/7 ad-blocker on cheap low-power hardware',
        icon: '🏠',
        appliesCriteria: { useCase: 'server', footprint: 'lean', platform: 'embedded-sbc' }
      },
      {
        id: 'daily_desktop',
        label: 'Everyday Computer for School, Work, or Web',
        description: 'Friendly desktop for web browsing, YouTube, and typing, completely immune to Windows malware',
        icon: '💻',
        appliesCriteria: { useCase: 'desktop', footprint: 'standard', platform: 'bare-metal' }
      },
      {
        id: 'modern_gaming',
        label: 'Modern PC Gaming (Steam Deck / Couch Gaming)',
        description: 'Play modern Steam, Epic, and indie PC games with a controller-friendly TV interface',
        icon: '🎮',
        appliesCriteria: { useCase: 'gaming', footprint: 'full', platform: 'bare-metal' }
      },
      {
        id: 'browser_wasm',
        label: 'Try Linux right now in my web browser tab',
        description: 'Test Linux in a sandbox without installing anything or touching your hard drive',
        icon: '🌐',
        appliesCriteria: { useCase: 'browser-wasm', footprint: 'minimal', platform: 'browser-wasm' }
      }
    ]
  },

  // --- STEP 2B: TECHNICAL USE CASE ---
  {
    id: 'technical_use_case',
    order: 2,
    prompt: 'What is the primary role or mission for this Linux system?',
    subtext: 'Sets the foundational baseline for packages, security boundaries, and kernel capabilities.',
    category: 'platform',
    shouldAsk: (criteria) => criteria.experienceLevel !== 'beginner',
    options: [
      {
        id: 'iot_embedded',
        label: 'IoT / Microcontroller / Embedded Hardware',
        description: 'Single-board computers, sensors, routers, robotics, or extreme low-power boards',
        icon: '🤖',
        appliesCriteria: { useCase: 'iot-embedded', platform: 'embedded-sbc' }
      },
      {
        id: 'container_base',
        label: 'Ultra-Minimal Container Base Image',
        description: 'Docker/OCI image targeting micro-size, zero CVEs, or distroless execution',
        icon: '🐳',
        appliesCriteria: { useCase: 'container-base', platform: 'container' }
      },
      {
        id: 'k8s_node',
        label: 'Dedicated Kubernetes Cluster Node',
        description: 'API-driven, immutable host running purely Kubelet and container runtime',
        icon: '☸️',
        appliesCriteria: { useCase: 'k8s-cluster', platform: 'k8s-node' }
      },
      {
        id: 'kiosk_display',
        label: 'Digital Signage / Web Kiosk / Public Terminal',
        description: 'Locked-down appliance booting straight into full-screen browser or app',
        icon: '🖥️',
        appliesCriteria: { useCase: 'kiosk-signage', platform: 'kiosk' }
      },
      {
        id: 'media_center',
        label: 'Home Theater PC (HTPC) / Dedicated Media Center',
        description: 'Boots directly into Kodi/Jellyfin with remote-control navigation and HW-accelerated video decoding',
        icon: '📺',
        appliesCriteria: { useCase: 'media-center', platform: 'bare-metal' }
      },
      {
        id: 'education_kids',
        label: 'Education, STEM & Kid-Safe Computing',
        description: 'Locked-down, offline-capable environment with Scratch, Khan Academy, and child-safe controls',
        icon: '🎓',
        appliesCriteria: { useCase: 'education-kids', platform: 'bare-metal' }
      },
      {
        id: 'nas_storage',
        label: 'Network Attached Storage (NAS) / File Server & Backups',
        description: 'Headless storage appliance with web UI, automated phone photo sync, and Samba/NFS file sharing',
        icon: '📦',
        appliesCriteria: { useCase: 'nas-storage', platform: 'server' }
      },
      {
        id: 'smart_home',
        label: 'Smart Home Automation Hub (Home Assistant / Local IoT)',
        description: 'Headless or touchscreen local hub managing Zigbee, Matter, Thread, camera NVR, and automations',
        icon: '🏡',
        appliesCriteria: { useCase: 'smart-home', platform: 'embedded-sbc' }
      },
      {
        id: 'appliance_product',
        label: 'Dedicated Single-App Appliance / Hardware Product (Cage / Buildroot)',
        description: 'Boots directly into a single full-screen application (Flutter, Qt, Web, Python) with zero desktop clutter and auto-restart',
        icon: '🛠️',
        appliesCriteria: { useCase: 'appliance-product', platform: 'kiosk' }
      },
      {
        id: 'server_cloud',
        label: 'Cloud Server or Self-Hosted Homelab',
        description: 'Reliable backend services, databases, web servers, or virtual machines',
        icon: '🖧',
        appliesCriteria: { useCase: 'server', platform: 'vm' }
      },
      {
        id: 'desktop_gaming',
        label: 'Workstation, Gaming, or Development',
        description: 'Rich GUI desktop environment, audio/video, GPU acceleration, and dev tools',
        icon: '🎮',
        appliesCriteria: { useCase: 'desktop', platform: 'bare-metal', prefersGui: true }
      },
      {
        id: 'browser_wasm',
        label: 'In-Browser WebAssembly (WASM) Sandbox',
        description: 'Runs entirely inside a browser tab client-side with zero native install',
        icon: '🌐',
        appliesCriteria: { useCase: 'browser-wasm', platform: 'browser-wasm' }
      }
    ]
  },

  // --- STEP 3A: BEGINNER DEVICE ---
  {
    id: 'beginner_device',
    order: 3,
    prompt: 'What kind of machine or device are you using?',
    subtext: 'Pick what best describes your hardware.',
    category: 'hardware',
    shouldAsk: (criteria) => criteria.experienceLevel === 'beginner' && criteria.useCase !== 'browser-wasm',
    options: [
      {
        id: 'standard_pc',
        label: 'Standard PC or Laptop (Intel or AMD)',
        description: 'Most ordinary desktops and laptops made in the last 10-12 years',
        icon: '💻',
        appliesCriteria: { architecture: 'x86_64' }
      },
      {
        id: 'ancient_pc',
        label: 'Ancient / Obsolete Computer (15-20 years old)',
        description: 'Very old machines with older CPUs and limited memory',
        icon: '👴',
        appliesCriteria: { architecture: 'x86_64', footprint: 'minimal' }
      },
      {
        id: 'raspberry_pi',
        label: 'Raspberry Pi or Mini Board',
        description: 'Raspberry Pi 3, 4, 5, or similar single-board mini computers',
        icon: '🍓',
        appliesCriteria: { architecture: 'arm64', platform: 'embedded-sbc' }
      },
      {
        id: 'gaming_handheld',
        label: 'Handheld Gaming Device (Steam Deck, ROG Ally, etc.)',
        description: 'Portable gaming PC with integrated display and thumbsticks',
        icon: '🎮',
        appliesCriteria: { architecture: 'x86_64' }
      }
    ]
  },

  // --- STEP 3B: TECHNICAL ARCHITECTURE ---
  {
    id: 'hardware_architecture',
    order: 3,
    prompt: 'What CPU architecture does the target hardware use?',
    subtext: 'Different distributions specialize in cross-compilation or prebuilt binary repositories.',
    category: 'hardware',
    shouldAsk: (criteria) => criteria.experienceLevel !== 'beginner' && criteria.useCase !== 'browser-wasm',
    options: [
      {
        id: 'x86_64',
        label: 'x86_64 / AMD64',
        description: 'Standard modern Intel and AMD PCs, laptops, and cloud hypervisors',
        icon: '💻',
        appliesCriteria: { architecture: 'x86_64' }
      },
      {
        id: 'arm64',
        label: 'ARM64 / AArch64',
        description: 'Raspberry Pi 4/5, Apple Silicon VMs, AWS Graviton, and modern SBCs',
        icon: '📱',
        appliesCriteria: { architecture: 'arm64' }
      },
      {
        id: 'armv7',
        label: '32-bit ARM (ARMv7 / Cortex-A)',
        description: 'Older Raspberry Pi (1/2/Zero), legacy industrial SBCs',
        icon: '📟',
        appliesCriteria: { architecture: 'armv7' }
      },
      {
        id: 'riscv64',
        label: 'RISC-V (64-bit)',
        description: 'Open-standard architecture (VisionFive, StarFive, Milk-V)',
        icon: '⚡',
        appliesCriteria: { architecture: 'riscv64' }
      },
      {
        id: 'nommu_mcu',
        label: 'Microcontroller / NOMMU (No Memory Management Unit)',
        description: 'ARM Cortex-M, STM32, ESP32, or extreme low-power chips',
        icon: '🔌',
        appliesCriteria: { architecture: 'nommu', footprint: 'micro' }
      }
    ]
  },

  // --- STEP 4A: BEGINNER RAM ---
  {
    id: 'beginner_memory',
    order: 4,
    prompt: 'Roughly how much memory (RAM) does it have?',
    subtext: 'A rough estimate is fine. Pick what sounds closest.',
    category: 'hardware',
    shouldAsk: (criteria) => criteria.experienceLevel === 'beginner' && criteria.useCase !== 'browser-wasm',
    options: [
      {
        id: 'very_low',
        label: 'Very Low (Under 1 GB RAM / Ancient machine)',
        description: 'Old computer that struggles with modern Windows or heavy browsers',
        icon: '🪶',
        appliesCriteria: { footprint: 'minimal', maxRamMb: 1024 }
      },
      {
        id: 'modest',
        label: 'Modest (2 GB to 4 GB RAM)',
        description: 'Typical older laptop or basic office PC',
        icon: '⚡',
        appliesCriteria: { footprint: 'lean', maxRamMb: 4096 }
      },
      {
        id: 'plenty',
        label: 'Plenty (8 GB RAM or more)',
        description: 'Modern desktop, gaming PC, or workstation',
        icon: '🚀',
        appliesCriteria: { footprint: 'standard', maxRamMb: 8192 }
      }
    ]
  },

  // --- STEP 4B: TECHNICAL FOOTPRINT ---
  {
    id: 'memory_and_storage',
    order: 4,
    prompt: 'What are your target storage footprint and RAM constraints?',
    subtext: 'How light does the root filesystem need to be?',
    category: 'hardware',
    shouldAsk: (criteria) => criteria.experienceLevel !== 'beginner',
    options: [
      {
        id: 'extreme_micro',
        label: 'Extreme Micro (< 16 MB flash / < 32 MB RAM)',
        description: 'BusyBox, uClibc-ng or musl, static binaries, no full package manager',
        icon: '🪶',
        appliesCriteria: { footprint: 'micro', maxRamMb: 32 }
      },
      {
        id: 'ultra_minimal',
        label: 'Ultra-Minimal (16 MB - 100 MB / 64 MB - 256 MB RAM)',
        description: 'Alpine-style minimal footprint with lightweight package manager (apk)',
        icon: '📦',
        appliesCriteria: { footprint: 'minimal', maxRamMb: 256 }
      },
      {
        id: 'lean',
        label: 'Lean & Efficient (100 MB - 1 GB / 512 MB - 2 GB RAM)',
        description: 'DietPi, minimal Debian netinst, lightweight headless server',
        icon: '⚡',
        appliesCriteria: { footprint: 'lean', maxRamMb: 2048 }
      },
      {
        id: 'unconstrained',
        label: 'Standard / Unconstrained (> 2 GB RAM & Storage)',
        description: 'Plenty of RAM and storage; prioritize features, drivers, and ease of use',
        icon: '🚀',
        appliesCriteria: { footprint: 'standard', maxRamMb: 8192 }
      }
    ]
  },

  // --- STEP 5: IMMUTABILITY (Only for Intermediate & Systems Engineers) ---
  {
    id: 'system_immutability',
    order: 5,
    prompt: 'How should system state and configuration changes be managed?',
    subtext: 'Traditional mutable OSes vs. modern immutable / declarative architectures.',
    category: 'lifecycle',
    shouldAsk: (criteria) => criteria.experienceLevel !== 'beginner',
    options: [
      {
        id: 'traditional_mutable',
        label: 'Traditional Mutable (apt, dnf, pacman)',
        description: 'Standard Linux: install and tweak packages whenever you want',
        icon: '🛠️',
        appliesCriteria: { statePreference: 'mutable' }
      },
      {
        id: 'declarative_reproducible',
        label: 'Declarative & Functional (NixOS / Guix)',
        description: 'Declare system state in code; atomic rebuilds and instant rollbacks',
        icon: '❄️',
        appliesCriteria: { statePreference: 'declarative' }
      },
      {
        id: 'immutable_ostree',
        label: 'Atomic / Immutable Read-Only Root (`/usr` locked)',
        description: 'Tamper-proof root filesystem updated atomically (e.g. rpm-ostree or Talos)',
        icon: '🔒',
        appliesCriteria: { statePreference: 'immutable-ostree' }
      },
      {
        id: 'stateless_ram',
        label: 'Stateless / Run from RAM',
        description: 'Boots into RAM disk; completely resets every reboot (kiosks, rescue discs)',
        icon: '💾',
        appliesCriteria: { statePreference: 'stateless-ram' }
      }
    ]
  },

  // --- STEP 6: C LIBRARY & INIT (Only for Systems Engineers) ---
  {
    id: 'c_library_and_init',
    order: 6,
    prompt: 'Do you have preferences for C Library and Init System?',
    subtext: 'Standard glibc + systemd vs. lightweight musl + OpenRC / BusyBox init.',
    category: 'software',
    shouldAsk: (criteria) => criteria.experienceLevel === 'systems-engineer',
    options: [
      {
        id: 'musl_busybox',
        label: 'musl libc + BusyBox / OpenRC',
        description: 'Maximum space savings, fastest cold boot, static linking friendly',
        icon: '⚡',
        appliesCriteria: { cLibPreference: 'musl', initPreference: 'openrc' }
      },
      {
        id: 'glibc_systemd',
        label: 'glibc + systemd',
        description: 'Broadest binary compatibility with commercial drivers and proprietary software',
        icon: '🏢',
        appliesCriteria: { cLibPreference: 'glibc', initPreference: 'systemd' }
      },
      {
        id: 'uclibc_nommu',
        label: 'uClibc-ng (for NOMMU or tiny microcontrollers)',
        description: 'Extreme micro footprint for architectures lacking MMU hardware',
        icon: '🔌',
        appliesCriteria: { cLibPreference: 'uclibc-ng', initPreference: 'busybox' }
      },
      {
        id: 'no_preference',
        label: 'No strong preference (pick the best default)',
        description: 'Let DistroTailor choose based on size and application goals',
        icon: '✨',
        appliesCriteria: { cLibPreference: 'no-preference', initPreference: 'no-preference' }
      }
    ]
  },

  // --- STEP 7: BUILD RECIPE OR PREBUILT IMAGE ---
  {
    id: 'recipe_generation_intent',
    order: 7,
    prompt: 'How would you like to get started?',
    subtext: 'Choose whether you want an existing image to download or a custom compilation recipe.',
    category: 'preferences',
    options: [
      {
        id: 'recommend_prebuilt',
        label: 'Recommend the Best Existing Distro',
        description: 'Provide an off-the-shelf, battle-tested ISO image to flash or download',
        icon: '📥',
        appliesCriteria: { requiresCustomBuild: false }
      },
      {
        id: 'generate_custom_recipe',
        label: 'Generate a Custom Build Recipe (Makefile / Script)',
        description: 'Give me a reproducible Makefile/toolchain to compile and assemble the OS myself',
        icon: '🛠️',
        appliesCriteria: { requiresCustomBuild: true }
      }
    ]
  }
];
