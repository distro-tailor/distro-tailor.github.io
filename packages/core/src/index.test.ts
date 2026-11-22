import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkDesktopAppCompatibility,
  checkDockerAppCompatibility,
  evaluateCriteria,
  getDesktopApp,
  getDockerApp,
  QuestionFlow,
  QUESTIONS,
  type UserCriteria
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

test('Core Matcher: Pinpoints OPNsense for standard x86 firewall & high-throughput routing', () => {
  const result = evaluateCriteria({
    experienceLevel: 'intermediate',
    useCase: 'router-networking',
    platform: 'router-firewall',
    architecture: 'x86_64',
    footprint: 'standard',
    maxRamMb: 4096
  });

  assert.equal(result.bestMatch.distro.id, 'opnsense');
  assert.ok(result.bestMatch.score >= 80);
  assert.equal(result.bestMatch.distro.osFamily, 'bsd');
  assert.equal(result.bestMatch.distro.kernelModel, 'monolithic-bsd');
});

test('Core Matcher: Pinpoints FreeDOS for micro-footprint real-mode PC appliances', () => {
  const result = evaluateCriteria({
    experienceLevel: 'intermediate',
    useCase: 'appliance-product',
    platform: 'bare-metal',
    architecture: 'x86_64',
    footprint: 'micro',
    maxRamMb: 16,
    cLibPreference: 'none'
  });

  assert.equal(result.bestMatch.distro.id, 'freedos');
  assert.ok(result.bestMatch.score >= 80);
  assert.equal(result.bestMatch.distro.osFamily, 'independent');
  assert.equal(result.bestMatch.distro.kernelModel, 'realmode-dos');
});

test('Core Matcher: Pinpoints SmartOS for stateless Illumos hypervisors and Solaris Zones', () => {
  const result = evaluateCriteria({
    experienceLevel: 'systems-engineer',
    useCase: 'hypervisor-vms',
    platform: 'server',
    architecture: 'x86_64',
    statePreference: 'stateless-ram',
    footprint: 'standard',
    maxRamMb: 8192
  });

  assert.equal(result.bestMatch.distro.id, 'smartos');
  assert.ok(result.bestMatch.score >= 80);
  assert.equal(result.bestMatch.distro.osFamily, 'independent');
  assert.equal(result.bestMatch.distro.kernelModel, 'illumos');
});

test('Core Matcher: Pinpoints ReactOS for open-source Windows NT compatibility on legacy PCs', () => {
  const result = evaluateCriteria({
    experienceLevel: 'intermediate',
    useCase: 'desktop',
    platform: 'bare-metal',
    architecture: 'x86_64',
    maxRamMb: 512,
    footprint: 'lean',
    cLibPreference: 'none',
    workflowStyle: 'windows'
  });

  assert.equal(result.bestMatch.distro.id, 'reactos');
  assert.ok(result.bestMatch.score >= 80);
  assert.equal(result.bestMatch.distro.osFamily, 'independent');
  assert.equal(result.bestMatch.distro.kernelModel, 'hybrid-nt');
});

