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
  }
];
