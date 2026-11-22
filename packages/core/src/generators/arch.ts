import { GeneratedRecipe, UserCriteria } from '../types.js';
import { CREDENTIAL_MAKE_VARS, credentialSetupSteps } from './credentials.js';
import { dockerBuildTarget } from './cross-build.js';
import { generateDockerStackFiles, getSelectedDockerApps } from './docker-apps.js';
import { generateBootstrapAppsScript } from './desktop-apps.js';
import { generateBootstrapEmulatorsScript } from './emulator-apps.js';
import { generateBootstrapNavigationScript } from './navigation-apps.js';

export function generateArchRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture === 'arm64' ? 'aarch64' : 'x86_64';
  const dockerPlatform = arch === 'aarch64' ? 'linux/arm64' : 'linux/amd64';
  const distroName = 'TailoredArch';

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
      ? 'gnome gdm'
      : desktopEnv === 'kde'
        ? 'plasma sddm'
        : desktopEnv === 'xfce'
          ? 'xfce4 lightdm lightdm-gtk-greeter'
          : desktopEnv === 'cage'
            ? 'cage foot'
            : '';

  const fsPkgs =
    criteria.fileSystem === 'btrfs'
      ? 'btrfs-progs snapper'
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
      : criteria.networkingStack === 'systemd-networkd'
        ? 'systemd'
        : 'networkmanager';

  const virtPkgs =
    criteria.virtHost === 'kvm-qemu'
      ? 'qemu-full libvirt edk2-ovmf'
      : criteria.virtHost === 'container-only'
        ? 'podman buildah'
        : '';

  const kernelPkg =
    criteria.kernelFlavor === 'lts-stable'
      ? 'linux-lts'
      : criteria.kernelFlavor === 'hardened'
        ? 'linux-hardened'
        : criteria.kernelFlavor === 'zen-liquorix'
          ? 'linux-zen'
          : 'linux';

  const extraPkgs = [
    'base',
    kernelPkg,
    'linux-firmware',
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
    criteria.secureBoot === 'own-keys' ? 'sbctl efitools' : '',
    dockerApps.length > 0 ? 'podman docker-compose' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const dockerInstallCmd =
    'sed -i "s/^#DisableSandbox/DisableSandbox/" /etc/pacman.conf && pacman -Syu --noconfirm arch-install-scripts make squashfs-tools xorriso mtools grub dosfstools';

  const iommuArg =
    criteria.devicePassthrough === 'gpu-vfio' || criteria.devicePassthrough === 'pci-devices'
      ? arch === 'aarch64'
        ? 'iommu.passthrough=1'
        : 'intel_iommu=on amd_iommu=on iommu=pt'
      : '';

  const makefileContent = `# DistroTailor Automated Arch Linux Build Recipe (pacstrap)
# Architecture: ${arch} | Kernel: ${kernelPkg} | FS: ${criteria.fileSystem || 'ext4'}

ARCH        ?= ${arch}
DISTRO_NAME ?= ${distroName}
${CREDENTIAL_MAKE_VARS}
BUILD_DIR   ?= ./build
ROOTFS_DIR  := $(BUILD_DIR)/rootfs
ISO_DIR     := $(BUILD_DIR)/iso
OUTPUT_DIR  ?= ./output
ISO_NAME    := $(DISTRO_NAME)-$(ARCH).iso
TARBALL_NAME := $(DISTRO_NAME)-$(ARCH)-rootfs.tar.gz

DOCKER_APP  ?= ${dockerApp}

.PHONY: all rootfs configure iso tarball docker-build clean app-up app-down

all: iso

rootfs:
\t@mkdir -p $(ROOTFS_DIR) $(OUTPUT_DIR)
\t@echo "[+] Bootstrapping Arch Linux ($(ARCH)) via pacstrap..."
\tpacstrap -K -c $(abspath $(ROOTFS_DIR)) ${extraPkgs}

configure: rootfs
\t@echo "[+] Configuring hostname, user, systemd services, and network..."
\techo "$(DISTRO_NAME)" > $(ROOTFS_DIR)/etc/hostname
${credentialSetupSteps({ rootfs: '$(ROOTFS_DIR)', user: 'root', home: '/root', sudo: '', expire: true })}
\tarch-chroot $(ROOTFS_DIR) systemctl enable sshd || true
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
\t@cp $(ROOTFS_DIR)/boot/initramfs-*.img $(ISO_DIR)/boot/initrd.img 2>/dev/null || true
\t@printf 'set timeout=3\\nset default=0\\nmenuentry "$(DISTRO_NAME) ($(ARCH))" {\\n  linux /boot/vmlinuz archisobasedir=LiveOS quiet ${iommuArg}\\n  initrd /boot/initrd.img\\n}\\n' > $(ISO_DIR)/boot/grub/grub.cfg
\tgrub-mkrescue -o $(OUTPUT_DIR)/$(ISO_NAME) $(ISO_DIR) -- -volid $(DISTRO_NAME)
\t@echo "[+] Built: $(OUTPUT_DIR)/$(ISO_NAME)"

tarball: configure
\t@echo "[+] Bundling rootfs tarball..."
\ttar -C $(ROOTFS_DIR) -czf $(OUTPUT_DIR)/$(TARBALL_NAME) .
\t@echo "[+] Built: $(OUTPUT_DIR)/$(TARBALL_NAME)"

${dockerBuildTarget({
  image: 'archlinux:latest',
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
      description: 'Automated Arch Linux pacstrap rootfs build, kernel/systemd setup, and bootable GRUB ISO generator',
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

  const quickstartCommands = ['sudo make  # Arch Linux host (or: make docker-build on macOS / Windows / Debian)'];
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
        ? `qemu-system-aarch64 -M virt -m 2048 -cdrom output/${distroName}-${arch}.iso`
        : `qemu-system-x86_64 -cdrom output/${distroName}-${arch}.iso -m 2048`
    );
  }

  return {
    id: 'arch-pacstrap',
    title: dockerAppDef
      ? `Tailored Arch Linux + ${dockerStack.summaryLabel} Appliance`
      : 'Custom Minimal Arch Linux Appliance (pacstrap)',
    summary: dockerStack.summaryLabel
      ? `Bootstraps a clean Arch Linux base via pacstrap (${kernelPkg}) and bundles ${dockerStack.summaryLabel} container stack(s).`
      : `Bootstraps a clean, rolling Arch Linux system via pacstrap (${kernelPkg}) with systemd and bootable GRUB ISO.`,
    targetFormat: 'iso',
    estimatedBuildTimeMinutes: 5,
    hostDependencies: ['pacstrap', 'arch-chroot', 'squashfs-tools', 'grub-mkrescue', 'xorriso'],
    files,
    quickstartCommands
  };
}
