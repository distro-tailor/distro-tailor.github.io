import { GeneratedRecipe, UserCriteria } from '../types.js';
import { CREDENTIAL_MAKE_VARS, credentialSetupSteps } from './credentials.js';
import { debootstrapCrossArchRootfsStep, debootstrapCrossArchVars, dockerBuildTarget } from './cross-build.js';
import { generateDockerStackFiles, getSelectedDockerApps } from './docker-apps.js';
import { generateBootstrapAppsScript } from './desktop-apps.js';
import { generateBootstrapEmulatorsScript } from './emulator-apps.js';
import { generateBootstrapNavigationScript } from './navigation-apps.js';

export function generateDebootstrapRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture === 'arm64' ? 'arm64' : 'amd64';
  const distroName = 'TailoredDebian';
  const dockerApps = getSelectedDockerApps(criteria);
  const dockerAppDef = dockerApps[0];
  const dockerStack = generateDockerStackFiles(criteria);
  const desktopApps = criteria.desktopApps || [];
  const emulatorApps = criteria.emulatorApps || [];
  const navigationApps = criteria.navigationApps || [];
  const desktopEnv = criteria.desktopEnv || (criteria.prefersGui ? 'cage' : 'none');
  const enableDistrobox = criteria.enableDistrobox ? '1' : '0';
  const enableNix = criteria.enableNix ? '1' : '0';
  const enableFlatpak = criteria.enableFlatpak ? '1' : '0';
  const dockerApp = dockerApps.length > 0 ? dockerApps.map((a) => a.id).join('+') : 'none';

  // Hardware Form Factor & Power/Battery Tuning
  const formFactor = criteria.formFactor || 'desktop';
  const isLaptop = formFactor === 'laptop';
  const isHandheld = formFactor === 'handheld';
  const isLowPower = formFactor === 'low-power';
  const isMac = formFactor === 'mac';
  const isServer = formFactor === 'server';
  const powerTuningProfile = isLaptop
    ? 'laptop-battery'
    : isLowPower
      ? 'low-power-idle'
      : isHandheld
        ? 'handheld-tdp'
        : isServer
          ? 'server-performance'
          : 'desktop-balanced';

  // Low-level Systems Engineering Options
  const fileSystem = criteria.fileSystem || 'ext4';
  const kernelFlavor = criteria.kernelFlavor || 'lts-stable';
  const bootloader = criteria.bootloader || 'grub-hybrid';
  const securityProfile = criteria.securityProfile || 'standard-dac';
  const networkingStack = criteria.networkingStack || 'networkmanager';

  const kernelPkg = kernelFlavor === 'realtime-rt' ? `linux-image-rt-${arch}` : `linux-image-${arch}`;
  const fsPkg =
    fileSystem === 'btrfs'
      ? 'btrfs-progs'
      : fileSystem === 'xfs'
        ? 'xfsprogs'
        : fileSystem === 'zfs'
          ? 'zfsutils-linux'
          : fileSystem === 'f2fs'
            ? 'f2fs-tools'
            : fileSystem === 'fat32'
              ? 'dosfstools'
              : 'e2fsprogs';
  const firmwareMode = criteria.firmwareMode;
  const secureBoot = criteria.secureBoot;
  const tpmUsage = criteria.tpmUsage;
  const virtHost = criteria.virtHost;
  const passthrough = criteria.devicePassthrough;
  const qemuPkg = arch === 'arm64' ? 'qemu-system-arm' : 'qemu-system-x86';
  const virtPkgs =
    virtHost === 'kvm-qemu'
      ? `${qemuPkg} qemu-utils libvirt-daemon-system libvirt-clients virtinst bridge-utils ovmf`
      : virtHost === 'xen'
        ? `xen-system-${arch} xen-utils`
        : virtHost === 'container-only'
          ? 'podman'
          : '';
  const firmwareLabel = firmwareMode || 'auto';
  const secureBootLabel = secureBoot || 'off';
  const tpmLabel = tpmUsage || 'off';

  // Boot stack: legacy BIOS needs only grub-pc; UEFI needs grub-efi (signed shim chain when Secure Boot is required).
  const efiGrubPkgs =
    secureBoot === 'required'
      ? `shim-signed grub-efi-${arch}-signed`
      : `grub-efi-${arch}-bin`;
  const bootloaderPkgs =
    bootloader === 'systemd-boot' && firmwareMode !== 'legacy-bios'
      ? 'systemd-boot'
      : arch === 'arm64'
        ? efiGrubPkgs
        : firmwareMode === 'legacy-bios'
          ? 'grub-pc-bin'
          : firmwareMode === 'uefi'
            ? efiGrubPkgs
            : `grub-pc-bin ${efiGrubPkgs}`;
  const extraSystemsPkgs = [
    securityProfile === 'selinux' ? 'selinux-basics selinux-policy-default auditd' : '',
    securityProfile === 'apparmor' ? 'apparmor apparmor-utils' : '',
    networkingStack === 'networkmanager' ? 'network-manager' : '',
    networkingStack === 'nftables-pf' ? 'nftables' : '',
    secureBoot === 'own-keys' ? 'sbsigntool efitools openssl' : '',
    tpmUsage === 'measured-boot' ? 'tpm2-tools' : '',
    tpmUsage === 'disk-unlock' ? 'tpm2-tools cryptsetup clevis-tpm2 clevis-luks clevis-initramfs' : '',
    virtPkgs,
    passthrough ? 'pciutils' : ''
  ].filter(Boolean).join(' ');

  const makefileContent = `# ==============================================================================
# DistroTailor: Debootstrap Minimal Linux Builder
# Target: Debian Minimal (bootable ISO & rootfs)
# Architecture: ${arch}
# ==============================================================================

DISTRO_NAME     ?= ${distroName}
VERSION         ?= 1.0.0
ARCH            ?= ${arch}
SUITE           ?= bookworm
MIRROR          ?= http://deb.debian.org/debian
${debootstrapCrossArchVars()}

# --- SYSTEMS ENGINEERING & FILESYSTEM ---
# ROOT_FS: ext4 | btrfs | zfs | xfs | f2fs | fat32
ROOT_FS         ?= ${fileSystem}
# KERNEL_FLAVOR: lts-stable | realtime-rt | hardened | zen-liquorix
KERNEL_FLAVOR   ?= ${kernelFlavor}
# BOOTLOADER: grub-hybrid | systemd-boot | u-boot | efistub
BOOTLOADER      ?= ${bootloader}
# SECURITY_PROFILE: standard-dac | selinux | apparmor | amnesic-ram
SECURITY_PROFILE ?= ${securityProfile}
# NETWORKING_STACK: networkmanager | systemd-networkd | nftables-pf | busybox-minimal
NETWORKING_STACK ?= ${networkingStack}
# FIRMWARE_MODE: auto | uefi | legacy-bios
FIRMWARE_MODE   ?= ${firmwareLabel}
# SECURE_BOOT: off | required (signed shim + signed GRUB) | own-keys (sign boot files with your own keys)
SECURE_BOOT     ?= ${secureBootLabel}
# TPM_USAGE: off | measured-boot | disk-unlock (Clevis TPM2 LUKS binding)
TPM_USAGE       ?= ${tpmLabel}
# VIRT_HOST: none | kvm-qemu | xen | bhyve | container-only
VIRT_HOST       ?= ${virtHost || 'none'}
# DEVICE_PASSTHROUGH: none | gpu-vfio | pci-devices
DEVICE_PASSTHROUGH ?= ${passthrough || 'none'}
# VFIO_IDS: comma-separated vendor:device IDs to bind to vfio-pci (find them with: lspci -nn)
VFIO_IDS        ?=

# --- SYSTEM INSTALLATION & LOCALIZATION (Installer Defaults) ---
# (Standard OS installer settings: override with make TIMEZONE=America/New_York KEYMAP=uk, etc.)
HOSTNAME        ?= $(DISTRO_NAME)
TIMEZONE        ?= UTC
LOCALE          ?= en_US.UTF-8
KEYMAP          ?= us
# Live ISO (live-boot overlayfs) does not support swapfiles; set > 0 only for writable disk installs
SWAP_SIZE_MB    ?= 0

# --- MODULAR HARDWARE & DESKTOP TUNING ---
# HARDWARE_TARGET: generic-x86 | rpi | intel-nuc | vm | mac | handheld
HARDWARE_TARGET ?= ${isMac ? 'mac-hardware' : isHandheld ? 'handheld-device' : 'generic-x86'}
# FORM_FACTOR: desktop | laptop | handheld | low-power | mac | sbc | server
FORM_FACTOR     ?= ${formFactor}
# POWER_TUNING: laptop-battery | low-power-idle | handheld-tdp | server-performance | desktop-balanced
POWER_TUNING    ?= ${powerTuningProfile}
# PRUNE_FIRMWARE: 1 = Strips 1.8GB of unused vendor blobs, keeps only essential free firmware
PRUNE_FIRMWARE  ?= 1
# DESKTOP_ENV: none (headless) | cage (wayland kiosk) | xfce | kde | gnome
DESKTOP_ENV     ?= ${desktopEnv}
# FRANKENSTEIN_HYBRID: 1 = Pre-installs Distrobox to run Arch AUR / Fedora packages on this Debian base!
ENABLE_DISTROBOX ?= ${enableDistrobox}
# UNIVERSAL_PACKAGES: Nix package manager & Flatpak layers
ENABLE_NIX       ?= ${enableNix}
ENABLE_FLATPAK   ?= ${enableFlatpak}

# --- TURNKEY 1-CLICK DOCKER APPLICATION LAYER ---
# DOCKER_APP: none | immich | home-assistant | jellyfin | pihole | ollama | nextcloud | lamp-wordpress | tailscale | uptime-kuma
DOCKER_APP       ?= ${dockerApp}

BUILD_DIR   ?= ./build
ROOTFS_DIR  ?= $(BUILD_DIR)/rootfs
OUTPUT_DIR  ?= ./output

${CREDENTIAL_MAKE_VARS}
ISO_NAME    ?= $(DISTRO_NAME)-$(VERSION)-$(ARCH).iso

# Required host tools
DEBOOTSTRAP ?= debootstrap
GENISOIMAGE ?= genisoimage
MKSQUASHFS  ?= mksquashfs

.PHONY: all clean check-root prepare rootfs configure iso detect-hardware app-up app-down app-logs

all: detect-hardware clean prepare rootfs configure iso
	@echo "===================================================="
	@echo " Build Complete! Image: $(OUTPUT_DIR)/$(ISO_NAME)"
	@echo " Hardware Profile:      $(HARDWARE_TARGET) ($(FORM_FACTOR))"
	@echo " Power & Battery Tuning: $(POWER_TUNING)"
	@echo " Firmware Pruning:      $(if $(filter 1,$(PRUNE_FIRMWARE)),ENABLED (-1.8GB bloat stripped),DISABLED)"
	@echo " Desktop Environment:   $(DESKTOP_ENV)"
	@echo " Distrobox Hybrid:      $(if $(filter 1,$(ENABLE_DISTROBOX)),ENABLED (Arch AUR / Podman),DISABLED)"
	@echo " Turnkey Docker App:    $(DOCKER_APP)"
	@echo "===================================================="

detect-hardware:
	@echo "===================================================="
	@echo " DistroTailor: PCPartPicker & Hardware Manifest Audit"
	@echo "===================================================="
	@echo "[+] Scanning active PCI & USB hardware inventory..."
	@lspci -nnk 2>/dev/null | grep -E "VGA|Network|Ethernet|Audio|Storage|Wireless" || true
	@echo ""
	@echo "[+] Scanned active NIC, Audio, GPU, and Storage controllers."
	@echo "[+] Pruning unused universal firmware (~1.8GB stripped) down to active chips."

check-root:
	@if [ $$(id -u) -ne 0 ]; then \\
		echo "[-] Error: This build requires root privileges. Please run with sudo make"; \\
		exit 1; \\
	fi

prepare: check-root
	@echo "[+] Preparing directories..."
	@mkdir -p $(ROOTFS_DIR) $(OUTPUT_DIR)

rootfs: prepare
	@echo "[+] Bootstrapping base Debian system using debootstrap..."
${debootstrapCrossArchRootfsStep({ sudoPrefix: '', suite: '$(SUITE)', mirror: '$(MIRROR)' })}

configure: rootfs
	@echo "[+] Configuring custom kernel, systemd, and networking..."
	# Mount kernel pseudo-filesystems
	mount -t proc none $(ROOTFS_DIR)/proc
	mount -o bind /sys $(ROOTFS_DIR)/sys
	mount -o bind /dev $(ROOTFS_DIR)/dev
	mount -o bind /dev/pts $(ROOTFS_DIR)/dev/pts

	# Configure inside chroot
	chroot $(ROOTFS_DIR) /bin/bash -c "export DEBIAN_FRONTEND=noninteractive && \\
${fileSystem === 'zfs' ? '\t\tsed -i "s/ main$/ main contrib/" /etc/apt/sources.list && \\\n' : ''}\t\tapt-get update && \\
		apt-get install -y --no-install-recommends \\
			${kernelPkg} \\
			systemd-sysv \\
			live-boot \\
			${bootloaderPkgs} \\
			${fsPkg} \\
${extraSystemsPkgs ? `\t\t\t${extraSystemsPkgs} \\\n` : ''}			iproute2 \\
			iputils-ping \\
			netbase \\
			ca-certificates \\
			locales \\
			curl && \\
		if [ '$(DESKTOP_ENV)' = 'cage' ]; then \\
			apt-get install -y --no-install-recommends cage xwayland libgl1-mesa-dri; \\
		elif [ '$(DESKTOP_ENV)' = 'xfce' ]; then \\
			apt-get install -y --no-install-recommends xfce4-session xfwm4 xinit; \\
		elif [ '$(DESKTOP_ENV)' = 'kde' ]; then \\
			apt-get install -y --no-install-recommends plasma-workspace-wayland sddm; \\
		elif [ '$(DESKTOP_ENV)' = 'gnome' ]; then \\
			apt-get install -y --no-install-recommends gnome-session gdm3; \\
		fi && \\
		if [ '$(POWER_TUNING)' = 'laptop-battery' ]; then \\
			apt-get install -y --no-install-recommends tlp tlp-rdw thermald acpi-support powertop && \\
			systemctl enable tlp; \\
		elif [ '$(POWER_TUNING)' = 'low-power-idle' ]; then \\
			apt-get install -y --no-install-recommends thermald cpufrequtils && \\
			echo 'GOVERNOR=\"powersave\"' > /etc/default/cpufrequtils; \\
		elif [ '$(POWER_TUNING)' = 'handheld-tdp' ]; then \\
			apt-get install -y --no-install-recommends power-profiles-daemon steam-devices; \\
		fi && \\
		if [ '$(HARDWARE_TARGET)' = 'mac-hardware' ]; then \\
			apt-get install -y --no-install-recommends bcmwl-kernel-source; \\
		fi && \\
		if [ '$(ENABLE_DISTROBOX)' = '1' ]; then \\
			apt-get install -y --no-install-recommends podman distrobox; \\
		fi && \\
		if [ '$(ENABLE_FLATPAK)' = '1' ]; then \\
			apt-get install -y --no-install-recommends flatpak; \\
		fi && \\
		if [ '$(ENABLE_NIX)' = '1' ]; then \\
			apt-get install -y --no-install-recommends xz-utils sudo; \\
		fi && \\
		if [ '$(DOCKER_APP)' != 'none' ]; then \\
			apt-get install -y --no-install-recommends docker.io docker-compose && \\
			systemctl enable docker && \\
			mkdir -p /opt/$(DOCKER_APP); \\
		fi && \\
		echo '$(HOSTNAME)' > /etc/hostname && \\
		printf '127.0.0.1\\tlocalhost\\n127.0.1.1\\t%s\\n' '$(HOSTNAME)' > /etc/hosts && \\
		ln -sf /usr/share/zoneinfo/$(TIMEZONE) /etc/localtime && \\
		echo '$(TIMEZONE)' > /etc/timezone && \\
		echo 'KEYMAP=$(KEYMAP)' > /etc/vconsole.conf && \\
		(sed -i 's/^# *$(LOCALE)/$(LOCALE)/' /etc/locale.gen 2>/dev/null || echo '$(LOCALE) UTF-8' >> /etc/locale.gen) && \\
		locale-gen && \\
		echo 'LANG=$(LOCALE)' > /etc/default/locale && \\
		apt-get clean && \\
		rm -rf /var/lib/apt/lists/*"

	# If a Docker application is configured, stage its compose file
	@if [ '$(DOCKER_APP)' != 'none' ] && [ -f docker-compose.yml ]; then \\
		cp docker-compose.yml $(ROOTFS_DIR)/opt/$(DOCKER_APP)/docker-compose.yml; \\
		echo "[+] Bundled docker-compose.yml into /opt/$(DOCKER_APP)/"; \\
	fi

${credentialSetupSteps({ rootfs: '$(ROOTFS_DIR)', user: 'root', home: '/root', sudo: '', expire: true })}

${passthrough ? `	# IOMMU / VFIO device passthrough: kernel arguments and modules
	@mkdir -p $(ROOTFS_DIR)/etc/modules-load.d $(ROOTFS_DIR)/etc/default/grub.d
	@printf 'vfio\\nvfio_iommu_type1\\nvfio_pci\\n' > $(ROOTFS_DIR)/etc/modules-load.d/vfio.conf
	@printf 'GRUB_CMDLINE_LINUX_DEFAULT="$$GRUB_CMDLINE_LINUX_DEFAULT intel_iommu=on amd_iommu=on iommu=pt$(if $(VFIO_IDS), vfio-pci.ids=$(VFIO_IDS))"\\n' > $(ROOTFS_DIR)/etc/default/grub.d/10-vfio.cfg
	@echo "[+] VFIO passthrough configured (${passthrough}); set VFIO_IDS=vendor:device,... to bind devices at boot"

