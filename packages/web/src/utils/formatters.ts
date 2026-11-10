import { getDockerApp, RecommendationOutput, UserCriteria } from '@distro-tailor/core';
import { escapeHtml } from './dom.js';

export interface FormattedConstraint {
  label: string;
  icon: string;
}

/**
 * Returns user-friendly human label and emoji icon for any constraint key and value.
 * Safely sanitizes dynamic user-supplied or unknown inputs using escapeHtml.
 */
export function formatConstraint(key: string, value: any): FormattedConstraint {
  const map: Record<string, Record<string, FormattedConstraint>> = {
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
    }
  };

  if (key === 'maxRamMb') {
    return { label: `${Number(value) || 0} MB RAM`, icon: '🧠' };
  }
  if (key === 'prefersGui') {
    return { label: value ? 'Graphical Desktop (GUI)' : 'Headless / Terminal Only', icon: value ? '🖼️' : '⌨️' };
  }
  if (key === 'requiresCustomBuild') {
    return { label: value ? 'Custom Build Recipe Required' : 'Prebuilt ISO Preferred', icon: '🛠️' };
  }
  if (key === 'dockerApp') {
    const app = getDockerApp(value);
    return {
      label: app ? `Docker: ${app.name}` : `Docker: ${escapeHtml(String(value))}`,
      icon: app ? app.icon : '🐳'
    };
  }
  if (key === 'desktopApps') {
    const list = Array.isArray(value) ? value : String(value).split(',').filter(Boolean);
    return { label: `Desktop Apps: ${list.length} selected`, icon: '📦' };
  }
  if (key === 'desktopEnv') {
    return { label: `Desktop: ${escapeHtml(String(value)).toUpperCase()}`, icon: '🖼️' };
  }
  if (key === 'enableDistrobox') {
    return { label: value ? 'Distrobox (Arch AUR)' : 'Native Only', icon: '🏛️' };
  }
  if (key === 'enableNix') {
    return { label: value ? 'Nix Package Layer' : 'No Nix', icon: '❄️' };
  }
  if (key === 'enableFlatpak') {
    return { label: value ? 'Flatpak Sandbox' : 'No Flatpak', icon: '📦' };
  }

  if (map[key] && map[key][value]) {
    return map[key][value];
  }
  return { label: escapeHtml(`${key}: ${value}`), icon: '📌' };
}

/**
 * Generates formatted markdown text suitable for copying to Reddit, GitHub, or Discord.
 */
export function generateMarkdownSummary(
  evaluation: RecommendationOutput,
  criteria: UserCriteria = {},
  shareUrl?: string
): string {
  const best = evaluation.bestMatch;
  const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : 'https://distrotailor.dev');
  const constraintsList = Object.entries(criteria)
    .map(([k, v]) => `• ${formatConstraint(k, v).icon} ${formatConstraint(k, v).label}`)
    .join('\n');

  return `🐧 **DistroTailor Recommendation: ${best.distro.name} (${best.score}% Match)**
*${best.distro.tagline}*

**Tailored Configuration:**
${constraintsList || '• Default profile'}

**Key Highlights:**
${best.distro.highlights.map((h) => `• ${h}`).join('\n')}

🔗 **View or customize this Linux build:**
${url}`;
}
