import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTRO_REGISTRY } from '@distro-tailor/core';
import { FLATPAK_PREINSTALLED_DISTRO_IDS } from './flatpak-defaults.js';

test('Flatpak Defaults: every listed distro exists in the registry', () => {
  const known = new Set(DISTRO_REGISTRY.map((d) => d.id));
  assert.deepEqual(FLATPAK_PREINSTALLED_DISTRO_IDS.filter((id) => !known.has(id)), []);
});
