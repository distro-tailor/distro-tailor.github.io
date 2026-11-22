import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UserCriteria } from '../types.js';
import {
  RECIPE_GENERATORS,
  isRecipeGeneratorId,
  resolveRecipeGenerator,
  getEmulatorApp,
  checkEmulatorAppCompatibility,
  generateBootstrapEmulatorsScript,
  getDockerApp,
  checkDockerAppCompatibility,
  getNavigationApp,
  checkNavigationAppCompatibility,
  generateBootstrapNavigationScript
} from './index.js';
import { generateDebootstrapRecipe } from './debootstrap.js';
import { generateCloudInitRecipe } from './cloud-init.js';
import { generateNixosRecipe } from './nixos.js';
import { generateBuildrootRecipe } from './buildroot.js';
import { generateAlpineRecipe } from './alpine.js';

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

test('Navigation Apps: registry and lookup return definitions for all navigation tools', () => {
  const ids: import('../types.js').NavigationAppId[] = [
    'navit',
    'gpsd',
    'foxtrotgps',
    'opencpn',
    'mkgmap'
  ];
  for (const id of ids) {
    const app = getNavigationApp(id);
    assert.ok(app, `Missing navigation app: ${id}`);
    assert.equal(app.id, id);
    assert.ok(app.minRamMb > 0);
  }
});

test('Navigation Apps: compatibility checks enforce hardware limits and RAM warnings', () => {
  const navit = getNavigationApp('navit')!;
  const nommuResult = checkNavigationAppCompatibility(navit, { architecture: 'nommu' });
  assert.equal(nommuResult.compatible, false);
  assert.match(nommuResult.blocker!, /Microcontrollers/);

  const gpsd = getNavigationApp('gpsd')!;
  const nommuGpsd = checkNavigationAppCompatibility(gpsd, { architecture: 'nommu' });
  assert.equal(nommuGpsd.compatible, true);

  const opencpn = getNavigationApp('opencpn')!;
  const ramResult = checkNavigationAppCompatibility(opencpn, { architecture: 'x86_64', maxRamMb: 128 });
  assert.equal(ramResult.compatible, true);
  assert.ok(ramResult.warnings.length > 0);
  assert.match(ramResult.warnings[0], /Exceeds your 128 MB budget/);
});

test('Navigation Apps: generateBootstrapNavigationScript outputs GPSd and Navit configuration', () => {
  const emptyScript = generateBootstrapNavigationScript([], {});
  assert.match(emptyScript, /No navigation apps selected/);

  const script = generateBootstrapNavigationScript(['navit', 'gpsd', 'mkgmap'], { architecture: 'x86_64' });
  assert.match(script, /gpsd/);
  assert.match(script, /fetch-osm-map/);
  assert.match(script, /navit\.xml/);
  assert.match(script, /compile-garmin-osm/);
});

test('Recipe Generator: debootstrap bundles bootstrap-navigation.sh when navigationApps are selected', () => {
  const recipe = generateDebootstrapRecipe({
    architecture: 'x86_64',
    navigationApps: ['navit', 'gpsd']
  });
  const file = recipe.files.find((f) => f.filename === 'bootstrap-navigation.sh');
  assert.ok(file, 'bootstrap-navigation.sh file was not bundled');
  assert.equal(file.executable, true);
  assert.ok(recipe.quickstartCommands.some((c) => c.includes('bootstrap-navigation.sh')));
});

test('Recipe Generator: debootstrap configures custom filesystem, kernel flavor, and bootloader', () => {
  const recipe = generateDebootstrapRecipe({
    architecture: 'x86_64',
    fileSystem: 'btrfs',
    kernelFlavor: 'realtime-rt',
    bootloader: 'systemd-boot',
    securityProfile: 'selinux',
    networkingStack: 'nftables-pf'
  });
  const makefile = recipe.files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(makefile, /ROOT_FS\s+\?=\s+btrfs/);
  assert.match(makefile, /KERNEL_FLAVOR\s+\?=\s+realtime-rt/);
  assert.match(makefile, /BOOTLOADER\s+\?=\s+systemd-boot/);
  assert.match(makefile, /btrfs-progs/);
  assert.match(makefile, /linux-image-rt-amd64/);
  assert.match(makefile, /selinux-basics/);
  assert.match(makefile, /nftables/);
});

test('Recipe Generator: cloud-init formats virtual disk using specified filesystem', () => {
  const recipe = generateCloudInitRecipe({
    architecture: 'x86_64',
    fileSystem: 'btrfs'
  });
  const makefile = recipe.files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(makefile, /virt-make-fs --partition=mbr --type=btrfs/);
});

