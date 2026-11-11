import { serializeCriteriaToQuery, UserCriteria } from '@distro-tailor/core';

export interface PersonaPreset {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  winnerDistroName: string;
  recipeId?: string;
  buildTargetDescription: string;
  criteria: UserCriteria;
  urlQuery: string;
}

const RAW_PRESETS: Array<{
  id: string;
  name: string;
  badge: string;
  tagline: string;
  winnerDistroName: string;
  recipeId?: string;
  buildTargetDescription: string;
  criteria: UserCriteria;
}> = [
  {
    id: 'nixos-declarative',
    name: 'Declarative NixOS Workstation',
    badge: 'Flake + VM Sandbox',
    tagline: '100% reproducible workstation with atomic upgrades and instant disposable QEMU test VM.',
    winnerDistroName: 'NixOS',
    recipeId: 'nixos-flake',
    buildTargetDescription: 'make test-vm (QEMU Virtual Machine)',
    criteria: {
      useCase: 'desktop',
      architecture: 'x86_64',
      statePreference: 'declarative',
      prefersGui: true,
      desktopEnv: 'gnome',
      desktopApps: ['firefox', 'vscode']
    }
  },
  {
    id: 'cloud-init-vm',
    name: 'Debian Cloud Virtual Machine',
    badge: 'QCOW2 Disk Image',
    tagline: 'Automated headless cloud or KVM server provisioned via cloud-init user-data scripts.',
    winnerDistroName: 'Debian',
    recipeId: 'cloud-init-qcow2',
    buildTargetDescription: 'make image (Bootable QCOW2 Disk)',
    criteria: {
      useCase: 'server',
      platform: 'vm',
      architecture: 'x86_64',
      prefersGui: false,
      dockerApp: 'nextcloud'
    }
  },
  {
    id: 'debootstrap-live-iso',
    name: 'Debian Live Boot Hybrid ISO',
    badge: 'Live ISO Builder',
    tagline: 'Custom minimal live USB/ISO installer with squashfs filesystem and GRUB hybrid bootloader.',
    winnerDistroName: 'Debian',
    recipeId: 'debootstrap-debian',
    buildTargetDescription: 'make iso (Bootable Hybrid ISO)',
    criteria: {
      useCase: 'desktop',
      platform: 'bare-metal',
      architecture: 'x86_64',
      prefersGui: true,
      desktopApps: ['firefox'],
      requiresCustomBuild: true
    }
  },
  {
    id: 'wayland-kiosk-appliance',
    name: 'Cage Wayland Kiosk Appliance',
    badge: 'Digital Signage',
    tagline: 'Stripped-down Alpine Linux system booting directly into a single Wayland application watchdog.',
    winnerDistroName: 'Cage Wayland Appliance',
    recipeId: 'kiosk-web',
    buildTargetDescription: 'make rootfs (Alpine + Cage Watchdog)',
    criteria: {
      useCase: 'kiosk-signage',
      platform: 'kiosk',
      architecture: 'x86_64',
      prefersGui: true
    }
  },
  {
    id: 'wsl2-developer-box',
    name: 'Windows WSL2 Developer Distro',
    badge: 'WSL2 Tarball',
    tagline: 'Ultra-fast Linux developer container running inside Windows Subsystem for Linux 2.',
    winnerDistroName: 'Debian',
    recipeId: 'wsl2-debian',
    buildTargetDescription: 'make tarball (WSL2 RootFS Archive)',
    criteria: {
      useCase: 'server',
      platform: 'wsl2',
      architecture: 'x86_64',
      prefersGui: false
    }
  },
  {
    id: 'proxmox-lxc-container',
    name: 'Homelab Proxmox LXC Template',
    badge: 'LXC Container',
    tagline: 'High-density homelab system container template optimized for Proxmox VE clustering.',
    winnerDistroName: 'Proxmox VE / Debian',
    recipeId: 'proxmox-lxc',
    buildTargetDescription: 'make tarball (XZ RootFS Template)',
    criteria: {
      useCase: 'hypervisor-vms',
      platform: 'bare-metal',
      architecture: 'x86_64'
    }
  },
  {
    id: 'retro-gaming-batocera',
    name: 'Living Room Retro Gaming',
    badge: 'Turnkey Appliance',
    tagline: 'Decommissioned office PC turned into a living room console with EmulationStation.',
    winnerDistroName: 'Batocera.linux',
    buildTargetDescription: 'Turnkey Image (Flash to USB)',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'gaming',
      platform: 'bare-metal',
      architecture: 'x86_64',
      footprint: 'lean',
      maxRamMb: 4096,
      prefersGui: true
    }
  },
  {
    id: 'home-office-mint',
    name: 'Home Office & Freelance PC',
    badge: 'Turnkey Desktop',
    tagline: 'Familiar, rock-solid desktop environment for spreadsheets, invoices, Zoom, and web browsing.',
    winnerDistroName: 'Linux Mint',
    buildTargetDescription: 'Turnkey Image (Timeshift snapshots)',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'home-office',
      platform: 'bare-metal',
      architecture: 'x86_64',
      maxRamMb: 8192,
      prefersGui: true
    }
  },
  {
    id: 'in-browser-v86',
    name: 'In-Browser WebAssembly Linux',
    badge: 'WebAssembly VM',
    tagline: 'Virtual x86 Linux machine running 100% client-side inside a browser tab with zero installation.',
    winnerDistroName: 'WebVM / v86',
    recipeId: 'wasm-browser',
    buildTargetDescription: 'make serve (Local Browser Sandbox)',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'browser-wasm',
      platform: 'browser-wasm',
      architecture: 'x86_64'
    }
  }
];

export const PERSONA_PRESETS: readonly PersonaPreset[] = RAW_PRESETS.map((p) => ({
  ...p,
  urlQuery: serializeCriteriaToQuery(p.criteria, { tab: 'results' })
}));

export function getPersonaPresetById(id: string): PersonaPreset | undefined {
  return PERSONA_PRESETS.find((p) => p.id === id);
}
