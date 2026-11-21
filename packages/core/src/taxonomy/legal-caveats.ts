import { LegalCaveat, UserCriteria } from '../types.js';

/**
 * Legal catches users should know up front. Everything DistroTailor recommends is free to use,
 * but some uses of it are not legal everywhere. Keep each caveat short, factual, and sourced.
 */
export const LEGAL_CAVEATS: readonly LegalCaveat[] = [
  {
    id: 'game-roms-and-bios',
    title: 'Only play games you own',
    text: 'Emulators are legal, but no game ROMs or console BIOS files are included. Use copies of games and consoles you own; downloading copyrighted games you do not own is illegal in most countries.',
    distroIds: ['batocera'],
    appliesTo: (c) => (c.emulatorApps?.length ?? 0) > 0
  },
  {
    id: 'authorized-security-testing',
    title: 'Test only what you are allowed to test',
    text: 'Penetration-testing tools are legal to install, but using them against networks, devices, or accounts you do not own or have written permission to test is a crime in most countries.',
    distroIds: ['kali-linux'],
    appliesTo: (c) => c.useCase === 'security-pentest'
  },
  {
    id: 'nvidia-geforce-datacenter',
    title: 'NVIDIA GeForce drivers are not licensed for datacenters',
    text: "NVIDIA's free GeForce/Titan driver licence does not cover datacenter deployment. A rig at home or in your homelab is fine; for a hosted or datacenter GPU server, use NVIDIA data-center GPUs and drivers or check the licence first.",
    appliesTo: (c) =>
      c.useCase === 'ai-gpu-compute' ||
      (c.driverPhilosophy === 'seamless-proprietary' && (c.platform === 'server' || c.useCase === 'hypervisor-vms')),
    sourceUrl: 'https://www.nvidia.com/en-us/drivers/geforce-license/'
  },
  {
    id: 'crypto-mining-law',
    title: 'Check local rules before mining cryptocurrency',
    text: 'If you use a GPU rig to mine cryptocurrency, check local law and your electricity contract first: some countries restrict or ban mining, and mining income is usually taxable.',
    appliesTo: (c) => c.useCase === 'ai-gpu-compute'
  },
  {
    id: 'kodi-third-party-addons',
    title: 'Stick to official Kodi add-ons',
    text: 'Install add-ons from the official Kodi repository. Many third-party add-ons stream pirated movies and TV, which is illegal in most countries.',
    distroIds: ['libreelec'],
    appliesTo: (c) => c.useCase === 'media-center'
  },
  {
    id: 'dvd-decryption',
    title: 'Encrypted DVD and Blu-ray playback',
    text: 'Patented media codecs are fine for personal use in practice. Playing encrypted DVDs or Blu-rays needs a decryption library such as libdvdcss, usually installed separately, whose legality varies by country (it is a grey area in the US).',
    distroIds: ['libreelec'],
    appliesTo: (c) => c.useCase === 'media-center'
  },
  {
    id: 'tor-restrictions',
    title: 'Tor is restricted in a few countries',
    text: 'Tails sends all traffic through Tor, which is legal in most countries but restricted or blocked in a few. Check local law before using it there.',
    distroIds: ['tails']
  }
];

/** Caveats for a recommendation: the top-match distro's own, plus any the criteria trigger. */
export function getLegalCaveats(criteria: UserCriteria, distroId?: string): LegalCaveat[] {
  return LEGAL_CAVEATS.filter(
    (caveat) => (distroId !== undefined && caveat.distroIds?.includes(distroId)) || caveat.appliesTo?.(criteria)
  );
}

/** Caveats that always apply to a distro, for its detail page. */
export function getDistroLegalCaveats(distroId: string): LegalCaveat[] {
  return LEGAL_CAVEATS.filter((caveat) => caveat.distroIds?.includes(distroId));
}
