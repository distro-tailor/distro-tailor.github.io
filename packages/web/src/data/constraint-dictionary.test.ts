import test from 'node:test';
import assert from 'node:assert/strict';
import { CONSTRAINT_DICTIONARY } from './constraint-dictionary.js';

test('Constraint Dictionary: contains all primary dimensions with valid labels and emoji icons', () => {
  const expectedDimensions = [
    'experienceLevel',
    'useCase',
    'platform',
    'architecture',
    'footprint',
    'statePreference',
    'cLibPreference',
    'initPreference',
    'releaseCadence',
    'driverPhilosophy',
    'bootMedium',
    'realtimeAudio',
    'peripheralNeed'
  ];

  for (const dim of expectedDimensions) {
    const entries = CONSTRAINT_DICTIONARY[dim];
    assert.ok(entries, `Dictionary must contain dimension: ${dim}`);
    const keys = Object.keys(entries);
    assert.ok(keys.length > 0, `Dimension ${dim} must have defined options`);

    for (const key of keys) {
      const item = entries[key];
      assert.ok(item.label && item.label.trim().length > 0, `Item ${dim}.${key} must have a label`);
      assert.ok(item.icon && item.icon.trim().length > 0, `Item ${dim}.${key} must have an icon`);
    }
  }
});
