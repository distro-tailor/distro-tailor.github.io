import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_LICENSE_MODELS, DISTRO_REGISTRY } from './distros.js';

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
