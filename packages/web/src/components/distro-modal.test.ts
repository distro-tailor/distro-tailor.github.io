import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTRO_REGISTRY, evaluateCriteria } from '@distro-tailor/core';
import { renderDistroDetailModal } from './distro-modal.js';
import { createDefaultState } from '../state/store.js';

test('Distro Modal: renders complete profile with specs, strengths, tradeoffs and links', () => {
  const mint = DISTRO_REGISTRY.find((d) => d.id === 'linux-mint')!;
  const evalResult = evaluateCriteria({ useCase: 'desktop' });
  const state = createDefaultState();

  const html = renderDistroDetailModal(mint, evalResult, state);

  assert.ok(html.includes('Linux Mint'));
  assert.ok(html.includes('Official Site'));
  assert.ok(html.includes('Key Strengths'));
  assert.ok(html.includes('Trade-offs to Consider'));
  assert.ok(html.includes('Min RAM'));
  assert.ok(html.includes('Footprint'));
  assert.ok(html.includes('btn-close-distro-modal'));
  assert.ok(html.includes('id="btn-modal-load-distro"'));
  assert.ok(html.includes('data-load-distro="linux-mint"'));
  assert.ok(html.includes('Load Match'));
});

test('Distro Modal: shows the licence and any legal notes for the distro', () => {
  const kali = DISTRO_REGISTRY.find((d) => d.id === 'kali-linux')!;
  const html = renderDistroDetailModal(kali);
  assert.ok(html.includes('Licence:'));
  assert.ok(html.includes('Legal notes'));
  assert.ok(html.includes('data-caveat-id="authorized-security-testing"'));

  const debian = DISTRO_REGISTRY.find((d) => d.id === 'debian')!;
  const plain = renderDistroDetailModal(debian);
  assert.ok(plain.includes('Licence:'));
  assert.ok(!plain.includes('Legal notes'));
});
