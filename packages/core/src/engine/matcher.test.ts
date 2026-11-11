import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISTRO_REGISTRY } from '../taxonomy/distros.js';
import { DistroProfile } from '../types.js';
import { evaluateCriteria } from './matcher.js';

test('Matcher Scoring: criteria with only undefined values use the unconstrained Linux Mint baseline', () => {
  const result = evaluateCriteria({ useCase: undefined, platform: undefined });
  assert.equal(result.bestMatch.distro.id, 'linux-mint');
  assert.equal(result.bestMatch.reasons[0]?.feature, 'Universal Baseline');
});

test('Matcher Scoring: alignment bonuses count toward the maximum, so exact footprint tier wins', () => {
  const result = evaluateCriteria({ footprint: 'standard' });
  const debian = result.allMatches.find((m) => m.distro.id === 'debian');
  const alpine = result.allMatches.find((m) => m.distro.id === 'alpine');
  assert.ok(debian && alpine);
  assert.equal(debian.score, 100, 'exact tier match should be a perfect score');
  assert.ok(alpine.score < debian.score, 'smaller-tier distro should no longer tie at 100%');
});

test('Matcher Scoring: router-only distributions are treated as dedicated appliances', () => {
  const debian = DISTRO_REGISTRY.find((d) => d.id === 'debian');
  assert.ok(debian);
  const routerOnly: DistroProfile = { ...debian, id: 'router-only', name: 'Router Only', primaryUseCases: ['router-networking'] };
  const result = evaluateCriteria({ useCase: 'gaming' }, [routerOnly]);
  const useCase = result.bestMatch.reasons.find((r) => r.feature === 'Use Case');
  assert.match(useCase?.explanation ?? '', /Dedicated appliance/);
});
