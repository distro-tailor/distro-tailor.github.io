import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCriteria, QuestionFlow, QUESTIONS } from './index.js';

test('Core Matcher: Pinpoints Buildroot for NOMMU microcontrollers', () => {
  const result = evaluateCriteria({
    useCase: 'iot-embedded',
    architecture: 'nommu',
    footprint: 'micro'
  });

  assert.equal(result.bestMatch.distro.id, 'buildroot');
  assert.ok(result.bestMatch.score >= 70);
  assert.ok(result.recommendedRecipe);
  if (result.recommendedRecipe) {
    assert.equal(result.recommendedRecipe.id, 'buildroot-embedded');
    assert.ok(result.recommendedRecipe.files.some(f => f.filename === 'distro.defconfig'));
  }
});

test('Core Matcher: Identifies Talos Linux for Kubernetes cluster nodes', () => {
  const result = evaluateCriteria({
    useCase: 'k8s-cluster',
    platform: 'k8s-node',
    architecture: 'x86_64'
  });

  assert.equal(result.bestMatch.distro.id, 'talos');
  assert.ok(result.bestMatch.score >= 80);
});

test('Core Matcher: Identifies Alpine / Distroless for minimal container base', () => {
  const result = evaluateCriteria({
    useCase: 'container-base',
    platform: 'container',
    footprint: 'minimal'
  });

  const topTwoIds = result.topMatches.slice(0, 2).map(m => m.distro.id);
  assert.ok(topTwoIds.includes('alpine') || topTwoIds.includes('chainguard-distroless'));
});

test('QuestionFlow: Dynamically filters questions for browser WASM', () => {
  const flow = new QuestionFlow(QUESTIONS);
  const eligible = flow.getEligibleQuestions({ useCase: 'browser-wasm' });

  // For browser-wasm, hardware_architecture question should be skipped
  const hasHardwareQuestion = eligible.some(q => q.id === 'hardware_architecture');
  assert.equal(hasHardwareQuestion, false);
});
