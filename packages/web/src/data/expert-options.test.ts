import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPERT_FIELDS } from './expert-options.js';

test('Expert Options: defines valid configs with unique IDs and populated options', () => {
  assert.equal(EXPERT_FIELDS.length, 9, 'Should define exactly 9 expert matrix fields');

  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();

  for (const field of EXPERT_FIELDS) {
    assert.ok(field.id && field.id.startsWith('expert-'), `Field ID must start with expert-: ${field.id}`);
    assert.ok(!seenIds.has(field.id), `Field ID must be unique: ${field.id}`);
    seenIds.add(field.id);

    assert.ok(field.criteriaKey);
    assert.ok(!seenKeys.has(field.criteriaKey), `Criteria key must be unique: ${field.criteriaKey}`);
    seenKeys.add(field.criteriaKey);

    assert.ok(field.label && field.label.length > 0);
    assert.ok(field.placeholder && field.placeholder.length > 0);
    assert.ok(Array.isArray(field.options) && field.options.length >= 3);

    for (const opt of field.options) {
      assert.ok(opt.value && opt.value.length > 0);
      assert.ok(opt.label && opt.label.length > 0);
    }
  }
});
