import test from 'node:test';
import assert from 'node:assert/strict';
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
  store.answerQuestion('c_library_and_init', 'cLibPreference', 'musl');
  store.answerQuestion('system_immutability', 'statePreference', 'declarative');

  assert.equal(store.getState().criteria.cLibPreference, 'musl');
  assert.equal(store.getState().criteria.statePreference, 'declarative');

  // Switch back to smart mode
  store.setFlowMode('smart');
  const state = store.getState();
  assert.equal(state.flowMode, 'smart');
  assert.equal(state.criteria.cLibPreference, undefined);
  assert.equal(state.criteria.statePreference, undefined);
  assert.equal(state.answeredQuestionIds.has('c_library_and_init'), false);
  assert.equal(state.answeredQuestionIds.has('system_immutability'), false);
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

test('AppStore: stepBackQuestion steps back one question and stays in wizard tab', () => {
  const store = new AppStore();

  store.answerQuestion('user_familiarity', 'experienceLevel', 'beginner');
  store.answerQuestion('beginner_device', 'architecture', 'x86_64');
  store.setTab('results'); // Simulate being on final results page

  // Step back from results -> should land on wizard with beginner_device reopened
  const stepped1 = store.stepBackQuestion();
  assert.equal(stepped1, true);
  assert.equal(store.getState().activeTab, 'wizard');
  assert.equal(store.getState().criteria.architecture, undefined);
  assert.equal(store.getState().criteria.experienceLevel, 'beginner');

  // Step back again -> should land on wizard with user_familiarity reopened
  const stepped2 = store.stepBackQuestion();
  assert.equal(stepped2, true);
  assert.equal(store.getState().activeTab, 'wizard');
  assert.equal(store.getState().criteria.experienceLevel, undefined);

  // Stepping back from beginning returns false
  const stepped3 = store.stepBackQuestion();
  assert.equal(stepped3, false);
});
