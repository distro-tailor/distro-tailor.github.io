import { PaidAlternative, UserCriteria } from '../types.js';

/**
 * Well-known systems that need payment (or a closed-source license) for the very feature the user
 * asked for. They are never scored or recommended; results list them as alternatives with caveats,
 * next to the free/open-source options that cover the same need.
 */
export const PAID_ALTERNATIVES: readonly PaidAlternative[] = [
  {
    id: 'hiveos',
    name: 'HiveOS (Hiveon OS)',
    website: 'https://hiveon.com/os/',
    useCases: ['ai-gpu-compute'],
    licensing: {
      model: 'freemium-closed',
      license: 'Proprietary',
      note: 'Free for up to 2 rigs; each additional rig is billed monthly.'
    },
    pitch: 'Turnkey multi-GPU rig management: remote overclocking profiles, fan curves, watchdog reboots, and a fleet dashboard.',
    caveat: 'Closed source, and free only for up to 2 rigs. Larger farms pay per rig every month.',
    freeOptionIds: ['ubuntu', 'pop-os']
  },
  {
    id: 'porteus-kiosk',
    name: 'Porteus Kiosk',
    website: 'https://porteus-kiosk.org',
    useCases: ['kiosk-signage'],
    licensing: {
      model: 'freemium-closed',
      license: 'GPL components plus a proprietary license for kiosk management',
      note: 'Automatic updates and the central management server are paid subscriptions.'
    },
    pitch: 'Locked-down full-screen browser kiosk that resets on every reboot, configured through a setup wizard.',
    caveat: 'The kiosk configuration and update components are under a proprietary license, and automatic updates and central management are paid subscriptions.',
    freeOptionIds: ['cage-appliance', 'dietpi']
  },
  {
    id: 'webvm-cheerpx',
    name: 'WebVM (CheerpX engine)',
    website: 'https://webvm.io',
    useCases: ['browser-wasm'],
    licensing: {
      model: 'freemium-closed',
      license: 'Apache-2.0 (WebVM) with the proprietary CheerpX engine',
      note: 'Free for personal and most non-commercial use; commercial, public-sector, and self-hosted deployments need a license.'
    },
    pitch: 'Faster in-browser Linux using a JIT-compiling x86 engine, with optional networking via Tailscale.',
    caveat: 'The CheerpX engine is proprietary. Companies, public-sector bodies, and self-hosted deployments need a commercial license.',
    freeOptionIds: ['webvm-v86']
  },
  {
    id: 'unraid',
    name: 'Unraid',
    website: 'https://unraid.net',
    useCases: ['nas-storage'],
    licensing: {
      model: 'proprietary',
      license: 'Proprietary',
      note: 'A paid license is required after the trial; tiers depend on the number of storage devices.'
    },
    pitch: 'Mix drives of different sizes in one parity-protected array, with an easy app store for Docker containers and VMs.',
    caveat: 'Proprietary, and a paid license is required after the free trial.',
    freeOptionIds: ['openmediavault', 'truenas-scale']
  },
  {
    id: 'pfsense-plus',
    name: 'pfSense Plus',
    website: 'https://www.netgate.com/pfsense-plus-software',
    useCases: ['router-networking'],
    licensing: {
      model: 'proprietary',
      license: 'Proprietary',
      note: 'Needs a paid subscription on non-Netgate hardware; the separate pfSense CE edition is open source.'
    },
    pitch: 'Mature firewall with a large package ecosystem, preinstalled on Netgate appliances.',
    caveat: 'Closed source, and it needs a paid subscription unless it came preinstalled on Netgate hardware.',
    freeOptionIds: ['opnsense', 'openwrt']
  }
];

/** Paid alternatives relevant to the user's chosen use case (empty when none apply). */
export function getPaidAlternatives(criteria: UserCriteria): PaidAlternative[] {
  if (!criteria.useCase) return [];
  return PAID_ALTERNATIVES.filter((alt) => alt.useCases.includes(criteria.useCase!));
}
