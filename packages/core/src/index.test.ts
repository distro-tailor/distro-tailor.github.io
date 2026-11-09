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

test('QuestionFlow: Dynamically tailors questions for beginners (hides init and libc jargon)', () => {
  const flow = new QuestionFlow(QUESTIONS);
  const beginnerEligible = flow.getEligibleQuestions({ experienceLevel: 'beginner' });

  assert.ok(beginnerEligible.some(q => q.id === 'beginner_goal'));
  assert.ok(beginnerEligible.some(q => q.id === 'beginner_device'));
  assert.equal(beginnerEligible.some(q => q.id === 'c_library_and_init'), false);
  assert.equal(beginnerEligible.some(q => q.id === 'system_immutability'), false);
  assert.equal(beginnerEligible.some(q => q.id === 'technical_use_case'), false);
});
