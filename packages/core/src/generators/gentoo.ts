import { GeneratedRecipe, UserCriteria } from '../types.js';
import { CREDENTIAL_MAKE_VARS, credentialSetupSteps } from './credentials.js';
import { dockerBuildTarget } from './cross-build.js';
import { generateDockerStackFiles, getSelectedDockerApps } from './docker-apps.js';
import { generateBootstrapAppsScript } from './desktop-apps.js';
import { generateBootstrapEmulatorsScript } from './emulator-apps.js';
import { generateBootstrapNavigationScript } from './navigation-apps.js';

export function generateGentooRecipe(criteria: UserCriteria): GeneratedRecipe {
  const isMusl = criteria.cLibPreference === 'musl';
  const useSystemd = criteria.initPreference === 'systemd';
  const arch = criteria.architecture === 'arm64' ? 'arm64' : 'amd64';
  const qemuArch = arch === 'arm64' ? 'aarch64' : 'x86_64';
  const dockerPlatform = arch === 'arm64' ? 'linux/arm64' : 'linux/amd64';
  const distroName = 'TailoredGentoo';

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
      ? 'gnome-base/gnome gnome-base/gdm'
      : desktopEnv === 'kde'
        ? 'kde-plasma/plasma-meta x11-misc/sddm'
        : desktopEnv === 'xfce'
          ? 'xfce-base/xfce4-meta x11-misc/lightdm'
          : desktopEnv === 'cage'
            ? 'gui-wm/cage gui-apps/foot'
            : '';

  const fsPkgs =
    criteria.fileSystem === 'btrfs'
      ? 'sys-fs/btrfs-progs'
      : criteria.fileSystem === 'xfs'
        ? 'sys-fs/xfsprogs'
        : criteria.fileSystem === 'f2fs'
          ? 'sys-fs/f2fs-tools'
          : criteria.fileSystem === 'ext4'
            ? 'sys-fs/e2fsprogs'
            : criteria.fileSystem === 'fat32'
              ? 'sys-fs/dosfstools'
              : '';

  const netPkgs =
    criteria.networkingStack === 'nftables-pf'
      ? 'net-firewall/nftables'
      : 'net-misc/networkmanager';

  const virtPkgs =
    criteria.virtHost === 'kvm-qemu'
      ? 'app-emulation/qemu app-emulation/libvirt'
      : criteria.virtHost === 'container-only'
        ? 'app-containers/podman'
        : '';

  const extraAtoms = [
    'sys-kernel/gentoo-kernel-bin',
    'net-misc/openssh',
    'net-misc/curl',
    fsPkgs,
    netPkgs,
    virtPkgs,
    dePkgs,
    criteria.enableFlatpak ? 'sys-apps/flatpak' : '',
    criteria.tpmUsage ? 'app-crypt/tpm2-tools' : '',
    dockerApps.length > 0 ? 'app-containers/podman app-containers/docker-compose' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const useFlags = [
    useSystemd ? 'systemd -openrc' : '-systemd openrc',
    isGui ? 'wayland X' : '-X -wayland',
    criteria.realtimeAudio ? 'jack pipewire' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const dockerImage = useSystemd
    ? 'gentoo/stage3:systemd'
    : isMusl
      ? 'gentoo/stage3:musl'
      : 'gentoo/stage3:latest';
  const ptyFallback =
    'python3 -c "import os,termios; m,s=os.openpty(); termios.tcgetattr(s)" 2>/dev/null || sed -i "s/_disable_openpty = .*/_disable_openpty = True/" /usr/lib/python*/site-packages/portage/util/_pty.py';
  const dockerInstallCmd =
    `${ptyFallback} && emerge-webrsync && emerge --getbinpkg --usepkg dev-build/make sys-fs/squashfs-tools dev-libs/libisoburn sys-fs/mtools sys-boot/grub`;

  const makeConfContent = `# DistroTailor Portage configuration (${arch} | ${isMusl ? 'musl' : 'glibc'} | ${useSystemd ? 'systemd' : 'OpenRC'})
COMMON_FLAGS="-O2 -pipe"
CFLAGS="\${COMMON_FLAGS}"
CXXFLAGS="\${COMMON_FLAGS}"
USE="${useFlags}"
ACCEPT_LICENSE="-* @FREE"
FEATURES="getbinpkg binpkg-request-signature"
`;

  const makefileContent = `# DistroTailor Automated Gentoo Linux Build Recipe (Portage / emerge)
# Architecture: ${arch} | Init: ${useSystemd ? 'systemd' : 'OpenRC'} | C Library: ${isMusl ? 'musl' : 'glibc'}

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
\t@mkdir -p $(ROOTFS_DIR)/etc/portage/package.use $(ROOTFS_DIR)/usr/share/openpgp-keys $(OUTPUT_DIR)
\t@cp -r /etc/portage/gnupg $(ROOTFS_DIR)/etc/portage/ 2>/dev/null || true
\t@cp -r /usr/share/openpgp-keys/. $(ROOTFS_DIR)/usr/share/openpgp-keys/ 2>/dev/null || true
\t@cp make.conf $(ROOTFS_DIR)/etc/portage/make.conf
\t@printf 'sys-kernel/installkernel dracut\\nnet-firewall/nftables json\\nnet-wireless/wpa_supplicant dbus\\n' > $(ROOTFS_DIR)/etc/portage/package.use/distrotailor
\t@mkdir -p /etc/portage/package.use && cp $(ROOTFS_DIR)/etc/portage/package.use/distrotailor /etc/portage/package.use/distrotailor 2>/dev/null || true
\t@echo "[+] Emerge binary/source packages into $(ROOTFS_DIR)..."
\tenv -u BUILD_DIR emerge --root=$(abspath $(ROOTFS_DIR)) --sysroot=$(abspath $(ROOTFS_DIR)) --getbinpkg --usepkg --oneshot ${extraAtoms}

configure: rootfs
\t@echo "[+] Configuring hostname, user, and ${useSystemd ? 'systemd' : 'OpenRC'} services..."
\techo "$(DISTRO_NAME)" > $(ROOTFS_DIR)/etc/hostname
${credentialSetupSteps({ rootfs: '$(ROOTFS_DIR)', user: 'root', home: '/root', sudo: '', expire: true })}
\t@if [ '${useSystemd ? 'systemd' : 'openrc'}' = 'systemd' ]; then \\
\t\tchroot $(ROOTFS_DIR) systemctl enable sshd || true; \\
\telse \\
\t\tchroot $(ROOTFS_DIR) rc-update add sshd default || true; \\
\tfi
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
\t@printf 'set timeout=3\\nset default=0\\nmenuentry "$(DISTRO_NAME) ($(ARCH))" {\\n  linux /boot/vmlinuz root=/dev/ram0 init=/sbin/init quiet\\n  initrd /boot/initrd.img\\n}\\n' > $(ISO_DIR)/boot/grub/grub.cfg
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
      description: 'Automated Gentoo Portage rootfs emerge build, USE-flag configuration, and bootable GRUB ISO generator',
      content: makefileContent
    },
    {
      filename: 'make.conf',
      description: 'Portage USE flags, compiler flags, and binpkg settings for this Gentoo target',
      content: makeConfContent
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

  const quickstartCommands = ['sudo make  # Gentoo host (or: make docker-build on macOS / Windows / Debian)'];
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
      arch === 'arm64'
        ? `qemu-system-${qemuArch} -M virt -m 2048 -cdrom output/${distroName}-${arch}.iso`
        : `qemu-system-${qemuArch} -cdrom output/${distroName}-${arch}.iso -m 2048`
    );
  }

  return {
    id: 'gentoo-portage',
    title: dockerAppDef
      ? `Tailored Gentoo + ${dockerStack.summaryLabel} Appliance`
      : `Custom Minimal Gentoo (${useSystemd ? 'systemd' : 'OpenRC'}) Appliance`,
    summary: dockerStack.summaryLabel
      ? `Emerges a tailored Gentoo Portage base (${useSystemd ? 'systemd' : 'OpenRC'}) with custom USE flags in make.conf and ${dockerStack.summaryLabel} container stack(s).`
      : `Emerges a tailored Gentoo Linux base (${useSystemd ? 'systemd' : 'OpenRC'}, ${isMusl ? 'musl' : 'glibc'}) with Portage USE flags in make.conf and bootable GRUB ISO.`,
    targetFormat: 'iso',
    estimatedBuildTimeMinutes: 10,
    hostDependencies: ['emerge', 'squashfs-tools', 'grub-mkrescue', 'xorriso'],
    files,
    quickstartCommands
  };
}