test('Core Matcher: Pinpoints Haiku for responsive personal desktop computing', () => {
  const result = evaluateCriteria({
    experienceLevel: 'intermediate',
    useCase: 'desktop',
    platform: 'bare-metal',
    architecture: 'x86_64',
    maxRamMb: 1024,
    footprint: 'lean',
    cLibPreference: 'none',
    workflowStyle: 'traditional-compact'
  });

  assert.equal(result.bestMatch.distro.id, 'haiku');
  assert.ok(result.bestMatch.score >= 80);
  assert.equal(result.bestMatch.distro.osFamily, 'independent');
  assert.equal(result.bestMatch.distro.kernelModel, 'beos-modular');
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
  const kiosk = result.allMatches.find(m => m.distro.id === 'cage-appliance');
  assert.ok(kiosk);
  assert.ok(kiosk.score < 65, 'A single-app kiosk appliance must not score high on an educational desktop');
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

test('Core Matcher: Recommends an open-source GPU OS (Pop!_OS / Ubuntu) for compute nodes and mining rigs', () => {
  const gpu = evaluateCriteria({ useCase: 'ai-gpu-compute', driverPhilosophy: 'seamless-proprietary' });
  assert.equal(gpu.bestMatch.distro.id, 'pop-os');

  // Headless rig: Ubuntu Server with one-step proprietary NVIDIA drivers (ubuntu-drivers)
  const rig = evaluateCriteria({
    experienceLevel: 'beginner',
    useCase: 'ai-gpu-compute',
    platform: 'server',
    footprint: 'lean',
    prefersGui: false,
    driverPhilosophy: 'seamless-proprietary'
  });
  assert.equal(rig.bestMatch.distro.id, 'ubuntu');
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

test('Matcher: allMatches contains all 48 registered distributions ranked', () => {
  const result = evaluateCriteria({});
  assert.equal(result.allMatches.length, 48);
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

test('QuestionFlow: offline_navigation applies screen-ready cage + Navit/GPSd defaults and skips display/desktop prompts', () => {
  const goalQuestion = QUESTIONS.find(q => q.id === 'beginner_goal');
  assert.ok(goalQuestion, 'beginner_goal question must exist');
  const navOption = goalQuestion.options.find(o => o.id === 'offline_navigation');
  assert.ok(navOption, 'offline_navigation option must exist');

  assert.equal(navOption.appliesCriteria.prefersGui, true);
  assert.equal(navOption.appliesCriteria.desktopEnv, 'cage');
  assert.deepEqual(navOption.appliesCriteria.navigationApps, ['navit', 'gpsd']);

  const flow = new QuestionFlow(QUESTIONS);
  const eligible = flow.getEligibleQuestions({
    experienceLevel: 'beginner',
    ...navOption.appliesCriteria
  });

  assert.ok(!eligible.some(q => q.id === 'display_mode'), 'Must skip display_mode for offline_navigation');
  assert.ok(!eligible.some(q => q.id === 'desktop_workflow_style'), 'Must skip desktop_workflow_style for offline_navigation');
});

test('QuestionFlow: beginner_goal orders everyday beginner choices before home/media and maker/hacker builds', () => {
  const goalQuestion = QUESTIONS.find(q => q.id === 'beginner_goal');
  assert.ok(goalQuestion, 'beginner_goal question must exist');
  const ids = goalQuestion.options.map(o => o.id);

  assert.equal(ids[0], 'daily_desktop', 'Everyday Computer should be the first beginner goal');
  assert.ok(ids.indexOf('revive_old_pc') < ids.indexOf('retro_gaming_console'));
  assert.ok(ids.indexOf('freelance_office_docs') < ids.indexOf('home_server'));
  assert.ok(ids.indexOf('retro_gaming_console') < ids.indexOf('offline_navigation'));
  assert.ok(ids.indexOf('home_server') < ids.indexOf('homelab_virtualization'));
  assert.ok(ids.indexOf('offline_navigation') < ids.indexOf('crypto_mining_rig'));

  const techUseCase = QUESTIONS.find(q => q.id === 'technical_use_case');
  assert.ok(techUseCase, 'technical_use_case question must exist');
  const techIds = techUseCase.options.map(o => o.id);
  assert.equal(techIds[0], 'desktop_gaming');
  assert.ok(techIds.indexOf('server_cloud') < techIds.indexOf('iot_embedded'));

  const cLibQuestion = QUESTIONS.find(q => q.id === 'c_library_and_init');
  assert.ok(cLibQuestion, 'c_library_and_init question must exist');
  assert.equal(cLibQuestion.options[0].id, 'glibc_systemd');
  assert.equal(cLibQuestion.options[0].isDefault, true);
});

test('QuestionFlow & Matcher: coding_dev, music_audio_studio, and security_privacy goals map cleanly', () => {
  const goalQuestion = QUESTIONS.find(q => q.id === 'beginner_goal')!;
  const codingOpt = goalQuestion.options.find(o => o.id === 'coding_dev')!;
  const audioOpt = goalQuestion.options.find(o => o.id === 'music_audio_studio')!;
  const secOpt = goalQuestion.options.find(o => o.id === 'security_privacy')!;

  assert.deepEqual(codingOpt.appliesCriteria.desktopApps, ['vscode', 'git-dev', 'python', 'nodejs']);
  assert.equal(audioOpt.appliesCriteria.realtimeAudio, true);
  assert.equal(secOpt.appliesCriteria.useCase, 'security-pentest');

  const audioRes = evaluateCriteria({ experienceLevel: 'beginner', ...audioOpt.appliesCriteria });
  assert.equal(audioRes.bestMatch.distro.id, 'ubuntu-studio');

  const tailsRes = evaluateCriteria({ experienceLevel: 'beginner', ...secOpt.appliesCriteria });
  assert.equal(tailsRes.bestMatch.distro.id, 'tails');

  const kaliRes = evaluateCriteria({
    experienceLevel: 'intermediate',
    useCase: 'security-pentest',
    platform: 'vm',
    releaseCadence: 'rolling'
  });
  assert.equal(kaliRes.bestMatch.distro.id, 'kali-linux');

  const zephyrRes = evaluateCriteria({
    experienceLevel: 'systems-engineer',
    useCase: 'iot-embedded',
    platform: 'microcontroller',
    architecture: 'nommu',
    footprint: 'micro',
    initPreference: 'custom'
  });
  assert.equal(zephyrRes.bestMatch.distro.id, 'zephyr');

  const yoctoRes = evaluateCriteria({
    experienceLevel: 'systems-engineer',
    useCase: 'iot-embedded',
    platform: 'embedded-sbc',
    footprint: 'minimal',
    statePreference: 'immutable-ostree'
  });
  assert.equal(yoctoRes.bestMatch.distro.id, 'yocto');
});

test('QuestionFlow: persona guards skip irrelevant hardware, audio, and storage questions', () => {
  const flow = new QuestionFlow(QUESTIONS);

  // Novice Home Server must not be asked pro-audio or desktop peripherals
  const serverIds = flow.getEligibleQuestions({
    experienceLevel: 'beginner',
    useCase: 'server',
    platform: 'embedded-sbc'
  }).map((q) => q.id);
  assert.ok(!serverIds.includes('audio_latency'));
  assert.ok(!serverIds.includes('attached_peripherals'));

  // Novice WSL2 must not be asked physical boot_medium or driver_philosophy
  const wslIds = flow.getEligibleQuestions({
    experienceLevel: 'beginner',
    platform: 'wsl2',
    footprint: 'minimal'
  }).map((q) => q.id);
  assert.ok(!wslIds.includes('boot_medium'));
  assert.ok(!wslIds.includes('driver_philosophy'));

  // Tinkerer K8s Node must not be asked attached_peripherals
  const k8sIds = flow.getEligibleQuestions({
    experienceLevel: 'intermediate',
    useCase: 'k8s-cluster',
    platform: 'k8s-node'
  }).map((q) => q.id);
  assert.ok(!k8sIds.includes('attached_peripherals'));

  // Expert NOMMU MCU keeps c_library_and_init but skips display, drivers, boot_medium, immutability, filesystems
  const mcuIds = flow.getEligibleQuestions({
    experienceLevel: 'systems-engineer',
    useCase: 'iot-embedded',
    platform: 'microcontroller',
    architecture: 'nommu',
    footprint: 'micro'
  }).map((q) => q.id);
  assert.ok(mcuIds.includes('c_library_and_init'));
  assert.ok(!mcuIds.includes('display_mode'));
  assert.ok(!mcuIds.includes('driver_philosophy'));
  assert.ok(!mcuIds.includes('boot_medium'));
  assert.ok(!mcuIds.includes('system_immutability'));
  assert.ok(!mcuIds.includes('filesystem_and_storage'));
});

test('QuestionFlow & Matcher: Evaluates desktop workflow familiarity (Windows, macOS, Mobile/Touch)', () => {
  const flow = new QuestionFlow(QUESTIONS);
  const eligible = flow.getEligibleQuestions({ experienceLevel: 'intermediate', useCase: 'desktop', prefersGui: true });
  assert.ok(eligible.some(q => q.id === 'desktop_workflow_style'), 'Must include desktop_workflow_style for GUI users');

  // 1. Mobile / Touch / Chromebook familiarity favors Endless OS
  const mobileRes = evaluateCriteria({
    useCase: 'desktop',
    prefersGui: true,
    workflowStyle: 'mobile-touch'
  });
  const endlessMatch = mobileRes.allMatches.find(m => m.distro.id === 'endless-os');
  assert.ok(endlessMatch);
  assert.ok(endlessMatch.reasons.some(r => r.feature === 'Interface Familiarity' && r.matched));

  // 2. Windows familiarity favors Linux Mint
  const winRes = evaluateCriteria({
    useCase: 'desktop',
    prefersGui: true,
    workflowStyle: 'windows'
  });
  const mintMatch = winRes.allMatches.find(m => m.distro.id === 'linux-mint');
  assert.ok(mintMatch);
  assert.ok(mintMatch.reasons.some(r => r.feature === 'Interface Familiarity' && r.matched));

  // 3. macOS familiarity favors Pop!_OS and GNOME
  const macRes = evaluateCriteria({
    useCase: 'desktop',
    prefersGui: true,
    workflowStyle: 'macos'
  });
  const popMatch = macRes.allMatches.find(m => m.distro.id === 'pop-os');
  assert.ok(popMatch);
  assert.ok(popMatch.reasons.some(r => r.feature === 'Interface Familiarity' && r.matched));
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

test('Recipe Generators: Generates Declarative NixOS Flake & VM Harness recipe', () => {
  const result = evaluateCriteria({
    statePreference: 'declarative',
    useCase: 'desktop',
    architecture: 'x86_64',
    desktopApps: ['firefox', 'vscode'],
    dockerApp: 'nextcloud',
    realtimeAudio: true
  });

  assert.equal(result.bestMatch.distro.id, 'nixos');
  assert.ok(result.recommendedRecipe);
  if (result.recommendedRecipe) {
    assert.equal(result.recommendedRecipe.id, 'nixos-flake');
    const filenames = result.recommendedRecipe.files.map((f) => f.filename);
    assert.ok(filenames.includes('flake.nix'));
    assert.ok(filenames.includes('configuration.nix'));
    assert.ok(filenames.includes('Makefile'));
    assert.ok(filenames.includes('README.md'));

    const config = result.recommendedRecipe.files.find((f) => f.filename === 'configuration.nix')?.content || '';
    assert.ok(config.includes('pkgs.firefox'));
    assert.ok(config.includes('pkgs.vscode'));
    assert.ok(config.includes('virtualisation.docker.enable = true'));
    assert.ok(config.includes('services.pipewire'));
  }
});

test('QuestionFlow: answering a question never makes that same question ineligible', () => {
  const flow = new QuestionFlow(QUESTIONS);
  const bases: UserCriteria[] = [
    { experienceLevel: 'beginner', useCase: 'desktop', platform: 'bare-metal', prefersGui: true },
    { experienceLevel: 'intermediate', useCase: 'desktop', platform: 'bare-metal', prefersGui: true },
    { experienceLevel: 'systems-engineer', useCase: 'server', platform: 'bare-metal', architecture: 'x86_64' },
    { experienceLevel: 'systems-engineer', useCase: 'iot-embedded', platform: 'embedded-sbc', architecture: 'arm64' }
  ];
  for (const base of bases) {
    for (const q of flow.getEligibleQuestions(base)) {
      for (const opt of q.options) {
        const answered = { ...base, ...opt.appliesCriteria };
        const ids = flow.getEligibleQuestions(answered, new Set([q.id])).map((e) => e.id);
        assert.ok(
          ids.includes(q.id),
          `${q.id} option ${opt.id} makes its own question ineligible (base ${JSON.stringify(base)})`
        );
      }
    }
  }

  // Goal Mode skips questions an earlier answer already decided; Technical Mode still offers them for fine-tuning
  const goalIds = flow.getEligibleQuestions({ experienceLevel: 'beginner', useCase: 'desktop', prefersGui: true }).map((q) => q.id);
  assert.ok(!goalIds.includes('display_mode'));
  const techIds = flow.getEligibleQuestions({ experienceLevel: 'intermediate', useCase: 'desktop', prefersGui: true }).map((q) => q.id);
  assert.ok(techIds.includes('display_mode'));
});

test('QuestionFlow: Goal Mode infers display, audio, cadence, and boot answers from goal and device', () => {
  const flow = new QuestionFlow(QUESTIONS);
  const goal = (id: string) => QUESTIONS.find((q) => q.id === 'beginner_goal')!.options.find((o) => o.id === id)!.appliesCriteria;
  const device = (id: string) => QUESTIONS.find((q) => q.id === 'beginner_device')!.options.find((o) => o.id === id)!.appliesCriteria;
  const answered = new Set(['user_familiarity', 'beginner_goal', 'beginner_device', 'beginner_memory']);

  const server: UserCriteria = { experienceLevel: 'beginner', ...goal('home_server'), ...device('standard_desktop'), maxRamMb: 4096 };
  assert.equal(server.prefersGui, false);
  assert.equal(server.releaseCadence, 'lts');
  assert.equal(server.bootMedium, 'nvme-ssd');
  const serverIds = flow.getEligibleQuestions(server, answered).map((q) => q.id);
  for (const id of ['display_mode', 'release_cadence', 'boot_medium', 'audio_latency']) {
    assert.ok(!serverIds.includes(id), `home server should not ask ${id}`);
  }

  const desktop: UserCriteria = { experienceLevel: 'beginner', ...goal('daily_desktop'), ...device('standard_laptop'), maxRamMb: 8192 };
  const desktopIds = flow.getEligibleQuestions(desktop, answered).map((q) => q.id);
  assert.ok(!desktopIds.includes('display_mode'));
  assert.ok(!desktopIds.includes('audio_latency'));
  assert.ok(desktopIds.includes('desktop_workflow_style'), 'personal preferences are still asked');

  // Raspberry Pi boards boot from SD cards, so boot_medium is inferred and skipped
  const pi: UserCriteria = { experienceLevel: 'beginner', ...goal('daily_desktop'), ...device('raspberry_pi'), maxRamMb: 4096 };
  assert.equal(pi.bootMedium, 'sd-card-usb');
  assert.ok(!flow.getEligibleQuestions(pi, answered).some((q) => q.id === 'boot_medium'));

  // Switching to Technical Mode re-offers inferred questions for fine-tuning
  const techIds = flow.getEligibleQuestions({ ...server, experienceLevel: 'intermediate' }, answered).map((q) => q.id);
  for (const id of ['display_mode', 'release_cadence', 'boot_medium']) {
    assert.ok(techIds.includes(id), `Technical Mode should offer ${id}`);
  }
});

test('Matcher: Raspberry Pi desktop goals pick Raspberry Pi OS, and only on Pi hardware', () => {
  const pick = (c: UserCriteria) => evaluateCriteria(c).bestMatch.distro.id;
  // Mirrors AppStore.answerQuestion: clear every key the question's options can set, then apply the choice
  const answer = (c: Record<string, unknown>, qid: string, oid: string): void => {
    const q = QUESTIONS.find((x) => x.id === qid)!;
    for (const o of q.options) for (const k of Object.keys(o.appliesCriteria)) delete c[k];
    Object.assign(c, q.options.find((o) => o.id === oid)!.appliesCriteria);
  };
  const wizard = (g: string, d: string): UserCriteria => {
    const c: Record<string, unknown> = { experienceLevel: 'beginner' };
    answer(c, 'beginner_goal', g);
    answer(c, 'beginner_device', d);
    answer(c, 'beginner_memory', 'modest');
    return c as UserCriteria;
  };

  for (const g of ['daily_desktop', 'freelance_office_docs', 'kids_education', 'coding_dev']) {
    assert.equal(pick(wizard(g, 'raspberry_pi')), 'raspberry-pi-os', `${g} on a Raspberry Pi`);

    // Android TV boxes are ARM SBC-class but cannot boot Raspberry Pi OS
    assert.notEqual(pick(wizard(g, 'android_tv_box')), 'raspberry-pi-os', `${g} on an Android TV box`);
  }

  // Security on a Pi stays Kali even though SD-card boot is inferred
  assert.equal(pick(wizard('security_privacy', 'raspberry_pi')), 'kali-linux');

  // Without SBC hardware in the criteria, the hardware lock keeps Raspberry Pi OS out of generic picks
  for (const c of [{ useCase: 'desktop', footprint: 'standard' }, { useCase: 'home-office' }, { useCase: 'education-kids' }] as UserCriteria[]) {
    assert.notEqual(pick(c), 'raspberry-pi-os', JSON.stringify(c));
  }
});

test('Matcher: SD-card boot gives full flash credit to tuned distros and partial credit to other SBC distros', () => {
  const sd = evaluateCriteria({ useCase: 'router-networking', bootMedium: 'sd-card-usb' });
  assert.equal(sd.bestMatch.distro.id, 'openwrt', 'use-case fit outweighs flash tuning');
  const flash = (id: string) => sd.allMatches.find((m) => m.distro.id === id)!.reasons.some((r) => r.feature === 'Flash Storage' && r.matched);
  assert.ok(flash('openwrt'), 'SBC-capable distros earn partial flash credit');
  assert.ok(flash('dietpi'));
});

test('Matcher: Apple Silicon Macs only get distros that boot on them; VMs and Intel Macs are unrestricted', () => {
  const appleSilicon = { architecture: 'arm64', platform: 'bare-metal', formFactor: 'mac', footprint: 'full' } as const;
  for (const useCase of ['desktop', 'server', 'game-server', 'home-office', 'security-pentest'] as const) {
    assert.equal(evaluateCriteria({ ...appleSilicon, useCase }).bestMatch.distro.id, 'asahi-linux', `${useCase} on an M-series Mac`);
  }
  // In a VM on the Mac, any arm64 distro is fine
  assert.notEqual(evaluateCriteria({ ...appleSilicon, platform: 'vm', useCase: 'server' }).bestMatch.distro.id, 'asahi-linux');
  // Intel Macs keep the Mac driver bonus for mainstream distros
  const intelMac = evaluateCriteria({ architecture: 'x86_64', platform: 'bare-metal', formFactor: 'mac', useCase: 'desktop' });
  assert.notEqual(intelMac.bestMatch.distro.id, 'asahi-linux');
  assert.ok(intelMac.bestMatch.reasons.some((r) => r.feature === 'Mac Hardware Support' && r.matched));
});

test('Matcher: Asahi Linux only surfaces for Apple Silicon Macs', () => {
  const generic = evaluateCriteria({ experienceLevel: 'intermediate', useCase: 'desktop', platform: 'bare-metal', prefersGui: true });
  assert.notEqual(generic.bestMatch.distro.id, 'asahi-linux');
  const asahi = generic.allMatches.find((m) => m.distro.id === 'asahi-linux')!;
  assert.ok(asahi.reasons.some((r) => r.feature === 'Hardware Lock' && !r.matched));

  const m1 = evaluateCriteria({ useCase: 'desktop', architecture: 'arm64', platform: 'bare-metal', formFactor: 'mac' });
  assert.equal(m1.bestMatch.distro.id, 'asahi-linux');
});

test('Matcher: Asahi stays available for arm64 requests without a form factor, but not on other ARM hardware', () => {
  // Available (no lock penalty, top score) for a plain arm64 request; Ubuntu may still win the tie
  const plain = evaluateCriteria({ useCase: 'desktop', architecture: 'arm64', platform: 'bare-metal' });
  const asahi = plain.allMatches.find((m) => m.distro.id === 'asahi-linux')!;
  assert.ok(!asahi.reasons.some((r) => r.feature === 'Hardware Lock'));
  assert.equal(asahi.score, plain.bestMatch.score);
  for (const formFactor of ['sbc', 'laptop', 'low-power'] as const) {
    assert.notEqual(evaluateCriteria({ useCase: 'desktop', architecture: 'arm64', platform: 'bare-metal', formFactor }).bestMatch.distro.id, 'asahi-linux', formFactor);
  }
});
