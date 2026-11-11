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

/** Patterns that indicate a fixed, publicly known login baked into a recipe. */
const FIXED_CREDENTIALS: Array<[string, RegExp]> = [
  ['literal password piped to chpasswd', /(echo|printf) +['"][a-z_][a-z0-9_-]*:[^'"$%]+['"] *\| *chpasswd/i],
  ['hashed password in cloud-config', /^\s*(passwd|hashed_passwd|plain_text_passwd):/m],
  ['fixed Pi-hole web password', /WEBPASSWORD|webserver_api_password/i],
  ['documented default password', /default (password|credentials)\s*[:=]/i]
];

for (const id of Object.keys(RECIPE_GENERATORS)) {
  test(`Recipe Generator ${id}: contains no fixed login credentials`, () => {
    const dockerApps = ['none', 'pihole', 'home-assistant'] as const;
    for (const criteria of [...CRITERIA_VARIANTS, ...dockerApps.map((dockerApp) => ({ dockerApp }))]) {
      for (const file of resolveRecipeGenerator(id, criteria).files) {
        for (const [label, pattern] of FIXED_CREDENTIALS) {
          assert.doesNotMatch(file.content, pattern, `${id}: ${file.filename} has a ${label}`);
        }
      }
    }
  });
}

test('Recipe Generator buildroot-embedded: uses selectable Kconfig choices for libc, headers, and NOMMU CPU', () => {
  // Derived symbols such as BR2_TOOLCHAIN_BUILDROOT_LIBC or BR2_USE_MMU have no prompt, so Buildroot
  // silently ignores them in a defconfig (verified against Buildroot 2025.02 with make defconfig).
  const defconfig = (architecture: UserCriteria['architecture']) =>
    resolveRecipeGenerator('buildroot-embedded', { architecture }).files.find((f) => f.filename === 'distro.defconfig')!.content;

  for (const architecture of ['x86_64', 'arm64'] as const) {
    assert.match(defconfig(architecture), /^BR2_TOOLCHAIN_BUILDROOT_MUSL=y$/m);
    assert.match(defconfig(architecture), /^BR2_KERNEL_HEADERS_6_6=y$/m);
  }
  const nommu = defconfig('nommu');
  assert.match(nommu, /^BR2_cortex_m4=y$/m);
  assert.match(nommu, /^BR2_TOOLCHAIN_BUILDROOT_UCLIBC=y$/m);
  for (const config of [defconfig('x86_64'), nommu]) {
    assert.doesNotMatch(config, /^BR2_(TOOLCHAIN_BUILDROOT_LIBC|USE_MMU|PACKAGE_HOST_LINUX_HEADERS_CUSTOM_\w+)=/m);
  }
});

test('Recipe Generator: unknown ids are rejected by isRecipeGeneratorId', () => {
  assert.equal(isRecipeGeneratorId('not-a-recipe'), false);
  assert.equal(isRecipeGeneratorId('toString'), false);
});