test('Recipe Generator: nixos configures custom kernel, filesystem, and bootloader', () => {
  const recipe = generateNixosRecipe({
    architecture: 'x86_64',
    fileSystem: 'zfs',
    kernelFlavor: 'zen-liquorix',
    bootloader: 'grub-hybrid',
    networkingStack: 'systemd-networkd'
  });
  const config = recipe.files.find((f) => f.filename === 'configuration.nix')?.content ?? '';
  assert.match(config, /boot\.kernelPackages = pkgs\.linuxPackages_zen;/);
  assert.match(config, /boot\.supportedFilesystems = \[ "zfs" \];/);
  assert.match(config, /boot\.loader\.grub\.enable = true;/);
  assert.match(config, /networking\.useNetworkd = true;/);
});

test('Recipe Generator: debootstrap wires firmware mode, Secure Boot, and TPM into packages and Makefile', () => {
  const file = (c: UserCriteria) =>
    generateDebootstrapRecipe({ architecture: 'x86_64', ...c }).files.find((f) => f.filename === 'Makefile')?.content ?? '';

  const bios = file({ firmwareMode: 'legacy-bios' });
  assert.match(bios, /FIRMWARE_MODE\s+\?=\s+legacy-bios/);
  assert.match(bios, /grub-pc-bin/);
  assert.doesNotMatch(bios, /grub-efi-amd64-bin/);

  const signed = file({ firmwareMode: 'uefi', secureBoot: 'required' });
  assert.match(signed, /shim-signed grub-efi-amd64-signed/);
  assert.doesNotMatch(signed, /grub-pc-bin \\/);

  const ownKeys = file({ secureBoot: 'own-keys', tpmUsage: 'disk-unlock' });
  assert.match(ownKeys, /sign-boot:/);
  assert.match(ownKeys, /sbsigntool/);
  assert.match(ownKeys, /clevis-tpm2/);

  const defaults = file({});
  assert.match(defaults, /SECURE_BOOT\s+\?=\s+off/);
  assert.match(defaults, /TPM_USAGE\s+\?=\s+off/);
  assert.doesNotMatch(defaults, /sign-boot:/);
});

test('Recipe Generator: nixos enables lanzaboote Secure Boot, TPM, and legacy BIOS GRUB', () => {
  const find = (c: UserCriteria, name: string) =>
    generateNixosRecipe({ architecture: 'x86_64', ...c }).files.find((f) => f.filename === name)?.content ?? '';

  const flake = find({ secureBoot: 'own-keys' }, 'flake.nix');
  const config = find({ secureBoot: 'own-keys', tpmUsage: 'disk-unlock' }, 'configuration.nix');
  assert.match(flake, /lanzaboote/);
  assert.match(config, /boot\.lanzaboote/);
  assert.match(config, /security\.tpm2\.enable = true;/);
  assert.match(config, /boot\.initrd\.systemd\.enable = true;/);

  const bios = find({ firmwareMode: 'legacy-bios' }, 'configuration.nix');
  assert.match(bios, /grub\.efiSupport = false;/);
  assert.doesNotMatch(find({}, 'flake.nix'), /lanzaboote/);
});

test('Recipe Generator: cloud-init, buildroot, and alpine honor firmware and TPM options', () => {
  const ci = generateCloudInitRecipe({ firmwareMode: 'uefi', secureBoot: 'required', tpmUsage: 'measured-boot' })
    .files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(ci, /--partition=gpt/);
  assert.match(ci, /OVMF_CODE_4M\.secboot\.fd/);
  assert.match(ci, /tpm-tis/);

  const br = generateBuildrootRecipe({ architecture: 'x86_64', firmwareMode: 'legacy-bios', tpmUsage: 'measured-boot' })
    .files.find((f) => f.filename === 'distro.defconfig')?.content ?? '';
  assert.match(br, /BR2_TARGET_GRUB2_I386_PC=y/);
  assert.match(br, /BR2_PACKAGE_TPM2_TOOLS=y/);

  const al = generateAlpineRecipe({ tpmUsage: 'disk-unlock', secureBoot: 'own-keys' })
    .files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(al, /tpm2-tools sbsigntool efitools/);
});

