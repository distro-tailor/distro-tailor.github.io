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
  },
  {
    id: 'splynx',
    name: 'Splynx (ISP billing & management)',
    website: 'https://splynx.com',
    useCases: ['community-network'],
    licensing: {
      model: 'proprietary',
      license: 'Proprietary subscription',
      note: 'Priced per active subscriber per month.'
    },
    pitch: 'All-in-one ISP billing, customer portal, and network management for wireless ISPs.',
    caveat: 'A monthly subscription priced per subscriber, so costs grow with every household you connect. Small community networks can run on OpenWrt or LibreMesh with simple shared accounting instead.',
    freeOptionIds: ['libremesh', 'openwrt', 'opnsense']
  },
  {
    id: 'cubecoders-amp',
    name: 'AMP (CubeCoders Application Management Panel)',
    website: 'https://cubecoders.com/AMP',
    useCases: ['game-server'],
    licensing: {
      model: 'proprietary',
      license: 'Proprietary',
      note: 'Needs a paid licence; tiers depend on how many server instances you run.'
    },
    pitch: 'Polished web panel to install, update, and back up Minecraft, Valheim, and dozens of Steam game servers.',
    caveat: 'Closed source, and it needs a paid licence. Free panels such as Pterodactyl, or LinuxGSM on Ubuntu/Debian, cover the same job.',
    freeOptionIds: ['ubuntu', 'debian', 'dietpi']
  },
  {
    id: 'minecraft-realms',
    name: 'Minecraft Realms',
    website: 'https://www.minecraft.net/realms',
    useCases: ['game-server'],
    licensing: {
      model: 'proprietary',
      license: 'Proprietary hosted service',
      note: 'A monthly subscription hosted by Mojang/Microsoft.'
    },
    pitch: 'Always-online Minecraft world for a few friends, hosted by Mojang with no setup.',
    caveat: 'A monthly subscription, and you do not get a server you control (limited mods and plugins). Hosting your own Minecraft server is free.',
    freeOptionIds: ['ubuntu', 'dietpi']
  }
];

/** Paid alternatives relevant to the user's chosen use case (empty when none apply). */
export function getPaidAlternatives(criteria: UserCriteria): PaidAlternative[] {
  if (!criteria.useCase) return [];
  return PAID_ALTERNATIVES.filter((alt) => alt.useCases.includes(criteria.useCase!));
}
