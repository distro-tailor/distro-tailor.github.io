import test from 'node:test';
import assert from 'node:assert/strict';
import {
  serializeStateToParams,
  parseRawUrlParams,
  AppRouter,
  MAX_TRANSITIONS_IN_WINDOW
} from './router.js';
import { createDefaultState } from './store.js';

test('AppRouter: serializeStateToParams encodes version, tabs, and active criteria cleanly', () => {
  const state = createDefaultState();
  state.activeTab = 'results';
  state.activeFileIndex = 2;
  state.answeredQuestionIds.add('q1');
  state.answeredQuestionIds.add('q2');
  state.criteria = {
    useCase: 'media-center',
    architecture: 'arm64',
    dockerApp: 'pihole'
  };

  const params = serializeStateToParams(state);
  assert.equal(params.get('v'), '1');
  assert.equal(params.get('tab'), 'results');
  assert.equal(params.get('file'), '2');
  assert.equal(params.get('ans'), 'q1,q2');
  assert.equal(params.get('useCase'), 'media-center');
  assert.equal(params.get('architecture'), 'arm64');
  assert.equal(params.get('dockerApp'), 'pihole');
});

test('AppRouter: parseRawUrlParams deserializes URL query strings and normalizes aliases', () => {
  const query = '?v=1&useCase=home-automation&platform=rpi&architecture=aarch64&tab=results';
  const result = parseRawUrlParams(query);

  assert.equal(result.supported, true);
  assert.equal(result.activeTab, 'results');
  // Aliases normalized via migration
  assert.equal(result.criteria.useCase, 'smart-home');
  assert.equal(result.criteria.platform, 'embedded-sbc');
  assert.equal(result.criteria.architecture, 'arm64');
  assert.equal(result.isSharedView, true);
});

test('AppRouter: parseRawUrlParams detects unsupported schema versions (v=0 and v=99)', () => {
  const obsolete = parseRawUrlParams('?v=0&useCase=something');
  assert.equal(obsolete.supported, false);
  assert.ok(obsolete.unsupportedNotice?.includes('no longer supported'));

  const future = parseRawUrlParams('?v=99&useCase=future');
  assert.equal(future.supported, false);
  assert.ok(future.unsupportedNotice?.includes('newer version'));
});

test('AppRouter: loop safeguard trips if transitions exceed safety threshold in window', () => {
  const router = new AppRouter();

  for (let i = 0; i < MAX_TRANSITIONS_IN_WINDOW; i++) {
    assert.equal(router.checkLoopSafeguard(), true);
  }

  // Next transition exceeding threshold fails
  assert.equal(router.checkLoopSafeguard(), false);

  // Reset clears counter
  router.resetLoopGuard();
  assert.equal(router.checkLoopSafeguard(), true);
});