test('Recipe Generator: makefiles expose overridable OS installer parameters (hostname, timezone, locale, keymap, swap)', () => {
  const debRecipe = generateDebootstrapRecipe({ architecture: 'x86_64' });
  const debMakefile = debRecipe.files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(debMakefile, /HOSTNAME\s+\?=/);
  assert.match(debMakefile, /TIMEZONE\s+\?=\s+UTC/);
  assert.match(debMakefile, /LOCALE\s+\?=\s+en_US\.UTF-8/);
  assert.match(debMakefile, /KEYMAP\s+\?=\s+us/);
  assert.match(debMakefile, /SWAP_SIZE_MB\s+\?=\s+0/);
  assert.match(debMakefile, /echo '\$\(HOSTNAME\)' > \/etc\/hostname/);
  assert.match(debMakefile, /ln -sf \/usr\/share\/zoneinfo\/\$\(TIMEZONE\) \/etc\/localtime/);
  assert.match(debMakefile, /fallocate -l \$\(SWAP_SIZE_MB\)M/);

  const alpineRecipe = generateAlpineRecipe({ architecture: 'x86_64' });
  const alpineMakefile = alpineRecipe.files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(alpineMakefile, /HOSTNAME\s+\?=/);
  assert.match(alpineMakefile, /TIMEZONE\s+\?=\s+UTC/);
  assert.match(alpineMakefile, /KEYMAP\s+\?=\s+us/);
  assert.match(alpineMakefile, /setup-timezone|\/usr\/share\/zoneinfo\/\$\(TIMEZONE\)/);

  const cloudRecipe = generateCloudInitRecipe({ architecture: 'x86_64' });
  const cloudMakefile = cloudRecipe.files.find((f) => f.filename === 'Makefile')?.content ?? '';
  const userData = cloudRecipe.files.find((f) => f.filename === 'user-data')?.content ?? '';
  assert.match(cloudMakefile, /HOSTNAME\s+\?=/);
  assert.match(cloudMakefile, /ADMIN_USER\s+\?=\s+tailor/);
  assert.match(cloudMakefile, /TIMEZONE\s+\?=\s+UTC/);
  assert.match(cloudMakefile, /LOCALE\s+\?=\s+en_US\.UTF-8/);
  assert.match(userData, /hostname: __HOSTNAME__/);
  assert.match(userData, /timezone: __TIMEZONE__/);
  assert.match(userData, /locale: __LOCALE__/);
});

test('Recipe Generator: debootstrap wires KVM/Xen host packages and VFIO passthrough', () => {
  const mk = (c: UserCriteria) =>
    generateDebootstrapRecipe({ architecture: 'x86_64', ...c }).files.find((f) => f.filename === 'Makefile')?.content ?? '';

  const kvm = mk({ virtHost: 'kvm-qemu', devicePassthrough: 'gpu-vfio' });
  assert.match(kvm, /VIRT_HOST\s+\?=\s+kvm-qemu/);
  assert.match(kvm, /qemu-system-x86 qemu-utils libvirt-daemon-system/);
  assert.match(kvm, /DEVICE_PASSTHROUGH\s+\?=\s+gpu-vfio/);
  assert.match(kvm, /intel_iommu=on amd_iommu=on iommu=pt/);
  assert.match(kvm, /vfio_pci/);
  assert.match(kvm, /VFIO_IDS\s+\?=/);

  assert.match(mk({ virtHost: 'xen' }), /xen-system-amd64/);
  assert.match(mk({ virtHost: 'bhyve' }), /bhyve is a FreeBSD/);

  const plain = mk({});
  assert.match(plain, /VIRT_HOST\s+\?=\s+none/);
  assert.doesNotMatch(plain, /libvirt/);
  assert.doesNotMatch(plain, /vfio_pci/);
});

test('Recipe Generator: nixos enables libvirt/Xen and VFIO, with a single extraGroups list', () => {
  const cfg = (c: UserCriteria) =>
    generateNixosRecipe({ architecture: 'x86_64', ...c }).files.find((f) => f.filename === 'configuration.nix')?.content ?? '';
  const kvm = cfg({ virtHost: 'kvm-qemu', devicePassthrough: 'pci-devices', dockerApp: 'jellyfin' });
  assert.match(kvm, /virtualisation\.libvirtd\.enable = true;/);
  assert.match(kvm, /boot\.kernelModules = \[ "vfio" "vfio_iommu_type1" "vfio_pci" \];/);
  assert.match(kvm, /extraGroups = \[ "wheel" "networkmanager" "docker" "libvirtd" \];/);
  assert.equal((kvm.match(/extraGroups/g) ?? []).length, 1);
  assert.match(cfg({ virtHost: 'xen' }), /virtualisation\.xen\.enable = true;/);
});

