import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkDesktopAppCompatibility,
  checkDockerAppCompatibility,
  evaluateCriteria,
  getDesktopApp,
  getDockerApp,
  QuestionFlow,
  QUESTIONS
} from './index.js';

test('Core Matcher: Pinpoints Buildroot for NOMMU microcontrollers', () => {
  const result = evaluateCriteria({
    useCase: 'iot-embedded',
    architecture: 'nommu',
    footprint: 'micro'
  });

  assert.equal(result.bestMatch.distro.id, 'buildroot');
  assert.ok(result.bestMatch.score >= 70);
  assert.ok(result.recommendedRecipe);
  if (result.recommendedRecipe) {
    assert.equal(result.recommendedRecipe.id, 'buildroot-embedded');
    assert.ok(result.recommendedRecipe.files.some(f => f.filename === 'distro.defconfig'));
  }
});

test('Core Matcher: Arch Linux winner does NOT attach an incompatible Debian debootstrap recipe by default', () => {
  const result = evaluateCriteria({
    useCase: 'desktop',
    releaseCadence: 'rolling',
    statePreference: 'mutable',
    cLibPreference: 'glibc',
    initPreference: 'systemd'
  });

  assert.equal(result.bestMatch.distro.id, 'arch');
  // Must NOT attach debootstrap-debian recipe to Arch Linux!
  assert.equal(result.recommendedRecipe, undefined);
  assert.equal(result.customRecipeAvailable, false);
});

test('Core Matcher: Identifies Talos Linux for Kubernetes cluster nodes', () => {
  const result = evaluateCriteria({
    useCase: 'k8s-cluster',
    platform: 'k8s-node',
    architecture: 'x86_64'
  });

  assert.equal(result.bestMatch.distro.id, 'talos');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Identifies Alpine / Distroless for minimal container base', () => {
  const result = evaluateCriteria({
    useCase: 'container-base',
    platform: 'container',
    footprint: 'minimal'
  });

  const topTwoIds = result.topMatches.slice(0, 2).map(m => m.distro.id);
  assert.ok(topTwoIds.includes('alpine') || topTwoIds.includes('chainguard-distroless'));
});

test('Core Matcher: Pinpoints Batocera for beginner retro-gaming on old hardware', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'gaming',
    footprint: 'lean',
    architecture: 'x86_64'
  });

  assert.equal(result.bestMatch.distro.id, 'batocera');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Identifies antiX for reviving ancient PCs with minimal RAM', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'desktop',
    footprint: 'minimal',
    architecture: 'x86_64'
  });

  assert.equal(result.bestMatch.distro.id, 'antix');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Pinpoints LibreELEC for living room media center (Kodi TV)', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'media-center',
    platform: 'bare-metal',
    architecture: 'x86_64'
  });

  assert.equal(result.bestMatch.distro.id, 'libreelec');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Pinpoints OpenWrt for home router & firewall', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'router-networking',
    platform: 'router-firewall'
  });

  assert.equal(result.bestMatch.distro.id, 'openwrt');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Pinpoints Endless OS for kids school and education', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'education-kids',
    platform: 'bare-metal'
  });

  assert.equal(result.bestMatch.distro.id, 'endless-os');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Pinpoints Endless OS on older MacBook laptop with 4GB RAM (never Porteus Kiosk)', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'education-kids',
    platform: 'bare-metal',
    architecture: 'x86_64',
    maxRamMb: 4096,
    prefersGui: true,
    releaseCadence: 'standard',
    driverPhilosophy: 'no-preference',
    bootMedium: 'nvme-ssd',
    realtimeAudio: false
  });

  assert.equal(result.bestMatch.distro.id, 'endless-os');
  assert.ok(result.bestMatch.score >= 90);
  const porteus = result.allMatches.find(m => m.distro.id === 'porteus-kiosk');
  assert.ok(porteus);
  assert.ok(porteus.score < 65, 'Porteus Kiosk must not score high on an educational desktop');
});

