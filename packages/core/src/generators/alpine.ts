import { GeneratedRecipe, UserCriteria } from '../types.js';
import { CREDENTIAL_MAKE_VARS, credentialSetupSteps } from './credentials.js';
import { getDockerApp } from './docker-apps.js';
import { generateBootstrapAppsScript } from './desktop-apps.js';
import { generateBootstrapEmulatorsScript } from './emulator-apps.js';
import { generateBootstrapNavigationScript } from './navigation-apps.js';
import { ALPINE_MINIROOTFS_SHA256, ALPINE_MIRROR, ALPINE_VERSION } from './checksums.js';

export function generateAlpineRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture === 'arm64' ? 'aarch64' : 'x86_64';
  const distroName = 'TailoredAlpine';
  const dockerAppDef = getDockerApp(criteria.dockerApp);
  const desktopApps = criteria.desktopApps || [];
  const emulatorApps = criteria.emulatorApps || [];
  const navigationApps = criteria.navigationApps || [];
  const dockerApp = dockerAppDef ? dockerAppDef.id : 'none';

  const kernelPkg = criteria.kernelFlavor ? 'linux-lts' : '';
  const fsPkg =
    criteria.fileSystem === 'btrfs'
      ? 'btrfs-progs'
      : criteria.fileSystem === 'xfs'
        ? 'xfsprogs'
        : criteria.fileSystem === 'zfs'
          ? 'zfs'
          : criteria.fileSystem === 'f2fs'
            ? 'f2fs-tools'
            : criteria.fileSystem === 'fat32'
              ? 'dosfstools'
              : criteria.fileSystem === 'ext4'
                ? 'e2fsprogs'
                : '';
  const virtPkgs =
    criteria.virtHost === 'kvm-qemu'
      ? `qemu-system-${arch} libvirt bridge-utils${arch === 'x86_64' ? ' ovmf' : ''}`
      : criteria.virtHost === 'xen' && arch === 'x86_64'
        ? 'xen'
        : criteria.virtHost === 'container-only'
          ? 'podman'
          : '';
  const netPkgs =
    criteria.networkingStack === 'nftables-pf'
      ? 'nftables'
      : criteria.networkingStack === 'networkmanager'
        ? 'networkmanager'
        : '';
  const bootPkgs =
    criteria.bootloader === 'efistub'
      ? 'efibootmgr'
      : criteria.bootloader === 'grub-hybrid'
        ? `grub${criteria.firmwareMode === 'uefi' || arch === 'aarch64' ? ' grub-efi' : ''}`
        : '';
  const extraApkPkgs = [
    kernelPkg,
    fsPkg,
    virtPkgs,
    netPkgs,
    bootPkgs,
    criteria.tpmUsage ? 'tpm2-tools' : '',
    criteria.secureBoot === 'own-keys' ? 'sbsigntool efitools' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const alpineNotes = [
    criteria.kernelFlavor === 'realtime-rt'
      ? '# Note: Alpine does not ship a PREEMPT_RT kernel package; using linux-lts.'
      : '',
    criteria.kernelFlavor === 'hardened'
      ? '# Note: Alpine does not ship a separate linux-hardened package; using linux-lts.'
      : '',
    criteria.bootloader === 'systemd-boot'
      ? '# Note: systemd-boot is not supported on OpenRC/Alpine; use grub or efistub.'
      : '',
    criteria.networkingStack === 'systemd-networkd'
      ? '# Note: Alpine uses OpenRC networking (systemd-networkd is not used on musl/OpenRC).'
      : '',
    criteria.securityProfile === 'selinux' || criteria.securityProfile === 'apparmor'
      ? `# Note: ${criteria.securityProfile} is not enabled by default in Alpine OpenRC recipes.`
      : '',
    criteria.virtHost === 'xen' && arch === 'aarch64'
      ? '# Note: Xen host packages in Alpine are only available for x86_64.'
      : ''
  ]
    .filter(Boolean)
    .join('\n');

  const makefileContent = `# ==============================================================================
# DistroTailor: Alpine Linux Minimal RootFS / Diskless Builder
# Target: Alpine Linux (${arch}) with musl libc + OpenRC
# ==============================================================================

DISTRO_NAME ?= ${distroName}
VERSION     ?= ${ALPINE_VERSION}
ARCH        ?= ${arch}
ALPINE_MIRROR ?= ${ALPINE_MIRROR}
# Published SHA-256 of alpine-minirootfs-$(VERSION)-$(ARCH).tar.gz (override when changing VERSION/ARCH)
ALPINE_SHA256 ?= ${ALPINE_MINIROOTFS_SHA256[arch]}
${alpineNotes ? `\n${alpineNotes}\n` : ''}

# Turnkey Docker App Layer
DOCKER_APP  ?= ${dockerApp}

# --- SYSTEM INSTALLATION & LOCALIZATION (Installer Defaults) ---
HOSTNAME      ?= $(DISTRO_NAME)
TIMEZONE      ?= UTC
KEYMAP        ?= us

BUILD_DIR   ?= ./build
ROOTFS_DIR  ?= $(BUILD_DIR)/rootfs
OUTPUT_DIR  ?= ./output

${CREDENTIAL_MAKE_VARS}
TARBALL_NAME ?= $(DISTRO_NAME)-$(ARCH).tar.gz

.PHONY: all clean check-root prepare rootfs configure tarball app-up app-down

all: clean prepare rootfs configure tarball
	@echo "===================================================="
	@echo " Build Complete! RootFS Tarball: $(OUTPUT_DIR)/$(TARBALL_NAME)"
	@echo " Footprint: ~15MB base compressed"
	@echo " Turnkey Docker App: $(DOCKER_APP)"
	@echo "===================================================="

check-root:
	@if [ $$(id -u) -ne 0 ]; then \\
		echo "[-] Error: Run with sudo make"; \\
		exit 1; \\
	fi

prepare: check-root
	@mkdir -p $(ROOTFS_DIR) $(OUTPUT_DIR)

rootfs: prepare
	@echo "[+] Downloading Alpine Mini RootFS..."
	curl -fsSL "$(ALPINE_MIRROR)/releases/$(ARCH)/alpine-minirootfs-$(VERSION)-$(ARCH).tar.gz" -o $(BUILD_DIR)/base.tar.gz
	@echo "$(ALPINE_SHA256)  $(BUILD_DIR)/base.tar.gz" | sha256sum -c - || \\
		(echo "[-] Checksum mismatch: set ALPINE_SHA256 to the published hash for $(VERSION)/$(ARCH)"; exit 1)
	tar -xzf $(BUILD_DIR)/base.tar.gz -C $(ROOTFS_DIR)

configure: rootfs
	@echo "[+] Configuring OpenRC services, networking, and applications..."
	# DNS setup
	echo "nameserver 1.1.1.1" > $(ROOTFS_DIR)/etc/resolv.conf
	
	# Mount for chroot package installations
	mount -t proc none $(ROOTFS_DIR)/proc
	mount -o bind /sys $(ROOTFS_DIR)/sys
	mount -o bind /dev $(ROOTFS_DIR)/dev

	chroot $(ROOTFS_DIR) /bin/sh -c "\\
		apk update && \\
		apk add --no-cache openrc util-linux ca-certificates openssh-server curl${extraApkPkgs ? ` ${extraApkPkgs}` : ''} && \\
		rc-update add bootmisc boot && \\
		rc-update add hostname boot && \\
		rc-update add networking boot && \\
${criteria.networkingStack === 'nftables-pf' ? '\t\trc-update add nftables default && \\\n' : ''}${criteria.networkingStack === 'networkmanager' ? '\t\trc-update add networkmanager default && \\\n' : ''}${criteria.devicePassthrough ? '\t\tmkdir -p /etc/modules-load.d && printf "vfio\\nvfio_iommu_type1\\nvfio_pci\\n" > /etc/modules-load.d/vfio.conf && \\\n' : ''}		if [ '$(DOCKER_APP)' != 'none' ]; then \\
			apk add --no-cache docker docker-cli-compose && \\
			rc-update add docker default && \\
			mkdir -p /opt/$(DOCKER_APP); \\
		fi && \\
		apk add --no-cache tzdata && \\
		cp /usr/share/zoneinfo/$(TIMEZONE) /etc/localtime && \\
		echo '$(TIMEZONE)' > /etc/timezone && \\
		echo 'keymap=\"$(KEYMAP)\"' > /etc/conf.d/loadkmap && \\
		echo '$(HOSTNAME)' > /etc/hostname"

${credentialSetupSteps({ rootfs: '$(ROOTFS_DIR)', user: 'root', home: '/root', sudo: '', expire: false })}

	# If a Docker application is configured, stage its compose file
	@if [ '$(DOCKER_APP)' != 'none' ] && [ -f docker-compose.yml ]; then \\
		cp docker-compose.yml $(ROOTFS_DIR)/opt/$(DOCKER_APP)/docker-compose.yml; \\
		echo "[+] Bundled docker-compose.yml into /opt/$(DOCKER_APP)/"; \\
	fi

	umount -l $(ROOTFS_DIR)/dev || true
	umount -l $(ROOTFS_DIR)/sys || true
	umount -l $(ROOTFS_DIR)/proc || true

tarball: configure
	@echo "[+] Bundling rootfs into portable tarball..."
	cd $(ROOTFS_DIR) && tar -czf ../../$(OUTPUT_DIR)/$(TARBALL_NAME) .
	@echo "[+] Built: $(OUTPUT_DIR)/$(TARBALL_NAME)"

app-up:
	@if [ '$(DOCKER_APP)' = 'none' ]; then \\
		echo "[-] No turnkey Docker app selected."; \\
	else \\
		docker compose -f docker-compose.yml up -d; \\
	fi

app-down:
	@docker compose -f docker-compose.yml down

clean:
	@umount -l $(ROOTFS_DIR)/dev 2>/dev/null || true
	@umount -l $(ROOTFS_DIR)/sys 2>/dev/null || true
	@umount -l $(ROOTFS_DIR)/proc 2>/dev/null || true
	@rm -rf $(BUILD_DIR)
`;

  const files: GeneratedRecipe['files'] = [
    {
      filename: 'Makefile',
      description: 'Automated Alpine mini-rootfs hydration, OpenRC service enablement, and packaging',
      content: makefileContent
    }
  ];

  if (dockerAppDef) {
    files.push({
      filename: 'docker-compose.yml',
      description: `Turnkey Docker Compose configuration for ${dockerAppDef.name} (${dockerAppDef.tagline})`,
      content: dockerAppDef.generateCompose(criteria)
    });
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

  const quickstartCommands = ['sudo make'];
  if (desktopApps.length > 0) {
    quickstartCommands.push(`sudo bash bootstrap-apps.sh  # 1-Click install ${desktopApps.length} desktop app(s)`);
  }
  if (emulatorApps.length > 0) {
    quickstartCommands.push(`sudo bash bootstrap-emulators.sh  # 1-Click install ${emulatorApps.length} emulator(s) & controller setup`);
  }
  if (navigationApps.length > 0) {
    quickstartCommands.push(`sudo bash bootstrap-navigation.sh  # 1-Click install ${navigationApps.length} navigation tool(s) & GPSd setup`);
  }
  if (dockerAppDef) {
    quickstartCommands.push(`docker compose up -d  # Launch ${dockerAppDef.name} at ${dockerAppDef.webUrl}`);
  } else if (desktopApps.length === 0 && emulatorApps.length === 0 && navigationApps.length === 0) {
    quickstartCommands.push(`tar -tzf output/${distroName}-${arch}.tar.gz | head -n 20`);
  }

  return {
    id: 'alpine-chroot',
    title: dockerAppDef
      ? `Alpine Linux + ${dockerAppDef.name} RootFS`
      : 'Ultra-Minimal Alpine musl/OpenRC RootFS',
    summary: dockerAppDef
      ? `Creates an Alpine Linux sub-30MB base with musl libc, OpenRC, and a pre-configured ${dockerAppDef.name} (${dockerAppDef.tagline}) stack.`
      : 'Creates a high-speed, sub-20MB Alpine Linux root filesystem using musl libc and OpenRC for containers, chroots, or diskless PXE boots.',
    targetFormat: 'tarball',
    estimatedBuildTimeMinutes: 2,
    hostDependencies: ['curl', 'tar', 'chroot'],
    files,
    quickstartCommands
  };
}