test('Recipe Generator: cloud-init installs the guest agent for the chosen hypervisor', () => {
  const files = (g?: UserCriteria['guestPlatform']) => generateCloudInitRecipe({ guestPlatform: g }).files;
  const userData = (g?: UserCriteria['guestPlatform']) => files(g).find((f) => f.filename === 'user-data')?.content ?? '';
  const makefile = (g?: UserCriteria['guestPlatform']) => files(g).find((f) => f.filename === 'Makefile')?.content ?? '';

  assert.match(userData(), /- qemu-guest-agent/);
  assert.match(makefile(), /GUEST_PLATFORM\s+\?=\s+kvm/);
  assert.match(userData('vmware'), /- open-vm-tools/);
  assert.match(makefile('vmware'), /\topen-vm-tools \\/);
  assert.doesNotMatch(makefile('vmware'), /\tqemu-guest-agent \\/);
  assert.match(userData('hyperv'), /systemctl enable --now hv-kvp-daemon/);
  assert.match(userData('virtualbox'), /VBoxGuestAdditions\.iso/);
});

test('Recipe Generator: capability warnings flag unsupported options and architecture mismatches', () => {
  const wsl = resolveRecipeGenerator('wsl2-debian', {
    architecture: 'x86_64',
    secureBoot: 'required',
    fileSystem: 'zfs'
  });
  assert.ok(wsl.warnings && wsl.warnings.length >= 2);
  assert.ok(wsl.warnings.some((w) => w.includes('Secure Boot')));
  assert.ok(wsl.warnings.some((w) => w.includes('Filesystem')));

  const debArm = resolveRecipeGenerator('debootstrap-debian', {
    architecture: 'arm64',
    firmwareMode: 'legacy-bios'
  });
  assert.ok(debArm.warnings?.some((w) => w.includes('Legacy BIOS boot is not supported on ARM64')));

  const ciVbox = resolveRecipeGenerator('cloud-init-qcow2', {
    architecture: 'x86_64',
    guestPlatform: 'virtualbox'
  });
  assert.ok(ciVbox.warnings?.some((w) => w.includes('virtualbox-guest-utils')));
});

test('Recipe Generator: alpine and buildroot wire expert kernel, filesystem, virt, and networking options', () => {
  const alpineMk =
    generateAlpineRecipe({
      architecture: 'x86_64',
      kernelFlavor: 'lts-stable',
      fileSystem: 'btrfs',
      virtHost: 'kvm-qemu',
      networkingStack: 'nftables-pf',
      bootloader: 'efistub',
      devicePassthrough: 'gpu-vfio'
    }).files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(alpineMk, /linux-lts/);
  assert.match(alpineMk, /btrfs-progs/);
  assert.match(alpineMk, /qemu-system-x86_64 libvirt bridge-utils ovmf/);
  assert.match(alpineMk, /nftables/);
  assert.match(alpineMk, /efibootmgr/);
  assert.match(alpineMk, /vfio_pci/);

  const brDef =
    generateBuildrootRecipe({
      architecture: 'arm64',
      fileSystem: 'f2fs',
      bootloader: 'u-boot',
      networkingStack: 'nftables-pf',
      virtHost: 'kvm-qemu'
    }).files.find((f) => f.filename === 'distro.defconfig')?.content ?? '';
  assert.match(brDef, /BR2_TARGET_ROOTFS_F2FS=y/);
  assert.match(brDef, /BR2_TARGET_UBOOT=y/);
  assert.match(brDef, /BR2_PACKAGE_NFTABLES=y/);
  assert.match(brDef, /BR2_PACKAGE_QEMU_SYSTEM=y/);
});

test('Recipe Generator: arm64 uses arm64 Debian packages instead of amd64 or x86 BIOS packages', () => {
  const debArmMk =
    generateDebootstrapRecipe({ architecture: 'arm64' }).files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(debArmMk, /grub-efi-arm64-bin/);
  assert.doesNotMatch(debArmMk, /grub-pc-bin/);

  const ciArmMk =
    generateCloudInitRecipe({ architecture: 'arm64' }).files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(ciArmMk, /ARCH\s+:=\s+arm64/);
  assert.match(ciArmMk, /linux-image-cloud-arm64/);
  assert.doesNotMatch(ciArmMk, /linux-image-cloud-amd64/);
});

