import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAnswer, evaluateCriteria, QUESTIONS, type AnswerState } from '@distro-tailor/core';
import { AppStore } from './store.js';

test('AppStore: initializes with clean default state and emits events on update', () => {
  const store = new AppStore();
  const state = store.getState();

  assert.equal(state.activeTab, 'wizard');
  assert.equal(state.flowMode, 'smart');
  assert.equal(state.showAllContenders, false);
  assert.deepEqual(state.criteria, {});
  assert.equal(state.answeredQuestionIds.size, 0);

  let notified = false;
  const unsubscribe = store.subscribe((newState) => {
    notified = true;
    assert.equal(newState.activeTab, 'results');
  });

  store.setTab('results');
  assert.equal(notified, true);
  assert.equal(store.getState().activeTab, 'results');

  unsubscribe();
});

test('AppStore: answerQuestion records criteria, tracks answered questions, and pushes history', () => {
  const store = new AppStore();

  store.answerQuestion('user_familiarity', 'experienceLevel', 'beginner');

  const state1 = store.getState();
  assert.equal(state1.criteria.experienceLevel, 'beginner');
  assert.ok(state1.answeredQuestionIds.has('user_familiarity'));
  assert.equal(state1.history.length, 1);

  store.answerQuestion('primary_goal', 'useCase', 'media-center');
  const state2 = store.getState();
  assert.equal(state2.criteria.useCase, 'media-center');
  assert.ok(state2.answeredQuestionIds.has('primary_goal'));
  assert.equal(state2.history.length, 2);

  // Undo / popHistory
  const popped = store.popHistory();
  assert.equal(popped, true);
  const state3 = store.getState();
  assert.equal(state3.criteria.useCase, undefined);
  assert.equal(state3.criteria.experienceLevel, 'beginner');
  assert.equal(state3.answeredQuestionIds.has('primary_goal'), false);
});

test('AppStore: removeChoice clears canonical question IDs and updates criteria', () => {
  const store = new AppStore();

  store.answerQuestion('user_familiarity', 'experienceLevel', 'beginner');
  assert.equal(store.getState().criteria.experienceLevel, 'beginner');
  assert.ok(store.getState().answeredQuestionIds.has('user_familiarity'));

  store.removeChoice('experienceLevel');
  assert.equal(store.getState().criteria.experienceLevel, undefined);
  assert.equal(store.getState().answeredQuestionIds.has('user_familiarity'), false);
});

test('AppStore: setFlowMode clears technical criteria when switching to smart/beginner mode', () => {
  const store = new AppStore();

  store.setFlowMode('expert');
  store.answerQuestion('user_familiarity', 'experienceLevel', 'systems-engineer');
  store.answerQuestion('c_library_and_init', 'cLibPreference', 'musl');
  store.answerQuestion('system_immutability', 'statePreference', 'declarative');
  store.answerQuestion('filesystem_and_storage', 'fileSystem', 'btrfs');

  assert.equal(store.getState().criteria.cLibPreference, 'musl');
  assert.equal(store.getState().criteria.statePreference, 'declarative');
  assert.equal(store.getState().criteria.fileSystem, 'btrfs');

  // Switch back to smart mode
  store.setFlowMode('smart');
  const state = store.getState();
  assert.equal(state.flowMode, 'smart');
  assert.equal(state.criteria.cLibPreference, undefined);
  assert.equal(state.criteria.statePreference, undefined);
  assert.equal(state.criteria.fileSystem, undefined);
  assert.equal(state.answeredQuestionIds.has('c_library_and_init'), false);
  assert.equal(state.answeredQuestionIds.has('filesystem_and_storage'), false);
  assert.equal(state.answeredQuestionIds.has('system_immutability'), false);
});

