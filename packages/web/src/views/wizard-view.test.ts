import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCriteria, QUESTIONS } from '@distro-tailor/core';
import { renderWizardQuestion } from './wizard-view.js';
import { AppState } from '../state/store.js';

test('Wizard View: displays fast-track match prediction banner when confidence >= 85% after step 3', () => {
  const dummyState: AppState = {
    criteria: { useCase: 'gaming', footprint: 'lean', architecture: 'x86_64' },
    answeredQuestionIds: new Set(['q1', 'q2', 'q3']),
    activeTab: 'wizard',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const evaluation = evaluateCriteria(dummyState.criteria);
  assert.ok(evaluation.bestMatch.score >= 85);

  const html = renderWizardQuestion(
    QUESTIONS[0],
    { current: 3, total: 10 },
    dummyState,
    evaluation
  );

  assert.ok(html.includes('id="early-guess-banner"'), 'Must include early-guess-banner');
  assert.ok(html.includes('id="btn-early-results"'), 'Must include view result now button');
  assert.ok(html.includes('Fast-Track Match'));
  assert.ok(html.includes(evaluation.bestMatch.distro.name));
});

test('Wizard View: suppresses fast-track banner during initial questions (step < 3) or low score', () => {
  const dummyState: AppState = {
    criteria: {},
    answeredQuestionIds: new Set(['q1']),
    activeTab: 'wizard',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const evaluation = evaluateCriteria(dummyState.criteria);

  // During step 1, even if score is high baseline, banner must be suppressed
  const htmlStep1 = renderWizardQuestion(
    QUESTIONS[0],
    { current: 1, total: 10 },
    dummyState,
    evaluation
  );

  assert.equal(htmlStep1.includes('id="early-guess-banner"'), false, 'Banner should not show on step 1');
});

test('Wizard View: displays Optional badge and Skip default button for optional questions', () => {
  const dummyState: AppState = {
    criteria: { useCase: 'desktop' },
    answeredQuestionIds: new Set(['q1', 'q2']),
    activeTab: 'wizard',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const optionalQuestion = QUESTIONS.find((q) => q.isOptional && q.options.some((o) => o.isDefault));
  assert.ok(optionalQuestion, 'There should be optional questions in question bank');

  const html = renderWizardQuestion(
    optionalQuestion,
    { current: 5, total: 10 },
    dummyState
  );

  assert.ok(html.includes('Optional'));
  assert.ok(html.includes('Next (Use Default) →') || html.includes('Next (Use Default)'));
});

test('Wizard View: highlights strictly ONE option on single-select even with shared architecture', () => {
  const dummyState: AppState = {
    criteria: { architecture: 'x86_64', formFactor: 'laptop' },
    answeredQuestionIds: new Set(['user_familiarity', 'beginner_goal', 'beginner_device']),
    activeTab: 'wizard',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const deviceQuestion = QUESTIONS.find((q) => q.id === 'beginner_device')!;
  assert.ok(deviceQuestion);

  const html = renderWizardQuestion(
    deviceQuestion,
    { current: 2, total: 10 },
    dummyState
  );

  // Exactly one option should have the ✓ Selected badge
  const selectedMatches = html.match(/✓ Selected/g) || [];
  assert.equal(selectedMatches.length, 1, 'Expected exactly one card to have ✓ Selected badge');

  // Verify that the laptop option card has the selected border styling
  assert.ok(html.includes('data-option-id="standard_laptop"'));
  assert.ok(html.includes('Laptop / Notebook / Ultrabook'));
});

test('Wizard View: highlights matching option on composite questions even when minor secondary tags are omitted', () => {
  // Criteria has useCase: 'education-kids' and platform: 'bare-metal', but footprint is omitted
  const dummyState: AppState = {
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'education-kids',
      platform: 'bare-metal',
      architecture: 'x86_64',
      maxRamMb: 4096
    },
    answeredQuestionIds: new Set(['user_familiarity', 'beginner_goal']),
    activeTab: 'wizard',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const goalQuestion = QUESTIONS.find((q) => q.id === 'beginner_goal')!;
  assert.ok(goalQuestion);

  const html = renderWizardQuestion(
    goalQuestion,
    { current: 2, total: 10 },
    dummyState
  );

  assert.ok(html.includes('✓ Selected'), 'Expected an option to be marked as ✓ Selected');
  assert.ok(html.includes('data-option-id="kids_education"'));
  assert.ok(html.includes('Kid-Safe School &amp; Coding Computer') || html.includes('Kid-Safe School & Coding Computer'));
});

test('Wizard View: highlights Standard Default badge when question has no active selection', () => {
  const bootQuestion = QUESTIONS.find((q) => q.id === 'boot_medium')!;
  assert.ok(bootQuestion);

  // 1. When no selection has been made yet
  const unselectedState: AppState = {
    criteria: { experienceLevel: 'intermediate', useCase: 'desktop' },
    answeredQuestionIds: new Set(['user_familiarity']),
    activeTab: 'wizard',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const unselectedHtml = renderWizardQuestion(
    bootQuestion,
    { current: 5, total: 10 },
    unselectedState
  );

  // Default badge should have emerald border highlight
  assert.ok(unselectedHtml.includes('border-emerald-500/50'), 'Standard Default should be emerald highlighted when nothing selected');
  assert.ok(unselectedHtml.includes('★ Standard Default'));
  assert.ok(!unselectedHtml.includes('✓ Selected'), 'No option should have ✓ Selected badge when unselected');

  // 2. When user manually selects another option (e.g. sd-card-usb)
  const selectedState: AppState = {
    ...unselectedState,
    criteria: { ...unselectedState.criteria, bootMedium: 'sd-card-usb' }
  };

  const selectedHtml = renderWizardQuestion(
    bootQuestion,
    { current: 5, total: 10 },
    selectedState
  );

  assert.ok(selectedHtml.includes('✓ Selected'), 'Manually chosen option must display ✓ Selected');
  // Default badge is no longer placeholder-highlighted
  assert.ok(!selectedHtml.includes('border-emerald-500/50'), 'Standard Default should drop emerald highlight once an option is selected');
  assert.ok(selectedHtml.includes('border-slate-700/80'), 'Standard Default drops back to neutral slate border');

  // 3. When the user manually selects the default option itself (nvme-ssd)
  const defaultSelectedState: AppState = {
    ...unselectedState,
    criteria: { ...unselectedState.criteria, bootMedium: 'nvme-ssd' }
  };

  const defaultSelectedHtml = renderWizardQuestion(
    bootQuestion,
    { current: 5, total: 10 },
    defaultSelectedState
  );

  assert.ok(defaultSelectedHtml.includes('✓ Selected'), 'Selected default option must display ✓ Selected');
  assert.ok(!defaultSelectedHtml.includes('★ Standard Default'), 'Do not show Standard Default badge if that option is already selected');
});

test('Wizard View: displays Return to Results button when user has an unlocked match', () => {
  const bootQuestion = QUESTIONS.find((q) => q.id === 'boot_medium')!;
  assert.ok(bootQuestion);

  const matchedState: AppState = {
    criteria: { experienceLevel: 'intermediate', useCase: 'desktop', architecture: 'x86_64' },
    answeredQuestionIds: new Set(['user_familiarity', 'technical_use_case']),
    activeTab: 'wizard',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const evaluation = evaluateCriteria(matchedState.criteria);

  const html = renderWizardQuestion(
    bootQuestion,
    { current: 5, total: 10 },
    matchedState,
    evaluation
  );

  assert.ok(html.includes('id="btn-jump-results"'), 'Must render bottom jump to results button');
  assert.ok(html.includes('id="btn-jump-results-top"'), 'Must render top jump to results button');
  assert.ok(html.includes('Return to Results'), 'Must include Return to Results label');
  assert.ok(html.includes('Next (Use Default) →') || html.includes('Next Question →'), 'Must allow moving forward');
});

test('Wizard View: displays quick filter input on questions with long option lists', () => {
  const goalQuestion = QUESTIONS.find((q) => q.id === 'beginner_goal')!;
  assert.ok(goalQuestion);
  assert.ok(goalQuestion.options.length >= 7, 'Goal question should have at least 7 options');

  const baseState: AppState = {
    criteria: {},
    answeredQuestionIds: new Set(),
    activeTab: 'wizard',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  // 1. Long list renders search filter input
  const longHtml = renderWizardQuestion(goalQuestion, { current: 2, total: 10 }, baseState);
  assert.ok(longHtml.includes('id="input-filter-wizard-options"'), 'Long question must render live filter input');

  // 2. Short list does NOT render search filter input
  const bootQuestion = QUESTIONS.find((q) => q.id === 'boot_medium')!;
  const shortHtml = renderWizardQuestion(bootQuestion, { current: 5, total: 10 }, baseState);
  assert.ok(!shortHtml.includes('id="input-filter-wizard-options"'), 'Short question must not render filter input');

  // 3. Filter query narrows displayed options
  const filteredState: AppState = {
    ...baseState,
    wizardFilterQuery: 'gps'
  };
  const filteredHtml = renderWizardQuestion(goalQuestion, { current: 2, total: 10 }, filteredState);
  assert.ok(filteredHtml.includes('In-Car GPS &amp; Offline Navigation') || filteredHtml.includes('In-Car GPS & Offline Navigation'));
  assert.ok(!filteredHtml.includes('Family Photo/Video Backup'), 'Non-matching options should be filtered out');

  // 4. Unmatched filter query renders empty state
  const emptyState: AppState = {
    ...baseState,
    wizardFilterQuery: 'xyznonexistentterm'
  };
  const emptyHtml = renderWizardQuestion(goalQuestion, { current: 2, total: 10 }, emptyState);
  assert.ok(emptyHtml.includes('No options match'), 'Should display empty state when no options match filter');
  assert.ok(emptyHtml.includes('id="btn-reset-wizard-filter"'), 'Should provide clear filter button in empty state');
});

test('Wizard View: beginner_device does not falsely highlight Old Intel MacBook via partial bare-metal match before being answered', () => {
  const deviceQuestion = QUESTIONS.find((q) => q.id === 'beginner_device')!;
  assert.ok(deviceQuestion);

  const stateAfterGoal: AppState = {
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'appliance-product',
      footprint: 'micro',
      platform: 'bare-metal',
      prefersGui: true,
      desktopEnv: 'cage',
      navigationApps: ['navit', 'gpsd']
    },
    answeredQuestionIds: new Set(['user_familiarity', 'beginner_goal']),
    activeTab: 'wizard',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const html = renderWizardQuestion(deviceQuestion, { current: 3, total: 8 }, stateAfterGoal);
  assert.ok(!html.includes('✓ Selected'), 'Unanswered beginner_device must not auto-select old_macbook');
  assert.ok(html.includes('★ Standard Default'), 'Standard default badge should be shown on standard_laptop');
});

test('Wizard View: returning from results to edit beginner_goal still highlights offline_navigation after device overwrote platform', () => {
  const goalQuestion = QUESTIONS.find((q) => q.id === 'beginner_goal')!;
  assert.ok(goalQuestion);

  const stateFromResults: AppState = {
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'appliance-product',
      footprint: 'micro',
      platform: 'embedded-sbc',
      architecture: 'arm64',
      formFactor: 'sbc',
      prefersGui: true,
      desktopEnv: 'cage',
      navigationApps: ['navit', 'gpsd']
    },
    answeredQuestionIds: new Set(['user_familiarity', 'beginner_goal', 'beginner_device']),
    activeTab: 'wizard',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const html = renderWizardQuestion(goalQuestion, { current: 2, total: 8 }, stateFromResults);
  const selectedMatches = html.match(/✓ Selected/g) || [];
  assert.equal(selectedMatches.length, 1, 'Expected exactly one selected goal when returning to edit');
  assert.ok(html.includes('In-Car GPS &amp; Offline Navigation') || html.includes('In-Car GPS & Offline Navigation'));
});

test('Wizard View: after toggling to Technical Mode, answered technical_use_case highlights selection while unanswered hardware_architecture shows default', () => {
  const techUseCaseQ = QUESTIONS.find((q) => q.id === 'technical_use_case')!;
  const archQ = QUESTIONS.find((q) => q.id === 'hardware_architecture')!;

  const switchedState: AppState = {
    criteria: {
      experienceLevel: 'intermediate',
      useCase: 'server',
      platform: 'embedded-sbc',
      footprint: 'lean'
    },
    answeredQuestionIds: new Set(['user_familiarity', 'technical_use_case']),
    activeTab: 'wizard',
    flowMode: 'expert',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };

  const techHtml = renderWizardQuestion(techUseCaseQ, { current: 2, total: 8 }, switchedState);
  assert.equal((techHtml.match(/✓ Selected/g) || []).length, 1, 'Remapped technical_use_case must highlight server_cloud');
  assert.ok(techHtml.includes('Cloud Server or Self-Hosted Homelab'));

  const archHtml = renderWizardQuestion(archQ, { current: 3, total: 8 }, switchedState);
  assert.ok(!archHtml.includes('✓ Selected'), 'Unanswered hardware_architecture must not auto-select');
  assert.ok(archHtml.includes('★ Standard Default'), 'Unanswered hardware_architecture must highlight default x86_64');
});

test('Wizard View: top and bottom navigation bars wrap cleanly when modifying questions with unlocked results', () => {
  const q = QUESTIONS.find((item) => item.id === 'technical_use_case')!;
  const state: AppState = {
    criteria: {
      experienceLevel: 'intermediate',
      useCase: 'server',
      platform: 'vm'
    },
    answeredQuestionIds: new Set(['user_familiarity', 'technical_use_case', 'hardware_architecture']),
    activeTab: 'wizard',
    flowMode: 'smart',
    activeFileIndex: 0,
    history: [],
    showAllContenders: false,
    showShareModal: false,
    isSharedView: false
  };
  const html = renderWizardQuestion(q, { current: 1, total: 8 }, state, evaluateCriteria(state.criteria));
  assert.match(html, /id="btn-jump-results-top"[^>]*flex-auto/);
  assert.match(html, /id="btn-jump-results"[^>]*flex-auto/);
  assert.match(html, /id="btn-back-top"[^>]*flex-auto/);
  assert.match(html, /id="btn-back"[^>]*flex-auto/);
  assert.ok(html.indexOf('id="btn-jump-results-top"') < html.indexOf('id="btn-back-top"'));
  assert.ok(html.indexOf('id="btn-jump-results"') < html.indexOf('id="btn-back"'));
  assert.doesNotMatch(html, /<div class="flex items-center gap-2 shrink-0">/);
  assert.doesNotMatch(html, /<div class="flex items-center gap-2 sm:gap-3 shrink-0">/);
});


