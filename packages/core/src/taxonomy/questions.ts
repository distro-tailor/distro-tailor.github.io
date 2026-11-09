import { Question } from '../types.js';

export const QUESTIONS: Question[] = [
  // --- STEP 1: EXPERIENCE & JARGON LEVEL ---
  {
    id: 'user_familiarity',
    order: 1,
    prompt: 'How much Linux experience do you have?',
    subtext: 'No wrong answers! We tailor all remaining questions to speak your language.',
    category: 'preferences',
    tip: {
      icon: '💡',
      title: 'Zero shame in picking Beginner!',
      text: 'Picking Beginner cuts out 90% of technical jargon and lets you pick an outcome (TV box, home server, gaming console) in under 60 seconds. You can toggle to Technical mode at any time using the mode switch in the header!'
    },
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
    subtext: 'Pick your main priority. (Want a combo like Media Center + Retro Games or NAS + Smart Home? Pick your foundation here—you can customize and mix & match add-ons later!)',
    category: 'platform',
    shouldAsk: (criteria) => criteria.experienceLevel === 'beginner',
    tip: {
      icon: '🧩',
      title: 'Linux is Modular — You Can Mix & Match',
      text: 'Don\'t stress over choosing between two goals (like a Media Center AND Retro Games). Pick your primary interface first—Linux lets you layer on containers, emulators, or ad-blockers on the results page.'
    },
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
        id: 'freelance_office_docs',
        label: 'Home Office & Freelancing (Word, Excel, Invoicing, Zoom, Slack)',
        description: 'Daily remote work driver: 100% Microsoft Office format fidelity (OnlyOffice/LibreOffice), PDF signing, and printer setup with zero Windows crashes',
        icon: '💼',
        appliesCriteria: { useCase: 'home-office', footprint: 'standard', platform: 'bare-metal', prefersGui: true }
      },
      {
        id: 'freelance_creative_graphics',
        label: 'Graphic Design, 3D Art & Video Production (Blender, Krita, DaVinci)',
        description: 'Creative workstation for freelance digital artists, video editors, and 3D animators with color-managed Wayland and GPU acceleration',
        icon: '🎨',
        appliesCriteria: { useCase: 'creative-studio', footprint: 'full', platform: 'bare-metal', prefersGui: true }
      },
      {
        id: 'modern_gaming',
        label: 'Modern PC Gaming (Steam Deck / Couch Gaming)',
        description: 'Play modern Steam, Epic, and indie PC games with a controller-friendly TV interface',
        icon: '🎮',
        appliesCriteria: { useCase: 'gaming', footprint: 'full', platform: 'bare-metal' }
      },
      {
        id: 'ai_ml_server',
        label: 'AI & Local LLM Server or Data Science Box',
        description: 'Run local AI models (Ollama, vLLM, DeepSeek, PyTorch, Stable Diffusion) with full NVIDIA/AMD GPU acceleration',
        icon: '🧠',
        appliesCriteria: { useCase: 'ai-gpu-compute', footprint: 'full', platform: 'server' }
      },
      {
        id: 'crypto_mining_rig',
        label: 'Multi-GPU Mining Rig or Distributed Compute Node',
        description: 'Dedicated headless rig for crypto mining or distributed GPU compute with fan control, watchdog, and web telemetry',
        icon: '⛏️',
        appliesCriteria: { useCase: 'ai-gpu-compute', footprint: 'lean', platform: 'server' }
      },
      {
        id: 'homelab_virtualization',
        label: 'Homelab Virtualization & Hypervisor Host (Proxmox / KVM / LXC)',
        description: 'Run multiple isolated Linux/Windows virtual machines, Docker apps, and ZFS storage pools on a single powerful host or Craigslist server rack',
        icon: '🖧',
        appliesCriteria: { useCase: 'hypervisor-vms', footprint: 'standard', platform: 'server' }
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
    tip: {
      icon: '⚙️',
      title: 'Architectural Baseline',
      text: 'Your choice defines the kernel configuration and security boundaries (e.g. musl libc for micro containers vs. glibc for broad software compatibility).'
    },
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
        id: 'home_office_workstation',
        label: 'Home Office & Freelancer Workstation (Office Suite, PDF, Web)',
        description: 'Turnkey productivity: 100% MS Office format fidelity, LibreOffice/OnlyOffice, PDF signing, Zoom/Slack, and rock-solid stability',
        icon: '💼',
        appliesCriteria: { useCase: 'home-office', platform: 'bare-metal', prefersGui: true }
      },
      {
        id: 'creative_media_production',
        label: 'Creative Studio: Graphic Design, 3D Art & Pro Audio/Video',
        description: 'Digital painting (Krita), vector design (Inkscape), 3D animation (Blender), RAW photography (Darktable), and low-latency audio/video editing',
        icon: '🎨',
        appliesCriteria: { useCase: 'creative-studio', platform: 'bare-metal', prefersGui: true }
      },
      {
        id: 'ai_gpu_compute',
        label: 'AI / ML Training, Local LLM Inference & GPU Mining',
        description: 'Optimized for NVIDIA CUDA, AMD ROCm, PyTorch, vLLM, Ollama, and multi-GPU headless compute rigs',
        icon: '🧠',
        appliesCriteria: { useCase: 'ai-gpu-compute', platform: 'server' }
      },
      {
        id: 'hypervisor_virtualization',
        label: 'Bare-Metal Hypervisor & VM Host (Proxmox VE / KVM / LXC / ZFS)',
        description: 'Host dozens of virtual machines and containers on used enterprise rack servers with web GUI, ZFS, and cluster management',
        icon: '🖧',
        appliesCriteria: { useCase: 'hypervisor-vms', platform: 'server', footprint: 'standard' }
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
    tip: {
      icon: '💡',
      title: 'Repurpose, Don\'t E-Waste',
      text: 'An old laptop with a broken screen or a $35 Raspberry Pi uses under 15W of power—making it 10x more energy-efficient for a 24/7 home server than running an expensive gaming desktop!'
    },
    options: [
      {
        id: 'standard_pc',
        label: 'Standard PC or Windows Laptop (Intel or AMD)',
        description: 'Most ordinary desktops and laptops made in the last 10-12 years',
        icon: '💻',
        appliesCriteria: { architecture: 'x86_64' }
      },
      {
        id: 'old_macbook',
        label: 'Old Intel MacBook / Mac (2006–2017)',
        description: 'Revive an older MacBook, MacBook Air/Pro, or Mac Mini abandoned by Apple macOS updates (includes Broadcom Wi-Fi driver fix)',
        icon: '🍏',
        appliesCriteria: { architecture: 'x86_64', platform: 'bare-metal' }
      },
      {
        id: 'ancient_pc',
        label: 'Ancient / Obsolete Computer (15-20 years old)',
        description: 'Very old machines with older CPUs and limited memory (under 1GB–2GB RAM)',
        icon: '👴',
        appliesCriteria: { architecture: 'x86_64', footprint: 'minimal' }
      },
      {
        id: 'raspberry_pi',
        label: 'Raspberry Pi or Mini SBC Board',
        description: 'Raspberry Pi 3, 4, 5, or similar developer single-board computers',
        icon: '🍓',
        appliesCriteria: { architecture: 'arm64', platform: 'embedded-sbc' }
      },
      {
        id: 'android_tv_box',
        label: 'Android TV Box or TV Stick (Amlogic, Allwinner, Rockchip)',
        description: 'Repurpose a cheap $25 TV box/stick into a 24/7 home server, Pi-hole ad-blocker, or Kodi TV player',
        icon: '📺',
        appliesCriteria: { architecture: 'arm64', platform: 'embedded-sbc' }
      },
      {
        id: 'repurposed_gadget',
        label: 'Repurposed Gadget (Synology NAS, Old Phone, Ouya, Thin Client)',
        description: 'Reclaim proprietary hardware: install OpenMediaVault on Synology NAS, postmarketOS on old phones, or Linux on Ouya/thin clients',
        icon: '🔓',
        appliesCriteria: { platform: 'embedded-sbc', footprint: 'lean' }
      },
      {
        id: 'gaming_handheld',
        label: 'Handheld Gaming Device (Steam Deck, ROG Ally, etc.)',
        description: 'Portable gaming PC with integrated display and thumbsticks',
        icon: '🎮',
        appliesCriteria: { architecture: 'x86_64' }
      },
      {
        id: 'used_server_rack',
        label: 'Used Enterprise Rack Server (Craigslist / eBay 1U/2U/4U)',
        description: 'Scored a cheap Dell PowerEdge (R720/R730), HP ProLiant (DL380), or Supermicro rack server? Ideal for Proxmox VE hypervisors or multi-bay ZFS storage',
        icon: '🖧',
        appliesCriteria: { architecture: 'x86_64', platform: 'server', footprint: 'full' }
      },
      {
        id: 'apple_silicon_mac',
        label: 'Apple Silicon Mac (M1 / M2 / M3 / M4 MacBook, Mini, Studio)',
        description: 'Modern ARM Apple hardware. Native bare-metal Linux via Fedora Asahi Remix with conformant Vulkan/OpenGL GPU drivers and speaker DSP',
        icon: '🍎',
        appliesCriteria: { architecture: 'arm64', platform: 'bare-metal', footprint: 'full' }
      },
      {
        id: 'snapdragon_arm_laptop',
        label: 'Snapdragon / ARM Laptop (Snapdragon X Elite, ThinkPad X13s, Surface Pro X)',
        description: 'Modern Qualcomm ARM64 laptops with extreme 20+ hour battery life, supported in upstream Linux kernels 6.11+',
        icon: '🐉',
        appliesCriteria: { architecture: 'arm64', platform: 'bare-metal', footprint: 'standard' }
      },
      {
        id: 'riscv_board',
        label: 'RISC-V Board or PC (VisionFive 2, Milk-V, SpacemiT)',
        description: 'Open-standard instruction set architecture (ISA) single-board computer or developer workstation',
        icon: '📐',
        appliesCriteria: { architecture: 'riscv64', platform: 'embedded-sbc', footprint: 'lean' }
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
    tip: {
      icon: '⚡',
      title: 'Beyond x86: The Modern Silicon Landscape',
      text: 'ARM64 powers everything from Raspberry Pis to Snapdragon X Elite laptops and Apple Silicon (via Asahi). RISC-V is the rising open-standard architecture.'
    },
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
        label: 'ARM64 / AArch64 (Qualcomm Snapdragon, Apple Silicon, Raspberry Pi 4/5)',
        description: 'Modern power-efficient silicon: Snapdragon X Elite, Apple M-series, AWS Graviton, and SBCs',
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
    tip: {
      icon: '🚀',
      title: 'Linux is Incredibly Lean',
      text: 'While Windows 11 idles at 3.5GB to 4GB of RAM, lightweight Linux systems like antiX and DietPi idle at just 60MB to 150MB of RAM, making ancient 1GB machines feel brand new.'
    },
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
    tip: {
      icon: '📦',
      title: 'Footprint Hierarchy',
      text: 'Micro (<16MB) fits in embedded SPI flash chips. Minimal (<100MB) runs from fast RAM-disks. Standard (1-5GB) provides full desktop utilities and multi-gigabyte package caches.'
    },
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
    tip: {
      icon: '🛡️',
      title: 'Appliance Secret: Immutability',
      text: 'Commercial appliances and smart home hubs lock `/usr` as read-only. If someone yanks the power cable or an update fails, the device falls back to the previous boot partition automatically.'
    },
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
    tip: {
      icon: '🏢',
      title: 'glibc vs. musl Trade-Off',
      text: 'glibc runs 99.9% of commercial software (Steam, NVIDIA drivers, Chrome). musl produces ultra-compact binaries (5x smaller) with sub-second boot times, perfect for custom appliances.'
    },
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
    tip: {
      icon: '🚀',
      title: 'Turnkey Flash vs. Custom-Bake',
      text: 'Prebuilt images get you up and running in 5 minutes with BalenaEtcher. Build recipes give you the exact Makefile or Buildroot config to bake your own bespoke Linux distro from source.'
    },
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
