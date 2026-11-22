import { GeneratedRecipe, UserCriteria } from '../types.js';
import { CREDENTIAL_MAKE_VARS, credentialSetupSteps } from './credentials.js';
import { dockerBuildTarget } from './cross-build.js';
import { generateDockerStackFiles, getSelectedDockerApps } from './docker-apps.js';
import { generateBootstrapAppsScript } from './desktop-apps.js';
import { generateBootstrapEmulatorsScript } from './emulator-apps.js';
import { generateBootstrapNavigationScript } from './navigation-apps.js';

export function generateFedoraRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture === 'arm64' ? 'aarch64' : 'x86_64';
  const dockerPlatform = arch === 'aarch64' ? 'linux/arm64' : 'linux/amd64';
  const releaseVer = '41';
  const distroName = 'TailoredFedora';

  const dockerApps = getSelectedDockerApps(criteria);
  const dockerAppDef = dockerApps[0];
  const dockerStack = generateDockerStackFiles(criteria);
  const desktopApps = criteria.desktopApps || [];
  const emulatorApps = criteria.emulatorApps || [];
  const navigationApps = criteria.navigationApps || [];
  const dockerApp = dockerApps.length > 0 ? dockerApps.map((a) => a.id).join('+') : 'none';

  const isGui = !!criteria.prefersGui;
  const desktopEnv = criteria.desktopEnv || (isGui ? 'gnome' : 'none');

  const dePkgs =
    desktopEnv === 'gnome'
      ? '@gnome-desktop gdm'
      : desktopEnv === 'kde'
        ? '@kde-desktop-environment sddm'
        : desktopEnv === 'xfce'
          ? '@xfce-desktop-environment lightdm'
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
        ? 'systemd-networkd'
        : 'NetworkManager';

  const virtPkgs =
    criteria.virtHost === 'kvm-qemu'
      ? 'qemu-kvm libvirt virt-install edk2-ovmf'
      : criteria.virtHost === 'container-only'
        ? 'podman buildah skopeo'
        : '';

  const extraPkgs = [
    'fedora-release',
    'systemd',
    'passwd',
    'rootfiles',
    'kernel',
    'kernel-modules',
    'dracut-live',
    'openssh-server',
    'curl',
    'ca-certificates',
    fsPkgs,
    netPkgs,
    virtPkgs,
    dePkgs,
    criteria.enableFlatpak ? 'flatpak' : '',
    criteria.enableDistrobox ? 'distrobox podman' : '',
    criteria.tpmUsage ? 'tpm2-tools' : '',
    criteria.secureBoot === 'own-keys' ? 'sbsigntools efitools' : '',
    criteria.securityProfile === 'selinux' ? 'selinux-policy-targeted policycoreutils' : '',
    dockerApps.length > 0 ? 'podman podman-compose' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const grubPkg = arch === 'aarch64' ? 'grub2-efi-aa64 grub2-tools-extra' : 'grub2-pc grub2-efi-x64 grub2-tools-extra';
  const dockerInstallCmd = `dnf install -y make dnf-plugins-core squashfs-tools xorriso ${grubPkg} dosfstools`;

  const selinuxLine =
    criteria.securityProfile === 'selinux'
      ? '\t@sed -i "s/^SELINUX=.*/SELINUX=enforcing/" $(ROOTFS_DIR)/etc/selinux/config 2>/dev/null || true'
      : '';

  const iommuArg =
    criteria.devicePassthrough === 'gpu-vfio' || criteria.devicePassthrough === 'pci-devices'
      ? arch === 'aarch64'
        ? 'iommu.passthrough=1'
        : 'intel_iommu=on amd_iommu=on iommu=pt'
      : '';

  const makefileContent = `# DistroTailor Automated Fedora Build Recipe (DNF ${releaseVer})
# Architecture: ${arch} | State: ${criteria.statePreference || 'mutable'} | FS: ${criteria.fileSystem || 'btrfs'}

ARCH        ?= ${arch}
RELEASEVER  ?= ${releaseVer}
DISTRO_NAME ?= ${distroName}
${CREDENTIAL_MAKE_VARS}
BUILD_DIR   ?= ./build
ROOTFS_DIR  := $(BUILD_DIR)/rootfs
ISO_DIR     := $(BUILD_DIR)/iso
OUTPUT_DIR  ?= ./output
ISO_NAME    := $(DISTRO_NAME)-$(RELEASEVER)-$(ARCH).iso
TARBALL_NAME := $(DISTRO_NAME)-$(RELEASEVER)-$(ARCH)-rootfs.tar.gz

DOCKER_APP  ?= ${dockerApp}

.PHONY: all rootfs configure iso tarball docker-build clean app-up app-down

all: iso

rootfs:
\t@mkdir -p $(ROOTFS_DIR) $(OUTPUT_DIR)
\t@echo "[+] Bootstrapping Fedora $(RELEASEVER) ($(ARCH)) via dnf --installroot..."
\tdnf --installroot=$(abspath $(ROOTFS_DIR)) \\
\t\t--use-host-config \\
\t\t--releasever=$(RELEASEVER) \\
\t\t--forcearch=$(ARCH) \\
\t\t--setopt=install_weak_deps=False \\
\t\tinstall -y ${extraPkgs}

configure: rootfs
\t@echo "[+] Configuring hostname, user, services, and network..."
\techo "$(DISTRO_NAME)" > $(ROOTFS_DIR)/etc/hostname
${credentialSetupSteps({ rootfs: '$(ROOTFS_DIR)', user: 'root', home: '/root', sudo: '', expire: true })}
\tchroot $(ROOTFS_DIR) systemctl enable sshd || true
${selinuxLine}
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
\t@printf 'set timeout=3\\nset default=0\\nmenuentry "$(DISTRO_NAME) ($(ARCH))" {\\n  linux /boot/vmlinuz root=live:CDLABEL=$(DISTRO_NAME) rd.live.image quiet ${iommuArg}\\n  initrd /boot/initrd.img\\n}\\n' > $(ISO_DIR)/boot/grub/grub.cfg
\tgrub2-mkrescue -o $(OUTPUT_DIR)/$(ISO_NAME) $(ISO_DIR) -- -volid $(DISTRO_NAME)
\t@echo "[+] Built: $(OUTPUT_DIR)/$(ISO_NAME)"

tarball: configure
\t@echo "[+] Bundling rootfs tarball..."
\ttar -C $(ROOTFS_DIR) -czf $(OUTPUT_DIR)/$(TARBALL_NAME) .
\t@echo "[+] Built: $(OUTPUT_DIR)/$(TARBALL_NAME)"

${dockerBuildTarget({
  image: `fedora:${releaseVer}`,
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
      description: `Automated Fedora ${releaseVer} DNF installroot build, SELinux/network setup, and bootable ISO generator`,
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

  const quickstartCommands = ['sudo make  # Fedora/RHEL host (or: make docker-build on macOS / Windows / Debian)'];
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
        ? `qemu-system-aarch64 -M virt -m 2048 -cdrom output/${distroName}-${releaseVer}-${arch}.iso`
        : `qemu-system-x86_64 -cdrom output/${distroName}-${releaseVer}-${arch}.iso -m 2048`
    );
  }

  return {
    id: 'fedora-dnf',
    title: dockerAppDef
      ? `Tailored Fedora + ${dockerStack.summaryLabel} Appliance`
      : `Custom Minimal Fedora ${releaseVer} Appliance (DNF)`,
    summary: dockerStack.summaryLabel
      ? `Bootstraps a clean Fedora ${releaseVer} RPM base via dnf --installroot and bundles ${dockerStack.summaryLabel} container stack(s).`
      : `Bootstraps a clean, standalone Fedora ${releaseVer} RPM system via dnf --installroot with systemd, SELinux/firewall tooling, and bootable GRUB ISO.`,
    targetFormat: 'iso',
    estimatedBuildTimeMinutes: 6,
    hostDependencies: ['dnf', 'squashfs-tools', 'grub2-mkrescue', 'xorriso'],
    files,
    quickstartCommands
  };
}