` : ''}${virtHost === 'bhyve' ? `	@echo "[!] VIRT_HOST=bhyve: bhyve is a FreeBSD / illumos hypervisor and is not available on this Debian image; use KVM or Xen here."

` : ''}	# Swapfile generation (if SWAP_SIZE_MB > 0)
	@if [ "$$(echo $(SWAP_SIZE_MB))" -gt 0 ] 2>/dev/null; then \\
		echo "[+] Allocating $(SWAP_SIZE_MB)MB swapfile..."; \\
		fallocate -l $(SWAP_SIZE_MB)M $(ROOTFS_DIR)/swapfile 2>/dev/null || dd if=/dev/zero of=$(ROOTFS_DIR)/swapfile bs=1M count=$(SWAP_SIZE_MB) status=none; \\
		chmod 600 $(ROOTFS_DIR)/swapfile; \\
		mkswap $(ROOTFS_DIR)/swapfile >/dev/null; \\
		echo '/swapfile none swap sw,nofail 0 0' >> $(ROOTFS_DIR)/etc/fstab; \\
	fi

	# Safe unmount
	umount -l $(ROOTFS_DIR)/dev/pts || true
	umount -l $(ROOTFS_DIR)/dev || true
	umount -l $(ROOTFS_DIR)/sys || true
	umount -l $(ROOTFS_DIR)/proc || true
	rm -f $(ROOTFS_DIR)/usr/bin/$(QEMU_USER_STATIC)

${dockerBuildTarget({
  image: 'debian:bookworm',
  platform: arch === 'arm64' ? 'linux/arm64' : 'linux/amd64',
  installCmd: `apt-get update && apt-get install -y --no-install-recommends make debootstrap genisoimage squashfs-tools ${arch === 'arm64' ? 'grub-efi-arm64-bin dosfstools' : firmwareMode === 'legacy-bios' ? 'grub-pc-bin' : 'grub-pc-bin grub-efi-amd64-bin'} mtools xorriso curl ca-certificates`
})}

iso: configure
	@echo "[+] Compressing rootfs into live squashfs image..."
	mkdir -p $(BUILD_DIR)/iso/live
	mkdir -p $(BUILD_DIR)/iso/boot/grub
	$(MKSQUASHFS) $(ROOTFS_DIR) $(BUILD_DIR)/iso/live/filesystem.squashfs -comp xz -wildcards -e "boot/*"
	cp $(ROOTFS_DIR)/boot/vmlinuz-* $(BUILD_DIR)/iso/boot/vmlinuz
	cp $(ROOTFS_DIR)/boot/initrd.img-* $(BUILD_DIR)/iso/boot/initrd.img
	
	@echo 'set timeout=3' > $(BUILD_DIR)/iso/boot/grub/grub.cfg
	@echo 'set default=0' >> $(BUILD_DIR)/iso/boot/grub/grub.cfg
	@echo 'menuentry "$(HOSTNAME) Live" {' >> $(BUILD_DIR)/iso/boot/grub/grub.cfg
	@echo '    linux /boot/vmlinuz quiet boot=live console=tty0' >> $(BUILD_DIR)/iso/boot/grub/grub.cfg
	@echo '    initrd /boot/initrd.img' >> $(BUILD_DIR)/iso/boot/grub/grub.cfg
	@echo '}' >> $(BUILD_DIR)/iso/boot/grub/grub.cfg

	grub-mkrescue -o $(OUTPUT_DIR)/$(ISO_NAME) $(BUILD_DIR)/iso
	@echo "[+] Generated: $(OUTPUT_DIR)/$(ISO_NAME)"
${secureBoot === 'own-keys' ? `
# Own-key Secure Boot: generate a signing key pair and sign the kernel with sbsign.
# Enroll output/secureboot/db.crt in your firmware (or MOK) before booting with Secure Boot on.
sign-boot: configure
	@mkdir -p $(OUTPUT_DIR)/secureboot
	openssl req -new -x509 -newkey rsa:2048 -nodes -days 3650 -subj "/CN=${distroName} Secure Boot/" \\
		-keyout $(OUTPUT_DIR)/secureboot/db.key -out $(OUTPUT_DIR)/secureboot/db.crt
	sbsign --key $(OUTPUT_DIR)/secureboot/db.key --cert $(OUTPUT_DIR)/secureboot/db.crt \\
		--output $(BUILD_DIR)/iso/boot/vmlinuz.signed $(BUILD_DIR)/iso/boot/vmlinuz
