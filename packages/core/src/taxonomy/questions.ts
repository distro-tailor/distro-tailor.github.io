import { Question, UserCriteria } from '../types.js';
import { SERVER_SITE_USE_CASES } from './affinities.js';

/**
 * In Goal Mode a value already inferred from the goal or device skips its question (20-questions style).
 * Technical Mode still asks it, pre-selected with the inferred value, so it can be fine-tuned.
 */
const decidedInGoalMode = (criteria: UserCriteria, key: keyof UserCriteria): boolean =>
  criteria.experienceLevel === 'beginner' && criteria[key] !== undefined;

const NON_INTERACTIVE_PLATFORMS = new Set([
  'container',
  'k8s-node',
  'router-firewall',
  'microcontroller',
  'server',
  'vm',
  'wsl2'
]);


/** Community and remote-site builds: these get the power and internet-connection questions. */
const isRemoteSiteBuild = (criteria: UserCriteria): boolean =>
  criteria.useCase === 'community-network' ||
  criteria.useCase === 'offline-library' ||
  criteria.deploymentSite === 'community';

const NON_AUDIO_USE_CASES = new Set([
  'browser-wasm',
  'server',
  'game-server',
  'community-network',
  'offline-library',
  'nas-storage',
  'smart-home',
  'hypervisor-vms',
  'ai-gpu-compute',
  'router-networking',
  'k8s-cluster',
  'container-base',
  'appliance-product',
  'kiosk-signage',
  'iot-embedded',
  'security-pentest'
]);

const NON_PERIPHERAL_USE_CASES = new Set([
  'browser-wasm',
  'server',
  'game-server',
  'community-network',
  'offline-library',
  'nas-storage',
  'hypervisor-vms',
  'ai-gpu-compute',
  'router-networking',
  'k8s-cluster',
  'container-base',
  'iot-embedded',
  'appliance-product',
  'kiosk-signage'
]);

