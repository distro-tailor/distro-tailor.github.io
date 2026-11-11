import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UserCriteria } from '../types.js';
import { RECIPE_GENERATORS, isRecipeGeneratorId, resolveRecipeGenerator } from './index.js';

const CRITERIA_VARIANTS: UserCriteria[] = [
  {},
  { architecture: 'x86_64', prefersGui: true, desktopEnv: 'xfce', desktopApps: ['firefox', 'vlc'] },
  { architecture: 'arm64', dockerApp: 'home-assistant', enableDistrobox: true, enableNix: true },
  { architecture: 'nommu', footprint: 'micro' },
  { architecture: 'riscv64', formFactor: 'laptop', dockerApp: 'jellyfin', enableFlatpak: true }
];

/** Downloads of archives or images that a recipe extracts or boots. */
const ARTIFACT_DOWNLOAD = /curl [^\n]*\.(tar\.gz|tar\.xz|iso|bin|img|qcow2)\b/;

for (const id of Object.keys(RECIPE_GENERATORS)) {
  test(`Recipe Generator ${id}: produces complete files for every criteria variant`, () => {
    assert.ok(isRecipeGeneratorId(id));
    for (const criteria of CRITERIA_VARIANTS) {
      const recipe = resolveRecipeGenerator(id, criteria);
      const label = `${id} with ${JSON.stringify(criteria)}`;

      assert.equal(recipe.id, id, label);
      assert.ok(recipe.files.length > 0, `${label}: no files`);
      assert.ok(recipe.quickstartCommands.length > 0, `${label}: no quickstart commands`);
      for (const file of recipe.files) {
        assert.ok(file.content.trim().length > 0, `${label}: ${file.filename} is empty`);
        assert.doesNotMatch(file.content, /\bundefined\b|\bNaN\b|\[object Object\]/, `${label}: ${file.filename} has an unfilled placeholder`);
      }
    }
  });

  test(`Recipe Generator ${id}: verifies a SHA-256 checksum for every downloaded artifact`, () => {
    for (const criteria of CRITERIA_VARIANTS) {
      for (const file of resolveRecipeGenerator(id, criteria).files) {
        if (!ARTIFACT_DOWNLOAD.test(file.content)) continue;
        assert.match(file.content, /(sha256sum|SHA256SUM\)) -c -/, `${id}: ${file.filename} downloads without checksum verification`);
        assert.doesNotMatch(file.content, /curl [^\n]*\| *tar/, `${id}: ${file.filename} pipes a download straight into tar`);
      }
    }
  });
}

test('Recipe Generator: unknown ids are rejected by isRecipeGeneratorId', () => {
  assert.equal(isRecipeGeneratorId('not-a-recipe'), false);
  assert.equal(isRecipeGeneratorId('toString'), false);
});