test('Core Matcher: Pinpoints OpenMediaVault for family NAS and photo backups', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'nas-storage',
    platform: 'bare-metal'
  });

  assert.equal(result.bestMatch.distro.id, 'openmediavault');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Pinpoints Home Assistant OS for smart home automation', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'smart-home',
    platform: 'embedded-sbc'
  });

  assert.equal(result.bestMatch.distro.id, 'home-assistant-os');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Pinpoints Cage Appliance for dedicated single-app hardware product', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'appliance-product',
    platform: 'kiosk'
  });

  assert.equal(result.bestMatch.distro.id, 'cage-appliance');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Recommends Armbian or DietPi for ARM TV boxes and single board servers', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'server',
    platform: 'embedded-sbc',
    architecture: 'arm64'
  });

  const topIds = result.topMatches.slice(0, 3).map(m => m.distro.id);
  assert.ok(topIds.includes('armbian') || topIds.includes('dietpi'));
});

test('Core Matcher: Identifies postmarketOS for repurposed mobile and gadget hardware', () => {
  const result = evaluateCriteria({
    useCase: 'iot-embedded',
    platform: 'embedded-sbc',
    cLibPreference: 'musl',
    footprint: 'minimal'
  });

  const topIds = result.topMatches.slice(0, 3).map(m => m.distro.id);
  assert.ok(topIds.includes('postmarketos') || topIds.includes('alpine') || topIds.includes('buildroot'));
});

test('Core Matcher: Identifies Pop!_OS for AI / Data Science GPU workstations', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'ai-gpu-compute',
    platform: 'desktop',
    footprint: 'full',
    architecture: 'x86_64'
  });

  assert.equal(result.bestMatch.distro.id, 'pop-os');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Identifies HiveOS for multi-GPU mining rigs and compute nodes', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'ai-gpu-compute',
    platform: 'server',
    footprint: 'lean',
    architecture: 'x86_64'
  });

  assert.equal(result.bestMatch.distro.id, 'hiveos');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Identifies Proxmox VE for used enterprise server racks & homelab virtualization', () => {
  const result = evaluateCriteria({
    experienceLevel: 'intermediate',
    useCase: 'hypervisor-vms',
    platform: 'server',
    architecture: 'x86_64'
  });

  assert.equal(result.bestMatch.distro.id, 'proxmox-ve');
  assert.ok(result.bestMatch.score >= 85);
});

test('Core Matcher: Identifies TrueNAS SCALE for enterprise multi-bay rack storage servers', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'nas-storage',
    platform: 'server',
    statePreference: 'read-only-rootfs'
  });

  assert.equal(result.bestMatch.distro.id, 'truenas-scale');
  assert.ok(result.bestMatch.score >= 85);
});

test('Core Matcher: Identifies Asahi Linux for Apple Silicon (M1/M2/M3) desktop machines', () => {
  const result = evaluateCriteria({
    experienceLevel: 'intermediate',
    useCase: 'desktop',
    platform: 'bare-metal',
    architecture: 'arm64',
    footprint: 'full'
  });

  const topIds = result.topMatches.slice(0, 3).map(m => m.distro.id);
  assert.ok(topIds.includes('asahi-linux'));
});

test('Core Matcher: Identifies Linux Mint or Fedora for home office and freelance workstations', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'home-office',
    platform: 'bare-metal',
    architecture: 'x86_64'
  });

  const topIds = result.topMatches.slice(0, 2).map(m => m.distro.id);
  assert.ok(topIds.includes('linux-mint') || topIds.includes('fedora'));
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Identifies Ubuntu Studio for freelance graphics, 3D art and video production', () => {
  const result = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'creative-studio',
    platform: 'bare-metal',
    footprint: 'full'
  });

  assert.equal(result.bestMatch.distro.id, 'ubuntu-studio');
  assert.ok(result.bestMatch.score >= 85);
});

test('Recipe Generators: Generates Cloud-Init QCOW2 virtual machine disk recipe', () => {
  const result = evaluateCriteria({
    useCase: 'server',
    platform: 'vm'
  });

  assert.ok(result.recommendedRecipe);
  assert.equal(result.recommendedRecipe.targetFormat, 'qcow2');
  assert.equal(result.recommendedRecipe.id, 'cloud-init-qcow2');
  assert.ok(result.recommendedRecipe.files.some(f => f.filename === 'user-data'));
  assert.ok(result.recommendedRecipe.files.some(f => f.filename === 'meta-data'));
});

