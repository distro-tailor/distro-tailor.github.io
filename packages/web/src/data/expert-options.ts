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
  }
];
