import { GeneratedRecipe, UserCriteria } from '../types.js';
import { CREDENTIAL_MAKE_VARS, credentialSetupSteps } from './credentials.js';
import { dockerBuildTarget } from './cross-build.js';
import { generateDockerStackFiles, getSelectedDockerApps } from './docker-apps.js';
import { generateBootstrapAppsScript } from './desktop-apps.js';
import { generateBootstrapEmulatorsScript } from './emulator-apps.js';
import { generateBootstrapNavigationScript } from './navigation-apps.js';

export function generateOpenSuseRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture === 'arm64' ? 'aarch64' : 'x86_64';
  const dockerPlatform = arch === 'aarch64' ? 'linux/arm64' : 'linux/amd64';
  const repoArch = arch === 'aarch64' ? 'aarch64' : 'x86_64';
  const distroName = 'TailoredOpenSUSE';

  const dockerApps = getSelectedDockerApps(criteria);
  const dockerAppDef = dockerApps[0];
  const dockerStack = generateDockerStackFiles(criteria);
  const desktopApps = criteria.desktopApps || [];
  const emulatorApps = criteria.emulatorApps || [];
  const navigationApps = criteria.navigationApps || [];
  const dockerApp = dockerApps.length > 0 ? dockerApps.map((a) => a.id).join('+') : 'none';

  const isGui = !!criteria.prefersGui;
  const desktopEnv = criteria.desktopEnv || (isGui ? 'kde' : 'none');

  const dePkgs =
    desktopEnv === 'gnome'
      ? 'patterns-gnome-gnome gdm'
      : desktopEnv === 'kde'
        ? 'patterns-kde-kde sddm'
        : desktopEnv === 'xfce'
          ? 'patterns-xfce-xfce lightdm'
          : desktopEnv === 'cage'
            ? 'cage foot'
            : '';

  const fsPkgs =
    criteria.fileSystem === 'btrfs' || !criteria.fileSystem
      ? 'btrfsprogs snapper'
      : criteria.fileSystem === 'xfs'
        ? 'xfsprogs'
        : criteria.fileSystem === 'f2fs'
          ? 'f2fs-tools'
          : criteria.fileSystem === 'ext4'
            ? 'e2fsprogs'
            : 'dosfstools';

  const netPkgs =
    criteria.networkingStack === 'nftables-pf'
      ? 'nftables'
      : criteria.networkingStack === 'systemd-networkd'
        ? 'systemd-network'
        : 'NetworkManager';

  const virtPkgs =
    criteria.virtHost === 'kvm-qemu'
      ? 'qemu libvirt virt-install'
      : criteria.virtHost === 'container-only'
        ? 'podman buildah'
        : '';

  const extraPkgs = [
    'openSUSE-release',
    'systemd',
    'shadow',
    'kernel-default',
    'dracut',
    'openssh',
    'curl',
    'ca-certificates',
    fsPkgs,
    netPkgs,
    virtPkgs,
    dePkgs,
    criteria.enableFlatpak ? 'flatpak' : '',
    criteria.enableDistrobox ? 'distrobox podman' : '',
    criteria.tpmUsage ? 'tpm2.0-tools' : '',
    criteria.secureBoot === 'own-keys' ? 'sbsigntools efitools' : '',
    criteria.securityProfile === 'apparmor' ? 'apparmor-parser apparmor-profiles' : '',
    dockerApps.length > 0 ? 'podman docker-compose' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const grubPkg = arch === 'aarch64' ? 'grub2-arm64-efi' : 'grub2-i386-pc grub2-x86_64-efi';
  const dockerInstallCmd = `zypper --non-interactive install --no-recommends make squashfs xorriso mtools ${grubPkg} dosfstools`;
  const repoUrl =
    arch === 'aarch64'
      ? 'https://download.opensuse.org/ports/aarch64/tumbleweed/repo/oss/'
      : `https://download.opensuse.org/tumbleweed/repo/oss/`;

  const iommuArg =
    criteria.devicePassthrough === 'gpu-vfio' || criteria.devicePassthrough === 'pci-devices'
      ? arch === 'aarch64'
        ? 'iommu.passthrough=1'
        : 'intel_iommu=on amd_iommu=on iommu=pt'
      : '';

  const makefileContent = `# DistroTailor Automated openSUSE Tumbleweed Build Recipe (Zypper)
# Architecture: ${arch} (${repoArch}) | FS: ${criteria.fileSystem || 'btrfs'}

ARCH        ?= ${arch}
DISTRO_NAME ?= ${distroName}
REPO_URL    ?= ${repoUrl}
${CREDENTIAL_MAKE_VARS}
BUILD_DIR   ?= ./build
ROOTFS_DIR  := $(BUILD_DIR)/rootfs
ISO_DIR     := $(BUILD_DIR)/iso
OUTPUT_DIR  ?= ./output
ISO_NAME    := $(DISTRO_NAME)-Tumbleweed-$(ARCH).iso
TARBALL_NAME := $(DISTRO_NAME)-Tumbleweed-$(ARCH)-rootfs.tar.gz

DOCKER_APP  ?= ${dockerApp}

.PHONY: all rootfs configure iso tarball docker-build clean app-up app-down

all: iso

rootfs:
\t@mkdir -p $(ROOTFS_DIR) $(OUTPUT_DIR)
\t@echo "[+] Bootstrapping openSUSE Tumbleweed ($(ARCH)) via zypper --root..."
\tzypper --root $(abspath $(ROOTFS_DIR)) --gpg-auto-import-keys ar -f $(REPO_URL) oss || true
\tzypper --root $(abspath $(ROOTFS_DIR)) --gpg-auto-import-keys refresh
\tzypper --root $(abspath $(ROOTFS_DIR)) --non-interactive install --no-recommends ${extraPkgs}

configure: rootfs
\t@echo "[+] Configuring hostname, user, services, and network..."
\techo "$(DISTRO_NAME)" > $(ROOTFS_DIR)/etc/hostname
${credentialSetupSteps({ rootfs: '$(ROOTFS_DIR)', user: 'root', home: '/root', sudo: '', expire: true })}
\tchroot $(ROOTFS_DIR) systemctl enable sshd || true
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
\t@cp $(ROOTFS_DIR)/boot/initrd-* $(ISO_DIR)/boot/initrd.img 2>/dev/null || true
\t@printf 'set timeout=3\\nset default=0\\nmenuentry "$(DISTRO_NAME) ($(ARCH))" {\\n  linux /boot/vmlinuz root=live:CDLABEL=$(DISTRO_NAME) rd.live.image quiet ${iommuArg}\\n  initrd /boot/initrd.img\\n}\\n' > $(ISO_DIR)/boot/grub/grub.cfg
\tgrub2-mkrescue -o $(OUTPUT_DIR)/$(ISO_NAME) $(ISO_DIR) -- -volid $(DISTRO_NAME)
\t@echo "[+] Built: $(OUTPUT_DIR)/$(ISO_NAME)"

tarball: configure
\t@echo "[+] Bundling rootfs tarball..."
\ttar -C $(ROOTFS_DIR) -czf $(OUTPUT_DIR)/$(TARBALL_NAME) .
\t@echo "[+] Built: $(OUTPUT_DIR)/$(TARBALL_NAME)"

${dockerBuildTarget({
  image: 'opensuse/tumbleweed:latest',
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
      description: 'Automated openSUSE Tumbleweed Zypper rootfs build, Btrfs/Snapper setup, and bootable ISO generator',
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

  const quickstartCommands = ['sudo make  # openSUSE host (or: make docker-build on macOS / Windows / Debian)'];
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
      arch === 'aarch64'
        ? `qemu-system-aarch64 -M virt -m 2048 -cdrom output/${distroName}-Tumbleweed-${arch}.iso`
        : `qemu-system-x86_64 -cdrom output/${distroName}-Tumbleweed-${arch}.iso -m 2048`
    );
  }

  return {
    id: 'opensuse-zypper',
    title: dockerAppDef
      ? `Tailored openSUSE + ${dockerStack.summaryLabel} Appliance`
      : 'Custom Minimal openSUSE Tumbleweed Appliance (Zypper)',
    summary: dockerStack.summaryLabel
      ? `Bootstraps a clean openSUSE Tumbleweed base via zypper --root with Btrfs/Snapper and ${dockerStack.summaryLabel} container stack(s).`
      : 'Bootstraps a clean, standalone openSUSE Tumbleweed system via zypper --root with Btrfs/Snapper rollback tooling and bootable GRUB ISO.',
    targetFormat: 'iso',
    estimatedBuildTimeMinutes: 6,
    hostDependencies: ['zypper', 'squashfs', 'grub2-mkrescue', 'xorriso'],
    files,
    quickstartCommands
  };
}
