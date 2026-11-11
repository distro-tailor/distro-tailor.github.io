import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCriteria } from '../engine/matcher.js';
import { DISTRO_REGISTRY } from './distros.js';
import {
  DISTRO_TARGET_CRITERIA,
  getDistroTargetCriteria,
  getDistroTargetUrl,
  getDistroUrlDirectory
} from './distro-urls.js';

test('Distro URLs: every registered distro has winning criteria and a deterministic permalink', () => {
  assert.equal(DISTRO_REGISTRY.length, 31, 'Must register exactly 31 distributions');
  const directory = getDistroUrlDirectory();
  assert.equal(directory.length, 31, 'Directory must contain 31 entries');

  for (const distro of DISTRO_REGISTRY) {
    const criteria = getDistroTargetCriteria(distro.id);
    assert.ok(criteria, `Distro ${distro.id} must define target criteria in DISTRO_TARGET_CRITERIA`);

    const url = getDistroTargetUrl(distro.id);
    assert.ok(url.startsWith('?v=1&tab=results'), `URL for ${distro.id} must start with ?v=1&tab=results`);

    const result = evaluateCriteria(criteria, DISTRO_REGISTRY);
    const winnerId = result.bestMatch.distro.id;
    const winnerScore = result.bestMatch.score;

    assert.equal(
      winnerId,
      distro.id,
      `Criteria for ${distro.name} (${distro.id}) must result in it being the #1 champion, but got ${winnerId} (${winnerScore}%)`
    );
    assert.ok(
      winnerScore >= 80,
      `Winner score for ${distro.name} must be >= 80%, but got ${winnerScore}%`
    );
  }
});
