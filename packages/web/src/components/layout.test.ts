import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCriteria } from '@distro-tailor/core';
import { renderLeaderboard } from './layout.js';
import { createDefaultState } from '../state/store.js';

test('Leaderboard Layout: renders top 6 contenders when collapsed and all 33 when expanded', () => {
  const evalResult = evaluateCriteria({});
  const state = createDefaultState();

  // Collapsed (default)
  state.showAllContenders = false;
  const collapsedHtml = renderLeaderboard(evalResult, state);
  const collapsedCards = (collapsedHtml.match(/<div class="p-3 rounded-xl bg-slate-950/g) || []).length;
  assert.equal(collapsedCards, 6, 'Collapsed leaderboard should show exactly top 6 cards');
  assert.ok(collapsedHtml.includes('Top 6 of 33'));
  assert.ok(collapsedHtml.includes('▼ View All 33 Distros'));

  // Expanded
  state.showAllContenders = true;
  const expandedHtml = renderLeaderboard(evalResult, state);
  const expandedCards = (expandedHtml.match(/<div class="p-3 rounded-xl bg-slate-950/g) || []).length;
  assert.equal(expandedCards, 33, 'Expanded leaderboard should show all 33 contenders');
  assert.ok(expandedHtml.includes('All 33 distros'));
  assert.ok(expandedHtml.includes('▲ Show Top 6 Only'));
  assert.ok(expandedHtml.includes('#33'));
});

test('Leaderboard Layout: live search filters contenders by name and tagline', () => {
  const evalResult = evaluateCriteria({});
  const state = createDefaultState();

  state.searchQuery = 'mint';
  const html = renderLeaderboard(evalResult, state);
  assert.ok(html.includes('Linux Mint'));
  assert.ok(html.includes('1 found') || html.includes('found'));
  assert.ok(!html.includes('Batocera.linux')); // should be filtered out
});
