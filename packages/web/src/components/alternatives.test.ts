import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTRO_REGISTRY } from '@distro-tailor/core';
import { renderAlternativeComparisons } from './alternatives.js';

test('Alternatives Component: returns empty string when distro has no alternativeComparisons', () => {
  const genericDistro = DISTRO_REGISTRY.find(d => !d.alternativeComparisons || d.alternativeComparisons.length === 0) || {
    id: 'test-distro',
    name: 'Test Distro',
    tagline: 'Test',
    description: 'Test',
    website: 'https://test.org',
    documentationUrl: 'https://test.org',
    platforms: ['bare-metal'],
    architectures: ['x86_64'],
    footprint: 'standard',
    minRamMb: 1024,
    initSystems: ['systemd'],
    cLibraries: ['glibc'],
    stateModel: 'mutable',
    experienceLevel: 'beginner',
    primaryUseCases: ['desktop'],
    rollingRelease: false,
    highlights: [],
    tradeoffs: []
  };

  const html = renderAlternativeComparisons(genericDistro as any);
  assert.equal(html, '');
});

test('Alternatives Component: renders comparisons against popular alternatives for Linux Mint and Fedora', () => {
  const mint = DISTRO_REGISTRY.find(d => d.id === 'linux-mint');
  assert.ok(mint);

  const mintHtml = renderAlternativeComparisons(mint);
  assert.ok(mintHtml.includes('Why Linux Mint over popular alternatives?'));
  assert.ok(mintHtml.includes('vs. Vanilla Ubuntu'));
  assert.ok(mintHtml.includes('Snap'));

  const fedora = DISTRO_REGISTRY.find(d => d.id === 'fedora');
  assert.ok(fedora);

  const fedoraHtml = renderAlternativeComparisons(fedora);
  assert.ok(fedoraHtml.includes('Why Fedora Workstation over popular alternatives?'));
  assert.ok(fedoraHtml.includes('Red Hat Enterprise Linux (RHEL)'));
  assert.ok(fedoraHtml.includes('subscription paywall'));
});
