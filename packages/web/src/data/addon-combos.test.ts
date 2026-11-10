import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ADDON_COMBOS, DISTRO_ADDON_CATALOG, getAddonCombos } from './addon-combos.js';

test('Addon Combos Catalog: provides valid combos for known distros and fallbacks gracefully', () => {
  // Test known distros
  const knownDistros = ['libreelec', 'openmediavault', 'home-assistant-os', 'cage-appliance', 'batocera'];

  for (const id of knownDistros) {
    const combos = getAddonCombos(id);
    assert.ok(Array.isArray(combos));
    assert.ok(combos.length > 0, `Distro ${id} should have addon combos`);

    for (const combo of combos) {
      assert.ok(combo.title && combo.title.length > 0);
      assert.ok(combo.icon && combo.icon.length > 0);
      assert.ok(combo.description && combo.description.length > 0);
      assert.ok(combo.howTo && combo.howTo.length > 0);
    }
  }

  // Test fallback
  const fallback = getAddonCombos('unknown-distro-xyz');
  assert.deepEqual(fallback, DEFAULT_ADDON_COMBOS);
  assert.equal(fallback.length, 2);
});