` : ''}${secureBoot === 'required' ? `
secure-boot-note:
	@echo "[i] Secure Boot=required: the image installs shim-signed + signed GRUB (Microsoft-signed shim chain)."
` : ''}
# Docker App Management Targets
app-up:
	@if [ '$(DOCKER_APP)' = 'none' ]; then \\
		echo "[-] No turnkey Docker app selected."; \\
	else \\
		echo "[+] Launching $(DOCKER_APP) via Docker Compose..."; \\
		docker compose -f docker-compose.yml up -d; \\
	fi

app-down:
	@docker compose -f docker-compose.yml down

app-logs:
	@docker compose -f docker-compose.yml logs -f

clean:
	@echo "[+] Cleaning artifacts..."
	umount -l $(ROOTFS_DIR)/dev/pts 2>/dev/null || true
	umount -l $(ROOTFS_DIR)/dev 2>/dev/null || true
	umount -l $(ROOTFS_DIR)/sys 2>/dev/null || true
	umount -l $(ROOTFS_DIR)/proc 2>/dev/null || true
	rm -rf $(BUILD_DIR)
`;

  const readmeContent = `# ${distroName} Build Instructions

This recipe builds a bare-metal bootable ISO based on a stripped Debian \`minbase\` core with custom modular layers.

## Configured Layers:
* **Architecture:** \`${arch}\`
* **Form Factor:** \`${formFactor}\`
* **Power & Battery Profile:** \`${powerTuningProfile}\`
* **Desktop Environment:** \`${desktopEnv}\`
* **Distrobox Hybrid:** \`${enableDistrobox === '1' ? 'Enabled (Arch AUR on Debian)' : 'Disabled'}\`
* **Nix Package Layer:** \`${enableNix === '1' ? 'Enabled' : 'Disabled'}\`
* **Turnkey Docker App:** \`${dockerAppDef ? `${dockerAppDef.name} (${dockerAppDef.tagline})` : 'None (Pure Minimal OS)'}\`

## Prerequisites
- **macOS / Windows / non-Debian hosts:** Install **Docker** (and **QEMU** if you want to simulate-boot the ISO locally), then skip \`apt-get\` and use \`make docker-build\`.
- **Debian / Ubuntu Linux hosts:** Install the native build tools (add \`qemu-user-static\` if cross-building for a different architecture):
\`\`\`bash
sudo apt-get update
sudo apt-get install -y debootstrap genisoimage ${arch === 'arm64' ? 'grub-efi-arm64-bin' : 'grub-pc-bin grub-efi-amd64-bin'} mtools xorriso
\`\`\`

## Build
Run inside a privileged Docker container (recommended on macOS, Windows, and cross-architecture hosts):
\`\`\`bash
make docker-build
\`\`\`
Or run natively with root permissions on a Debian/Ubuntu Linux host:
\`\`\`bash
sudo make
\`\`\`
${
  desktopApps.length > 0 || emulatorApps.length > 0 || navigationApps.length > 0
    ? `