test('AppStore: toggleWizardMode remaps viewingQuestionId, preserves compatible criteria, and keeps reconciliation active', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', 'experienceLevel', 'beginner');
  store.answerQuestion('beginner_goal', { useCase: 'server', platform: 'embedded-sbc', footprint: 'lean' });
  store.setViewingQuestion('beginner_goal');

  // Switch from Goal Mode -> Technical Mode
  store.toggleWizardMode();
  let state = store.getState();
  assert.equal(state.flowMode, 'expert');
  assert.equal(state.criteria.experienceLevel, 'intermediate');
  assert.equal(state.criteria.useCase, 'server');
  assert.equal(state.viewingQuestionId, 'technical_use_case');
  assert.ok(state.answeredQuestionIds.has('technical_use_case'));
  assert.ok(!state.answeredQuestionIds.has('beginner_goal'));

  // Reconciliation must still prune ineligible questions while on wizard tab
  store.answerQuestion('boot_medium', 'bootMedium', 'nvme-ssd');
  store.answerQuestion('technical_use_case', { useCase: 'container-base', platform: 'container' });
  state = store.getState();
  assert.equal(state.criteria.bootMedium, undefined, 'boot_medium must be pruned when switching to container');

  // Switch back to Goal Mode while viewing system_immutability (ineligible for beginner)
  store.setViewingQuestion('system_immutability');
  store.toggleWizardMode();
  state = store.getState();
  assert.equal(state.flowMode, 'smart');
  assert.equal(state.criteria.experienceLevel, 'beginner');
  assert.equal(state.viewingQuestionId, null, 'ineligible viewingQuestionId must be cleared on switch');
  assert.ok(state.answeredQuestionIds.has('beginner_goal'));

  // Stepping back after mode switch walks through the new mode's eligible questions
  store.setViewingQuestion('beginner_device');
  const stepped = store.stepBackQuestion();
  assert.equal(stepped, true);
  assert.equal(store.getState().viewingQuestionId, 'beginner_goal');
});

test('AppStore: toggleAllContenders flips visibility state and notifies subscribers', () => {
  const store = new AppStore();
  assert.equal(store.getState().showAllContenders, false);

  store.toggleAllContenders();
  assert.equal(store.getState().showAllContenders, true);

  store.toggleAllContenders();
  assert.equal(store.getState().showAllContenders, false);
});

test('AppStore: removeChoice clears new dimensions like peripheralNeed and realtimeAudio', () => {
  const store = new AppStore();
  store.answerQuestion('attached_peripherals', 'peripheralNeed', 'touchscreen');
  assert.equal(store.getState().criteria.peripheralNeed, 'touchscreen');
  assert.ok(store.getState().answeredQuestionIds.has('attached_peripherals'));

  store.removeChoice('peripheralNeed');
  assert.equal(store.getState().criteria.peripheralNeed, undefined);
  assert.equal(store.getState().answeredQuestionIds.has('attached_peripherals'), false);
});

test('AppStore: stepBackQuestion steps back one question and stays in wizard tab with selected criteria intact for highlighting', () => {
  const store = new AppStore();

  store.answerQuestion('user_familiarity', 'experienceLevel', 'beginner');
  store.answerQuestion('beginner_goal', 'useCase', 'gaming');
  store.answerQuestion('beginner_device', 'architecture', 'x86_64');
  store.setTab('results'); // Simulate being on final results page

  // Step back from results -> should land on wizard with beginner_device reopened and architecture intact for highlighting
  const stepped1 = store.stepBackQuestion();
  assert.equal(stepped1, true);
  assert.equal(store.getState().activeTab, 'wizard');
  assert.equal(store.getState().viewingQuestionId, 'beginner_device');
  assert.equal(store.getState().criteria.architecture, 'x86_64');
  assert.equal(store.getState().criteria.useCase, 'gaming');
  assert.equal(store.getState().criteria.experienceLevel, 'beginner');

  // Step back again -> should land on wizard with beginner_goal reopened
  const stepped2 = store.stepBackQuestion();
  assert.equal(stepped2, true);
  assert.equal(store.getState().activeTab, 'wizard');
  assert.equal(store.getState().viewingQuestionId, 'beginner_goal');
  assert.equal(store.getState().criteria.useCase, 'gaming');

  // Step back again -> should land on wizard with user_familiarity reopened
  const stepped3 = store.stepBackQuestion();
  assert.equal(stepped3, true);
  assert.equal(store.getState().activeTab, 'wizard');
  assert.equal(store.getState().viewingQuestionId, 'user_familiarity');
  assert.equal(store.getState().criteria.experienceLevel, 'beginner');

  // Stepping back from beginning returns false
  const stepped4 = store.stepBackQuestion();
  assert.equal(stepped4, false);

  // Stepping forward advances through previously answered questions
  const steppedFwd1 = store.stepForwardQuestion();
  assert.equal(steppedFwd1, true);
  assert.equal(store.getState().activeTab, 'wizard');
  assert.equal(store.getState().viewingQuestionId, 'beginner_goal');

  const steppedFwd2 = store.stepForwardQuestion();
  assert.equal(steppedFwd2, true);
  assert.equal(store.getState().activeTab, 'wizard');
  assert.equal(store.getState().viewingQuestionId, 'beginner_device');
});