export const QUESTIONS: Question[] = [
  // --- STEP 1: EXPERIENCE & JARGON LEVEL ---
  {
    id: 'user_familiarity',
    order: 1,
    prompt: 'How much experience do you have with open-source OSes?',
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
        label: 'New to Linux & Open Source / Just have a goal in mind',
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
      title: 'Open Source is Modular — You Can Mix & Match',
      text: 'Don\'t stress over choosing between two goals (like a Media Center AND Retro Games). Pick your primary interface first—you can layer on containers, emulators, or ad-blockers on the results page.'
    },
    options: [
      {
        id: 'daily_desktop',
        label: 'Everyday Computer for School, Work, or Web',
        description: 'Friendly desktop for web browsing, YouTube, and typing, completely immune to Windows malware',
        icon: '💻',
        appliesCriteria: { useCase: 'desktop', footprint: 'standard', platform: 'bare-metal', prefersGui: true, realtimeAudio: false, releaseCadence: 'lts' }
      },
      {
        id: 'revive_old_pc',
        label: 'Revive an Ancient, Slow Computer',
        description: 'Make an ancient 10-20 year old PC or laptop with low RAM (512MB-2GB) snappy and fast again',
        icon: '💨',
        appliesCriteria: { useCase: 'desktop', footprint: 'minimal', platform: 'bare-metal', prefersGui: true, realtimeAudio: false, releaseCadence: 'lts' }
      },
      {
        id: 'freelance_office_docs',
        label: 'Home Office & Freelancing (Word, Excel, Invoicing, Zoom, Slack)',
        description: 'Daily remote work driver: 100% Microsoft Office format fidelity (OnlyOffice/LibreOffice), PDF signing, and printer setup with zero Windows crashes',
        icon: '💼',
        appliesCriteria: { useCase: 'home-office', footprint: 'standard', platform: 'bare-metal', prefersGui: true, realtimeAudio: false, releaseCadence: 'lts' }
      },
      {
        id: 'coding_dev',
        label: 'Coding & Software Development (VS Code, Git, Python, Node)',
        description: 'Clean developer workstation with terminal tools, compilers, Git, Python/Node.js, and VS Code pre-wired',
        icon: '👨‍💻',
        appliesCriteria: {
          useCase: 'desktop',
          footprint: 'standard',
          platform: 'bare-metal',
          prefersGui: true,
          desktopApps: ['vscode', 'git-dev', 'python', 'nodejs'],
          realtimeAudio: false,
          releaseCadence: 'standard'
        }
      },
      {
        id: 'browser_wasm',
        label: 'Try an OS right now in my web browser tab',
        description: 'Test an operating system in a sandbox without installing anything or touching your hard drive',
        icon: '🌐',
        appliesCriteria: { useCase: 'browser-wasm', footprint: 'minimal', platform: 'browser-wasm' }
      },
      {
        id: 'kids_education',
        label: 'Kid-Safe School & Coding Computer',
        description: 'An iPad-simple computer for children: school homework, Scratch coding, offline Wikipedia, and educational games',
        icon: '🎓',
        appliesCriteria: { useCase: 'education-kids', footprint: 'standard', platform: 'bare-metal', prefersGui: true, realtimeAudio: false, releaseCadence: 'lts' }
      },
      {
        id: 'retro_gaming_console',
        label: 'Retro Gaming Console',
        description: 'Play arcade, PS1, N64, SNES, and retro classics on your TV with game controllers',
        icon: '🕹️',
        appliesCriteria: { useCase: 'gaming', footprint: 'lean', platform: 'bare-metal', prefersGui: true, realtimeAudio: false, releaseCadence: 'lts' }
      },
      {
        id: 'modern_gaming',
        label: 'Modern PC Gaming (Steam Deck / Couch Gaming)',
        description: 'Play modern Steam, Epic, and indie PC games with a controller-friendly TV interface',
        icon: '🎮',
        appliesCriteria: { useCase: 'gaming', footprint: 'full', platform: 'bare-metal', prefersGui: true, realtimeAudio: false, releaseCadence: 'standard' }
      },
      {
        id: 'media_center',
        label: 'Living Room Media Center / TV Box (Kodi)',
        description: 'Turn an old PC or TV box into a dedicated media player controlled with a regular TV remote',
        icon: '📺',
        appliesCriteria: { useCase: 'media-center', footprint: 'minimal', platform: 'bare-metal', prefersGui: true, realtimeAudio: false, releaseCadence: 'lts' }
      },
      {
        id: 'freelance_creative_graphics',
        label: 'Graphic Design, 3D Art & Video Production (Blender, Krita, DaVinci)',
        description: 'Creative workstation for freelance digital artists, video editors, and 3D animators with color-managed Wayland and GPU acceleration',
        icon: '🎨',
        appliesCriteria: { useCase: 'creative-studio', footprint: 'full', platform: 'bare-metal', prefersGui: true, realtimeAudio: false, releaseCadence: 'standard' }
      },
      {
        id: 'music_audio_studio',
        label: 'Music Production, Podcasting & Pro Audio Studio (Ardour, PipeWire)',
        description: 'Low-latency realtime audio workstation for DAWs, synthesizers, MIDI controllers, and crackle-free recording',
        icon: '🎵',
        appliesCriteria: { useCase: 'creative-studio', footprint: 'full', platform: 'bare-metal', prefersGui: true, realtimeAudio: true, releaseCadence: 'lts' }
      },
      {
        id: 'home_server',
        label: 'Simple Home Server & Private Cloud',
        description: 'Run Plex/Jellyfin media streaming, Pi-hole ad-blocking, or self-hosted apps on cheap low-power hardware',
        icon: '🏠',
        appliesCriteria: { useCase: 'server', footprint: 'lean', platform: 'embedded-sbc', prefersGui: false, releaseCadence: 'lts', deploymentSite: 'home' }
      },
      {
        id: 'game_server_lan',
        label: 'Minecraft or LAN Party Game Server',
        description: 'Host Minecraft, Valheim, Terraria, or Steam dedicated servers for friends, or a LAN party download cache',
        icon: '🎮',
        appliesCriteria: { useCase: 'game-server', footprint: 'lean', platform: 'bare-metal', prefersGui: false, releaseCadence: 'lts', deploymentSite: 'home' }
      },
      {
        id: 'community_wifi',
        label: 'Community Wi-Fi or Village Internet',
        description: 'Share internet across a neighbourhood, village, or campus with rooftop Wi-Fi links or a self-healing mesh of cheap routers',
        icon: '📶',
        appliesCriteria: { useCase: 'community-network', platform: 'router-firewall', footprint: 'minimal', prefersGui: false, releaseCadence: 'lts', deploymentSite: 'community' }
      },
      {
        id: 'offline_library',
        label: 'Offline Library & Learning Server',
        description: 'Serve Wikipedia, maps, books, and courses over local Wi-Fi to phones and laptops, with little or no internet',
        icon: '📚',
        appliesCriteria: { useCase: 'offline-library', platform: 'embedded-sbc', footprint: 'lean', prefersGui: false, releaseCadence: 'lts', deploymentSite: 'community' }
      },
      {
        id: 'community_server',
        label: 'Community Server (Shared Files, Chat & Calls)',
        description: 'One low-power box for a school, clinic, or co-op: shared files (Nextcloud), chat, and video calls (Jitsi) on the local network',
        icon: '🤝',
        appliesCriteria: { useCase: 'server', platform: 'bare-metal', footprint: 'lean', prefersGui: false, releaseCadence: 'lts', deploymentSite: 'community' }
      },
      {
        id: 'small_business_office',
        label: 'Small Business or Shop Office (Shared Files, Printer & Backups)',
        description: 'One quiet server for a shop, clinic, or small office: shared folders, printer and scanner sharing, and automatic backups. For staff PCs, pick Home Office',
        icon: '🏪',
        appliesCriteria: { useCase: 'nas-storage', footprint: 'lean', platform: 'bare-metal', prefersGui: false, releaseCadence: 'lts', deploymentSite: 'office' }
      },
      {
        id: 'nas_photo_backup',
        label: 'Family Photo/Video Backup & Home Storage (NAS)',
        description: 'Auto-backup family phone photos and videos over Wi-Fi, share files at home, and ditch monthly cloud fees',
        icon: '📦',
        appliesCriteria: { useCase: 'nas-storage', footprint: 'lean', platform: 'bare-metal', prefersGui: false, releaseCadence: 'lts', deploymentSite: 'home' }
      },
      {
        id: 'smart_home',
        label: 'Smart Home Automation Hub (Home Assistant)',
        description: 'Turn a Raspberry Pi or mini PC into a private smart home controller for Zigbee, Matter, lights, and sensors with zero cloud fees',
        icon: '🏡',
        appliesCriteria: { useCase: 'smart-home', footprint: 'lean', platform: 'embedded-sbc', prefersGui: false, releaseCadence: 'lts', deploymentSite: 'home' }
      },
      {
        id: 'cheap_router',
        label: 'Home Router & Wi-Fi Firewall',
        description: 'Turn an old PC or box into a fast home router, ditch ISP rental fees, and block ads network-wide',
        icon: '📡',
        appliesCriteria: { useCase: 'router-networking', footprint: 'micro', platform: 'router-firewall', prefersGui: false, releaseCadence: 'lts', deploymentSite: 'home' }
      },
      {
        id: 'offline_navigation',
        label: 'In-Car GPS & Offline Navigation (Navit + OpenStreetMap)',
        description: 'Turn an old GPS (TomTom/WinCE), Raspberry Pi, or car touchscreen into a dedicated offline road & marine navigator with zero cellular fees',
        icon: '🧭',
        appliesCriteria: {
          useCase: 'appliance-product',
          footprint: 'micro',
          platform: 'bare-metal',
          prefersGui: true,
          desktopEnv: 'cage',
          navigationApps: ['navit', 'gpsd'],
          releaseCadence: 'lts'
        }
      },
      {
        id: 'shop_kiosk',
        label: 'Store Display, Digital Menu Board, or Shop Kiosk',
        description: 'Boot directly into a full-screen website, digital price menu, or dashboard with no desktop clutter',
        icon: '🏪',
        appliesCriteria: { useCase: 'kiosk-signage', footprint: 'lean', platform: 'kiosk', prefersGui: true, releaseCadence: 'lts' }
      },
      {
        id: 'appliance_product',
        label: 'Dedicated Single-App Appliance / Custom Product',
        description: 'Building a product where your app is the ONLY thing running (like Kodi or RetroPie, but for your custom Flutter, Qt, Web, or Python app)',
        icon: '🛠️',
        appliesCriteria: { useCase: 'appliance-product', footprint: 'minimal', platform: 'kiosk', releaseCadence: 'lts' }
      },
      {
        id: 'homelab_virtualization',
        label: 'Homelab Virtualization & Hypervisor Host (Proxmox / KVM / LXC)',
        description: 'Run multiple isolated Linux/Windows virtual machines, Docker apps, and ZFS storage pools on a single powerful host or Craigslist server rack',
        icon: '🖧',
        appliesCriteria: { useCase: 'hypervisor-vms', footprint: 'standard', platform: 'server', prefersGui: false, releaseCadence: 'lts', deploymentSite: 'home' }
      },
      {
        id: 'ai_ml_server',
        label: 'AI & Local LLM Server or Data Science Box',
        description: 'Run local AI models (Ollama, vLLM, DeepSeek, PyTorch, Stable Diffusion) with full NVIDIA/AMD GPU acceleration',
        icon: '🧠',
        appliesCriteria: { useCase: 'ai-gpu-compute', footprint: 'full', platform: 'server', prefersGui: false, driverPhilosophy: 'seamless-proprietary', releaseCadence: 'lts' }
      },
      {
        id: 'crypto_mining_rig',
        label: 'Multi-GPU Mining Rig or Distributed Compute Node',
        description: 'Dedicated headless rig for crypto mining or distributed GPU compute with fan control, watchdog, and web telemetry',
        icon: '⛏️',
        appliesCriteria: { useCase: 'ai-gpu-compute', footprint: 'lean', platform: 'server', prefersGui: false, driverPhilosophy: 'seamless-proprietary', releaseCadence: 'lts' }
      },
      {
        id: 'private_everyday',
        label: 'Private Everyday Computer (No Tracking, Encrypted Disk)',
        description: 'A normal computer for web, school, and work with no telemetry and full-disk encryption. Your browser and online accounts matter too',
        icon: '🔒',
        appliesCriteria: { useCase: 'desktop', footprint: 'standard', platform: 'bare-metal', prefersGui: true, realtimeAudio: false, privacyFocus: true, releaseCadence: 'lts' }
      },
      {
        id: 'security_privacy',
        label: 'Privacy, Anonymity & Cybersecurity (Tails / Kali Linux)',
        description: 'Amnesic Tor privacy from a USB stick (Tails) or ethical hacking and penetration testing toolkit (Kali)',
        icon: '🛡️',
        appliesCriteria: { useCase: 'security-pentest', footprint: 'lean', platform: 'bare-metal', prefersGui: true, releaseCadence: 'standard' }
      }
    ]
  },

  // --- STEP 2B: TECHNICAL USE CASE ---
  {
    id: 'technical_use_case',
    order: 2,
    prompt: 'What is the primary role or mission for this system?',
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
        id: 'desktop_gaming',
        label: 'Workstation, Gaming, or Development',
        description: 'Rich GUI desktop environment, audio/video, GPU acceleration, and dev tools',
        icon: '🎮',
        appliesCriteria: { useCase: 'desktop', platform: 'bare-metal', prefersGui: true }
      },
      {
        id: 'server_cloud',
        label: 'Cloud Server or Self-Hosted Homelab',
        description: 'Reliable backend services, databases, web servers, or virtual machines',
        icon: '🖧',
        appliesCriteria: { useCase: 'server', platform: 'vm' }
      },
      {
        id: 'game_server_hosting',
        label: 'Dedicated Game Server',
        description: 'Minecraft (Java/Bedrock), SteamCMD dedicated servers, LinuxGSM, or a LAN cache for game downloads',
        icon: '🎮',
        appliesCriteria: { useCase: 'game-server', platform: 'server', prefersGui: false }
      },
      {
        id: 'community_isp',
        label: 'Community ISP or Mesh Network',
        description: 'Community wireless network, mesh nodes, or a small ISP edge: OpenWrt, LibreMesh, or an OPNsense gateway',
        icon: '📶',
        appliesCriteria: { useCase: 'community-network', platform: 'router-firewall', prefersGui: false }
      },
      {
        id: 'offline_library_server',
        label: 'Offline Content & Learning Server',
        description: 'Kiwix / Internet-in-a-Box hotspot serving offline Wikipedia, maps, and course packs',
        icon: '📚',
        appliesCriteria: { useCase: 'offline-library', prefersGui: false }
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
        id: 'hypervisor_virtualization',
        label: 'Bare-Metal Hypervisor & VM Host (Proxmox VE / KVM / LXC / ZFS)',
        description: 'Host dozens of virtual machines and containers on used enterprise rack servers with web GUI, ZFS, and cluster management',
        icon: '🖧',
        appliesCriteria: { useCase: 'hypervisor-vms', platform: 'server', footprint: 'standard' }
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
        id: 'kiosk_display',
        label: 'Digital Signage / Web Kiosk / Public Terminal',
        description: 'Locked-down appliance booting straight into full-screen browser or app',
        icon: '🖥️',
        appliesCriteria: { useCase: 'kiosk-signage', platform: 'kiosk' }
      },
      {
        id: 'appliance_product',
        label: 'Dedicated Single-App Appliance / Hardware Product (Cage / Buildroot)',
        description: 'Boots directly into a single full-screen application (Flutter, Qt, Web, Python) with zero desktop clutter and auto-restart',
        icon: '🛠️',
        appliesCriteria: { useCase: 'appliance-product', platform: 'kiosk' }
      },
      {
        id: 'iot_embedded',
        label: 'IoT / Microcontroller / Embedded Hardware & SoMs',
        description: 'Single-board computers, Compute Modules / SoMs, Hybrid SoCs (i.MX8), routers, or RTOS microcontrollers',
        icon: '🤖',
        appliesCriteria: { useCase: 'iot-embedded', platform: 'embedded-sbc' }
      },
      {
        id: 'ai_gpu_compute',
        label: 'AI / ML Training, Local LLM Inference & GPU Mining',
        description: 'Optimized for NVIDIA CUDA, AMD ROCm, PyTorch, vLLM, Ollama, and multi-GPU headless compute rigs',
        icon: '🧠',
        appliesCriteria: { useCase: 'ai-gpu-compute', platform: 'server' }
      },
      {
        id: 'security_pentest',
        label: 'Cybersecurity, Penetration Testing & Amnesic Privacy',
        description: 'Security auditing, ethical hacking, network forensics (Kali), or Tor-routed amnesic live USB (Tails)',
        icon: '🛡️',
        appliesCriteria: { useCase: 'security-pentest', platform: 'bare-metal', prefersGui: true }
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
        id: 'standard_desktop',
        label: 'Desktop PC or Tower (Intel or AMD)',
        description: 'AC wall-powered desktop or workstation made in the last 10–12 years',
        icon: '🖥️',
        appliesCriteria: { architecture: 'x86_64', platform: 'bare-metal', formFactor: 'desktop', bootMedium: 'nvme-ssd' }
      },
      {
        id: 'standard_laptop',
        label: 'Laptop / Notebook / Ultrabook (Intel or AMD)',
        description: 'Battery-powered portable laptop; needs power-saving, sleep/suspend, and Wi-Fi management',
        icon: '💻',
        isDefault: true,
        appliesCriteria: { architecture: 'x86_64', platform: 'bare-metal', formFactor: 'laptop', bootMedium: 'nvme-ssd' }
      },
      {
        id: 'old_macbook',
        label: 'Old Intel MacBook / Mac (2006–2017)',
        description: 'Revive an older MacBook, MacBook Air/Pro, or Mac Mini abandoned by Apple macOS updates (includes Broadcom Wi-Fi driver fix)',
        icon: '🍏',
        appliesCriteria: { architecture: 'x86_64', platform: 'bare-metal', formFactor: 'mac', bootMedium: 'nvme-ssd' }
      },
      {
        id: 'ancient_pc',
        label: 'Ancient / Low-Power Computer (Intel Atom, Celeron, 10–15+ yrs)',
        description: 'Very weak CPU or under 1GB–2GB RAM; needs an ultra-lightweight OS that will not lag',
        icon: '👴',
        appliesCriteria: { architecture: 'x86_64', platform: 'bare-metal', footprint: 'minimal', formFactor: 'low-power', bootMedium: 'nvme-ssd' }
      },
      {
        id: 'raspberry_pi',
        label: 'Raspberry Pi, Compute Module (SoM), or Mini SBC Board',
        description: 'Raspberry Pi 3/4/5, Compute Modules (CM4/CM5), or similar single-board computers & System-on-Modules',
        icon: '🍓',
        appliesCriteria: { architecture: 'arm64', platform: 'embedded-sbc', formFactor: 'sbc', bootMedium: 'sd-card-usb' }
      },
      {
        id: 'android_tv_box',
        label: 'Android TV Box or TV Stick (Amlogic, Allwinner, Rockchip)',
        description: 'Repurpose a cheap $25 TV box/stick into a 24/7 home server, Pi-hole ad-blocker, or Kodi TV player',
        icon: '📺',
        appliesCriteria: { architecture: 'arm64', platform: 'embedded-sbc', formFactor: 'low-power', bootMedium: 'sd-card-usb' }
      },
      {
        id: 'repurposed_gadget',
        label: 'Repurposed Gadget (Synology NAS, Old Phone, Ouya, Thin Client)',
        description: 'Reclaim proprietary hardware: install OpenMediaVault on Synology NAS, postmarketOS on old phones, or Linux on Ouya/thin clients',
        icon: '🔓',
        appliesCriteria: { platform: 'embedded-sbc', footprint: 'lean', formFactor: 'low-power', bootMedium: 'sd-card-usb' }
      },
      {
        id: 'gaming_handheld',
        label: 'Handheld Gaming Device (Steam Deck, ROG Ally, etc.)',
        description: 'Portable gaming PC with 15W APU, integrated display, thumbsticks, and Game Mode',
        icon: '🎮',
        appliesCriteria: { architecture: 'x86_64', platform: 'bare-metal', formFactor: 'handheld', bootMedium: 'nvme-ssd' }
      },
      {
        id: 'used_server_rack',
        label: 'Used Enterprise Rack Server (Craigslist / eBay 1U/2U/4U)',
        description: 'Scored a cheap Dell PowerEdge (R720/R730), HP ProLiant (DL380), or Supermicro rack server? Ideal for Proxmox VE hypervisors or multi-bay ZFS storage',
        icon: '🖧',
        appliesCriteria: { architecture: 'x86_64', platform: 'server', footprint: 'full', formFactor: 'server', bootMedium: 'nvme-ssd' }
      },
      {
        id: 'apple_silicon_mac',
        label: 'Apple Silicon Mac (M1 / M2 / M3 / M4 MacBook, Mini, Studio)',
        description: 'Modern ARM Apple hardware. Native bare-metal Linux via Fedora Asahi Remix with conformant Vulkan/OpenGL GPU drivers and speaker DSP',
        icon: '🍎',
        appliesCriteria: { architecture: 'arm64', platform: 'bare-metal', footprint: 'full', formFactor: 'mac', bootMedium: 'nvme-ssd' }
      },
      {
        id: 'snapdragon_arm_laptop',
        label: 'Snapdragon / ARM Laptop (Snapdragon X Elite, ThinkPad X13s, Surface Pro X)',
        description: 'Modern Qualcomm ARM64 laptops with extreme 20+ hour battery life, supported in upstream Linux kernels 6.11+',
        icon: '🐉',
        appliesCriteria: { architecture: 'arm64', platform: 'bare-metal', footprint: 'standard', formFactor: 'laptop', bootMedium: 'nvme-ssd' }
      },
      {
        id: 'windows_wsl2',
        label: 'Windows 10 / 11 Subsystem for Linux (WSL2)',
        description: 'Run native Linux directly inside Windows alongside your Windows desktop without dual-booting or repartitioning',
        icon: '🪟',
        appliesCriteria: { platform: 'wsl2', footprint: 'minimal' }
      },
      {
        id: 'riscv_board',
        label: 'RISC-V Board or PC (VisionFive 2, Milk-V, SpacemiT)',
        description: 'Open-standard instruction set architecture (ISA) single-board computer or developer workstation',
        icon: '📐',
        appliesCriteria: { architecture: 'riscv64', platform: 'embedded-sbc', footprint: 'lean', formFactor: 'sbc', bootMedium: 'sd-card-usb' }
      },
      {
        id: 'budget_laptop',
        label: 'Chromebook or Budget Laptop (Intel or AMD)',
        description: 'Low-cost laptops with about 4 GB RAM and small eMMC storage: Chromebooks, netbooks, and budget Windows laptops (Celeron, Pentium, Athlon)',
        icon: '💻',
        appliesCriteria: { architecture: 'x86_64', platform: 'bare-metal', formFactor: 'budget-laptop', bootMedium: 'nvme-ssd' }
      },
      {
        id: 'wifi_router',
        label: 'Wi-Fi Router or Outdoor Radio',
        description: 'A cheap home router or outdoor Wi-Fi radio that OpenWrt supports (TP-Link, GL.iNet, Ubiquiti, and similar)',
        icon: '📡',
        appliesCriteria: { platform: 'router-firewall', footprint: 'minimal', formFactor: 'low-power' },
        showIf: (criteria) => criteria.useCase === 'community-network' || criteria.useCase === 'router-networking'
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
        isDefault: true,
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
        description: 'ARM Cortex-M, STM32, ESP32, RP2040 — RTOS (Zephyr / FreeRTOS), MicroPython, or uClinux NOMMU',
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
      title: 'Open Source Systems are Incredibly Lean',
      text: 'While Windows 11 idles at 3.5GB to 4GB of RAM, lightweight systems like antiX, Haiku, and FreeDOS idle at just 2MB to 150MB of RAM, making older machines feel brand new.'
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
        appliesCriteria: { maxRamMb: 4096 }
      },
      {
        id: 'plenty',
        label: 'Plenty (8 GB RAM or more)',
        description: 'Modern desktop, gaming PC, or workstation',
        icon: '🚀',
        appliesCriteria: { maxRamMb: 8192 }
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

  // --- STEP 5: DISPLAY INTERFACE (Screen vs Headless) ---
  {
    id: 'display_mode',
    order: 5,
    isOptional: true,
    prompt: 'Will this device have a screen attached, or run with no screen?',
    subtext: 'Choose Screen if you are plugging in a monitor, TV, or touchscreen (desktop, media center, kiosk, or full-screen app).',
    category: 'software',
    shouldAsk: (criteria) =>
      !decidedInGoalMode(criteria, 'prefersGui') &&
      criteria.useCase !== 'browser-wasm' &&
      criteria.useCase !== 'container-base' &&
      criteria.useCase !== 'k8s-cluster' &&
      criteria.platform !== 'container' &&
      criteria.platform !== 'k8s-node' &&
      criteria.platform !== 'microcontroller' &&
      criteria.architecture !== 'nommu',
    tip: {
      icon: '🖥️',
      title: 'Screen vs. No Screen (Headless)',
      text: 'Display drivers and a graphical interface add 300MB–1GB of packages. Running without a screen (headless) uses ~5x less RAM and boots faster—ideal for servers or devices managed over SSH or a web browser.'
    },
    options: [
      {
        id: 'graphical_desktop',
        label: 'Screen / Display Attached (Monitor, TV, or Touchscreen)',
        description: 'Shows a desktop, TV media center (Kodi), full-screen app, map, or dashboard on a connected screen',
        icon: '🖼️',
        appliesCriteria: { prefersGui: true }
      },
      {
        id: 'headless_terminal',
        label: 'No Screen (Headless / Remote SSH or Web Dashboard)',
        description: 'No monitor or display server; manage entirely via terminal, SSH, or a web browser from another device',
        icon: '⌨️',
        appliesCriteria: { prefersGui: false }
      }
    ]
  },

  // --- STEP 5B: DESKTOP WORKFLOW & INTERFACE FAMILIARITY ---
  {
    id: 'desktop_workflow_style',
    order: 5,
    isOptional: true,
    prompt: 'What desktop layout and interface style feels most natural to you?',
    subtext: 'We tailor the desktop environment and distribution to match your muscle memory.',
    category: 'software',
    shouldAsk: (criteria) =>
      criteria.prefersGui === true &&
      !decidedInGoalMode(criteria, 'workflowStyle') &&
      criteria.desktopEnv === undefined &&
      criteria.useCase !== 'appliance-product' &&
      criteria.useCase !== 'kiosk-signage' &&
      criteria.useCase !== 'browser-wasm' &&
      criteria.useCase !== 'container-base' &&
      criteria.useCase !== 'k8s-cluster' &&
      criteria.platform !== 'kiosk' &&
      criteria.platform !== 'container' &&
      criteria.platform !== 'k8s-node',
    tip: {
      icon: '🎨',
      title: 'Muscle Memory Matters',
      text: 'Switching to open-source systems is easiest when your desktop layout feels familiar! Distributions offer desktop environments tailored for Windows switchers (Linux Mint, ReactOS), macOS users (Pop!_OS/COSMIC, GNOME), or lightweight traditional setups (Haiku, antiX).'
    },
    options: [
      {
        id: 'windows_style',
        label: 'Windows-Style (Taskbar & Start Menu)',
        description: 'Bottom taskbar, system tray on the right, traditional Start menu (Linux Mint Cinnamon, KDE Plasma)',
        icon: '🪟',
        appliesCriteria: { workflowStyle: 'windows' }
      },
      {
        id: 'macos_style',
        label: 'macOS-Style (Dock, Top Bar & Gestures)',
        description: 'Centered app dock, global top bar, Spotlight-style app launcher, and smooth trackpad gestures (Pop!_OS, GNOME, Ubuntu)',
        icon: '🍏',
        appliesCriteria: { workflowStyle: 'macos' }
      },
      {
        id: 'mobile_touch_style',
        label: 'Tablet / Mobile / Chromebook (Icon Grid & Touch First)',
        description: 'Full-screen app grid, large tap targets, and touch gestures similar to iPadOS, Android, and ChromeOS (Endless OS, GNOME Touch)',
        icon: '📱',
        appliesCriteria: { workflowStyle: 'mobile-touch' }
      },
      {
        id: 'compact_traditional_style',
        label: 'Lightweight / Traditional Desktop',
        description: 'Minimalist, low-RAM interface with traditional menus and maximum responsiveness on older hardware (antiX, Haiku, XFCE)',
        icon: '🪶',
        appliesCriteria: { workflowStyle: 'traditional-compact' }
      },
      {
        id: 'no_preference_workflow',
        label: 'No Preference / Open to Any Style',
        description: 'Recommend whatever best fits my hardware and technical use case',
        icon: '⚖️',
        isDefault: true,
        appliesCriteria: { workflowStyle: 'no-preference' }
      }
    ]
  },

  // --- STEP 6: RELEASE CADENCE ---
  {
    id: 'release_cadence',
    order: 6,
    isOptional: true,
    prompt: 'How often do you want big software updates?',
    subtext: 'Fewer changes keep things stable; more frequent updates bring newer apps and drivers.',
    category: 'lifecycle',
    shouldAsk: (criteria) => criteria.useCase !== 'browser-wasm' && !decidedInGoalMode(criteria, 'releaseCadence'),
    tip: {
      icon: '🔄',
      title: 'Stable vs. latest',
      text: 'Long-term support (LTS) systems such as Debian or Ubuntu LTS get security fixes for years but keep the same app versions. Rolling systems such as Arch update everything continuously, so you always have the newest versions but things change more often. Not sure? Stable is the safe choice.'
    },
    options: [
      {
        id: 'lts_stable',
        label: 'Rarely: Keep It Stable (LTS)',
        description: 'Security fixes for years, with few changes to how things look or work (e.g. Debian, Ubuntu LTS, Linux Mint)',
        icon: '🛡️',
        isDefault: true,
        appliesCriteria: { releaseCadence: 'lts' }
      },
      {
        id: 'standard_release',
        label: 'Every Few Months (Standard Releases)',
        description: 'A bigger upgrade about twice a year, with fairly new apps in between (e.g. Fedora, Ubuntu standard)',
        icon: '⏱️',
        appliesCriteria: { releaseCadence: 'standard' }
      },
      {
        id: 'rolling_bleeding',
        label: 'Always the Latest (Rolling)',
        description: 'Install once and keep updating; always the newest apps and drivers, with more frequent changes (e.g. Arch, openSUSE Tumbleweed)',
        icon: '🔄',
        appliesCriteria: { releaseCadence: 'rolling' }
      }
    ]
  },

  // --- STEP 7: DRIVER PHILOSOPHY ---
  {
    id: 'driver_philosophy',
    order: 7,
    isOptional: true,
    prompt: 'What is your philosophy on hardware drivers and proprietary software?',
    subtext: 'Zero-effort proprietary drivers (NVIDIA GPUs, Broadcom Wi-Fi) vs 100% Free / Open Source Software.',
    category: 'software',
    shouldAsk: (criteria) =>
      !decidedInGoalMode(criteria, 'driverPhilosophy') &&
      criteria.useCase !== 'browser-wasm' &&
      criteria.platform !== 'container' &&
      criteria.platform !== 'k8s-node' &&
      criteria.platform !== 'microcontroller' &&
      criteria.platform !== 'wsl2' &&
      criteria.architecture !== 'nommu',
    tip: {
      icon: '⚙️',
      title: 'Driver Freedom & Binary Blobs',
      text: 'Modern hardware (especially NVIDIA graphics cards and Broadcom Wi-Fi chips) often requires proprietary binary blobs. Distros like Pop!_OS and Linux Mint include them out of the box, whereas pure GNU distros exclude them.'
    },
    options: [
      {
        id: 'seamless_proprietary',
        label: 'Seamless & Turnkey (Include NVIDIA & Wi-Fi Blobs)',
        description: 'Maximum convenience: out-of-the-box proprietary GPU drivers, Wi-Fi firmware, and media codecs',
        icon: '🎮',
        isDefault: true,
        appliesCriteria: { driverPhilosophy: 'seamless-proprietary' }
      },
      {
        id: 'free_software_only',
        label: '100% Free / Open Source Only (Strict FSF / Libre)',
        description: 'Principled open-source: zero closed-source binary blobs, strict Free Software Foundation compliance',
        icon: '🕊️',
        appliesCriteria: { driverPhilosophy: 'free-software-only' }
      },
      {
        id: 'no_preference_drivers',
        label: 'No Strong Preference / Standard Balance',
        description: 'Standard Linux driver defaults with optional non-free firmware repositories when needed',
        icon: '⚖️',
        appliesCriteria: { driverPhilosophy: 'no-preference' }
      }
    ]
  },
  {
    id: 'deployment_site',
    order: 7,
    isOptional: true,
    prompt: 'Where will this machine run?',
    subtext: 'Shared and remote sites favour long-term releases, and some driver licences treat a home rig and a datacenter rack differently.',
    category: 'hardware',
    shouldAsk: (criteria) =>
      !decidedInGoalMode(criteria, 'deploymentSite') &&
      ((!!criteria.useCase && SERVER_SITE_USE_CASES.has(criteria.useCase)) ||
        (criteria.driverPhilosophy === 'seamless-proprietary' && criteria.platform === 'server')),
    tip: {
      icon: '⚖️',
      title: 'Why we ask',
      text: "Offices, datacenters, and community sites need systems that stay stable with little hands-on care, so we favour long-term releases there. NVIDIA's free GeForce/Titan driver licence also does not cover datacenter deployment; home rigs and homelabs are fine."
    },
    options: [
      {
        id: 'home_homelab',
        label: 'Home or Homelab',
        description: 'A machine in your home, garage, or personal homelab rack',
        icon: '🏠',
        appliesCriteria: { deploymentSite: 'home' }
      },
      {
        id: 'office_small_business',
        label: 'Office or Small-Business Server Room',
        description: 'A server closet or small rack at a shop, office, school, or club',
        icon: '🏢',
        appliesCriteria: { deploymentSite: 'office' }
      },
      {
        id: 'community_remote',
        label: 'Community or Remote Site',
        description: 'A school, clinic, village, or co-op, often with limited power or internet',
        icon: '🏘️',
        appliesCriteria: { deploymentSite: 'community' }
      },
      {
        id: 'datacenter_hosting_isp',
        label: 'Datacenter, Colocation, Hosting, or ISP Network',
        description: 'Racks serving customers: colocation, VPS/GPU hosting, or a wireless/community ISP',
        icon: '🏭',
        appliesCriteria: { deploymentSite: 'datacenter' }
      }
    ]
  },

  // --- STEP 8: BOOT MEDIUM ---
  {
    id: 'boot_medium',
    order: 8,
    isOptional: true,
    prompt: 'Where will this system be installed and booted from?',
    subtext: 'Storage drive medium affects filesystem caching, wear reduction, and RAM disk architecture.',
    category: 'hardware',
    shouldAsk: (criteria) =>
      !decidedInGoalMode(criteria, 'bootMedium') &&
      criteria.useCase !== 'browser-wasm' &&
      criteria.platform !== 'container' &&
      criteria.platform !== 'wsl2' &&
      criteria.platform !== 'microcontroller' &&
      criteria.architecture !== 'nommu',
    tip: {
      icon: '💾',
      title: 'Flash Wear Reduction & RAM Disks',
      text: 'MicroSD cards and USB thumbdrives have limited write cycles. Specialized distributions like DietPi, LibreELEC, and Batocera mount logs and temporary directories in RAM (zram) to prevent card burn-out.'
    },
    options: [
      {
        id: 'nvme_ssd',
        label: 'Internal NVMe / SATA SSD or Hard Drive',
        description: 'Standard high-speed persistent disk storage on desktop, laptop, or server',
        icon: '⚡',
        isDefault: true,
        appliesCriteria: { bootMedium: 'nvme-ssd' }
      },
      {
        id: 'sd_card_usb',
        label: 'MicroSD Card or USB Flash Thumbdrive',
        description: 'Flash storage that benefits from RAM log caching, write reduction, and read-only root options',
        icon: '💾',
        appliesCriteria: { bootMedium: 'sd-card-usb' }
      },
      {
        id: 'pxe_diskless',
        label: 'Network Boot (PXE / Diskless / Run-from-RAM)',
        description: 'Diskless boot over Ethernet; runs entirely in RAM with no local persistent disk required',
        icon: '🌐',
        appliesCriteria: { bootMedium: 'pxe-diskless' }
      }
    ]
  },

  // --- REMOTE & OFF-GRID SITES: POWER AND INTERNET ---
  {
    id: 'power_supply',
    order: 8,
    isOptional: true,
    prompt: 'How is this machine powered?',
    subtext: 'Off-grid sites need light systems that survive sudden power loss.',
    category: 'hardware',
    shouldAsk: (criteria) => isRemoteSiteBuild(criteria),
    tip: {
      icon: '🔋',
      title: 'Power cuts corrupt ordinary installs',
      text: 'A system with a read-only or image-based root filesystem comes back cleanly after the power drops. On solar or battery, a Raspberry Pi-class board draws a few watts, versus 30–100 W for an old PC.'
    },
    options: [
      {
        id: 'mains_reliable',
        label: 'Reliable Mains Power',
        description: 'Grid power that rarely cuts out',
        icon: '🔌',
        appliesCriteria: { powerSupply: 'mains' }
      },
      {
        id: 'mains_unreliable',
        label: 'Mains With Frequent Cuts',
        description: 'Grid or generator power that drops out regularly',
        icon: '⚡',
        appliesCriteria: { powerSupply: 'unreliable' }
      },
      {
        id: 'solar_battery',
        label: 'Solar Panel or Battery',
        description: 'Off-grid: every watt counts',
        icon: '☀️',
        appliesCriteria: { powerSupply: 'solar-battery' }
      }
    ]
  },
  {
    id: 'internet_uplink',
    order: 8,
    isOptional: true,
    prompt: 'What internet connection does the site have?',
    subtext: 'Offline and slow sites need systems that rarely need big updates.',
    category: 'lifecycle',
    shouldAsk: (criteria) => isRemoteSiteBuild(criteria),
    tip: {
      icon: '🛰️',
      title: 'Plan updates around the connection',
      text: 'With little or no internet, prefer long-term releases and download content or updates where bandwidth exists, then carry them in on a USB drive.'
    },
    options: [
      {
        id: 'uplink_fast',
        label: 'Reliable Broadband or Fibre',
        description: 'Updates and downloads are not a problem',
        icon: '🚀',
        appliesCriteria: { uplink: 'fast' }
      },
      {
        id: 'uplink_slow',
        label: 'Slow, Metered, or Satellite',
        description: 'Every gigabyte costs time or money',
        icon: '🐢',
        appliesCriteria: { uplink: 'slow' }
      },
      {
        id: 'uplink_none',
        label: 'No Internet (Offline Site)',
        description: 'Local network only; updates arrive on a USB drive',
        icon: '🏝️',
        appliesCriteria: { uplink: 'none' }
      }
    ]
  },

  // --- STEP 9: REALTIME AUDIO ---
  {
    id: 'audio_latency',
    order: 9,
    isOptional: true,
    prompt: 'Will this system be used for pro-audio production or low-latency music creation?',
    subtext: 'Real-time audio processing (DAWs, software synthesizers, MIDI) requires a low-latency realtime kernel.',
    category: 'software',
    shouldAsk: (criteria) =>
      criteria.prefersGui !== false &&
      !decidedInGoalMode(criteria, 'realtimeAudio') &&
      !NON_AUDIO_USE_CASES.has(criteria.useCase || '') &&
      !NON_INTERACTIVE_PLATFORMS.has(criteria.platform || '') &&
      criteria.architecture !== 'nommu' &&
      criteria.footprint !== 'micro',
    tip: {
      icon: '🎵',
      title: 'Pro Audio & Realtime Kernels',
      text: 'Standard kernels prioritize throughput over sub-millisecond latency. Professional digital audio workstations (Ardour, Reaper, Bitwig) require PREEMPT_RT or lowlatency kernels to avoid audio buffer xruns and crackles.'
    },
    options: [
      {
        id: 'pro_audio_realtime',
        label: 'Yes, Pro Audio Studio / Low-Latency Realtime Kernel',
        description: 'PipeWire pro-audio, JACK, PREEMPT_RT / lowlatency kernel for DAWs, synths, and guitar amps',
        icon: '🎵',
        appliesCriteria: { realtimeAudio: true }
      },
      {
        id: 'standard_audio',
        label: 'No, Standard Audio & Everyday Multimedia',
        description: 'Standard desktop audio stack (PulseAudio / standard PipeWire) for music, movies, and conferencing',
        icon: '🔊',
        isDefault: true,
        appliesCriteria: { realtimeAudio: false }
      }
    ]
  },

  // --- STEP 10: ATTACHED PERIPHERALS & DISPLAYS ---
  {
    id: 'attached_peripherals',
    order: 10,
    isOptional: true,
    isMultiSelect: true,
    prompt: 'Do you have any specialized peripherals or attached displays?',
    subtext: 'Standard mouse, keyboard, and screen are fully supported out of the box. Select any specialized hardware you also plan to connect:',
    category: 'hardware',
    shouldAsk: (criteria) =>
      criteria.prefersGui !== false &&
      !NON_PERIPHERAL_USE_CASES.has(criteria.useCase || '') &&
      !NON_INTERACTIVE_PLATFORMS.has(criteria.platform || '') &&
      criteria.architecture !== 'nommu' &&
      criteria.footprint !== 'micro',
    tip: {
      icon: '🔌',
      title: 'Peripherals & Display Servers',
      text: 'Touchscreens and mixed 4K/1080p multi-monitors require modern Wayland compositors for smooth gestures and fractional scaling. Wi-Fi printers benefit from pre-bundled CUPS and mDNS daemons.'
    },
    options: [
      {
        id: 'standard_peripherals',
        label: 'Standard Mouse, Keyboard & Screen Only',
        description: 'Everyday standard desktop or laptop peripherals with no special hardware requirements',
        icon: '🖥️',
        isDefault: true,
        appliesCriteria: { peripherals: ['standard'], peripheralNeed: 'standard' }
      },
      {
        id: 'touchscreen_tablet',
        label: 'Touchscreen, Tablet, or 2-in-1 Laptop',
        description: 'Requires native Wayland multi-touch gestures, auto-screen rotation, and virtual on-screen keyboards',
        icon: '📱',
        appliesCriteria: { peripherals: ['touchscreen'], peripheralNeed: 'touchscreen' }
      },
      {
        id: 'printers_scanners',
        label: 'Home or Office Printers & Document Scanners',
        description: 'Requires turnkey CUPS printing, automatic Bonjour/mDNS Wi-Fi printer discovery, and HP/Brother drivers',
        icon: '🖨️',
        appliesCriteria: { peripherals: ['printer-scanner'], peripheralNeed: 'printer-scanner' }
      },
      {
        id: 'vr_gaming_rig',
        label: 'Virtual Reality (VR) Headset or Flight/Sim Rig',
        description: 'Requires SteamVR compatibility, DRM display leasing, cutting-edge Vulkan drivers, and Monado OpenXR',
        icon: '🥽',
        appliesCriteria: { peripherals: ['vr-headset'], peripheralNeed: 'vr-headset' }
      },
      {
        id: 'drawing_tablet',
        label: 'Drawing Tablet or Pen Stylus (Wacom / Huion)',
        description: 'Requires digitizer kernel drivers, pressure sensitivity calibration, and creative tool integration',
        icon: '🎨',
        appliesCriteria: { peripherals: ['drawing-tablet'], peripheralNeed: 'drawing-tablet' }
      },
      {
        id: 'mixed_dpi_monitors',
        label: 'Multiple Monitors or Mixed 4K / High-DPI Displays',
        description: 'Requires per-monitor Wayland fractional scaling (125%/150%) and independent refresh rates without blur',
        icon: '📺',
        appliesCriteria: { peripherals: ['mixed-dpi'], peripheralNeed: 'mixed-dpi' }
      }
    ]
  },

  // --- STEP 11: IMMUTABILITY (Only for Intermediate & Systems Engineers) ---
  {
    id: 'system_immutability',
    order: 11,
    isOptional: true,
    prompt: 'How should system state and configuration changes be managed?',
    subtext: 'Traditional mutable OSes vs. modern immutable / declarative architectures.',
    category: 'lifecycle',
    shouldAsk: (criteria) =>
      criteria.experienceLevel !== 'beginner' &&
      criteria.platform !== 'microcontroller' &&
      criteria.architecture !== 'nommu',
    tip: {
      icon: '🛡️',
      title: 'Appliance Secret: Immutability',
      text: 'Commercial appliances and smart home hubs lock `/usr` as read-only. If someone yanks the power cable or an update fails, the device falls back to the previous boot partition automatically.'
    },
    options: [
      {
        id: 'traditional_mutable',
        label: 'Traditional Mutable (apt, dnf, pacman)',
        description: 'Standard mutable OS: install and tweak packages whenever you want',
        icon: '🛠️',
        isDefault: true,
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

  // --- STEP 11: C LIBRARY & INIT (Only for Systems Engineers) ---
  {
    id: 'c_library_and_init',
    order: 11,
    isOptional: true,
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
        id: 'glibc_systemd',
        label: 'glibc + systemd',
        description: 'Broadest binary compatibility with commercial drivers and proprietary software',
        icon: '🏢',
        isDefault: true,
        appliesCriteria: { cLibPreference: 'glibc', initPreference: 'systemd' }
      },
      {
        id: 'musl_busybox',
        label: 'musl libc + BusyBox / OpenRC',
        description: 'Maximum space savings, fastest cold boot, static linking friendly',
        icon: '⚡',
        appliesCriteria: { cLibPreference: 'musl', initPreference: 'openrc' }
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

  // --- STEP 12: ROOT FILESYSTEM & STORAGE (Only for Systems Engineers) ---
  {
    id: 'filesystem_and_storage',
    order: 12,
    isOptional: true,
    prompt: 'Root Filesystem & Storage Architecture',
    subtext: 'Standard ext4 vs. snapshot-capable Btrfs/ZFS, flash-friendly F2FS, or high-throughput XFS.',
    category: 'software',
    shouldAsk: (criteria) =>
      criteria.experienceLevel === 'systems-engineer' &&
      criteria.platform !== 'microcontroller' &&
      criteria.architecture !== 'nommu',
    tip: {
      icon: '💾',
      title: 'Filesystem Trade-Offs',
      text: 'ext4 is rock-solid and universally supported. Btrfs and ZFS provide copy-on-write snapshots and rollback. F2FS minimizes flash write amplification on MicroSD and eMMC.'
    },
    options: [
      {
        id: 'ext4',
        label: 'ext4 (Standard Journaled)',
        description: 'Battle-tested Linux standard with minimal overhead and maximum tool support',
        icon: '📁',
        isDefault: true,
        appliesCriteria: { fileSystem: 'ext4' }
      },
      {
        id: 'btrfs',
        label: 'Btrfs (Snapshots & Subvolumes)',
        description: 'Copy-on-write filesystem with subvolume rollbacks and transparent zstd compression',
        icon: '🌳',
        appliesCriteria: { fileSystem: 'btrfs' }
      },
      {
        id: 'zfs',
        label: 'OpenZFS (Storage Pools & RAID-Z)',
        description: 'Enterprise storage pools, dataset snapshots, end-to-end checksumming, and RAID-Z',
        icon: '🛡️',
        appliesCriteria: { fileSystem: 'zfs' }
      },
      {
        id: 'xfs',
        label: 'XFS (High-Throughput Enterprise)',
        description: 'Parallel I/O allocation groups designed for large scale-out database servers',
        icon: '⚡',
        appliesCriteria: { fileSystem: 'xfs' }
      },
      {
        id: 'f2fs',
        label: 'F2FS (Flash-Friendly for SD/eMMC)',
        description: 'Log-structured filesystem optimized for NAND flash endurance and random I/O',
        icon: '💾',
        appliesCriteria: { fileSystem: 'f2fs' }
      }
    ]
  }
];