test('Recipe Generator: Makefiles include docker-build and qemu-user-static cross-arch support', () => {
  const debArm =
    generateDebootstrapRecipe({ architecture: 'arm64' }).files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(debArm, /qemu-\$\(TARGET_UNAME_ARCH\)-static/);
  assert.match(debArm, /--foreign/);
  assert.match(debArm, /--second-stage/);
  assert.match(debArm, /docker-build:/);
  assert.match(debArm, /--platform linux\/arm64/);

  const alpineArm =
    generateAlpineRecipe({ architecture: 'arm64' }).files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(alpineArm, /qemu-\$\(ARCH\)-static/);
  assert.match(alpineArm, /docker-build:/);
  assert.match(alpineArm, /--platform linux\/arm64/);

  const cloudArm =
    generateCloudInitRecipe({ architecture: 'arm64' }).files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(cloudArm, /qemu-\$\(TARGET_UNAME_ARCH\)-static/);
  assert.match(cloudArm, /docker-build:/);

  const br =
    generateBuildrootRecipe({ architecture: 'arm64' }).files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(br, /docker-build:/);
  assert.match(br, /--platform linux\/amd64/);

  const debArmRecipe = generateDebootstrapRecipe({ architecture: 'arm64' });
  const debArmReadme = debArmRecipe.files.find((f) => f.filename === 'README.md')?.content ?? '';
  assert.match(debArmReadme, /make docker-build/);
  assert.match(debArmReadme, /qemu-system-aarch64/);
  assert.ok(debArmRecipe.quickstartCommands.some((c) => c.includes('make docker-build')));
  assert.ok(debArmRecipe.quickstartCommands.some((c) => c.includes('qemu-system-aarch64')));
  assert.doesNotMatch(debArm, /\\\\$/m, 'Makefile must not emit double-backslash line continuations');
});

test('nixos-flake configuration.nix defines a default root fileSystems."/" entry', () => {
  const recipe = resolveRecipeGenerator('nixos-flake', { architecture: 'x86_64' });
  const config = recipe.files.find((f) => f.filename === 'configuration.nix')?.content ?? '';
  assert.match(config, /fileSystems\."\/"\s*=\s*lib\.mkDefault/);
  assert.match(config, /fsType\s*=\s*"ext4"/);
  assert.match(config, /nixpkgs\.config\.allowUnfree = true;/);

  const flossRecipe = resolveRecipeGenerator('nixos-flake', {
    architecture: 'x86_64',
    driverPhilosophy: 'free-software-only'
  });
  const flossConfig = flossRecipe.files.find((f) => f.filename === 'configuration.nix')?.content ?? '';
  assert.doesNotMatch(flossConfig, /allowUnfree = true/);

  const zfsRecipe = resolveRecipeGenerator('nixos-flake', { architecture: 'x86_64', fileSystem: 'zfs' });
  const zfsConfig = zfsRecipe.files.find((f) => f.filename === 'configuration.nix')?.content ?? '';
  assert.match(zfsConfig, /fsType\s*=\s*"zfs"/);
});

test('developer toolchains (golang, ruby, rust, dotnet, java, php) are wired into bootstrap-apps.sh and nixos-flake', () => {
  const langs = ['golang', 'ruby', 'rust', 'dotnet', 'java', 'php'] as const;
  const deb = resolveRecipeGenerator('debootstrap-debian', {
    architecture: 'x86_64',
    desktopApps: [...langs]
  });
  const bootstrap = deb.files.find((f) => f.filename === 'bootstrap-apps.sh')?.content ?? '';
  assert.match(bootstrap, /golang-go/);
  assert.match(bootstrap, /ruby-full/);
  assert.match(bootstrap, /rustc/);
  assert.match(bootstrap, /default-jdk/);
  assert.match(bootstrap, /composer/);
  assert.match(bootstrap, /dotnet-install\.sh/);

  const nix = resolveRecipeGenerator('nixos-flake', {
    architecture: 'x86_64',
    desktopApps: [...langs]
  });
  const nixConfig = nix.files.find((f) => f.filename === 'configuration.nix')?.content ?? '';
  for (const pkg of ['pkgs.go', 'pkgs.ruby', 'pkgs.rustc', 'pkgs.dotnet-sdk_8', 'pkgs.jdk', 'pkgs.php']) {
    assert.ok(nixConfig.includes(pkg), `Expected ${pkg} in NixOS configuration.nix`);
  }
});

test('non-gaming compatibility and system emulators (wine, bottles, qemu-user, qemu-system) wire into bootstrap-emulators.sh', () => {
  const deb = resolveRecipeGenerator('debootstrap-debian', {
    architecture: 'x86_64',
    emulatorApps: ['wine', 'bottles', 'qemu-user', 'qemu-system']
  });
  const script = deb.files.find((f) => f.filename === 'bootstrap-emulators.sh')?.content ?? '';
  assert.match(script, /wine/);
  assert.match(script, /com\.usebottles\.bottles/);
  assert.match(script, /qemu-user-static/);
  assert.match(script, /qemu-system-x86/);
});