## 1-Click Application Bootstrap Scripts
Once the ISO is booted on your target machine or VM, run the included setup script(s):
\`\`\`bash
${desktopApps.length > 0 ? 'sudo bash bootstrap-apps.sh\n' : ''}${emulatorApps.length > 0 ? 'sudo bash bootstrap-emulators.sh\n' : ''}${navigationApps.length > 0 ? 'sudo bash bootstrap-navigation.sh\n' : ''}\`\`\`
`
    : ''
}
## Regenerate via DistroTailor CLI
\`\`\`bash
npx tsx packages/cli/src/index.ts export --recipe debootstrap-debian --arch ${criteria.architecture || 'x86_64'} --out .
\`\`\`

${dockerAppDef ? `
## Turnkey 1-Click App: ${dockerAppDef.name}
To spin up ${dockerAppDef.name} immediately on any Docker host using the included \`docker-compose.yml\`:
\`\`\`bash
docker compose up -d
\`\`\`
* **Access URL:** ${dockerAppDef.webUrl}
* **Default Port:** ${dockerAppDef.defaultPort}
* **Description:** ${dockerAppDef.description}
` : ''}

## 🧪 3-Tier Verification & Testing Ladder
\`\`\`bash
# Safe VM Sandbox (QEMU):
${
  arch === 'arm64'
    ? `qemu-system-aarch64 -M virt -m 2048 -cpu cortex-a57 -bios /usr/share/AAVMF/AAVMF_CODE.fd -cdrom output/${distroName}-1.0.0-${arch}.iso