test('AppStore: remembers panels the user opened or closed, and reset clears them', () => {
  const s = new AppStore();
  let notifications = 0;
  s.addEventListener('statechange', () => notifications++);

  s.setPanelOpen('build-recipe', true);
  s.setPanelOpen('build-recipe', true); // unchanged: no extra re-render
  s.setPanelOpen('head-to-head', false);
  assert.deepEqual(s.getState().panelOpen, { 'build-recipe': true, 'head-to-head': false });
  assert.equal(notifications, 2);

  s.reset();
  assert.deepEqual(s.getState().panelOpen, {});
});

test('AppStore: answerQuestion supports in-place update when autoAdvance is false', () => {
  const store = new AppStore();

  // First question with autoAdvance = true (default) advances to beginner_goal
  store.answerQuestion('user_familiarity', 'experienceLevel', 'beginner');
  assert.equal(store.getState().viewingQuestionId, 'beginner_goal');

  // Updating beginner_goal with autoAdvance = false stays in-place on beginner_goal
  store.answerQuestion('beginner_goal', { useCase: 'gaming', footprint: 'lean', platform: 'bare-metal' }, false);
  assert.equal(store.getState().viewingQuestionId, 'beginner_goal');
  assert.equal(store.getState().criteria.useCase, 'gaming');
  assert.ok(store.getState().answeredQuestionIds.has('beginner_goal'));
});

test('AppStore: reconcileIneligibleCriteria prunes downstream questions when upstream decision conflicts', () => {
  const store = new AppStore();

  // 1. Answer in beginner mode
  store.answerQuestion('user_familiarity', 'experienceLevel', 'beginner');
  store.answerQuestion('beginner_goal', { useCase: 'gaming', footprint: 'lean', platform: 'bare-metal' });
  store.answerQuestion('beginner_device', { platform: 'bare-metal', architecture: 'x86_64' });

  assert.ok(store.getState().answeredQuestionIds.has('beginner_goal'));
  assert.ok(store.getState().answeredQuestionIds.has('beginner_device'));
  assert.equal(store.getState().criteria.useCase, 'gaming');

  // 2. User goes back to Question 1 and changes from beginner to systems-engineer
  store.answerQuestion('user_familiarity', 'experienceLevel', 'systems-engineer', false);

  // beginner_goal and beginner_device are no longer eligible for systems-engineer!
  assert.equal(store.getState().answeredQuestionIds.has('beginner_goal'), false, 'beginner_goal must be pruned');
  assert.equal(store.getState().answeredQuestionIds.has('beginner_device'), false, 'beginner_device must be pruned');
  assert.equal(store.getState().criteria.useCase, undefined, 'Orphaned useCase from beginner_goal must be deleted');
  assert.equal(store.getState().criteria.experienceLevel, 'systems-engineer', 'New experienceLevel must be preserved');
});


