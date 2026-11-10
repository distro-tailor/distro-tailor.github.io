import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCriteria } from '@distro-tailor/core';
import { renderLeaderboard } from './layout.js';
import { createDefaultState } from '../state/store.js';

test('Leaderboard Layout: renders top 6 contenders when collapsed and all 31 when expanded', () => {
  const evalResult = evaluateCriteria({});
  const state = createDefaultState();

  // Collapsed (default)
  state.showAllContenders = false;
  const collapsedHtml = renderLeaderboard(evalResult, state);
  const collapsedCards = (collapsedHtml.match(/<div class="p-3 rounded-xl bg-slate-950/g) || []).length;
  assert.equal(collapsedCards, 6, 'Collapsed leaderboard should show exactly top 6 cards');
  assert.ok(collapsedHtml.includes('Top 6 of 31'));
  assert.ok(collapsedHtml.includes('▼ View All 31 Distros'));

  // Expanded
  state.showAllContenders = true;
  const expandedHtml = renderLeaderboard(evalResult, state);
  const expandedCards = (expandedHtml.match(/<div class="p-3 rounded-xl bg-slate-950/g) || []).length;
  assert.equal(expandedCards, 31, 'Expanded leaderboard should show all 31 contenders');
  assert.ok(expandedHtml.includes('All 31 distros'));
  assert.ok(expandedHtml.includes('▲ Show Top 6 Only'));
  assert.ok(expandedHtml.includes('#31'));
});