# On Apple Silicon macOS (Hypervisor.framework acceleration):
qemu-system-aarch64 -M virt -accel hvf -cpu host -m 2048 -bios "$(brew --prefix qemu)/share/qemu/edk2-aarch64-code.fd" -cdrom output/${distroName}-1.0.0-${arch}.iso -device virtio-gpu-pci -display cocoa -device qemu-xhci -device usb-kbd`
    : `qemu-system-x86_64 -cdrom output/${distroName}-1.0.0-${arch}.iso -m 2048 -enable-kvm
# On macOS (omit -enable-kvm):
qemu-system-x86_64 -cdrom output/${distroName}-1.0.0-${arch}.iso -m 2048 -display cocoa`
}
\`\`\`
* **Login:** no fixed password. \`make\` sets a random root password (saved to \`output/credentials.txt\`, must be changed at first login) and authorizes your SSH public key if one is found (\`make SSH_PUBKEY=path/to/key.pub\` / \`LOGIN_PASSWORD=...\` to override)
`;

  const files: GeneratedRecipe['files'] = [
    {
      filename: 'Makefile',
      description: 'Complete build automation target for rootfs bootstrapping, desktop environment, and Docker configuration',
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

  files.push({
    filename: 'README.md',
    description: 'Step-by-step build instructions, app quickstart, and QEMU test guide',
    content: readmeContent
  });

  const quickstartCommands = [
    `sudo apt-get install -y debootstrap genisoimage ${arch === 'arm64' ? 'grub-efi-arm64-bin' : 'grub-pc-bin'} xorriso`,
    'make detect-hardware  # (Optional: audit active NIC, Wi-Fi & GPU inventory)',
    'sudo make             # Linux host (or: make docker-build on macOS / Windows / cross-arch)'
  ];

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
        ? `qemu-system-aarch64 -M virt -m 2048 -cdrom output/${distroName}-1.0.0-${arch}.iso  # See README.md for macOS HVF flags`
        : `qemu-system-x86_64 -cdrom output/${distroName}-1.0.0-${arch}.iso -m 1024`
    );
  }

  return {
    id: 'debootstrap-debian',
    title: dockerStack.summaryLabel
      ? `Tailored Debian + ${dockerStack.summaryLabel} Appliance`
      : 'Custom Minimal Debian Appliance (Debootstrap)',
    summary: dockerStack.summaryLabel
      ? `Compiles a lean Debian base (~250MB) and bundles production-ready ${dockerStack.summaryLabel} Docker stack(s).`
      : 'Compiles a lean, standalone Debian distribution (~250MB) with a tailored kernel, systemd, and bootable GRUB ISO.',
    targetFormat: 'iso',
    estimatedBuildTimeMinutes: 5,
    hostDependencies: ['debootstrap', 'genisoimage', arch === 'arm64' ? 'grub-efi-arm64-bin' : 'grub-pc-bin', 'xorriso'],
    files,
    quickstartCommands
  };
}
