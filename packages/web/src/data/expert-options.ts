import { UserCriteria } from '@distro-tailor/core';

export interface ExpertFieldOption {
  value: string;
  label: string;
}

export interface ExpertFieldConfig {
  id: string;
  label: string;
  criteriaKey: keyof UserCriteria;
  placeholder: string;
  options: ExpertFieldOption[];
}

export const EXPERT_FIELDS: ExpertFieldConfig[] = [
  {
    id: 'expert-arch',
    label: 'CPU Architecture',
    criteriaKey: 'architecture',
    placeholder: 'Any Architecture',
    options: [
      { value: 'x86_64', label: 'x86_64 / AMD64' },
      { value: 'arm64', label: 'ARM64 / AArch64' },
      { value: 'armv7', label: 'ARMv7 (32-bit)' },
      { value: 'riscv64', label: 'RISC-V 64-bit' },
      { value: 'nommu', label: 'NOMMU / Microcontroller' }
    ]
  },
  {
    id: 'expert-footprint',
    label: 'Storage & RAM Footprint',
    criteriaKey: 'footprint',
    placeholder: 'Any Footprint',
    options: [
      { value: 'micro', label: 'Extreme Micro (<16 MB)' },
      { value: 'minimal', label: 'Ultra-Minimal (16-100 MB)' },
      { value: 'lean', label: 'Lean (100 MB - 1 GB)' },
      { value: 'standard', label: 'Standard (1 - 5 GB)' },
      { value: 'full', label: 'Full Workstation (>5 GB)' }
    ]
  },
  {
    id: 'expert-init',
    label: 'Init System Preference',
    criteriaKey: 'initPreference',
    placeholder: 'No Preference',
    options: [
      { value: 'systemd', label: 'systemd' },
      { value: 'openrc', label: 'OpenRC' },
      { value: 'busybox', label: 'BusyBox Init' },
      { value: 'runit', label: 'runit' }
    ]
  },
  {
    id: 'expert-clib',
    label: 'C Standard Library',
    criteriaKey: 'cLibPreference',
    placeholder: 'No Preference',
    options: [
      { value: 'glibc', label: 'glibc (GNU C Library)' },
      { value: 'musl', label: 'musl libc' },
      { value: 'uclibc-ng', label: 'uClibc-ng (NOMMU)' }
    ]
  },
  {
    id: 'expert-state',
    label: 'State Management',
    criteriaKey: 'statePreference',
    placeholder: 'Any State Model',
    options: [
      { value: 'mutable', label: 'Traditional Mutable' },
      { value: 'declarative', label: 'Declarative (NixOS)' },
      { value: 'immutable-ostree', label: 'Atomic / Immutable (OSTree)' },
      { value: 'stateless-ram', label: 'Stateless / Run from RAM' }
    ]
  },
  {
    id: 'expert-role',
    label: 'Primary Target Role',
    criteriaKey: 'useCase',
    placeholder: 'Any Role',
    options: [
      { value: 'gaming', label: 'Gaming & Arcade' },
      { value: 'media-center', label: 'Living Room Media Center (Kodi)' },
      { value: 'education-kids', label: 'Kids & Education' },
      { value: 'nas-storage', label: 'NAS & Family Photo Backups' },
      { value: 'game-server', label: 'Game & LAN Party Server' },
      { value: 'community-network', label: 'Community Wi-Fi & Mesh' },
      { value: 'offline-library', label: 'Offline Library Server' },
      { value: 'router-networking', label: 'Router & Firewall' },
      { value: 'kiosk-signage', label: 'Kiosk & Digital Signage' },
      { value: 'container-base', label: 'Container Base Image' },
      { value: 'k8s-cluster', label: 'Kubernetes Node' },
      { value: 'iot-embedded', label: 'IoT & Embedded' },
      { value: 'browser-wasm', label: 'In-Browser WebAssembly' }
    ]
  },
  {
    id: 'expert-release-cadence',
    label: 'Release Cadence',
    criteriaKey: 'releaseCadence',
    placeholder: 'Any Release Model',
    options: [
      { value: 'lts', label: 'Long Term Support (LTS)' },
      { value: 'rolling', label: 'Rolling Release' },
      { value: 'standard', label: 'Standard Release Cycle' }
    ]
  },
  {
    id: 'expert-driver-philosophy',
    label: 'Driver Philosophy',
    criteriaKey: 'driverPhilosophy',
    placeholder: 'No Preference',
    options: [
      { value: 'seamless-proprietary', label: 'Proprietary Drivers Included (NVIDIA/Wi-Fi)' },
      { value: 'free-software-only', label: '100% Free / Open Source Only' },
      { value: 'no-preference', label: 'No Preference / Standard Balance' }
    ]
  },
  {
    id: 'expert-workflow-style',
    label: 'Desktop Interface / Workflow Style',
    criteriaKey: 'workflowStyle',
    placeholder: 'Any Workflow Style',
    options: [
      { value: 'windows', label: 'Windows-Style (Taskbar & Start Menu)' },
      { value: 'macos', label: 'macOS-Style (Dock, Top Bar & Gestures)' },
      { value: 'mobile-touch', label: 'Tablet / Mobile / Chromebook (Icon Grid & Touch)' },
      { value: 'traditional-compact', label: 'Lightweight / Traditional Minimal' },
      { value: 'no-preference', label: 'No Preference' }
    ]
  },
  {
    id: 'expert-boot-medium',
    label: 'Boot Medium',
    criteriaKey: 'bootMedium',
    placeholder: 'Any Boot Medium',
    options: [
      { value: 'nvme-ssd', label: 'Internal NVMe / SATA SSD' },
      { value: 'sd-card-usb', label: 'MicroSD / USB Flash Drive' },
      { value: 'pxe-diskless', label: 'Network Boot (PXE / Diskless)' }
    ]
  },
  {
    id: 'expert-deployment-site',
    label: 'Where It Runs',
    criteriaKey: 'deploymentSite',
    placeholder: 'Any Site',
    options: [
      { value: 'home', label: 'Home or Homelab' },
      { value: 'office', label: 'Office or Small-Business Server Room' },
      { value: 'community', label: 'Community or Remote Site' },
      { value: 'datacenter', label: 'Datacenter, Colocation, Hosting, or ISP' }
    ]
  },
  {
    id: 'expert-power-supply',
    label: 'Power Supply',
    criteriaKey: 'powerSupply',
    placeholder: 'Any Power',
    options: [
      { value: 'mains', label: 'Reliable Mains Power' },
      { value: 'unreliable', label: 'Unreliable Power (Frequent Cuts)' },
      { value: 'solar-battery', label: 'Solar Panel or Battery' }
    ]
  },
  {
    id: 'expert-uplink',
    label: 'Internet Connection',
    criteriaKey: 'uplink',
    placeholder: 'Any Connection',
    options: [
      { value: 'fast', label: 'Reliable Broadband or Fibre' },
      { value: 'slow', label: 'Slow, Metered, or Satellite' },
      { value: 'none', label: 'No Internet (Offline Site)' }
    ]
  },
  {
    id: 'expert-filesystem',
    label: 'Root Filesystem',
    criteriaKey: 'fileSystem',
    placeholder: 'Any Filesystem (Default: ext4)',
    options: [
      { value: 'ext4', label: 'ext4 (Standard Journaled)' },
      { value: 'btrfs', label: 'Btrfs (Snapshots & Subvolumes)' },
      { value: 'zfs', label: 'OpenZFS (Storage Pools & Datasets)' },
      { value: 'xfs', label: 'XFS (High-Throughput Enterprise)' },
      { value: 'f2fs', label: 'F2FS (Flash-Friendly SD/eMMC)' },
      { value: 'fat32', label: 'FAT32 (Legacy MS-DOS)' }
    ]
  },
  {
    id: 'expert-kernel-flavor',
    label: 'Kernel Flavor',
    criteriaKey: 'kernelFlavor',
    placeholder: 'Any Kernel (Default: LTS)',
    options: [
      { value: 'lts-stable', label: 'LTS Stable Upstream Tree' },
      { value: 'realtime-rt', label: 'PREEMPT_RT Realtime Low-Latency' },
      { value: 'hardened', label: 'Hardened / ASLR Attack-Surface Reduction' },
      { value: 'zen-liquorix', label: 'Zen / Liquorix Low-Latency Desktop' }
    ]
  },
  {
    id: 'expert-bootloader',
    label: 'Bootloader & Firmware',
    criteriaKey: 'bootloader',
    placeholder: 'Any Bootloader (Default: GRUB)',
    options: [
      { value: 'grub-hybrid', label: 'GRUB 2 Hybrid (BIOS + UEFI)' },
      { value: 'systemd-boot', label: 'systemd-boot Minimal UEFI' },
      { value: 'u-boot', label: 'Das U-Boot (ARM & RISC-V SBCs)' },
      { value: 'efistub', label: 'Direct EFISTUB Kernel Boot' }
    ]
  },
  {
    id: 'expert-security-profile',
    label: 'Security Hardening',
    criteriaKey: 'securityProfile',
    placeholder: 'Standard DAC (POSIX)',
    options: [
      { value: 'standard-dac', label: 'Standard POSIX DAC' },
      { value: 'selinux', label: 'SELinux Enforcing MAC' },
      { value: 'apparmor', label: 'AppArmor Path-Based MAC' },
      { value: 'amnesic-ram', label: 'Amnesic RAM Incognito (Zero Footprint)' }
    ]
  },
  {
    id: 'expert-firmware-mode',
    label: 'Firmware Mode',
    criteriaKey: 'firmwareMode',
    placeholder: 'Any Firmware (UEFI or BIOS)',
    options: [
      { value: 'uefi', label: 'UEFI (GPT + EFI System Partition)' },
      { value: 'legacy-bios', label: 'Legacy BIOS / CSM (MBR)' }
    ]
  },
  {
    id: 'expert-secure-boot',
    label: 'Secure Boot',
    criteriaKey: 'secureBoot',
    placeholder: 'Not Required',
    options: [
      { value: 'required', label: 'Required (Microsoft-signed shim)' },
      { value: 'own-keys', label: 'Enroll My Own Keys (signed UKI)' }
    ]
  },
  {
    id: 'expert-tpm-usage',
    label: 'TPM 2.0',
    criteriaKey: 'tpmUsage',
    placeholder: 'Not Used',
    options: [
      { value: 'measured-boot', label: 'Measured Boot / Attestation' },
      { value: 'disk-unlock', label: 'TPM-Sealed Disk Unlock' }
    ]
  },
  {
    id: 'expert-virt-host',
    label: 'Virtualization Host',
    criteriaKey: 'virtHost',
    placeholder: 'Not a Hypervisor Host',
    options: [
      { value: 'kvm-qemu', label: 'KVM / QEMU + libvirt' },
      { value: 'xen', label: 'Xen (dom0)' },
      { value: 'bhyve', label: 'bhyve (FreeBSD / illumos)' },
      { value: 'container-only', label: 'Containers Only (Podman / Docker)' }
    ]
  },
  {
    id: 'expert-device-passthrough',
    label: 'Device Passthrough',
    criteriaKey: 'devicePassthrough',
    placeholder: 'None',
    options: [
      { value: 'gpu-vfio', label: 'GPU Passthrough (IOMMU / VFIO)' },
      { value: 'pci-devices', label: 'Any PCI Device (VFIO)' }
    ]
  },
  {
    id: 'expert-guest-platform',
    label: 'Guest Hypervisor (VM Image)',
    criteriaKey: 'guestPlatform',
    placeholder: 'Default (KVM / QEMU)',
    options: [
      { value: 'kvm', label: 'KVM / QEMU (qemu-guest-agent)' },
      { value: 'vmware', label: 'VMware (open-vm-tools)' },
      { value: 'hyperv', label: 'Hyper-V (hyperv-daemons)' },
      { value: 'virtualbox', label: 'VirtualBox (guest utils)' }
    ]
  },
  {
    id: 'expert-networking-stack',
    label: 'Networking Daemon',
    criteriaKey: 'networkingStack',
    placeholder: 'Default (NetworkManager / OS Default)',
    options: [
      { value: 'networkmanager', label: 'NetworkManager (Desktop, Wi-Fi & VPN)' },
      { value: 'systemd-networkd', label: 'systemd-networkd Declarative Daemon' },
      { value: 'nftables-pf', label: 'nftables / BSD Packet Filter (pf)' },
      { value: 'busybox-minimal', label: 'BusyBox Minimal Networking' }
    ]
  }
];
