import {
  DistroProfile,
  DistroScore,
  MatchReason,
  RecommendationOutput,
  UserCriteria
} from '../types.js';
import { DISTRO_REGISTRY } from '../taxonomy/distros.js';
import { resolveRecipeGenerator } from '../generators/index.js';

export function evaluateCriteria(
  criteria: UserCriteria,
  distros: DistroProfile[] = DISTRO_REGISTRY
): RecommendationOutput {
  // Calculate total maximum weight of criteria actually specified by the user
  let maxWeight = 0;
  if (criteria.useCase) maxWeight += 25;
  if (criteria.platform) maxWeight += 20;
  if (criteria.architecture) maxWeight += 20;
  if (criteria.footprint) maxWeight += 15;
  if (criteria.maxRamMb) maxWeight += 15;
  if (criteria.formFactor) maxWeight += 15;
  if (criteria.statePreference && criteria.statePreference !== 'no-preference') maxWeight += 10;
  if (criteria.cLibPreference && criteria.cLibPreference !== 'no-preference') maxWeight += 5;
  if (criteria.initPreference && criteria.initPreference !== 'no-preference') maxWeight += 5;
  if (criteria.experienceLevel) maxWeight += 5;
  if (criteria.releaseCadence) maxWeight += 10;
  if (criteria.driverPhilosophy && criteria.driverPhilosophy !== 'no-preference') maxWeight += 10;
  if (criteria.bootMedium) maxWeight += 10;
  if (criteria.prefersGui !== undefined) maxWeight += 10;
  if (criteria.realtimeAudio) maxWeight += 15;
  const selectedPeripherals = (
    criteria.peripherals ||
    (criteria.peripheralNeed && criteria.peripheralNeed !== 'standard' ? [criteria.peripheralNeed] : [])
  ).filter((p) => p !== 'standard');
  if (selectedPeripherals.length > 0) {
    maxWeight += selectedPeripherals.length * 15;
  }

  if (maxWeight === 0) {
    maxWeight = 100; // Default baseline if nothing specified
  }

  const scoredDistros: DistroScore[] = distros.map((distro) => {
    let earned = 0;
    let isHardDisqualified = false;
    let hardDisqualificationReason = '';
    const reasons: MatchReason[] = [];

    // 0. Unconstrained Baseline (Zero Constraints Specified)
    if (Object.keys(criteria).length === 0) {
      if (distro.id === 'linux-mint') {
        earned = 100;
        reasons.push({
          feature: 'Universal Baseline',
          matched: true,
          explanation: 'Recommended standard out-of-the-box desktop Linux for everyday PC and laptop use.'
        });
      } else if (distro.id === 'ubuntu' || distro.id === 'fedora') {
        earned = 90;
        reasons.push({
          feature: 'Universal Baseline',
          matched: true,
          explanation: 'Leading mainstream distribution with extensive community and hardware support.'
        });
      } else if (distro.experienceLevel === 'beginner' && distro.primaryUseCases.includes('desktop')) {
        earned = 80;
      } else {
        earned = 50;
      }
    }

    // 1. Use Case Alignment (Weight: 25)
    if (criteria.useCase) {
      if (distro.primaryUseCases.includes(criteria.useCase)) {
        earned += 25;
        if (distro.primaryUseCases[0] === criteria.useCase) {
          earned += 2; // Bonus for flagship primary focus
        }
        reasons.push({
          feature: 'Use Case',
          matched: true,
          explanation: `Specifically built or recognized for ${criteria.useCase}.`
        });
      } else {
        const desktopUseCases = [
          'education-kids',
          'home-office',
          'creative-studio',
          'gaming',
          'desktop'
        ];
        const singlePurposeAppliances = [
          'kiosk-signage',
          'home-router',
          'smart-home',
          'media-center',
          'nas-storage',
          'hypervisor-vms',
          'k8s-cluster',
          'browser-wasm'
        ];

        // Is the candidate a dedicated single-purpose appliance?
        const isDedicatedAppliance = distro.primaryUseCases.every((uc) =>
          singlePurposeAppliances.includes(uc)
        );

        if (isDedicatedAppliance) {
          earned -= 25; // Severe penalty: dedicated appliance completely incompatible with target use case
          reasons.push({
            feature: 'Use Case',
            matched: false,
            explanation: `Dedicated appliance (${distro.primaryUseCases.join(', ')}) not suitable for ${criteria.useCase}.`
          });
        } else if (
          desktopUseCases.includes(criteria.useCase) &&
          distro.primaryUseCases.includes('desktop')
        ) {
          earned += 8; // Capable desktop fallback (e.g. Mint, Debian, Arch, Fedora)
          reasons.push({
            feature: 'Use Case',
            matched: true,
            explanation: `Versatile desktop distribution capable of ${criteria.useCase}.`
          });
        } else {
          earned -= 10; // Moderate deduction for generic mismatch
          reasons.push({
            feature: 'Use Case',
            matched: false,
            explanation: `Not primarily designed for ${criteria.useCase}.`
          });
        }
      }
    }

    // 2. Platform Target (Weight: 20)
    if (criteria.platform) {
      if (distro.platforms.includes(criteria.platform)) {
        earned += 20;
        reasons.push({
          feature: 'Platform',
          matched: true,
          explanation: `First-class support for ${criteria.platform}.`
        });
      } else {
        earned -= 10;
        reasons.push({
          feature: 'Platform',
          matched: false,
          explanation: `Not optimized for ${criteria.platform}.`
        });
      }
    }

    // 3. CPU Architecture (Weight: 20 - Hard Physical Disqualifier Gate)
    if (criteria.architecture) {
      if (distro.architectures.includes(criteria.architecture)) {
        earned += 20;
        reasons.push({
          feature: 'Architecture',
          matched: true,
          explanation: `Supports ${criteria.architecture} hardware.`
        });
      } else {
        isHardDisqualified = true;
        hardDisqualificationReason = `Cannot run on ${criteria.architecture} hardware (unsupported CPU architecture).`;
        reasons.push({
          feature: 'Architecture',
          matched: false,
          explanation: hardDisqualificationReason
        });
      }
    }

    // 4. Storage Footprint & RAM Budget (Weight: 15 + 15)
    if (criteria.footprint) {
      const footprintOrder = ['micro', 'minimal', 'lean', 'standard', 'full'];
      const targetIdx = footprintOrder.indexOf(criteria.footprint);
      const distroIdx = footprintOrder.indexOf(distro.footprint);

      if (distroIdx <= targetIdx) {
        earned += 15;
        // Bonus for exact footprint tier alignment
        if (distroIdx === targetIdx) {
          earned += 2;
        }
        reasons.push({
          feature: 'Footprint',
          matched: true,
          explanation: `Fits within your ${criteria.footprint} size budget.`
        });
      } else {
        // If distro is larger than target footprint:
        // If machine has sufficient RAM (minRamMb <= maxRamMb), scale penalty proportionally
        const tierDiff = distroIdx - targetIdx;
        const ramFits = !criteria.maxRamMb || distro.minRamMb <= criteria.maxRamMb;
        const penalty = ramFits ? Math.min(15, tierDiff * 5) : 15;
        earned -= penalty;
        reasons.push({
          feature: 'Footprint',
          matched: false,
          explanation: `Exceeds your ${criteria.footprint} size budget (requires ${distro.footprint}).`
        });
      }
    }

    if (criteria.maxRamMb) {
      if (distro.minRamMb <= criteria.maxRamMb) {
        earned += 15;
        reasons.push({
          feature: 'RAM Budget',
          matched: true,
          explanation: `Requires ${distro.minRamMb} MB RAM, fits within your ${criteria.maxRamMb} MB budget.`
        });
      } else {
        earned -= 30; // Heavy penalty: exceeds physically installed RAM
        reasons.push({
          feature: 'RAM Budget',
          matched: false,
          explanation: `Requires minimum ${distro.minRamMb} MB RAM, which exceeds your ${criteria.maxRamMb} MB hardware budget.`
        });
      }
    }

    // 4B. Form Factor & Thermal / Power Envelope (Weight: 15)
    if (criteria.formFactor) {
      if (criteria.formFactor === 'handheld') {
        if (distro.id === 'bazzite') {
          earned += 15;
          reasons.push({
            feature: 'Handheld Gaming Optimization',
            matched: true,
            explanation: 'Built specifically for Steam Deck, ROG Ally, and handheld PCs with custom TDP limiters, controller sleep/wake, and Game Mode.'
          });
        } else if (distro.id === 'batocera') {
          earned += 10;
          reasons.push({
            feature: 'Handheld Gaming Optimization',
            matched: true,
            explanation: 'Controller-driven arcade interface designed for portable gaming consoles.'
          });
        } else if (['proxmox-ve', 'talos', 'openwrt', 'buildroot', 'cage-appliance'].includes(distro.id)) {
          earned -= 20;
          reasons.push({
            feature: 'Handheld Gaming Optimization',
            matched: false,
            explanation: 'Server/appliance distribution lacks handheld controller support and graphical game UI.'
          });
        }
      } else if (criteria.formFactor === 'laptop') {
        const laptopFriendly = ['fedora', 'pop-os', 'linux-mint', 'ubuntu', 'endless-os'];
        if (laptopFriendly.includes(distro.id)) {
          earned += 15;
          reasons.push({
            feature: 'Laptop Power & Battery',
            matched: true,
            explanation: 'First-class battery management (power-profiles-daemon), reliable Modern Standby/suspend, and automatic Wi-Fi management.'
          });
        } else if (distro.platforms.includes('desktop')) {
          earned += 8;
        }
      } else if (criteria.formFactor === 'desktop') {
        if (distro.platforms.includes('desktop')) {
          earned += 15;
          reasons.push({
            feature: 'Desktop Performance',
            matched: true,
            explanation: 'Optimized for AC wall-powered desktops with uncapped performance governors and multi-monitor setups.'
          });
        }
      } else if (criteria.formFactor === 'low-power') {
        const lowPowerDistros = ['antix', 'dietpi', 'libreelec', 'alpine', 'porteus-kiosk'];
        if (lowPowerDistros.includes(distro.id)) {
          earned += 15;
          reasons.push({
            feature: 'Low-Power Hardware',
            matched: true,
            explanation: 'Ultra-low CPU and RAM footprint designed specifically to run smoothly on weak or low-power processors.'
          });
        } else if (distro.footprint === 'full' || distro.minRamMb > 2048) {
          earned -= 15;
          reasons.push({
            feature: 'Low-Power Hardware',
            matched: false,
            explanation: 'Heavy desktop compositor and background services may struggle or lag on low-power processors.'
          });
        }
      } else if (criteria.formFactor === 'mac') {
        if (criteria.architecture === 'arm64' && distro.id === 'asahi-linux') {
          earned += 15;
          reasons.push({
            feature: 'Apple Silicon Hardware',
            matched: true,
            explanation: 'Native upstream kernel support and reverse-engineered GPU drivers for Apple M-series chips.'
          });
        } else if (['linux-mint', 'fedora', 'pop-os', 'ubuntu', 'endless-os'].includes(distro.id)) {
          earned += 15;
          reasons.push({
            feature: 'Mac Hardware Support',
            matched: true,
            explanation: 'Includes out-of-the-box proprietary drivers for Broadcom Wi-Fi and Mac hardware quirks.'
          });
        }
      } else if (criteria.formFactor === 'sbc') {
        if (['dietpi', 'armbian', 'postmarketos', 'alpine', 'batocera', 'libreelec'].includes(distro.id)) {
          earned += 15;
          reasons.push({
            feature: 'Single-Board Computer',
            matched: true,
            explanation: 'Specifically optimized for single-board ARM computers (Raspberry Pi, Rockchip, Allwinner).'
          });
        }
      } else if (criteria.formFactor === 'server') {
        if (['proxmox-ve', 'truenas-scale', 'debian', 'ubuntu', 'talos'].includes(distro.id)) {
          earned += 15;
          reasons.push({
            feature: 'Server Hardware',
            matched: true,
            explanation: 'Designed for dedicated 24/7 server hardware, IPMI remote management, and rack infrastructure.'
          });
        }
      }
    }

    // 5. State Model & Immutability (Weight: 10)
    if (criteria.statePreference && criteria.statePreference !== 'no-preference') {
      if (distro.stateModel === criteria.statePreference) {
        earned += 10;
        reasons.push({
          feature: 'State Model',
          matched: true,
          explanation: `Employs ${criteria.statePreference} state model.`
        });
      } else {
        earned -= 10;
        reasons.push({
          feature: 'State Model',
          matched: false,
          explanation: `Uses ${distro.stateModel} rather than ${criteria.statePreference} architecture.`
        });
      }
    }

    // 6. C-Library / Init (Weight: 10)
    if (criteria.cLibPreference && criteria.cLibPreference !== 'no-preference') {
      if (distro.cLibraries.includes(criteria.cLibPreference)) {
        earned += 5;
        reasons.push({
          feature: 'C Library',
          matched: true,
          explanation: `Supports ${criteria.cLibPreference} libc.`
        });
      }
    }
    if (criteria.initPreference && criteria.initPreference !== 'no-preference') {
      if (distro.initSystems.includes(criteria.initPreference)) {
        earned += 5;
        reasons.push({
          feature: 'Init System',
          matched: true,
          explanation: `Supports ${criteria.initPreference} init system.`
        });
      }
    }

    // 7. Experience Level Alignment (Weight: 5)
    if (criteria.experienceLevel) {
      if (distro.experienceLevel === criteria.experienceLevel) {
        earned += 5;
        reasons.push({
          feature: 'Experience Level',
          matched: true,
          explanation: `Matches your ${criteria.experienceLevel} comfort zone.`
        });
      } else if (criteria.experienceLevel === 'beginner' && distro.experienceLevel === 'systems-engineer') {
        earned -= 15; // Don't recommend a source-compilation distro to a beginner
        reasons.push({
          feature: 'Experience Level',
          matched: false,
          explanation: `Requires advanced low-level source compilation (not ideal for beginners).`
        });
      }
    }

    // 8. Release Cadence (Weight: 10)
    if (criteria.releaseCadence) {
      if (criteria.releaseCadence === 'rolling' && distro.rollingRelease) {
        earned += 10;
        reasons.push({
          feature: 'Release Cadence',
          matched: true,
          explanation: 'Continuous rolling release model provides the latest software packages without full OS upgrades.'
        });
      } else if (criteria.releaseCadence === 'lts' && !distro.rollingRelease) {
        earned += 10;
        reasons.push({
          feature: 'Release Cadence',
          matched: true,
          explanation: 'Predictable long-term enterprise point releases with rock-solid stability.'
        });
      } else if (criteria.releaseCadence === 'standard') {
        earned += 7;
        reasons.push({
          feature: 'Release Cadence',
          matched: true,
          explanation: 'Standard scheduled release cycle with modern stable packages.'
        });
      } else {
        reasons.push({
          feature: 'Release Cadence',
          matched: false,
          explanation: distro.rollingRelease ? 'Uses rolling updates rather than LTS releases.' : 'Uses fixed point releases rather than continuous rolling updates.'
        });
      }
    }

    // 9. GUI vs Headless Interface (Weight: 10)
    if (criteria.prefersGui !== undefined) {
      const isGuiDistro =
        distro.platforms.includes('desktop') ||
        distro.platforms.includes('kiosk') ||
        distro.id === 'batocera' ||
        distro.id === 'libreelec';
      if (criteria.prefersGui && isGuiDistro) {
        earned += 10;
        reasons.push({
          feature: 'Display Server',
          matched: true,
          explanation: 'First-class support for graphical desktop interfaces and Wayland/X11 compositors.'
        });
      } else if (!criteria.prefersGui && !isGuiDistro) {
        earned += 10;
        reasons.push({
          feature: 'Headless Mode',
          matched: true,
          explanation: 'Optimized for headless server, container, or terminal-first operations.'
        });
      }
    }

    // 10. Driver Philosophy (Weight: 10)
    if (criteria.driverPhilosophy && criteria.driverPhilosophy !== 'no-preference') {
      if (criteria.driverPhilosophy === 'free-software-only') {
        if (['debian', 'alpine', 'arch'].includes(distro.id)) {
          earned += 10;
          reasons.push({
            feature: 'Open Source Drivers',
            matched: true,
            explanation: 'Strictly prioritizes 100% Free/Libre open-source software and clean driver separation.'
          });
        }
      } else if (criteria.driverPhilosophy === 'seamless-proprietary') {
        if (['pop-os', 'linux-mint', 'ubuntu-studio', 'fedora', 'batocera'].includes(distro.id)) {
          earned += 10;
          reasons.push({
            feature: 'Proprietary Drivers',
            matched: true,
            explanation: 'Includes out-of-the-box proprietary drivers (NVIDIA GPUs, Broadcom Wi-Fi, media codecs).'
          });
        }
      }
    }

    // 11. Boot Medium (Weight: 10)
    if (criteria.bootMedium) {
      if (criteria.bootMedium === 'sd-card-usb' && ['dietpi', 'libreelec', 'batocera', 'alpine', 'tails', 'antix'].includes(distro.id)) {
        earned += 10;
        reasons.push({
          feature: 'Flash Storage',
          matched: true,
          explanation: 'Includes RAM caching and Flash-wear reduction optimized for MicroSD cards and USB thumbdrives.'
        });
      } else if (criteria.bootMedium === 'pxe-diskless' && ['talos', 'alpine', 'proxmox-ve'].includes(distro.id)) {
        earned += 10;
        reasons.push({
          feature: 'Diskless Boot',
          matched: true,
          explanation: 'Native support for diskless PXE network booting and run-from-RAM architectures.'
        });
      } else if (criteria.bootMedium === 'nvme-ssd') {
        earned += 8;
      }
    }

    // 12. Realtime Pro Audio (Weight: 15)
    if (criteria.realtimeAudio) {
      if (distro.id === 'ubuntu-studio') {
        earned += 15;
        reasons.push({
          feature: 'Low-Latency Audio',
          matched: true,
          explanation: 'Features an out-of-the-box lowlatency / realtime Linux kernel with PipeWire pro audio and JACK.'
        });
      }
    }

    // 13. Specialized Hardware & Peripherals (Weight: 15 per selected peripheral)
    for (const p of selectedPeripherals) {
      if (p === 'touchscreen') {
        const touchDistros = [
          'fedora',
          'fedora-silverblue',
          'endless-os',
          'bazzite',
          'postmarketos',
          'ubuntu',
          'asahi-linux'
        ];
        if (touchDistros.includes(distro.id)) {
          earned += 15;
          reasons.push({
            feature: 'Touch & Tablet Support',
            matched: true,
            explanation: 'First-class Wayland touch gestures, auto-screen rotation, and integrated on-screen keyboard.'
          });
        } else if (distro.id === 'antix') {
          earned -= 10;
          reasons.push({
            feature: 'Touch & Tablet Support',
            matched: false,
            explanation: 'Uses traditional X11 window managers with minimal or no touch gesture support.'
          });
        }
      } else if (p === 'printer-scanner') {
        const printFriendly = ['linux-mint', 'ubuntu', 'fedora'];
        if (printFriendly.includes(distro.id)) {
          earned += 15;
          reasons.push({
            feature: 'Printers & Scanners',
            matched: true,
            explanation: 'Pre-configured CUPS, automatic mDNS Bonjour discovery, and turnkey HP/Brother/Epson driver utilities.'
          });
        } else if (['alpine', 'buildroot', 'dietpi'].includes(distro.id)) {
          earned -= 15;
          reasons.push({
            feature: 'Printers & Scanners',
            matched: false,
            explanation: 'Minimal base system requires manual terminal setup and installation of CUPS printing daemons.'
          });
        }
      } else if (p === 'vr-headset') {
        const vrDistros = ['bazzite', 'pop-os', 'arch'];
        if (vrDistros.includes(distro.id)) {
          earned += 15;
          reasons.push({
            feature: 'VR & Sim Rigs',
            matched: true,
            explanation: 'Cutting-edge Mesa Vulkan drivers, native SteamVR compatibility, Monado/Envision OpenXR runtime, and DRM direct display leasing.'
          });
        } else if (['debian', 'antix'].includes(distro.id)) {
          earned -= 15;
          reasons.push({
            feature: 'VR & Sim Rigs',
            matched: false,
            explanation: 'Older LTS kernel and Mesa graphics stack lack DRM leasing for modern VR headsets.'
          });
        }
      } else if (p === 'drawing-tablet') {
        const artDistros = ['ubuntu-studio', 'fedora', 'pop-os'];
        if (artDistros.includes(distro.id)) {
          earned += 15;
          reasons.push({
            feature: 'Drawing Tablets & Stylus',
            matched: true,
            explanation: 'Pre-calibrated Wacom/Huion digitizer drivers, pressure sensitivity curves, and pen mapping tools.'
          });
        }
      } else if (p === 'mixed-dpi') {
        const waylandFractional = ['fedora', 'fedora-silverblue', 'bazzite', 'pop-os', 'ubuntu'];
        if (waylandFractional.includes(distro.id)) {
          earned += 15;
          reasons.push({
            feature: 'High-DPI & Multi-Monitor',
            matched: true,
            explanation: 'Native Wayland per-monitor fractional scaling and independent refresh rates (prevents 4K blur).'
          });
        }
      }
    }

    // Normalized relative compatibility score (0 - 100%). Hard disqualifications are locked to 0%.
    const normalizedScore = isHardDisqualified ? 0 : Math.max(0, Math.min(100, Math.round((earned / maxWeight) * 100)));

    return {
      distro,
      score: normalizedScore,
      reasons
    };
  });

  // Deterministic, fact-based tie breaking:
  // 1. Primary score descending
  // 2. Flagship use-case alignment
  // 3. Lower minimum RAM footprint
  // 4. Exact experience level match
  // 5. Alphabetical by name
  scoredDistros.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (criteria.useCase) {
      const aFlagship = a.distro.primaryUseCases[0] === criteria.useCase;
      const bFlagship = b.distro.primaryUseCases[0] === criteria.useCase;
      if (aFlagship !== bFlagship) return aFlagship ? -1 : 1;
    }
    if (criteria.maxRamMb && a.distro.minRamMb !== b.distro.minRamMb) {
      return a.distro.minRamMb - b.distro.minRamMb;
    }
    if (criteria.experienceLevel) {
      const aExp = a.distro.experienceLevel === criteria.experienceLevel;
      const bExp = b.distro.experienceLevel === criteria.experienceLevel;
      if (aExp !== bExp) return aExp ? -1 : 1;
    }
    const universalDefaults = ['linux-mint', 'ubuntu', 'fedora'];
    const aDefIndex = universalDefaults.indexOf(a.distro.id);
    const bDefIndex = universalDefaults.indexOf(b.distro.id);
    if (aDefIndex !== -1 || bDefIndex !== -1) {
      if (aDefIndex === -1) return 1;
      if (bDefIndex === -1) return -1;
      return aDefIndex - bDefIndex;
    }
    return a.distro.name.localeCompare(b.distro.name);
  });

  const bestMatch = scoredDistros[0];

  // Resolve recipe generator if requested or available
  let recommendedRecipe;
  const hasExplicitModifiers = !!(
    criteria.requiresCustomBuild ||
    criteria.enableDistrobox ||
    criteria.enableNix ||
    criteria.dockerApp ||
    (criteria.desktopApps && criteria.desktopApps.length > 0)
  );

  const targetGeneratorId =
    criteria.platform === 'wsl2'
      ? 'wsl2-debian'
      : criteria.platform === 'vm'
      ? 'cloud-init-qcow2'
      : criteria.useCase === 'hypervisor-vms'
      ? 'proxmox-lxc'
      : criteria.useCase === 'iot-embedded'
      ? 'buildroot-embedded'
      : bestMatch.distro.recipeGeneratorId
      ? bestMatch.distro.recipeGeneratorId
      : (hasExplicitModifiers && bestMatch.distro.id !== 'arch'
          ? 'debootstrap-debian'
          : undefined);

  if (targetGeneratorId) {
    recommendedRecipe = resolveRecipeGenerator(targetGeneratorId, criteria);
  }

  const summary = `Evaluated ${distros.length} distributions. Top match is ${bestMatch.distro.name} with a ${bestMatch.score}% compatibility score.`;

  return {
    topMatches: scoredDistros.slice(0, 5),
    allMatches: scoredDistros,
    bestMatch,
    customRecipeAvailable: !!recommendedRecipe,
    recommendedRecipe,
    summaryText: summary
  };
}