test('AppStore: answering audio_latency in Technical Mode keeps realtimeAudio', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', { experienceLevel: 'intermediate' }, false);
  store.answerQuestion('technical_use_case', { useCase: 'desktop', prefersGui: true }, false);
  store.answerQuestion('audio_latency', { realtimeAudio: true }, false);
  const state = store.getState();
  assert.equal(state.criteria.realtimeAudio, true);
  assert.ok(state.answeredQuestionIds.has('audio_latency'));
});

test('AppStore: toggleWizardMode keeps answeredQuestionOrder in sync and is undoable', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', 'experienceLevel', 'beginner');
  store.answerQuestion('beginner_goal', { useCase: 'server', platform: 'embedded-sbc', footprint: 'lean' });

  store.toggleWizardMode();
  let state = store.getState();
  assert.deepEqual(state.answeredQuestionOrder, ['user_familiarity', 'technical_use_case']);

  store.answerQuestion('system_immutability', { statePreference: 'declarative' }, false);
  store.toggleWizardMode();
  state = store.getState();
  assert.equal(state.flowMode, 'smart');
  assert.equal(state.criteria.statePreference, undefined);
  assert.ok(!state.answeredQuestionOrder?.includes('system_immutability'));
  assert.deepEqual(state.answeredQuestionOrder, ['user_familiarity', 'beginner_goal']);

  // Undo restores the pre-toggle mode, expert criteria, and answered order
  assert.equal(store.popHistory(), true);
  state = store.getState();
  assert.equal(state.flowMode, 'expert');
  assert.equal(state.criteria.statePreference, 'declarative');
  assert.equal(state.criteria.experienceLevel, 'intermediate');
  assert.ok(state.answeredQuestionIds.has('system_immutability'));
  assert.ok(state.answeredQuestionOrder?.includes('system_immutability'));
});

test('AppStore: toggleWizardMode prunes remapped answers that are ineligible in the target mode', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', { experienceLevel: 'intermediate' }, false);
  store.answerQuestion('technical_use_case', { useCase: 'browser-wasm' }, false);
  // Force a stale technical hardware answer, then switch to Goal Mode
  store.getState().answeredQuestionIds.add('hardware_architecture');
  store.toggleWizardMode();
  const state = store.getState();
  assert.ok(!state.answeredQuestionIds.has('beginner_device'), 'beginner_device is ineligible for browser-wasm');
});

test('AppStore: answering display_mode advances to the next question instead of jumping to results', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', { experienceLevel: 'intermediate' });
  store.answerQuestion('technical_use_case', { useCase: 'server' });
  store.answerQuestion('display_mode', { prefersGui: false });
  const state = store.getState();
  assert.equal(state.activeTab, 'wizard');
  assert.notEqual(state.viewingQuestionId, null);
  assert.equal(state.criteria.prefersGui, false);
  assert.ok(state.answeredQuestionIds.has('display_mode'));
});

test('AppStore: the device replaces the goal hardware guesses, in any answer order', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', 'experienceLevel', 'beginner');
  store.answerQuestion('beginner_goal', { useCase: 'server', footprint: 'lean', platform: 'embedded-sbc', prefersGui: false });
  store.answerQuestion('beginner_device', { architecture: 'x86_64', platform: 'bare-metal', formFactor: 'desktop' });
  let c = store.getState().criteria;
  assert.equal(c.platform, 'bare-metal', 'device wins on platform');
  assert.equal(c.footprint, undefined, 'device owns footprint, so the goal guess is dropped');

  // Re-answering the goal later must not overwrite the device's hardware answer
  store.answerQuestion('beginner_goal', { useCase: 'nas-storage', footprint: 'lean', platform: 'bare-metal', prefersGui: false }, false);
  c = store.getState().criteria;
  assert.equal(c.useCase, 'nas-storage');
  assert.equal(c.platform, 'bare-metal');
  assert.equal(c.footprint, undefined);
});

