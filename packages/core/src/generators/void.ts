import { GeneratedRecipe, UserCriteria } from '../types.js';
import { CREDENTIAL_MAKE_VARS, credentialSetupSteps } from './credentials.js';
import { dockerBuildTarget } from './cross-build.js';
import { generateDockerStackFiles, getSelectedDockerApps } from './docker-apps.js';
import { generateBootstrapAppsScript } from './desktop-apps.js';
import { generateBootstrapEmulatorsScript } from './emulator-apps.js';
import { generateBootstrapNavigationScript } from './navigation-apps.js';

export function generateVoidRecipe(criteria: UserCriteria): GeneratedRecipe {
  const isMusl = criteria.cLibPreference === 'musl';
  const arch =
    criteria.architecture === 'arm64'
      ? isMusl
        ? 'aarch64-musl'
        : 'aarch64'
      : criteria.architecture === 'armv7'
        ? isMusl
          ? 'armv7l-musl'
          : 'armv7l'
        : isMusl
          ? 'x86_64-musl'
          : 'x86_64';
  const dockerPlatform = criteria.architecture === 'arm64' ? 'linux/arm64' : 'linux/amd64';
  const repoUrl = isMusl
    ? 'https://repo-default.voidlinux.org/current/musl'
    : 'https://repo-default.voidlinux.org/current';
  const distroName = 'TailoredVoid';

  const dockerApps = getSelectedDockerApps(criteria);
  const dockerAppDef = dockerApps[0];
  const dockerStack = generateDockerStackFiles(criteria);
  const desktopApps = criteria.desktopApps || [];
  const emulatorApps = criteria.emulatorApps || [];
  const navigationApps = criteria.navigationApps || [];
  const dockerApp = dockerApps.length > 0 ? dockerApps.map((a) => a.id).join('+') : 'none';

  const isGui = !!criteria.prefersGui;
  const desktopEnv = criteria.desktopEnv || (isGui ? 'xfce' : 'none');

  const dePkgs =
    desktopEnv === 'gnome'
      ? 'gnome gdm elogind'
      : desktopEnv === 'kde'
        ? 'kde5 sddm elogind'
        : desktopEnv === 'xfce'
          ? 'xfce4 lightdm elogind'
          : desktopEnv === 'cage'
            ? 'cage foot seatd'
            : '';

  const fsPkgs =
    criteria.fileSystem === 'btrfs'
      ? 'btrfs-progs'
      : criteria.fileSystem === 'xfs'
        ? 'xfsprogs'
        : criteria.fileSystem === 'f2fs'
          ? 'f2fs-tools'
          : criteria.fileSystem === 'ext4'
            ? 'e2fsprogs'
            : criteria.fileSystem === 'fat32'
              ? 'dosfstools'
              : '';

  const netPkgs =
    criteria.networkingStack === 'nftables-pf'
      ? 'nftables'
      : 'NetworkManager';

  const virtPkgs =
    criteria.virtHost === 'kvm-qemu'
      ? 'qemu libvirt'
      : criteria.virtHost === 'container-only'
        ? 'podman buildah'
        : '';

  const kernelPkg = criteria.kernelFlavor === 'lts-stable' ? 'linux-lts' : 'linux';

  const extraPkgs = [
    'base-system',
    kernelPkg,
    'openssh',
    'curl',
    'ca-certificates',
    fsPkgs,
    netPkgs,
    virtPkgs,
    dePkgs,
    criteria.enableFlatpak ? 'flatpak' : '',
    criteria.enableDistrobox ? 'distrobox podman' : '',
    criteria.tpmUsage ? 'tpm2-tools' : '',
    criteria.secureBoot === 'own-keys' ? 'sbsigntool efitools' : '',
    dockerApps.length > 0 ? 'podman docker-compose' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const grubPkg = arch.startsWith('aarch64')
    ? 'grub-arm64-efi'
    : 'grub-i386-efi grub-x86_64-efi grub';
  const dockerInstallCmd = `xbps-install -Suy xbps && xbps-install -Sy make squashfs-tools xorriso ${grubPkg} dosfstools`;
  const dockerImage = isMusl
    ? 'ghcr.io/void-linux/void-musl:latest'
    : 'ghcr.io/void-linux/void-glibc:latest';

  const iommuArg =
    criteria.devicePassthrough === 'gpu-vfio' || criteria.devicePassthrough === 'pci-devices'
      ? arch.startsWith('aarch64')
        ? 'iommu.passthrough=1'
        : 'intel_iommu=on amd_iommu=on iommu=pt'
      : '';

  const makefileContent = `# DistroTailor Automated Void Linux Build Recipe (XBPS + runit)
# Architecture: ${arch} | C Library: ${isMusl ? 'musl' : 'glibc'} | Init: runit

XBPS_ARCH   ?= ${arch}
DISTRO_NAME ?= ${distroName}
REPO_URL    ?= ${repoUrl}
${CREDENTIAL_MAKE_VARS}
BUILD_DIR   ?= ./build
ROOTFS_DIR  := $(BUILD_DIR)/rootfs
ISO_DIR     := $(BUILD_DIR)/iso
OUTPUT_DIR  ?= ./output
ISO_NAME    := $(DISTRO_NAME)-$(XBPS_ARCH).iso
TARBALL_NAME := $(DISTRO_NAME)-$(XBPS_ARCH)-rootfs.tar.gz

DOCKER_APP  ?= ${dockerApp}

.PHONY: all rootfs configure iso tarball docker-build clean app-up app-down

all: iso

rootfs:
\t@mkdir -p $(ROOTFS_DIR)/var/db/xbps/keys $(OUTPUT_DIR)
\t@echo "[+] Bootstrapping Void Linux ($(XBPS_ARCH)) via xbps-install..."
\tcp /var/db/xbps/keys/*.plist $(ROOTFS_DIR)/var/db/xbps/keys/ 2>/dev/null || true
\tXBPS_ARCH=$(XBPS_ARCH) xbps-install -Sy -r $(abspath $(ROOTFS_DIR)) -R $(REPO_URL) ${extraPkgs}

configure: rootfs
\t@echo "[+] Configuring hostname, user, and runit services..."
\techo "$(DISTRO_NAME)" > $(ROOTFS_DIR)/etc/hostname
${credentialSetupSteps({ rootfs: '$(ROOTFS_DIR)', user: 'root', home: '/root', sudo: '', expire: true })}
\tmkdir -p $(ROOTFS_DIR)/etc/runit/runsvdir/default
\tln -sf /etc/sv/sshd $(ROOTFS_DIR)/etc/runit/runsvdir/default/sshd
\t@if [ -d $(ROOTFS_DIR)/etc/sv/NetworkManager ]; then ln -sf /etc/sv/NetworkManager $(ROOTFS_DIR)/etc/runit/runsvdir/default/NetworkManager; fi
\t@if [ -n "${iommuArg}" ]; then echo "# Kernel cmdline recommendation: ${iommuArg}" > $(ROOTFS_DIR)/etc/distro-tailor-iommu.conf; fi
\t@if [ '$(DOCKER_APP)' != 'none' ] && [ -f docker-compose.yml ]; then \\
\t\tmkdir -p $(ROOTFS_DIR)/opt/$(DOCKER_APP); \\
\t\tcp docker-compose.yml $(ROOTFS_DIR)/opt/$(DOCKER_APP)/; \\
\tfi

iso: configure
\t@echo "[+] Building SquashFS + bootable GRUB ISO..."
\t@mkdir -p $(ISO_DIR)/LiveOS $(ISO_DIR)/boot/grub
\tmksquashfs $(ROOTFS_DIR) $(ISO_DIR)/LiveOS/squashfs.img -noappend -comp xz
\t@cp $(ROOTFS_DIR)/boot/vmlinuz-* $(ISO_DIR)/boot/vmlinuz 2>/dev/null || true
\t@cp $(ROOTFS_DIR)/boot/initramfs-* $(ISO_DIR)/boot/initrd.img 2>/dev/null || true
\t@printf 'set timeout=3\\nset default=0\\nmenuentry "$(DISTRO_NAME) ($(XBPS_ARCH))" {\\n  linux /boot/vmlinuz root=live:CDLABEL=$(DISTRO_NAME) rd.live.image quiet ${iommuArg}\\n  initrd /boot/initrd.img\\n}\\n' > $(ISO_DIR)/boot/grub/grub.cfg
\tgrub-mkrescue -o $(OUTPUT_DIR)/$(ISO_NAME) $(ISO_DIR) -- -volid $(DISTRO_NAME)
\t@echo "[+] Built: $(OUTPUT_DIR)/$(ISO_NAME)"

tarball: configure
\t@echo "[+] Bundling rootfs tarball..."
\ttar -C $(ROOTFS_DIR) -czf $(OUTPUT_DIR)/$(TARBALL_NAME) .
\t@echo "[+] Built: $(OUTPUT_DIR)/$(TARBALL_NAME)"

${dockerBuildTarget({
  image: dockerImage,
  platform: dockerPlatform,
  installCmd: dockerInstallCmd
})}

app-up:
\t@if [ '$(DOCKER_APP)' = 'none' ]; then \\
\t\techo "[-] No turnkey Docker app selected."; \\
\telse \\
\t\tdocker compose -f docker-compose.yml up -d; \\
\tfi

app-down:
\t@docker compose -f docker-compose.yml down

clean:
\t@rm -rf $(BUILD_DIR)
`;

  const files: GeneratedRecipe['files'] = [
    {
      filename: 'Makefile',
      description: `Automated Void Linux (${isMusl ? 'musl' : 'glibc'}) XBPS rootfs build, runit service setup, and bootable ISO generator`,
      content: makefileContent
    }
  ];

  for (const stackFile of dockerStack.files) {
    files.push(stackFile);
  }

  if (desktopApps.length > 0) {
    files.push({
      filename: 'bootstrap-apps.sh',
      description: `1-Click automated unattended installer for ${desktopApps.length} desktop application(s)`,
      content: generateBootstrapAppsScript(desktopApps, criteria),
      executable: true
    });
  }

  if (emulatorApps.length > 0) {
    files.push({
      filename: 'bootstrap-emulators.sh',
      description: `Turnkey unattended installer for ${emulatorApps.length} gaming emulator(s) and gamepad udev rules`,
      content: generateBootstrapEmulatorsScript(emulatorApps, criteria),
      executable: true
    });
  }

  if (navigationApps.length > 0) {
    files.push({
      filename: 'bootstrap-navigation.sh',
      description: `Turnkey unattended installer for ${navigationApps.length} navigation tool(s), GPSd, and OpenStreetMap data`,
      content: generateBootstrapNavigationScript(navigationApps, criteria),
      executable: true
    });
  }

  const quickstartCommands = ['sudo make  # Void Linux host (or: make docker-build on macOS / Windows / Debian)'];
  if (desktopApps.length > 0) {
    quickstartCommands.push(`sudo bash bootstrap-apps.sh  # 1-Click install ${desktopApps.length} desktop app(s)`);
  }
  if (emulatorApps.length > 0) {
    quickstartCommands.push(`sudo bash bootstrap-emulators.sh  # 1-Click install ${emulatorApps.length} emulator(s) & controller setup`);
  }
  if (navigationApps.length > 0) {
    quickstartCommands.push(`sudo bash bootstrap-navigation.sh  # 1-Click install ${navigationApps.length} navigation tool(s) & GPSd setup`);
  }
  if (dockerStack.quickstartCommands.length > 0) {
    quickstartCommands.push(...dockerStack.quickstartCommands);
  } else if (desktopApps.length === 0 && emulatorApps.length === 0 && navigationApps.length === 0) {
    quickstartCommands.push(
      arch.startsWith('aarch64')
        ? `qemu-system-aarch64 -M virt -m 2048 -cdrom output/${distroName}-${arch}.iso`
        : `qemu-system-x86_64 -cdrom output/${distroName}-${arch}.iso -m 2048`
    );
  }

  return {
    id: 'void-xbps',
    title: dockerAppDef
      ? `Tailored Void Linux + ${dockerStack.summaryLabel} Appliance`
      : `Custom Minimal Void Linux (${isMusl ? 'musl' : 'glibc'} / runit) Appliance`,
    summary: dockerStack.summaryLabel
      ? `Bootstraps a clean Void Linux (${isMusl ? 'musl' : 'glibc'}) base via xbps-install with runit supervision and ${dockerStack.summaryLabel} container stack(s).`
      : `Bootstraps an independent Void Linux (${isMusl ? 'musl' : 'glibc'}) system via xbps-install with fast runit service supervision and bootable GRUB ISO.`,
    targetFormat: 'iso',
    estimatedBuildTimeMinutes: 4,
    hostDependencies: ['xbps-install', 'squashfs-tools', 'grub-mkrescue', 'xorriso'],
    files,
    quickstartCommands
  };
}