test('rpcs3, waydroid, and box64 wire into bootstrap-emulators.sh with architecture/DE checks', () => {
  const armDeb = resolveRecipeGenerator('debootstrap-debian', {
    architecture: 'arm64',
    emulatorApps: ['waydroid', 'box64']
  });
  const armScript = armDeb.files.find((f) => f.filename === 'bootstrap-emulators.sh')?.content ?? '';
  assert.match(armScript, /repo\.waydro\.id/);
  assert.match(armScript, /box64-generic-arm/);

  const x64Deb = resolveRecipeGenerator('debootstrap-debian', {
    architecture: 'x86_64',
    emulatorApps: ['rpcs3']
  });
  const x64Script = x64Deb.files.find((f) => f.filename === 'bootstrap-emulators.sh')?.content ?? '';
  assert.match(x64Script, /net\.rpcs3\.RPCS3/);
});

test('1-click homelab services (vaultwarden, gitea, nginx-proxy-manager, portainer) and game clients wire into recipes', () => {
  for (const serviceId of ['vaultwarden', 'gitea', 'nginx-proxy-manager', 'portainer'] as const) {
    const recipe = resolveRecipeGenerator('cloud-init-qcow2', {
      architecture: 'x86_64',
      dockerApp: serviceId
    });
    const compose = recipe.files.find((f) => f.filename === 'docker-compose.yml')?.content ?? '';
    assert.ok(compose.includes('services:'), `${serviceId}: expected docker-compose.yml`);
  }

  const deb = resolveRecipeGenerator('debootstrap-debian', {
    architecture: 'x86_64',
    desktopApps: ['steam', 'heroic', 'lutris', 'prism-launcher']
  });
  const bootstrap = deb.files.find((f) => f.filename === 'bootstrap-apps.sh')?.content ?? '';
  assert.match(bootstrap, /com\.valvesoftware\.Steam/);
  assert.match(bootstrap, /com\.heroicgameslauncher\.hgl/);
  assert.match(bootstrap, /net\.lutris\.Lutris/);
  assert.match(bootstrap, /org\.prismlauncher\.PrismLauncher/);
});

test('modern 1-click services (ghost, wikijs, comfyui, paperless-ngx, n8n) generate compose files and GPU warnings', () => {
  for (const serviceId of ['ghost', 'wikijs', 'comfyui', 'paperless-ngx', 'n8n'] as const) {
    const recipe = resolveRecipeGenerator('cloud-init-qcow2', {
      architecture: 'x86_64',
      dockerApp: serviceId
    });
    const compose = recipe.files.find((f) => f.filename === 'docker-compose.yml')?.content ?? '';
    assert.ok(compose.includes('services:'), `${serviceId}: expected docker-compose.yml`);
  }

  const comfyCompat = checkDockerAppCompatibility(getDockerApp('comfyui')!, {
    architecture: 'x86_64',
    maxRamMb: 16384,
    driverPhilosophy: 'free-software-only'
  });
  assert.ok(comfyCompat.warnings.some((w) => w.includes('NVIDIA')));
});

test('file sharing, Tor, IRC, and Usenet apps & services wire into recipes', () => {
  const deb = resolveRecipeGenerator('debootstrap-debian', {
    architecture: 'x86_64',
    desktopApps: ['tor-browser', 'onionshare', 'qbittorrent', 'weechat', 'halloy']
  });
  const bootstrap = deb.files.find((f) => f.filename === 'bootstrap-apps.sh')?.content ?? '';
  assert.match(bootstrap, /org\.torproject\.torbrowser-launcher/);
  assert.match(bootstrap, /org\.onionshare\.OnionShare/);
  assert.match(bootstrap, /qbittorrent/);
  assert.match(bootstrap, /weechat/);
  assert.match(bootstrap, /org\.squidowl\.halloy/);

  for (const serviceId of ['filebrowser', 'thelounge', 'sabnzbd', 'frigate'] as const) {
    const recipe = resolveRecipeGenerator('cloud-init-qcow2', {
      architecture: 'x86_64',
      dockerApp: serviceId
    });
    const compose = recipe.files.find((f) => f.filename === 'docker-compose.yml')?.content ?? '';
    assert.ok(compose.includes('services:'), `${serviceId}: expected docker-compose.yml`);
  }

  const emu = resolveRecipeGenerator('debootstrap-debian', {
    architecture: 'x86_64',
    emulatorApps: ['mednafen', 'mgba', 'flycast']
  });
  const emuScript = emu.files.find((f) => f.filename === 'bootstrap-emulators.sh')?.content ?? '';
  assert.match(emuScript, /mednafen/);
  assert.match(emuScript, /io\.mgba\.mGBA/);
  assert.match(emuScript, /org\.flycast\.Flycast/);
});