test('AppStore: changing the goal re-derives its inferences but keeps later explicit answers', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', 'experienceLevel', 'intermediate');
  store.answerQuestion('technical_use_case', { useCase: 'desktop', platform: 'bare-metal', prefersGui: true });
  store.answerQuestion('release_cadence', { releaseCadence: 'rolling' });

  // Switch to Goal Mode and pick a server goal that infers headless + LTS
  store.toggleWizardMode();
  store.answerQuestion('beginner_goal', { useCase: 'server', footprint: 'lean', platform: 'embedded-sbc', prefersGui: false, releaseCadence: 'lts' }, false);
  let c = store.getState().criteria;
  assert.equal(c.prefersGui, false, 'the new goal replaces the old goal inference');
  assert.equal(c.releaseCadence, 'rolling', 'an explicit later answer beats the goal inference');

  // Back to a desktop goal: the server inferences disappear instead of lingering
  store.answerQuestion('beginner_goal', { useCase: 'desktop', footprint: 'standard', platform: 'bare-metal', prefersGui: true }, false);
  c = store.getState().criteria;
  assert.equal(c.prefersGui, true);
  assert.equal(c.useCase, 'desktop');
  assert.equal(c.releaseCadence, 'rolling');
});

test('AppStore: removed choices, Expert edits, and URL loads are not undone by a later re-answer', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', 'experienceLevel', 'beginner');
  store.answerQuestion('beginner_goal', { useCase: 'server', footprint: 'lean', platform: 'embedded-sbc', releaseCadence: 'lts' });
  store.removeChoice('releaseCadence');
  store.answerQuestion('beginner_device', { architecture: 'arm64', platform: 'embedded-sbc', formFactor: 'sbc' }, false);
  assert.equal(store.getState().criteria.releaseCadence, undefined);

  // Expert tab edit survives a later wizard answer
  store.update({ criteria: { ...store.getState().criteria, kernelFlavor: 'lts-stable', useCase: 'nas-storage' } });
  store.answerQuestion('beginner_device', { architecture: 'x86_64', platform: 'bare-metal', formFactor: 'desktop' }, false);
  assert.equal(store.getState().criteria.kernelFlavor, 'lts-stable');
  assert.equal(store.getState().criteria.useCase, 'nas-storage');

  // After a URL load the patches are unknown; re-answering clears only that question's keys
  store.update({
    criteria: { experienceLevel: 'beginner', useCase: 'server', platform: 'embedded-sbc', architecture: 'x86_64', formFactor: 'desktop' },
    answeredQuestionIds: new Set(['user_familiarity', 'beginner_goal', 'beginner_device']),
    answeredQuestionOrder: ['user_familiarity', 'beginner_goal', 'beginner_device']
  });
  assert.deepEqual(store.getState().answerPatches, {});
  store.answerQuestion('beginner_device', { architecture: 'arm64', platform: 'embedded-sbc', formFactor: 'sbc' }, false);
  const c = store.getState().criteria;
  assert.equal(c.useCase, 'server');
  assert.equal(c.formFactor, 'sbc');
  assert.equal(c.architecture, 'arm64');
});

test('AppStore: Next at the end of the flow visits questions an edit unlocked before results', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', { experienceLevel: 'intermediate' });
  store.answerQuestion('technical_use_case', { useCase: 'container-base', platform: 'container' });
  // Walk to the end: container builds skip display, boot, and driver questions
  while (store.getState().activeTab === 'wizard') {
    if (!store.stepForwardQuestion()) break;
  }
  assert.equal(store.getState().activeTab, 'results');

  // Edit the use case from results: a bare-metal desktop unlocks display_mode and friends
  store.answerQuestion('technical_use_case', { useCase: 'desktop', platform: 'bare-metal' }, false);
  assert.ok(store.firstUnansweredQuestionId(), 'the edit unlocked new questions');
  const last = store.getState().answeredQuestionOrder!.at(-1)!;
  store.stepForwardQuestion(last);
  assert.equal(store.getState().activeTab, 'wizard', 'Next goes to an unlocked question instead of results');
  assert.equal(store.getState().answeredQuestionIds.has(store.getState().viewingQuestionId!), false);
});