test('Recipe Generators: Generates WSL2 rootfs package recipe for Windows developers', () => {
  const result = evaluateCriteria({
    platform: 'wsl2'
  });

  assert.ok(result.recommendedRecipe);
  assert.equal(result.recommendedRecipe.targetFormat, 'wsl2');
  assert.equal(result.recommendedRecipe.id, 'wsl2-debian');
  assert.ok(result.recommendedRecipe.files.some(f => f.filename === 'wsl.conf'));
  assert.ok(result.recommendedRecipe.files.some(f => f.filename === 'install-wsl.ps1'));
});

test('Recipe Generators: Generates Proxmox LXC system container template recipe', () => {
  const result = evaluateCriteria({
    useCase: 'hypervisor-vms',
    platform: 'server'
  });

  assert.ok(result.recommendedRecipe);
  assert.equal(result.recommendedRecipe.targetFormat, 'lxc-template');
  assert.equal(result.recommendedRecipe.id, 'proxmox-lxc');
  assert.ok(result.recommendedRecipe.files.some(f => f.filename === 'lxc-create.sh'));
});

test('Recipe Modifiers: Frankenstein cards alter Makefile desktop, Distrobox and package layers', () => {
  const result = evaluateCriteria({
    useCase: 'desktop',
    platform: 'bare-metal',
    desktopEnv: 'cage',
    enableDistrobox: true,
    enableNix: true
  });

  assert.ok(result.recommendedRecipe);
  const makefile = result.recommendedRecipe.files.find(f => f.filename === 'Makefile');
  assert.ok(makefile);
  assert.ok(makefile.content.includes('DESKTOP_ENV     ?= cage'));
  assert.ok(makefile.content.includes('ENABLE_DISTROBOX ?= 1'));
  assert.ok(makefile.content.includes('ENABLE_NIX       ?= 1'));
});

test('Recipe Modifiers: Turnkey Docker app layer injects docker-compose.yml and updates Makefile', () => {
  const result = evaluateCriteria({
    useCase: 'nas-storage',
    platform: 'bare-metal',
    dockerApp: 'immich'
  });

  assert.ok(result.recommendedRecipe);
  const composeFile = result.recommendedRecipe.files.find(f => f.filename === 'docker-compose.yml');
  assert.ok(composeFile, 'docker-compose.yml must be generated when dockerApp is set');
  assert.ok(composeFile.content.includes('immich-server'));
  assert.ok(composeFile.content.includes('immich-machine-learning'));
  assert.ok(composeFile.content.includes('2283:2283'));

  const makefile = result.recommendedRecipe.files.find(f => f.filename === 'Makefile');
  assert.ok(makefile);
  assert.ok(makefile.content.includes('DOCKER_APP       ?= immich'));
  assert.ok(makefile.content.includes('docker compose -f docker-compose.yml up -d'));
});

test('Recipe Modifiers: Turnkey Docker app integrates into Cloud-Init recipe', () => {
  const result = evaluateCriteria({
    useCase: 'server',
    platform: 'vm',
    dockerApp: 'home-assistant'
  });

  assert.ok(result.recommendedRecipe);
  const composeFile = result.recommendedRecipe.files.find(f => f.filename === 'docker-compose.yml');
  assert.ok(composeFile);
  assert.ok(composeFile.content.includes('homeassistant'));

  const userData = result.recommendedRecipe.files.find(f => f.filename === 'user-data');
  assert.ok(userData);
  assert.ok(userData.content.includes('docker.io'));
  assert.ok(userData.content.includes('cd /opt/home-assistant && docker compose up -d'));
});

test('Recipe Modifiers: Desktop apps layer injects bootstrap-apps.sh with unattended installer', () => {
  const result = evaluateCriteria({
    useCase: 'desktop',
    platform: 'bare-metal',
    desktopApps: ['firefox', 'vscode', 'vlc']
  });

  assert.ok(result.recommendedRecipe);
  const bootstrapFile = result.recommendedRecipe.files.find(f => f.filename === 'bootstrap-apps.sh');
  assert.ok(bootstrapFile, 'bootstrap-apps.sh must be generated when desktopApps are selected');
  assert.ok(bootstrapFile.content.includes('Firefox'));
  assert.ok(bootstrapFile.content.includes('VS Code'));
  assert.ok(bootstrapFile.content.includes('VLC'));
  assert.ok(bootstrapFile.content.includes('flatpak install -y --noninteractive flathub com.visualstudio.code'));
  assert.ok(result.recommendedRecipe.quickstartCommands.some(c => c.includes('bootstrap-apps.sh')));
});