test('multi-stack dockerApps generates isolated per-stack stacks/<id>/docker-compose.yml files', () => {
  const multi = resolveRecipeGenerator('cloud-init-qcow2', {
    architecture: 'x86_64',
    dockerApps: ['immich', 'jellyfin', 'vaultwarden']
  });
  const filenames = multi.files.map((f) => f.filename);
  assert.ok(filenames.includes('stacks/immich/docker-compose.yml'));
  assert.ok(filenames.includes('stacks/jellyfin/docker-compose.yml'));
  assert.ok(filenames.includes('stacks/vaultwarden/docker-compose.yml'));
  assert.ok(!filenames.includes('docker-compose.yml'));
  assert.ok(multi.quickstartCommands.some((c) => c.includes('stacks/immich/docker-compose.yml')));
});

test('multi-stack dockerApps auto-adjusts colliding host ports across stacks', () => {
  const clash = resolveRecipeGenerator('cloud-init-qcow2', {
    architecture: 'x86_64',
    dockerApps: ['vaultwarden', 'filebrowser', 'sabnzbd']
  });
  const vw = clash.files.find((f) => f.filename === 'stacks/vaultwarden/docker-compose.yml')?.content ?? '';
  const fb = clash.files.find((f) => f.filename === 'stacks/filebrowser/docker-compose.yml')?.content ?? '';
  const sab = clash.files.find((f) => f.filename === 'stacks/sabnzbd/docker-compose.yml')?.content ?? '';
  assert.match(vw, /"8080:80"/);
  assert.match(fb, /"8081:80"/);
  assert.match(sab, /"8082:8080"/);
  assert.ok(clash.quickstartCommands.some((c) => c.includes('8081')));
  assert.ok(clash.quickstartCommands.some((c) => c.includes('8082')));
});

test('counterpart services (gitlab-ce, bookstack, navidrome, adguard-home, dockge, caddy) and kodi wire into recipes', () => {
  for (const serviceId of [
    'gitlab-ce',
    'bookstack',
    'navidrome',
    'adguard-home',
    'dockge',
    'caddy',
    'lychee',
    'meilisearch',
    'opensearch',
    'searxng',
    'prowlarr',
    'nzbhydra2'
  ] as const) {
    const recipe = resolveRecipeGenerator('cloud-init-qcow2', {
      architecture: 'x86_64',
      dockerApp: serviceId
    });
    const compose = recipe.files.find((f) => f.filename === 'docker-compose.yml')?.content ?? '';
    assert.ok(compose.includes('services:'), `${serviceId}: expected docker-compose.yml`);
  }

  const deb = resolveRecipeGenerator('debootstrap-debian', {
    architecture: 'x86_64',
    desktopApps: ['kodi']
  });
  const bootstrap = deb.files.find((f) => f.filename === 'bootstrap-apps.sh')?.content ?? '';
  assert.match(bootstrap, /kodi/);
});

test('media creative apps (handbrake, kdenlive, inkscape, krita, darktable, gthumb, audacity, ardour) wire into recipes', () => {
  const mediaApps = ['handbrake', 'kdenlive', 'inkscape', 'krita', 'darktable', 'gthumb', 'audacity', 'ardour'] as const;
  const deb = resolveRecipeGenerator('debootstrap-debian', {
    architecture: 'x86_64',
    desktopApps: [...mediaApps]
  });
  const bootstrap = deb.files.find((f) => f.filename === 'bootstrap-apps.sh')?.content ?? '';
  assert.match(bootstrap, /inkscape/);
  assert.match(bootstrap, /gthumb/);
  assert.match(bootstrap, /fr\.handbrake\.ghb/);
  assert.match(bootstrap, /org\.kde\.kdenlive/);
  assert.match(bootstrap, /org\.kde\.krita/);
  assert.match(bootstrap, /org\.darktable\.Darktable/);
  assert.match(bootstrap, /org\.audacityteam\.Audacity/);
  assert.match(bootstrap, /org\.ardour\.Ardour/);
});

