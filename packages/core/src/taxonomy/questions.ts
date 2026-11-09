import { Question } from '../types.js';

export const QUESTIONS: Question[] = [
  {
    id: 'primary_use_case',
    order: 1,
    prompt: 'What is the primary role or mission for this Linux system?',
    subtext: 'This sets the foundational baseline for packages, security posture, and kernel capabilities.',
    category: 'platform',
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
        id: 'server_cloud',
        label: 'Cloud Server or Self-Hosted Homelab',
        description: 'Reliable backend services, databases, web servers, or virtual machines',
        icon: '🖧',
        appliesCriteria: { useCase: 'server', platform: 'vm' }
      },
      {
        id: 'desktop_gaming',
        label: 'Daily Workstation, Gaming, or Development',
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
  {
    id: 'hardware_architecture',
    order: 2,
    prompt: 'What CPU architecture does the target hardware use?',
    subtext: 'Different distributions specialize in cross-compilation or prebuilt binary repositories.',
    category: 'hardware',
    shouldAsk: (criteria) => criteria.useCase !== 'browser-wasm',
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
  {
    id: 'memory_and_storage',
    order: 3,
    prompt: 'What are your target storage footprint and RAM constraints?',
    subtext: 'How light does the root filesystem need to be?',
    category: 'hardware',
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
  {
    id: 'system_immutability',
    order: 4,
    prompt: 'How should system state and configuration changes be managed?',
    subtext: 'Traditional mutable OSes vs. modern immutable / declarative architectures.',
    category: 'lifecycle',
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
  {
    id: 'c_library_and_init',
    order: 5,
    prompt: 'Do you have preferences for C Library and Init System?',
    subtext: 'Standard glibc + systemd vs. lightweight musl + OpenRC / BusyBox init.',
    category: 'software',
    shouldAsk: (criteria) => criteria.footprint === 'micro' || criteria.footprint === 'minimal',
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
  {
    id: 'user_experience_level',
    order: 6,
    prompt: 'What is your comfort level maintaining this system?',
    subtext: 'Determines whether we lean towards turn-key automated tools or granular control.',
    category: 'preferences',
    options: [
      {
        id: 'beginner',
        label: 'Novice / Set-and-Forget',
        description: 'Needs graphical setup, robust sane defaults, and minimal maintenance',
        icon: '🌱',
        appliesCriteria: { experienceLevel: 'beginner' }
      },
      {
        id: 'intermediate',
        label: 'Intermediate Linux User',
        description: 'Comfortable with CLI, package managers, and standard systemd administration',
        icon: '🌿',
        appliesCriteria: { experienceLevel: 'intermediate' }
      },
      {
        id: 'advanced',
        label: 'Advanced Tinker / Systems Hacker',
        description: 'Wants full control over kernel modules, custom init scripts, and minimal bloat',
        icon: '🌳',
        appliesCriteria: { experienceLevel: 'advanced' }
      }
    ]
  },
  {
    id: 'recipe_generation_intent',
    order: 7,
    prompt: 'Do you want a pre-built image or a custom compilation recipe?',
    subtext: 'Choose whether you want an existing ISO/image or a customized Makefile to compile it.',
    category: 'preferences',
    options: [
      {
        id: 'recommend_prebuilt',
        label: 'Recommend the Best Existing Distro',
        description: 'Provide an off-the-shelf, battle-tested ISO, OCI container, or Cloud AMI',
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