test('QuestionFlow: Dynamically tailors questions for beginners (hides init and libc jargon)', () => {
  const flow = new QuestionFlow(QUESTIONS);
  const beginnerEligible = flow.getEligibleQuestions({ experienceLevel: 'beginner' });

  assert.ok(beginnerEligible.some(q => q.id === 'beginner_goal'));
  assert.ok(beginnerEligible.some(q => q.id === 'beginner_device'));
  assert.equal(beginnerEligible.some(q => q.id === 'c_library_and_init'), false);
  assert.equal(beginnerEligible.some(q => q.id === 'system_immutability'), false);
  assert.equal(beginnerEligible.some(q => q.id === 'technical_use_case'), false);
});

test('Matcher: Incompatible CPU architecture results in score 0 (hard physical gate)', () => {
  // Test NOMMU microcontroller constraint on x86-only distros
  const result = evaluateCriteria({
    architecture: 'nommu',
    useCase: 'server'
  });

  // Distros that do not support nommu must be disqualified (score = 0)
  for (const match of result.topMatches) {
    if (!match.distro.architectures.includes('nommu')) {
      assert.equal(match.score, 0, `${match.distro.name} must have 0 score on nommu`);
      assert.ok(match.reasons.some(r => r.feature === 'Architecture' && !r.matched));
    }
  }
});

test('Matcher: RAM constraints evaluate maxRamMb against minRamMb', () => {
  const lowRamResult = evaluateCriteria({
    maxRamMb: 512,
    useCase: 'desktop'
  });

  // antiX or tiny distros should outrank 4GB workstations like Pop!_OS or Fedora
  const antix = lowRamResult.topMatches.find(m => m.distro.id === 'antix');
  assert.ok(antix, 'antiX should be in top matches for 512MB RAM desktop');
  assert.ok(antix.score > 0);

  const ramReason = antix.reasons.find(r => r.feature === 'RAM Budget');
  assert.ok(ramReason);
  assert.equal(ramReason.matched, true);
});

test('Matcher: allMatches contains all 31 registered distributions ranked', () => {
  const result = evaluateCriteria({});
  assert.equal(result.allMatches.length, 31);
  assert.equal(result.topMatches.length, 5);
  // Unconstrained baseline recommends Linux Mint at 100% instead of arbitrary Alpine 0%
  assert.equal(result.bestMatch.distro.id, 'linux-mint');
  assert.equal(result.bestMatch.score, 100);
  assert.equal(result.bestMatch.reasons[0].feature, 'Universal Baseline');
  // Ensure descending score order
  for (let i = 0; i < result.allMatches.length - 1; i++) {
    assert.ok(result.allMatches[i].score >= result.allMatches[i + 1].score);
  }
});

test('Hardware Constraints: Docker app compatibility enforces architecture and RAM budgets', () => {
  const immich = getDockerApp('immich');
  const pihole = getDockerApp('pihole');
  assert.ok(immich && pihole);

  // NOMMU microcontroller hard blocker
  const nommuCheck = checkDockerAppCompatibility(immich, { architecture: 'nommu' });
  assert.equal(nommuCheck.compatible, false);
  assert.ok(nommuCheck.blocker?.includes('Microcontrollers (NOMMU)'));

  // Architecture incompatibility (Immich not on riscv64)
  const riscvCheck = checkDockerAppCompatibility(immich, { architecture: 'riscv64' });
  assert.equal(riscvCheck.compatible, false);
  assert.ok(riscvCheck.blocker?.includes('do not support riscv64'));

  // Low RAM warning on Immich (requires 4GB, budget 512MB)
  const lowRamImmich = checkDockerAppCompatibility(immich, { architecture: 'x86_64', maxRamMb: 512 });
  assert.equal(lowRamImmich.compatible, true);
  assert.equal(lowRamImmich.warnings.length, 1);
  assert.ok(lowRamImmich.warnings[0].includes('requires ~4 GB RAM'));

  // Pi-hole on 512MB RAM has no warnings
  const piholeCheck = checkDockerAppCompatibility(pihole, { architecture: 'x86_64', maxRamMb: 512 });
  assert.equal(piholeCheck.compatible, true);
  assert.equal(piholeCheck.warnings.length, 0);
});

