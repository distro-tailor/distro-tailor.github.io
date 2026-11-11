import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCriteria } from '@distro-tailor/core';
import { getPersonaPresetById, PERSONA_PRESETS } from './persona-presets.js';
import { renderPersonaPresetsPanel } from '../components/persona-presets-panel.js';

test('Persona Presets: every preset has valid properties and deterministic URL state', () => {
  assert.ok(PERSONA_PRESETS.length >= 8, 'Must provide at least 8 persona presets');

  for (const preset of PERSONA_PRESETS) {
    assert.ok(preset.id, 'Preset must have an id');
    assert.ok(preset.name, `${preset.id} must have a name`);
    assert.ok(preset.badge, `${preset.id} must have a badge`);
    assert.ok(preset.tagline, `${preset.id} must have a tagline`);
    assert.ok(preset.winnerDistroName, `${preset.id} must declare winnerDistroName`);
    assert.ok(preset.buildTargetDescription, `${preset.id} must have buildTargetDescription`);
    assert.ok(preset.urlQuery.startsWith('?'), `${preset.id} urlQuery must start with '?'`);
    assert.ok(preset.urlQuery.includes('tab=results'), `${preset.id} urlQuery must target tab=results`);

    const fetched = getPersonaPresetById(preset.id);
    assert.equal(fetched?.id, preset.id);

    // Verify deterministic match
    const evaluation = evaluateCriteria(preset.criteria);
    assert.ok(evaluation.bestMatch.score >= 70, `${preset.id} score must be >= 70%`);

    if (preset.recipeId) {
      assert.equal(
        evaluation.recommendedRecipe?.id,
        preset.recipeId,
        `${preset.id} must resolve recipe ${preset.recipeId}`
      );
    }
  }
});

test('Persona Presets Panel: renders all persona cards with data-preset-id attributes', () => {
  const html = renderPersonaPresetsPanel();
  assert.ok(html.includes('Example Personas &amp; Deterministic VM Test Builds') || html.includes('Deterministic VM Test Builds'));

  for (const preset of PERSONA_PRESETS) {
    assert.ok(html.includes(`data-preset-id="${preset.id}"`), `Must render card for ${preset.id}`);
    assert.ok(html.includes(preset.id), `Must render preset id for ${preset.id}`);
    assert.ok(html.includes(preset.badge), `Must render badge for ${preset.badge}`);
  }
});
