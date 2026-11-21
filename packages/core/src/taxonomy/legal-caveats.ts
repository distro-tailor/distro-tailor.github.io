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
    // Only relevant when NVIDIA's proprietary driver is in play and the machine is not at home
    appliesTo: (c) =>
      c.driverPhilosophy !== 'free-software-only' &&
      c.deploymentSite !== 'home' &&
      (c.useCase === 'ai-gpu-compute' ||
        (c.driverPhilosophy === 'seamless-proprietary' && (c.platform === 'server' || c.useCase === 'hypervisor-vms'))),
    sourceUrl: 'https://www.nvidia.com/en-us/drivers/geforce-license/'
  },
  {
    id: 'crypto-mining-law',
    title: 'Check local rules before mining cryptocurrency',
    text: 'If you use a GPU rig to mine cryptocurrency, check local law and your electricity contract first: some countries restrict or ban mining, and mining income is usually taxable.',
    appliesTo: (c) => c.useCase === 'ai-gpu-compute'
  },
  {
    id: 'game-server-terms',
    title: "Follow each game's server terms",
    text: "Game server software comes with its own terms. Minecraft's server will not start until you accept Mojang's EULA, and Minecraft's usage guidelines limit how you can charge players (for example, no selling gameplay advantages). Check a game's terms before charging for access or perks.",
    appliesTo: (c) => c.useCase === 'game-server',
    sourceUrl: 'https://www.minecraft.net/en-us/usage-guidelines'
  },
  {
    id: 'radio-regulations',
    title: 'Stay within your country\'s radio limits',
    text: 'Outdoor Wi-Fi links must stay within the power and frequency limits your country sets for unlicensed bands. High-gain antennas can push a link over the legal limit, and some countries require a licence or registration for outdoor or point-to-point links. Check with your national telecom regulator.',
    appliesTo: (c) => c.useCase === 'community-network'
  },
  {
    id: 'sharing-internet-access',
    title: 'Check the rules for sharing internet access',
    text: 'Read your upstream provider\'s terms before sharing a connection with other households, and check whether your country requires registration or a licence to provide internet access to others, especially if you charge for it.',
    appliesTo: (c) => c.useCase === 'community-network'
  },
  {
    id: 'offline-content-licences',
    title: 'Mind the licence of each content pack',
    text: 'Most offline content (Wikipedia, OpenStreetMap) is freely licensed and can be shared. Some packs are non-commercial only, such as Khan Academy videos (CC BY-NC-SA): fine for a school, library, or clinic, but not for resale.',
    distroIds: ['internet-in-a-box'],
    appliesTo: (c) => c.useCase === 'offline-library'
  },
  {
    id: 'school-managed-chromebook',
    title: 'Only change Chromebooks you own',
    text: 'School- or work-managed Chromebooks are locked by their organisation; changing their firmware or OS breaks the device policy you agreed to and can wipe it. Use your own Chromebook, or ChromeOS\'s built-in Linux environment where the school allows it.',
    appliesTo: (c) => c.formFactor === 'chromebook'
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