test('Hardware Constraints: Desktop app compatibility enforces architecture and RAM budgets', () => {
  const chromium = getDesktopApp('chromium');
  const blender = getDesktopApp('blender');
  const neovim = getDesktopApp('neovim');
  assert.ok(chromium && blender && neovim);

  // NOMMU blocker
  const nommuCheck = checkDesktopAppCompatibility(chromium, { architecture: 'nommu' });
  assert.equal(nommuCheck.compatible, false);
  assert.ok(nommuCheck.blocker?.includes('NOMMU'));

  // Architecture blocker (Blender not on armv7)
  const armv7Check = checkDesktopAppCompatibility(blender, { architecture: 'armv7' });
  assert.equal(armv7Check.compatible, false);
  assert.ok(armv7Check.blocker?.includes('armv7'));

  // Low RAM warning on Chromium (2GB req, 512MB budget)
  const lowRamChromium = checkDesktopAppCompatibility(chromium, { architecture: 'x86_64', maxRamMb: 512 });
  assert.equal(lowRamChromium.compatible, true);
  assert.equal(lowRamChromium.warnings.length, 1);
  assert.ok(lowRamChromium.warnings[0].includes('requires ~2 GB RAM'));

  // Neovim on 512MB has no warnings
  const neovimCheck = checkDesktopAppCompatibility(neovim, { architecture: 'x86_64', maxRamMb: 512 });
  assert.equal(neovimCheck.compatible, true);
  assert.equal(neovimCheck.warnings.length, 0);
});

test('QuestionFlow: Presents expanded questions (display mode, release cadence, driver philosophy, boot medium, pro audio)', () => {
  const flow = new QuestionFlow(QUESTIONS);
  const eligible = flow.getEligibleQuestions({ experienceLevel: 'intermediate', useCase: 'desktop' });

  assert.ok(eligible.some(q => q.id === 'display_mode'), 'Must include display_mode');
  assert.ok(eligible.some(q => q.id === 'release_cadence'), 'Must include release_cadence');
  assert.ok(eligible.some(q => q.id === 'driver_philosophy'), 'Must include driver_philosophy');
  assert.ok(eligible.some(q => q.id === 'boot_medium'), 'Must include boot_medium');
  assert.ok(eligible.some(q => q.id === 'audio_latency'), 'Must include audio_latency');
});

test('Matcher: Evaluates release cadence (rolling vs LTS)', () => {
  const rollingRes = evaluateCriteria({
    useCase: 'desktop',
    releaseCadence: 'rolling'
  });
  const archMatch = rollingRes.allMatches.find(m => m.distro.id === 'arch');
  assert.ok(archMatch);
  assert.ok(archMatch.reasons.some(r => r.feature === 'Release Cadence' && r.matched));

  const ltsRes = evaluateCriteria({
    useCase: 'desktop',
    releaseCadence: 'lts'
  });
  const debianMatch = ltsRes.allMatches.find(m => m.distro.id === 'debian');
  assert.ok(debianMatch);
  assert.ok(debianMatch.reasons.some(r => r.feature === 'Release Cadence' && r.matched));
});

test('Matcher: Evaluates driver philosophy (proprietary vs free software)', () => {
  const propRes = evaluateCriteria({
    useCase: 'desktop',
    driverPhilosophy: 'seamless-proprietary'
  });
  const popMatch = propRes.allMatches.find(m => m.distro.id === 'pop-os');
  assert.ok(popMatch);
  assert.ok(popMatch.reasons.some(r => r.feature === 'Proprietary Drivers' && r.matched));

  const freeRes = evaluateCriteria({
    useCase: 'desktop',
    driverPhilosophy: 'free-software-only'
  });
  const debianFreeMatch = freeRes.allMatches.find(m => m.distro.id === 'debian');
  assert.ok(debianFreeMatch);
  assert.ok(debianFreeMatch.reasons.some(r => r.feature === 'Open Source Drivers' && r.matched));
});