test('AppStore: leaving results for the wizard captures a baseline once until dismissed', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', 'experienceLevel', 'beginner');
  store.answerQuestion('beginner_goal', { useCase: 'server', footprint: 'lean', platform: 'embedded-sbc', prefersGui: false });
  store.setTab('results');
  assert.equal(store.getState().resultsBaseline ?? null, null);

  store.setTab('wizard');
  const baseline = store.getState().resultsBaseline;
  assert.ok(baseline);
  assert.equal(baseline.criteria.useCase, 'server');

  // A second round trip keeps the original baseline
  store.answerQuestion('beginner_goal', { useCase: 'nas-storage', footprint: 'lean', platform: 'bare-metal', prefersGui: false }, false);
  store.setTab('results');
  store.setTab('wizard');
  assert.equal(store.getState().resultsBaseline?.criteria.useCase, 'server');

  store.clearResultsBaseline();
  assert.equal(store.getState().resultsBaseline, null);

  // Back from results also captures it
  store.setTab('results');
  store.stepBackQuestion();
  assert.equal(store.getState().resultsBaseline?.criteria.useCase, 'nas-storage');
});

test('AppStore: removing an inferred chip re-opens its own question without un-answering the goal or device', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', { experienceLevel: 'beginner' }, false);
  store.answerQuestion('beginner_goal', { useCase: 'server', footprint: 'lean', platform: 'embedded-sbc', prefersGui: false, releaseCadence: 'lts', deploymentSite: 'home' }, false);
  store.answerQuestion('beginner_device', { architecture: 'x86_64', platform: 'bare-metal', formFactor: 'desktop', bootMedium: 'nvme-ssd' }, false);

  store.removeChoice('bootMedium');
  let state = store.getState();
  assert.ok(state.answeredQuestionIds.has('beginner_device'), 'device answer stays');
  assert.equal(state.viewingQuestionId, 'boot_medium');

  store.removeChoice('releaseCadence');
  state = store.getState();
  assert.ok(state.answeredQuestionIds.has('beginner_goal'), 'goal answer stays');
  assert.equal(state.viewingQuestionId, 'release_cadence');
  assert.equal(state.criteria.useCase, 'server');

  // Removing the goal's subject (use case) still re-opens the goal
  store.removeChoice('useCase');
  assert.ok(!store.getState().answeredQuestionIds.has('beginner_goal'));
});

test('AppStore: Next from a question that no longer applies goes to results once everything is answered', () => {
  const store = new AppStore();
  store.answerQuestion('user_familiarity', { experienceLevel: 'intermediate' }, false);
  store.answerQuestion('technical_use_case', { useCase: 'container-base', platform: 'container' }, false);
  while (store.firstUnansweredQuestionId()) {
    store.stepForwardQuestion(store.firstUnansweredQuestionId()!);
  }
  // display_mode does not apply to containers
  assert.equal(store.nextQuestionIdAfter('display_mode'), null);
});

test('AppStore: the web store and the CLI (applyAnswer) build identical criteria from the same answers', () => {
  const opt = (q: string, id: string) => QUESTIONS.find((x) => x.id === q)!.options.find((o) => o.id === id)!.appliesCriteria;
  const answers: Array<[string, string]> = [
    ['user_familiarity', 'beginner'],
    ['beginner_goal', 'game_server_lan'],
    ['beginner_device', 'standard_desktop'],
    ['beginner_memory', 'modest']
  ];
  const store = new AppStore();
  let cli: AnswerState = { criteria: {}, patches: {}, answeredIds: new Set<string>() };
  for (const [q, o] of answers) {
    store.answerQuestion(q, opt(q, o), false);
    cli = applyAnswer(cli, q, opt(q, o));
  }
  assert.deepEqual(store.getState().criteria, cli.criteria);
  assert.equal(evaluateCriteria(cli.criteria).bestMatch.distro.id, evaluateCriteria(store.getState().criteria).bestMatch.distro.id);
});
