import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCriteria, QuestionFlow, QUESTIONS } from './index.js';

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
