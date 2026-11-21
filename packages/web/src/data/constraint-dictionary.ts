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
    'iot-embedded': { label: 'IoT & Microcontrollers', icon: '🤖' },
    'security-pentest': { label: 'Cybersecurity & Privacy', icon: '🛡️' }
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
  },
  fileSystem: {
    ext4: { label: 'ext4 Journaled File System', icon: '📁' },
    btrfs: { label: 'Btrfs (Snapshots & Subvolumes)', icon: '🌳' },
    zfs: { label: 'OpenZFS (Storage Pools & Datasets)', icon: '🛡️' },
    xfs: { label: 'XFS (Enterprise Scalable)', icon: '⚡' },
    f2fs: { label: 'F2FS (Flash-Friendly SD/eMMC)', icon: '💾' },
    fat32: { label: 'FAT32 (Legacy MS-DOS)', icon: '💾' }
  },
  kernelFlavor: {
    'lts-stable': { label: 'LTS Stable Kernel', icon: '🐧' },
    'realtime-rt': { label: 'PREEMPT_RT Realtime Low-Latency', icon: '⏱️' },
    hardened: { label: 'Hardened Security Kernel', icon: '🛡️' },
    'zen-liquorix': { label: 'Zen / Liquorix Low-Latency Desktop', icon: '🚀' }
  },
  bootloader: {
    'grub-hybrid': { label: 'GRUB 2 Hybrid (BIOS + UEFI)', icon: '🥾' },
    'systemd-boot': { label: 'systemd-boot Minimal UEFI', icon: '⚡' },
    'u-boot': { label: 'Das U-Boot (ARM & RISC-V SBCs)', icon: '🔌' },
    efistub: { label: 'Direct EFISTUB Kernel Boot', icon: '🚀' }
  },
  securityProfile: {
    'standard-dac': { label: 'Standard POSIX DAC', icon: '🔑' },
    selinux: { label: 'SELinux Enforcing MAC', icon: '🛡️' },
    apparmor: { label: 'AppArmor Path-Based MAC', icon: '🏰' },
    'amnesic-ram': { label: 'Amnesic RAM Incognito', icon: '🕵️' }
  },
  firmwareMode: {
    uefi: { label: 'UEFI Firmware (GPT)', icon: '🧬' },
    'legacy-bios': { label: 'Legacy BIOS / CSM (MBR)', icon: '🕰️' }
  },
  secureBoot: {
    required: { label: 'Secure Boot (Signed Shim)', icon: '🔏' },
    'own-keys': { label: 'Secure Boot (Own Keys)', icon: '🗝️' }
  },
  tpmUsage: {
    'measured-boot': { label: 'TPM 2.0 Measured Boot', icon: '📟' },
    'disk-unlock': { label: 'TPM-Sealed Disk Unlock', icon: '🔐' }
  },
  virtHost: {
    'kvm-qemu': { label: 'KVM / QEMU Hypervisor Host', icon: '🖧' },
    xen: { label: 'Xen Hypervisor (dom0)', icon: '🧊' },
    bhyve: { label: 'bhyve Hypervisor (FreeBSD)', icon: '😈' },
    'container-only': { label: 'Container Host (No VM Hypervisor)', icon: '📦' }
  },
  devicePassthrough: {
    'gpu-vfio': { label: 'GPU Passthrough (IOMMU / VFIO)', icon: '🎮' },
    'pci-devices': { label: 'PCI Device Passthrough (VFIO)', icon: '🔌' }
  },
  guestPlatform: {
    kvm: { label: 'Guest on KVM / QEMU', icon: '🖥️' },
    vmware: { label: 'Guest on VMware', icon: '☁️' },
    hyperv: { label: 'Guest on Hyper-V', icon: '🪟' },
    virtualbox: { label: 'Guest on VirtualBox', icon: '📦' }
  },
  networkingStack: {
    networkmanager: { label: 'NetworkManager (Desktop & Wi-Fi)', icon: '📶' },
    'systemd-networkd': { label: 'systemd-networkd Daemon', icon: '⚙️' },
    'nftables-pf': { label: 'nftables / BSD Packet Filter (pf)', icon: '🔥' },
    'busybox-minimal': { label: 'BusyBox Minimal Networking', icon: '🧰' }
  }
};
