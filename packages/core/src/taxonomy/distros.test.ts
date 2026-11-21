import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_LICENSE_MODELS, DISTRO_REGISTRY } from './distros.js';
import { PAID_ALTERNATIVES } from './paid-alternatives.js';
import { evaluateCriteria } from '../engine/matcher.js';
import { DistroProfile } from '../types.js';

test('Licensing policy: every registered distro is free and/or open source', () => {
  for (const distro of DISTRO_REGISTRY) {
    assert.ok(
      ALLOWED_LICENSE_MODELS.includes(distro.licensing.model),
      `${distro.id} has license model "${distro.licensing.model}", which the free/open-source policy does not allow`
    );
    assert.ok(distro.licensing.license.trim().length > 0, `${distro.id} must name its license`);
  }
});

test('Licensing policy: optional-paid and firmware models explain what is optional or closed', () => {
  for (const distro of DISTRO_REGISTRY) {
    if (distro.licensing.model === 'foss-optional-paid' || distro.licensing.model === 'foss-with-firmware') {
      assert.ok(distro.licensing.note, `${distro.id} (${distro.licensing.model}) needs a note on what is paid or closed`);
    }
  }
});

test('Licensing policy: closed-core or usage-capped systems stay out of the registry', () => {
  const ids = DISTRO_REGISTRY.map((d) => d.id);
  for (const removed of ['hiveos', 'porteus-kiosk']) {
    assert.ok(!ids.includes(removed), `${removed} was removed for a closed-source core / paid usage cap`);
  }
  const v86 = DISTRO_REGISTRY.find((d) => d.id === 'webvm-v86')!;
  assert.ok(!v86.website.includes('webvm.io'), 'link the open-source v86 emulator, not the proprietary CheerpX-based WebVM');
});

test('Paid alternatives: catalogued with caveats, never registered, and backed by free options', () => {
  const registryIds = new Set(DISTRO_REGISTRY.map((d) => d.id));
  for (const alt of PAID_ALTERNATIVES) {
    assert.ok(!ALLOWED_LICENSE_MODELS.includes(alt.licensing.model), `${alt.id} is free/open source, so it belongs in the registry`);
    assert.ok(!registryIds.has(alt.id), `${alt.id} must not share an id with a registered distro`);
    assert.ok(alt.caveat.length > 0 && alt.pitch.length > 0, `${alt.id} needs a pitch and a caveat`);
    assert.ok(alt.freeOptionIds.length > 0, `${alt.id} must point to at least one free option`);
    for (const id of alt.freeOptionIds) assert.ok(registryIds.has(id), `${alt.id} free option ${id} must be registered`);
  }
});

test('Paid alternatives: shown for the matching use case only, beside a free top pick', () => {
  const mining = evaluateCriteria({ useCase: 'ai-gpu-compute', platform: 'server', prefersGui: false });
  assert.deepEqual(mining.paidAlternatives.map((a) => a.id), ['hiveos']);
  assert.ok(ALLOWED_LICENSE_MODELS.includes(mining.bestMatch.distro.licensing.model));

  assert.deepEqual(evaluateCriteria({ useCase: 'nas-storage' }).paidAlternatives.map((a) => a.id), ['unraid']);
  assert.deepEqual(evaluateCriteria({ useCase: 'desktop' }).paidAlternatives, []);
  assert.deepEqual(evaluateCriteria({}).paidAlternatives, []);
});

test('Matcher: a paid or closed-core system is never scored, even with a perfect fit', () => {
  const base = DISTRO_REGISTRY.find((d) => d.id === 'ubuntu')!;
  const paid: DistroProfile = {
    ...base,
    id: 'paid-perfect-fit',
    name: 'Paid Perfect Fit',
    primaryUseCases: ['ai-gpu-compute'],
    licensing: { model: 'freemium-closed', license: 'Proprietary' }
  };
  const result = evaluateCriteria({ useCase: 'ai-gpu-compute' }, [paid, ...DISTRO_REGISTRY]);
  assert.ok(!result.allMatches.some((m) => m.distro.id === 'paid-perfect-fit'));
});
