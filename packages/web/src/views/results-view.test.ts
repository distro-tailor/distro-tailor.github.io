import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCriteria } from '@distro-tailor/core';
import { renderResultsView } from './results-view.js';
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