test('Recipe Generator fedora-dnf: bootstraps Fedora RPM rootfs with DNF, SELinux, and Docker build support', () => {
  const fed = resolveRecipeGenerator('fedora-dnf', {
    architecture: 'x86_64',
    fileSystem: 'btrfs',
    securityProfile: 'selinux',
    dockerApps: ['pihole']
  });
  const makefile = fed.files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(makefile, /dnf --installroot=/);
  assert.match(makefile, /btrfs-progs/);
  assert.match(makefile, /SELINUX=enforcing/);
  assert.match(makefile, /fedora:41/);
  assert.ok(fed.files.some((f) => f.filename === 'docker-compose.yml'));
});

test('Recipe Generator opensuse-zypper: bootstraps openSUSE Tumbleweed rootfs with Zypper, Snapper, and Docker build support', () => {
  const suse = resolveRecipeGenerator('opensuse-zypper', {
    architecture: 'x86_64',
    fileSystem: 'btrfs',
    dockerApps: ['pihole']
  });
  const makefile = suse.files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(makefile, /zypper --root/);
  assert.match(makefile, /btrfsprogs snapper/);
  assert.match(makefile, /opensuse\/tumbleweed:latest/);
  assert.ok(suse.files.some((f) => f.filename === 'docker-compose.yml'));
});

test('Recipe Generator void-xbps: bootstraps Void Linux rootfs with XBPS, runit, musl support, and Docker build support', () => {
  const voidMusl = resolveRecipeGenerator('void-xbps', {
    architecture: 'x86_64',
    cLibPreference: 'musl',
    dockerApps: ['pihole']
  });
  const makefile = voidMusl.files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(makefile, /xbps-install/);
  assert.match(makefile, /runsvdir\/default/);
  assert.match(makefile, /current\/musl/);
  assert.match(makefile, /void-musl:latest/);
  assert.ok(voidMusl.files.some((f) => f.filename === 'docker-compose.yml'));
});

test('Recipe Generator arch-pacstrap: bootstraps Arch Linux rootfs with pacstrap, hardened kernel, and Docker build support', () => {
  const archRecipe = resolveRecipeGenerator('arch-pacstrap', {
    architecture: 'x86_64',
    kernelFlavor: 'hardened',
    fileSystem: 'btrfs',
    dockerApps: ['pihole']
  });
  const makefile = archRecipe.files.find((f) => f.filename === 'Makefile')?.content ?? '';
  assert.match(makefile, /pacstrap -K/);
  assert.match(makefile, /linux-hardened/);
  assert.match(makefile, /archlinux:latest/);
  assert.ok(archRecipe.files.some((f) => f.filename === 'docker-compose.yml'));
});

test('Recipe Generator gentoo-portage: generates Portage make.conf, OpenRC/systemd emerge Makefile, and Docker build support', () => {
  const gentooRecipe = resolveRecipeGenerator('gentoo-portage', {
    architecture: 'x86_64',
    initPreference: 'openrc',
    dockerApps: ['pihole']
  });
  const makefile = gentooRecipe.files.find((f) => f.filename === 'Makefile')?.content ?? '';
  const makeConf = gentooRecipe.files.find((f) => f.filename === 'make.conf')?.content ?? '';
  assert.match(makefile, /emerge --root=/);
  assert.match(makefile, /gentoo\/stage3:latest/);
  assert.match(makeConf, /-systemd openrc/);
  assert.ok(gentooRecipe.files.some((f) => f.filename === 'docker-compose.yml'));
});

test('Recipe Generator freebsd-pkg & openbsd-pkg: generate native pkg, sysrc/rcctl, and PF firewall files', () => {
  const fbsd = resolveRecipeGenerator('freebsd-pkg', {
    architecture: 'x86_64',
    fileSystem: 'zfs',
    virtHost: 'container-only',
    dockerApps: ['pihole']
  });
  const fbsdScript = fbsd.files.find((f) => f.filename === 'bootstrap-freebsd.sh')?.content ?? '';
  assert.match(fbsdScript, /pkg install -y/);
  assert.match(fbsdScript, /sysrc zfs_enable="YES"/);
  assert.match(fbsdScript, /sysrc bastille_enable="YES"/);
  assert.ok(fbsd.files.some((f) => f.filename === 'pf.conf'));

  const obsd = resolveRecipeGenerator('openbsd-pkg', {
    architecture: 'x86_64',
    desktopApps: ['neovim']
  });
  const obsdScript = obsd.files.find((f) => f.filename === 'bootstrap-openbsd.sh')?.content ?? '';
  assert.match(obsdScript, /pkg_add -I/);
  assert.match(obsdScript, /rcctl enable sshd/);
  assert.ok(obsd.files.some((f) => f.filename === 'pf.conf'));
});