test('Matcher: Evaluates boot medium (MicroSD/USB flash wear reduction vs PXE diskless)', () => {
  const flashRes = evaluateCriteria({
    useCase: 'server',
    bootMedium: 'sd-card-usb'
  });
  const dietPiMatch = flashRes.allMatches.find(m => m.distro.id === 'dietpi');
  assert.ok(dietPiMatch);
  assert.ok(dietPiMatch.reasons.some(r => r.feature === 'Flash Storage' && r.matched));

  const pxeRes = evaluateCriteria({
    useCase: 'k8s-cluster',
    bootMedium: 'pxe-diskless'
  });
  const talosMatch = pxeRes.allMatches.find(m => m.distro.id === 'talos');
  assert.ok(talosMatch);
  assert.ok(talosMatch.reasons.some(r => r.feature === 'Diskless Boot' && r.matched));
});

test('Matcher: Realtime audio significantly boosts Ubuntu Studio', () => {
  const studioRes = evaluateCriteria({
    useCase: 'creative-studio',
    realtimeAudio: true
  });
  const studioMatch = studioRes.allMatches.find(m => m.distro.id === 'ubuntu-studio');
  assert.ok(studioMatch);
  assert.ok(studioMatch.reasons.some(r => r.feature === 'Low-Latency Audio' && r.matched));
});

test('Matcher: Specialized peripherals evaluate touch, printers, and VR stacks', () => {
  // Touchscreen
  const touchRes = evaluateCriteria({
    useCase: 'desktop',
    peripheralNeed: 'touchscreen'
  });
  const fedoraMatch = touchRes.allMatches.find(m => m.distro.id === 'fedora');
  assert.ok(fedoraMatch);
  assert.ok(fedoraMatch.reasons.some(r => r.feature === 'Touch & Tablet Support' && r.matched));

  // Printers & Scanners
  const printRes = evaluateCriteria({
    useCase: 'home-office',
    peripheralNeed: 'printer-scanner'
  });
  const mintMatch = printRes.allMatches.find(m => m.distro.id === 'linux-mint');
  assert.ok(mintMatch);
  assert.ok(mintMatch.reasons.some(r => r.feature === 'Printers & Scanners' && r.matched));

  // VR Headsets
  const vrRes = evaluateCriteria({
    useCase: 'gaming',
    peripheralNeed: 'vr-headset'
  });
  const bazziteMatch = vrRes.allMatches.find(m => m.distro.id === 'bazzite');
  assert.ok(bazziteMatch);
  assert.ok(bazziteMatch.reasons.some(r => r.feature === 'VR & Sim Rigs' && r.matched));

  // Multi-Select Peripherals: Touch + Printer
  const multiRes = evaluateCriteria({
    useCase: 'home-office',
    peripherals: ['touchscreen', 'printer-scanner']
  });
  const fedoraMulti = multiRes.allMatches.find(m => m.distro.id === 'fedora');
  assert.ok(fedoraMulti);
  assert.ok(fedoraMulti.reasons.some(r => r.feature === 'Touch & Tablet Support' && r.matched));
  assert.ok(fedoraMulti.reasons.some(r => r.feature === 'Printers & Scanners' && r.matched));
});

test('Matcher: Form Factor scoring differentiates Handheld, Laptop, and Low-Power hardware', () => {
  // Handheld gaming PC (Steam Deck / ROG Ally)
  const handheldRes = evaluateCriteria({
    useCase: 'gaming',
    architecture: 'x86_64',
    formFactor: 'handheld'
  });
  assert.equal(handheldRes.bestMatch.distro.id, 'bazzite');
  const bazziteMatch = handheldRes.allMatches.find(m => m.distro.id === 'bazzite');
  assert.ok(bazziteMatch);
  assert.ok(bazziteMatch.reasons.some(r => r.feature === 'Handheld Gaming Optimization' && r.matched));

  // Laptop power and battery management
  const laptopRes = evaluateCriteria({
    useCase: 'desktop',
    architecture: 'x86_64',
    formFactor: 'laptop'
  });
  const fedoraMatch = laptopRes.allMatches.find(m => m.distro.id === 'fedora');
  assert.ok(fedoraMatch);
  assert.ok(fedoraMatch.reasons.some(r => r.feature === 'Laptop Power & Battery' && r.matched));

  // Low-power / ancient PC
  const lowPowerRes = evaluateCriteria({
    architecture: 'x86_64',
    formFactor: 'low-power',
    footprint: 'minimal'
  });
  const antixMatch = lowPowerRes.allMatches.find(m => m.distro.id === 'antix');
  assert.ok(antixMatch);
  assert.ok(antixMatch.reasons.some(r => r.feature === 'Low-Power Hardware' && r.matched));
});
