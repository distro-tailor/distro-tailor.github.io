export interface FormattedConstraint {
  label: string;
  icon: string;
}

/**
 * Central dictionary mapping canonical criteria keys and discrete option values
 * to human-readable labels and emoji iconography.
 */
export const CONSTRAINT_DICTIONARY: Record<string, Record<string, FormattedConstraint>> = {
  experienceLevel: {
    beginner: { label: 'Beginner / Goal-Oriented', icon: '🌱' },
    intermediate: { label: 'Comfortable Tinkerer', icon: '🌿' },
    'systems-engineer': { label: 'Systems Hacker', icon: '🌳' }
  },
  useCase: {
    'media-center': { label: 'Living Room Media Center', icon: '📺' },
    gaming: { label: 'Retro Gaming Console', icon: '🕹️' },
    'education-kids': { label: 'Kid-Safe School & Coding', icon: '🎓' },
    'nas-storage': { label: 'Family Photo & Video NAS', icon: '📦' },
    'smart-home': { label: 'Smart Home Hub', icon: '🏡' },
    'appliance-product': { label: 'Dedicated Single-App Appliance', icon: '🛠️' },
    'ai-gpu-compute': { label: 'AI, LLM & GPU Compute', icon: '🧠' },
    'hypervisor-vms': { label: 'Homelab Virtualization & Hypervisor', icon: '🖧' },
    'home-office': { label: 'Home Office & Freelancer Workstation', icon: '💼' },
    'creative-studio': { label: 'Creative Studio (Art, 3D & Video)', icon: '🎨' },
    'router-networking': { label: 'Home Router & Firewall', icon: '📡' },
    'kiosk-signage': { label: 'Store Display & Kiosk', icon: '🏪' },
    desktop: { label: 'Everyday Desktop', icon: '💻' },
    'browser-wasm': { label: 'In-Browser Linux (WASM)', icon: '🌐' },
    server: { label: 'Home Server & Cloud', icon: '🏠' },
    'container-base': { label: 'Container Base Image', icon: '🐳' },
    'k8s-cluster': { label: 'Kubernetes Cluster Node', icon: '☸️' },
    'iot-embedded': { label: 'IoT & Microcontrollers', icon: '🤖' }
  },
  platform: {
    'bare-metal': { label: 'Physical PC / Laptop', icon: '💻' },
    'embedded-sbc': { label: 'Raspberry Pi / Mini Board', icon: '🍓' },
    kiosk: { label: 'Locked Kiosk', icon: '🔒' },
    'browser-wasm': { label: 'Web Browser VM', icon: '🌐' },
    'router-firewall': { label: 'Router Appliance', icon: '📡' },
    vm: { label: 'Virtual Machine', icon: '🖧' },
    wsl2: { label: 'Windows Subsystem for Linux (WSL2)', icon: '🪟' },
    container: { label: 'Docker Container', icon: '🐳' }
  },
  architecture: {
    x86_64: { label: 'Standard 64-bit PC', icon: '💻' },
    arm64: { label: 'ARM64 (Raspberry Pi 4/5 / Apple Silicon / Snapdragon)', icon: '📱' },
    armv7: { label: '32-bit ARM (Older Pi)', icon: '📟' },
    riscv64: { label: 'RISC-V 64-bit Board', icon: '📐' },
    nommu: { label: 'Microcontroller (NOMMU)', icon: '🔌' }
  },
  formFactor: {
    desktop: { label: 'Desktop PC / Tower', icon: '🖥️' },
    laptop: { label: 'Laptop / Notebook', icon: '💻' },
    handheld: { label: 'Handheld Gaming PC', icon: '🎮' },
    'low-power': { label: 'Low-Power / Ancient PC', icon: '👴' },
    mac: { label: 'Apple Mac Hardware', icon: '🍏' },
    sbc: { label: 'Single-Board Computer', icon: '🍓' },
    server: { label: 'Enterprise Rack Server', icon: '🖧' }
  },
  footprint: {
    micro: { label: 'Extreme Micro (<16MB)', icon: '🪶' },
    minimal: { label: 'Ultra-Light (<1GB RAM)', icon: '⚡' },
    lean: { label: 'Lean (1-2GB RAM)', icon: '📦' },
    standard: { label: 'Standard (4-8GB RAM)', icon: '🚀' },
    full: { label: 'Full Workstation', icon: '🎮' }
  },
  statePreference: {
    mutable: { label: 'Traditional Mutable (apt/dnf)', icon: '✏️' },
    'traditional-mutable': { label: 'Traditional Mutable (apt/dnf)', icon: '✏️' },
    declarative: { label: 'Declarative (NixOS / Guix)', icon: '❄️' },
    'stateless-ram': { label: 'Stateless / Run from RAM', icon: '⚡' },
    'read-only-rootfs': { label: 'Read-Only RootFS (OverlayFS)', icon: '🔒' },
    'immutable-ostree': { label: 'Atomic / Immutable (OSTree)', icon: '🛡️' }
  },
  cLibPreference: {
    glibc: { label: 'GNU C Library (glibc)', icon: '📚' },
    musl: { label: 'musl libc (Lean & Fast)', icon: '🪶' },
    'uclibc-ng': { label: 'uClibc-ng (Embedded)', icon: '🔌' },
    uclibc: { label: 'uClibc-ng (Embedded)', icon: '🔌' }
  },
  initPreference: {
    systemd: { label: 'systemd (Standard)', icon: '⚙️' },
    openrc: { label: 'OpenRC (Lightweight)', icon: '⚡' },
    runit: { label: 'runit (Minimalist)', icon: '⏱️' },
    busybox: { label: 'BusyBox Init (Embedded)', icon: '🧰' }
  },
  releaseCadence: {
    lts: { label: 'Stable Long-Term Support (LTS)', icon: '🛡️' },
    rolling: { label: 'Bleeding-Edge Rolling Release', icon: '🔄' },
    standard: { label: 'Standard Release Cycle', icon: '⏱️' }
  },
  driverPhilosophy: {
    'seamless-proprietary': { label: 'Proprietary Drivers (NVIDIA/Wi-Fi)', icon: '🎮' },
    'free-software-only': { label: '100% Free / Open Source Only', icon: '🕊️' },
    'no-preference': { label: 'Standard Driver Balance', icon: '⚖️' }
  },
  workflowStyle: {
    windows: { label: 'Windows-Style (Taskbar & Start Menu)', icon: '🪟' },
    macos: { label: 'macOS-Style (Dock, Top Bar & Gestures)', icon: '🍏' },
    'mobile-touch': { label: 'Tablet / Mobile / Chromebook (Touch Grid)', icon: '📱' },
    'traditional-compact': { label: 'Traditional / Lightweight Minimal', icon: '🪶' },
    'no-preference': { label: 'Any Desktop Workflow', icon: '⚖️' }
  },
  bootMedium: {
    'nvme-ssd': { label: 'Internal SSD / NVMe Storage', icon: '⚡' },
    'sd-card-usb': { label: 'MicroSD / USB Flash Drive', icon: '💾' },
    'pxe-diskless': { label: 'Network Boot (PXE / Diskless)', icon: '🌐' }
  },
  realtimeAudio: {
    true: { label: 'Pro Audio (Low-Latency Realtime Kernel)', icon: '🎵' },
    false: { label: 'Standard Everyday Audio', icon: '🔊' }
  },
  peripheralNeed: {
    'touchscreen': { label: 'Touchscreen / 2-in-1 Tablet', icon: '📱' },
    'printer-scanner': { label: 'Home / Office Printers & Scanners', icon: '🖨️' },
    'vr-headset': { label: 'Virtual Reality (VR) / Sim Rig', icon: '🥽' },
    'drawing-tablet': { label: 'Drawing Tablet / Stylus Pen', icon: '🎨' },
    'mixed-dpi': { label: 'Mixed 4K / High-DPI Multi-Monitor', icon: '📺' },
    'standard': { label: 'Standard Mouse, Keyboard & Screen', icon: '🖥️' }
  }
};
