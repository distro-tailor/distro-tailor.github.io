import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UserCriteria } from '../types.js';
import {
  RECIPE_GENERATORS,
  isRecipeGeneratorId,
  resolveRecipeGenerator,
  getEmulatorApp,
  checkEmulatorAppCompatibility,
  generateBootstrapEmulatorsScript
} from './index.js';
import { generateDebootstrapRecipe } from './debootstrap.js';

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

test('Emulator Apps: registry and lookup return definitions for all emulators', () => {
  const ids: import('../types.js').EmulatorAppId[] = [
    'retroarch',
    'dosbox-staging',
    'dolphin',
    'pcsx2',
    'duckstation',
    'ppsspp',
    'scummvm',
    'mame'
  ];
  for (const id of ids) {
    const app = getEmulatorApp(id);
    assert.ok(app, `Missing emulator app: ${id}`);
    assert.equal(app.id, id);
    assert.ok(app.minRamMb > 0);
  }
});

test('Emulator Apps: compatibility checks enforce hardware limits and RAM warnings', () => {
  const dolphin = getEmulatorApp('dolphin')!;
  const nommuResult = checkEmulatorAppCompatibility(dolphin, { architecture: 'nommu' });
  assert.equal(nommuResult.compatible, false);
  assert.match(nommuResult.blocker!, /Microcontrollers/);

  const pcsx2 = getEmulatorApp('pcsx2')!;
  const archResult = checkEmulatorAppCompatibility(pcsx2, { architecture: 'riscv64' });
  assert.equal(archResult.compatible, false);
  assert.match(archResult.blocker!, /does not provide prebuilt binaries/);

  const ramResult = checkEmulatorAppCompatibility(pcsx2, { architecture: 'x86_64', maxRamMb: 1024 });
  assert.equal(ramResult.compatible, true);
  assert.ok(ramResult.warnings.length > 0);
  assert.match(ramResult.warnings[0], /Exceeds your 1024 MB budget/);
});

test('Emulator Apps: generateBootstrapEmulatorsScript outputs gamepad rules and ROM scaffolding', () => {
  const emptyScript = generateBootstrapEmulatorsScript([], {});
  assert.match(emptyScript, /No emulators selected/);

  const script = generateBootstrapEmulatorsScript(['retroarch', 'dosbox-staging'], { architecture: 'x86_64' });
  assert.match(script, /99-distrotailor-gamepads\.rules/);
  assert.match(script, /Xbox 360 \/ Xbox One/);
  assert.match(script, /mkdir -p "\$TARGET_HOME\/Games\/bios"/);
  assert.match(script, /"\$TARGET_HOME\/Games\/roms\/snes"/);
  assert.match(script, /RetroArch/);
  assert.match(script, /DOSBox-Staging/);
});

test('Recipe Generator: debootstrap bundles bootstrap-emulators.sh when emulatorApps are selected', () => {
  const recipe = generateDebootstrapRecipe({
    architecture: 'x86_64',
    emulatorApps: ['retroarch', 'dosbox-staging']
  });
  const file = recipe.files.find((f) => f.filename === 'bootstrap-emulators.sh');
  assert.ok(file, 'bootstrap-emulators.sh file was not bundled');
  assert.equal(file.executable, true);
  assert.ok(recipe.quickstartCommands.some((c) => c.includes('bootstrap-emulators.sh')));
});
