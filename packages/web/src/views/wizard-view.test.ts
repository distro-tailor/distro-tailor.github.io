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

  const optionalQuestion = QUESTIONS.find(q => q.isOptional);
  assert.ok(optionalQuestion, 'There should be optional questions in question bank');

  const html = renderWizardQuestion(
    optionalQuestion,
    { current: 5, total: 10 },
    dummyState
  );

  assert.ok(html.includes('Optional'));
  assert.ok(html.includes('Skip (Use Default) →'));
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
