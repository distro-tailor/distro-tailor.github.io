import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCriteria } from '@distro-tailor/core';
import { renderResultsView } from './results-view.js';
import { describeOpenQuestions } from '../components/results/results-change-banner.js';
import { AppState } from '../state/store.js';

test('Results View: renders progressive disclosure accordions for advanced app layers and tooling', () => {
  const dummyState: AppState = {
    criteria: { useCase: 'desktop', architecture: 'x86_64', footprint: 'standard' },
    answeredQuestionIds: new Set(['q1', 'q2', 'q3']),
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const evaluation = evaluateCriteria(dummyState.criteria);
  const html = renderResultsView(evaluation, dummyState);

  // Must render Winner Hero Card and Actions
  assert.ok(html.includes(evaluation.bestMatch.distro.name));
  assert.ok(html.includes('id="btn-modify-answers"'));
  assert.ok(html.includes('id="btn-tweak-blueprint"'));
  assert.ok(html.includes('Your Tailored Blueprint'));

  // Must render progressive disclosure accordions
  assert.ok(html.includes('Add-On Applications & Turnkey Services'));
  assert.ok(html.includes('Head-to-Head Comparison'));
  assert.ok(html.includes('Supplemental App Layers & Runtimes'));
  assert.ok(html.includes('<details'));
});

test('Results View: Arch Linux result does NOT display a Debian Debootstrap recipe', () => {
  const dummyState: AppState = {
    criteria: {
      useCase: 'desktop',
      releaseCadence: 'rolling',
      statePreference: 'mutable',
      cLibPreference: 'glibc',
      initPreference: 'systemd'
    },
    answeredQuestionIds: new Set(['q1', 'q2', 'q3', 'q4']),
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const evaluation = evaluateCriteria(dummyState.criteria);
  assert.equal(evaluation.bestMatch.distro.id, 'arch');
  const html = renderResultsView(evaluation, dummyState);

  // Must NOT contain Debian Debootstrap recipe!
  assert.equal(html.includes('Custom Minimal Debian Appliance (Debootstrap)'), false);
  assert.equal(html.includes('debootstrap-debian'), false);

  // Must include Arch quickstart
  assert.ok(html.includes('archinstall'));
});

test('Results View: panels keep the open / closed state the user chose', () => {
  const state: AppState = {
    criteria: { useCase: 'desktop', requiresCustomBuild: true },
    answeredQuestionIds: new Set(),
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false,
    panelOpen: { 'build-recipe': false, 'head-to-head': true }
  };
  const html = renderResultsView(evaluateCriteria(state.criteria), state);
  assert.match(html, /data-panel-id="build-recipe" data-panel-default="open">/, 'auto-open recipe panel stays closed');
  assert.match(html, /data-panel-id="head-to-head" data-panel-default="closed" open>/, 'opened panel stays open');
  assert.match(html, /data-panel-id="verification-ladder" data-panel-default="closed">/, 'untouched panel keeps default');
});

test('Results View: renders empty-state Makefile notice when prebuilt image is recommended', () => {
  const state: AppState = {
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'media-center',
      architecture: 'x86_64',
      formFactor: 'laptop',
      maxRamMb: 4096,
      prefersGui: true
    },
    answeredQuestionIds: new Set(),
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };
  const evaluation = evaluateCriteria(state.criteria);
  assert.equal(evaluation.recommendedRecipe, undefined);
  const html = renderResultsView(evaluation, state);
  assert.match(html, /data-panel-id="build-recipe"/);
  assert.match(html, /Prebuilt Recommended/);
  assert.match(html, /No custom Makefile is needed/);
});

test('Results View: verification ladder adapts QEMU and deployment guidance to arm64 SBC', () => {
  const state: AppState = {
    criteria: {
      useCase: 'gaming',
      platform: 'embedded-sbc',
      architecture: 'arm64',
      formFactor: 'sbc',
      emulatorApps: ['mame']
    },
    answeredQuestionIds: new Set(),
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };
  const html = renderResultsView(evaluateCriteria(state.criteria), state);
  assert.match(html, /make docker-build/);
  assert.match(html, /qemu-system-aarch64/);
  assert.match(html, /SBC SD Card/);
});

test('Results View: after an edit, the banner names the old and new top match and the changed choices', () => {
  const criteria = { experienceLevel: 'beginner' as const, useCase: 'education-kids' as const, platform: 'embedded-sbc' as const, architecture: 'arm64' as const, formFactor: 'sbc' as const, prefersGui: true };
  const before = { ...criteria, platform: 'bare-metal' as const, architecture: 'x86_64' as const, formFactor: 'desktop' as const };
  const state: AppState = {
    criteria,
    answeredQuestionIds: new Set(['user_familiarity', 'beginner_goal', 'beginner_device', 'beginner_memory', 'release_cadence', 'driver_philosophy', 'desktop_workflow_style', 'attached_peripherals', 'display_mode', 'audio_latency', 'boot_medium']),
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false,
    resultsBaseline: { distroId: evaluateCriteria(before).bestMatch.distro.id, criteria: before }
  };
  const evaluation = evaluateCriteria(criteria);
  assert.equal(evaluation.bestMatch.distro.id, 'raspberry-pi-os');
  const html = renderResultsView(evaluation, state);
  assert.ok(html.includes('id="results-change-banner"'));
  assert.ok(html.includes('Top match changed:'));
  assert.ok(html.includes('→ Raspberry Pi OS'));
  assert.ok(html.includes('Your edits:'));
  assert.ok(html.includes('btn-dismiss-change-banner'));
});

test('Results View: change banner offers unlocked questions and stays hidden without a baseline', () => {
  const criteria = { experienceLevel: 'intermediate' as const, useCase: 'desktop' as const, platform: 'bare-metal' as const };
  const base: AppState = {
    criteria,
    answeredQuestionIds: new Set(['user_familiarity', 'technical_use_case']),
    activeTab: 'results',
    flowMode: 'expert',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };
  const evaluation = evaluateCriteria(criteria);
  assert.ok(!renderResultsView(evaluation, base).includes('results-change-banner'));

  const withBaseline: AppState = { ...base, resultsBaseline: { distroId: evaluation.bestMatch.distro.id, criteria } };
  const html = renderResultsView(evaluation, withBaseline);
  assert.ok(html.includes('Top match unchanged:'));
  assert.ok(html.includes('still unanswered could refine this match'), 'nothing was unlocked by an edit here');
  assert.ok(html.includes('id="btn-answer-unlocked"'));

  // A baseline where display questions were not yet eligible: the edit genuinely unlocked them
  const unlockedState: AppState = {
    ...base,
    resultsBaseline: { distroId: evaluation.bestMatch.distro.id, criteria: { experienceLevel: 'intermediate', useCase: 'container-base', platform: 'container' } }
  };
  assert.ok(renderResultsView(evaluation, unlockedState).includes('Your edit unlocked'));
});

test('Results View: open-question copy distinguishes unlocked from still-unanswered', () => {
  assert.equal(describeOpenQuestions(3, 0), '3 questions still unanswered could refine this match.');
  assert.equal(describeOpenQuestions(1, 1), 'Your edit unlocked 1 new question that could refine this match.');
  assert.equal(describeOpenQuestions(5, 2), 'Your edit unlocked 2 new questions (plus 3 still unanswered) that could refine this match.');
});

test('Results View: paid alternatives appear only as caveated comparisons beside a free top pick', () => {
  const state: AppState = {
    criteria: { useCase: 'ai-gpu-compute', platform: 'server', prefersGui: false },
    answeredQuestionIds: new Set(['user_familiarity']),
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };
  const evaluation = evaluateCriteria(state.criteria);
  const html = renderResultsView(evaluation, state);
  assert.ok(html.includes('id="paid-alternatives"'));
  assert.ok(html.includes('Paid alternatives (not recommended)'));
  assert.ok(html.includes('HiveOS (Hiveon OS)'));
  assert.ok(html.includes('Caveat:'));
  assert.notEqual(evaluation.bestMatch.distro.id, 'hiveos');

  const desktop = evaluateCriteria({ useCase: 'desktop' });
  assert.ok(!renderResultsView(desktop, { ...state, criteria: { useCase: 'desktop' } }).includes('id="paid-alternatives"'));
});

test('Results View: legal notes appear when the setup has a legal catch', () => {
  const base: AppState = {
    criteria: { useCase: 'ai-gpu-compute', platform: 'server', prefersGui: false },
    answeredQuestionIds: new Set(['user_familiarity']),
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };
  const html = renderResultsView(evaluateCriteria(base.criteria), base);
  assert.ok(html.includes('id="legal-caveats"'));
  assert.ok(html.includes('data-caveat-id="nvidia-geforce-datacenter"'));
  assert.ok(html.includes('https://www.nvidia.com/en-us/drivers/geforce-license/'));

  const office = { ...base, criteria: { useCase: 'home-office' as const } };
  assert.ok(!renderResultsView(evaluateCriteria(office.criteria), office).includes('id="legal-caveats"'));
});

test('Results View: router builds get router flashing steps and no desktop add-on panel', () => {
  const criteria = { experienceLevel: 'beginner' as const, useCase: 'community-network' as const, platform: 'router-firewall' as const, formFactor: 'low-power' as const, footprint: 'minimal' as const, prefersGui: false };
  const state: AppState = {
    criteria,
    answeredQuestionIds: new Set(['user_familiarity', 'beginner_goal', 'beginner_device']),
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };
  const evaluation = evaluateCriteria(criteria);
  assert.equal(evaluation.bestMatch.distro.id, 'libremesh');
  const html = renderResultsView(evaluation, state);
  assert.ok(html.includes('own web interface (or with sysupgrade'));
  assert.ok(!html.includes('Raspberry Pi Imager'));
  assert.ok(!html.includes('Add-On Applications & Turnkey Services'));
  assert.ok(html.includes('Low-Power Hardware'));

  // Desktops keep the add-on panel and the generic flashing steps
  const desktop = { useCase: 'desktop' as const, platform: 'bare-metal' as const };
  const desktopHtml = renderResultsView(evaluateCriteria(desktop), { ...state, criteria: desktop });
  assert.ok(desktopHtml.includes('Add-On Applications & Turnkey Services'));
});

test('Results View: budget laptops get USB install steps plus the Chromebook routes', () => {
  const criteria = { experienceLevel: 'beginner' as const, useCase: 'desktop' as const, architecture: 'x86_64' as const, platform: 'bare-metal' as const, formFactor: 'budget-laptop' as const, prefersGui: true };
  const state: AppState = {
    criteria,
    answeredQuestionIds: new Set(['user_familiarity', 'beginner_goal', 'beginner_device']),
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };
  const html = renderResultsView(evaluateCriteria(criteria), state);
  assert.ok(html.includes('Linux development environment'));
  assert.ok(html.includes('mrchromebox.tech'));
  assert.ok(html.includes('install like any PC'));
});

test('Results View: legal notes and the distro modal carry the "not legal advice" disclaimer', () => {
  const criteria = { useCase: 'security-pentest' as const };
  const state: AppState = {
    criteria,
    answeredQuestionIds: new Set(['user_familiarity']),
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };
  const html = renderResultsView(evaluateCriteria(criteria), state);
  assert.ok(html.includes('For information only, not legal advice.'));
});

test('Results View: winner and recipe action buttons use flex-auto so mobile flex-wrap does not clip', () => {
  const state: AppState = {
    criteria: { useCase: 'server', platform: 'vm', architecture: 'x86_64' },
    answeredQuestionIds: new Set<string>(),
    viewingQuestionId: null,
    panelOpen: {},
    theme: 'dark',
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };
  const html = renderResultsView(evaluateCriteria(state.criteria), state);
  assert.match(html, /id="btn-modify-answers"[^>]*flex-auto/);
  assert.match(html, /id="btn-share-match"[^>]*flex-auto/);
  assert.match(html, /id="btn-official-site"[^>]*flex-auto/);
  assert.match(html, /id="btn-share-recipe"[^>]*flex-auto/);
  assert.match(html, /id="btn-copy-recipe"[^>]*flex-auto/);
});

test('Results View: Offline GPS & Navigation suite only renders for navigation/appliance contexts', () => {
  const desktopState: AppState = {
    criteria: { useCase: 'desktop', platform: 'bare-metal', architecture: 'x86_64', prefersGui: true },
    answeredQuestionIds: new Set<string>(),
    viewingQuestionId: null,
    panelOpen: {},
    theme: 'dark',
    activeTab: 'results',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };
  const desktopHtml = renderResultsView(evaluateCriteria(desktopState.criteria), desktopState);
  assert.ok(!desktopHtml.includes('Offline GPS & In-Car Navigation Suite'));

  const navState: AppState = {
    ...desktopState,
    criteria: { useCase: 'appliance-product', navigationApps: ['navit', 'gpsd'] }
  };
  const navHtml = renderResultsView(evaluateCriteria(navState.criteria), navState);
  assert.ok(navHtml.includes('Offline GPS & In-Car Navigation Suite'));
});
