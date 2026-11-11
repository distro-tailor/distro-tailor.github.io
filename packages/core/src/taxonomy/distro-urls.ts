import { serializeCriteriaToQuery } from '../migrations/url-schema.js';
import { DistroProfile, UserCriteria } from '../types.js';
import { DISTRO_REGISTRY } from './distros.js';

/**
 * Curated, natural criteria sets that deterministically select each of the 31 registered
 * distributions as the top (#1) recommendation champion.
 */
export const DISTRO_TARGET_CRITERIA: Readonly<Record<string, UserCriteria>> = {
  // --- TURNKEY APPLIANCES & SPECIALIZED ---
  batocera: {
    experienceLevel: 'beginner',
    useCase: 'gaming',
    platform: 'bare-metal',
    architecture: 'x86_64',
    footprint: 'lean'
  },
  libreelec: {
    experienceLevel: 'beginner',
    useCase: 'media-center',
    platform: 'bare-metal',
    architecture: 'x86_64',
    maxRamMb: 2048
  },
  'endless-os': {
    experienceLevel: 'beginner',
    useCase: 'education-kids',
    footprint: 'standard',
    platform: 'bare-metal',
    architecture: 'x86_64',
    formFactor: 'desktop',
    maxRamMb: 4096,
    prefersGui: true,
    workflowStyle: 'mobile-touch',
    releaseCadence: 'standard',
    driverPhilosophy: 'seamless-proprietary',
    bootMedium: 'nvme-ssd',
    realtimeAudio: false,
    peripheralNeed: 'standard'
  },
  openmediavault: {
    experienceLevel: 'beginner',
    useCase: 'nas-storage',
    platform: 'bare-metal',
    architecture: 'x86_64',
    maxRamMb: 4096
  },
  'home-assistant-os': {
    experienceLevel: 'beginner',
    useCase: 'smart-home',
    platform: 'embedded-sbc',
    architecture: 'arm64'
  },
  'proxmox-ve': {
    experienceLevel: 'intermediate',
    useCase: 'hypervisor-vms',
    platform: 'server',
    architecture: 'x86_64',
    maxRamMb: 32768
  },
  'truenas-scale': {
    experienceLevel: 'intermediate',
    useCase: 'nas-storage',
    platform: 'server',
    architecture: 'x86_64',
    maxRamMb: 16384,
    footprint: 'full'
  },
  smartos: {
    experienceLevel: 'systems-engineer',
    useCase: 'hypervisor-vms',
    platform: 'server',
    architecture: 'x86_64',
    statePreference: 'stateless-ram',
    footprint: 'standard',
    maxRamMb: 8192
  },
  'asahi-linux': {
    experienceLevel: 'intermediate',
    useCase: 'desktop',
    platform: 'bare-metal',
    architecture: 'arm64'
  },
  bazzite: {
    experienceLevel: 'intermediate',
    useCase: 'gaming',
    formFactor: 'handheld',
    platform: 'bare-metal',
    architecture: 'x86_64'
  },
  'pop-os': {
    experienceLevel: 'intermediate',
    useCase: 'ai-gpu-compute',
    platform: 'bare-metal',
    architecture: 'x86_64',
    driverPhilosophy: 'seamless-proprietary'
  },
  hiveos: {
    experienceLevel: 'advanced',
    useCase: 'ai-gpu-compute',
    platform: 'server',
    architecture: 'x86_64'
  },

  // --- HARDWARE RECLAMATION & DESKTOP ---
  antix: {
    experienceLevel: 'beginner',
    useCase: 'desktop',
    platform: 'bare-metal',
    architecture: 'x86_64',
    maxRamMb: 512,
    footprint: 'minimal'
  },
  freedos: {
    experienceLevel: 'intermediate',
    useCase: 'appliance-product',
    platform: 'bare-metal',
    architecture: 'x86_64',
    footprint: 'micro',
    maxRamMb: 16,
    cLibPreference: 'none'
  },
  reactos: {
    experienceLevel: 'intermediate',
    useCase: 'desktop',
    platform: 'bare-metal',
    architecture: 'x86_64',
    maxRamMb: 512,
    footprint: 'lean',
    cLibPreference: 'none',
    workflowStyle: 'windows'
  },
  haiku: {
    experienceLevel: 'intermediate',
    useCase: 'desktop',
    platform: 'bare-metal',
    architecture: 'x86_64',
    maxRamMb: 1024,
    footprint: 'lean',
    cLibPreference: 'none',
    workflowStyle: 'traditional-compact'
  },
  'linux-mint': {
    experienceLevel: 'beginner',
    useCase: 'home-office',
    platform: 'bare-metal',
    architecture: 'x86_64',
    maxRamMb: 8192
  },
  fedora: {
    experienceLevel: 'intermediate',
    useCase: 'desktop',
    formFactor: 'laptop',
    platform: 'bare-metal',
    architecture: 'x86_64'
  },
  'ubuntu-studio': {
    experienceLevel: 'intermediate',
    useCase: 'creative-studio',
    platform: 'bare-metal',
    architecture: 'x86_64',
    realtimeAudio: true
  },

  // --- EMBEDDED & APPLIANCES ---
  buildroot: {
    experienceLevel: 'systems-engineer',
    useCase: 'iot-embedded',
    architecture: 'nommu',
    footprint: 'micro'
  },
  openwrt: {
    experienceLevel: 'intermediate',
    useCase: 'router-networking',
    platform: 'router-firewall',
    architecture: 'x86_64'
  },
  opnsense: {
    experienceLevel: 'intermediate',
    useCase: 'router-networking',
    platform: 'router-firewall',
    architecture: 'x86_64',
    footprint: 'standard',
    maxRamMb: 4096
  },
  dietpi: {
    experienceLevel: 'intermediate',
    useCase: 'server',
    platform: 'embedded-sbc',
    architecture: 'arm64',
    footprint: 'lean',
    bootMedium: 'sd-card-usb'
  },
  armbian: {
    experienceLevel: 'beginner',
    useCase: 'server',
    platform: 'embedded-sbc',
    architecture: 'arm64'
  },
  postmarketos: {
    experienceLevel: 'intermediate',
    useCase: 'desktop',
    formFactor: 'handheld',
    platform: 'embedded-sbc',
    architecture: 'arm64'
  },

  // --- CONTAINERS & IMMUTABLE ---
  alpine: {
    experienceLevel: 'intermediate',
    useCase: 'container-base',
    platform: 'container',
    footprint: 'minimal'
  },
  'chainguard-distroless': {
    experienceLevel: 'systems-engineer',
    useCase: 'container-base',
    platform: 'container',
    footprint: 'micro',
    statePreference: 'read-only-rootfs'
  },
  talos: {
    experienceLevel: 'systems-engineer',
    useCase: 'k8s-cluster',
    platform: 'k8s-node',
    architecture: 'x86_64'
  },
  nixos: {
    experienceLevel: 'advanced',
    useCase: 'desktop',
    statePreference: 'declarative',
    architecture: 'x86_64'
  },
  'fedora-silverblue': {
    experienceLevel: 'intermediate',
    useCase: 'desktop',
    statePreference: 'immutable-ostree',
    architecture: 'x86_64',
    prefersGui: true
  },

  // --- KIOSK, WAYLAND APPLIANCE & WASM ---
  'porteus-kiosk': {
    experienceLevel: 'beginner',
    useCase: 'kiosk-signage',
    platform: 'kiosk',
    architecture: 'x86_64'
  },
  'cage-appliance': {
    experienceLevel: 'intermediate',
    useCase: 'appliance-product',
    platform: 'kiosk',
    architecture: 'x86_64',
    prefersGui: true
  },
  'webvm-v86': {
    experienceLevel: 'beginner',
    useCase: 'browser-wasm',
    platform: 'browser-wasm'
  },

  // --- GENERAL PURPOSE WORKHORSES ---
  debian: {
    experienceLevel: 'intermediate',
    useCase: 'server',
    platform: 'bare-metal',
    architecture: 'x86_64',
    statePreference: 'mutable',
    cLibPreference: 'glibc',
    initPreference: 'systemd'
  },
  arch: {
    experienceLevel: 'advanced',
    useCase: 'gaming',
    releaseCadence: 'rolling',
    architecture: 'x86_64',
    prefersGui: true
  },
  ubuntu: {
    experienceLevel: 'beginner',
    useCase: 'desktop',
    platform: 'bare-metal',
    architecture: 'x86_64',
    workflowStyle: 'macos'
  }
};

export interface DistroUrlEntry {
  distro: DistroProfile;
  criteria: UserCriteria;
  urlQuery: string;
}

export function getDistroTargetCriteria(distroId: string): UserCriteria | undefined {
  return DISTRO_TARGET_CRITERIA[distroId];
}

export function getDistroTargetUrl(distroId: string): string {
  const criteria = getDistroTargetCriteria(distroId);
  if (!criteria) return '?tab=results';
  return serializeCriteriaToQuery(criteria, { tab: 'results' });
}

export function getDistroUrlDirectory(): DistroUrlEntry[] {
  return DISTRO_REGISTRY.map((distro) => {
    const criteria = DISTRO_TARGET_CRITERIA[distro.id] || {};
    return {
      distro,
      criteria,
      urlQuery: serializeCriteriaToQuery(criteria, { tab: 'results' })
    };
  });
}
