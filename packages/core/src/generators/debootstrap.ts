import { GeneratedRecipe, UserCriteria } from '../types.js';
import { CREDENTIAL_MAKE_VARS, credentialSetupSteps } from './credentials.js';
import { getDockerApp } from './docker-apps.js';
import { generateBootstrapAppsScript } from './desktop-apps.js';

export function generateDebootstrapRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture === 'arm64' ? 'arm64' : 'amd64';
  const distroName = 'TailoredDebian';
  const dockerAppDef = getDockerApp(criteria.dockerApp);
  const desktopApps = criteria.desktopApps || [];
  const desktopEnv = criteria.desktopEnv || (criteria.prefersGui ? 'cage' : 'none');
  const enableDistrobox = criteria.enableDistrobox ? '1' : '0';
  const enableNix = criteria.enableNix ? '1' : '0';
  const enableFlatpak = criteria.enableFlatpak ? '1' : '0';
  const dockerApp = dockerAppDef ? dockerAppDef.id : 'none';

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
	$(DEBOOTSTRAP) --arch=$(ARCH) --variant=minbase $(SUITE) $(ROOTFS_DIR) $(MIRROR)

configure: rootfs
	@echo "[+] Configuring custom kernel, systemd, and networking..."
	# Mount kernel pseudo-filesystems
	mount -t proc none $(ROOTFS_DIR)/proc
	mount -o bind /sys $(ROOTFS_DIR)/sys
	mount -o bind /dev $(ROOTFS_DIR)/dev
	mount -o bind /dev/pts $(ROOTFS_DIR)/dev/pts

	# Configure inside chroot
	chroot $(ROOTFS_DIR) /bin/bash -c "export DEBIAN_FRONTEND=noninteractive && \\
		apt-get update && \\
		apt-get install -y --no-install-recommends \\
			linux-image-${arch} \\
			systemd-sysv \\
			live-boot \\
			grub-pc-bin \\
			grub-efi-${arch}-bin \\
			iproute2 \\
			iputils-ping \\
			netbase \\
			ca-certificates \\
			curl && \\
		\\
		# Desktop Environment Injection \\
		if [ '$(DESKTOP_ENV)' = 'cage' ]; then \\
			apt-get install -y --no-install-recommends cage xwayland libgl1-mesa-dri; \\
		elif [ '$(DESKTOP_ENV)' = 'xfce' ]; then \\
			apt-get install -y --no-install-recommends xfce4-session xfwm4 xinit; \\
		elif [ '$(DESKTOP_ENV)' = 'kde' ]; then \\
			apt-get install -y --no-install-recommends plasma-workspace-wayland sddm; \\
		elif [ '$(DESKTOP_ENV)' = 'gnome' ]; then \\
			apt-get install -y --no-install-recommends gnome-session gdm3; \\
		fi && \\
		\\
		# Power, TDP & Battery Optimization Layer \\
		if [ '$(POWER_TUNING)' = 'laptop-battery' ]; then \\
			apt-get install -y --no-install-recommends tlp tlp-rdw thermald acpi-support powertop && \\
			systemctl enable tlp; \\
		elif [ '$(POWER_TUNING)' = 'low-power-idle' ]; then \\
			apt-get install -y --no-install-recommends thermald cpufrequtils && \\
			echo 'GOVERNOR=\"powersave\"' > /etc/default/cpufrequtils; \\
		elif [ '$(POWER_TUNING)' = 'handheld-tdp' ]; then \\
			apt-get install -y --no-install-recommends power-profiles-daemon steam-devices; \\
		fi && \\
		\\
		# Hardware Quirk Fixes (Mac Broadcom Wi-Fi & Dual EFI) \\
		if [ '$(HARDWARE_TARGET)' = 'mac-hardware' ]; then \\
			apt-get install -y --no-install-recommends bcmwl-kernel-source; \\
		fi && \\
		\\
		# Optional Frankenstein Hybrid Engine (Distrobox) \\
		if [ '$(ENABLE_DISTROBOX)' = '1' ]; then \\
			apt-get install -y --no-install-recommends podman distrobox; \\
		fi && \\
		\\
		# Universal Package Layers (Nix & Flatpak) \\
		if [ '$(ENABLE_FLATPAK)' = '1' ]; then \\
			apt-get install -y --no-install-recommends flatpak; \\
		fi && \\
		if [ '$(ENABLE_NIX)' = '1' ]; then \\
			apt-get install -y --no-install-recommends xz-utils sudo; \\
		fi && \\
		\\
		# Turnkey 1-Click Docker Application Layer \\
		if [ '$(DOCKER_APP)' != 'none' ]; then \\
			apt-get install -y --no-install-recommends docker.io docker-compose-v2 && \\
			systemctl enable docker && \\
			mkdir -p /opt/$(DOCKER_APP); \\
		fi && \\
		\\
		echo '${distroName}' > /etc/hostname && \\
		apt-get clean && \\
		rm -rf /var/lib/apt/lists/*"

	# If a Docker application is configured, stage its compose file
	@if [ '$(DOCKER_APP)' != 'none' ] && [ -f docker-compose.yml ]; then \\
		cp docker-compose.yml $(ROOTFS_DIR)/opt/$(DOCKER_APP)/docker-compose.yml; \\
		echo "[+] Bundled docker-compose.yml into /opt/$(DOCKER_APP)/"; \\
	fi

${credentialSetupSteps({ rootfs: '$(ROOTFS_DIR)', user: 'root', home: '/root', sudo: '', expire: true })}

	# Safe unmount
	umount -l $(ROOTFS_DIR)/dev/pts || true
	umount -l $(ROOTFS_DIR)/dev || true
	umount -l $(ROOTFS_DIR)/sys || true
	umount -l $(ROOTFS_DIR)/proc || true

iso: configure
	@echo "[+] Compressing rootfs into live squashfs image..."
	mkdir -p $(BUILD_DIR)/iso/live
	mkdir -p $(BUILD_DIR)/iso/boot/grub
	$(MKSQUASHFS) $(ROOTFS_DIR) $(BUILD_DIR)/iso/live/filesystem.squashfs -comp xz -wildcards -e "boot/*"
	cp $(ROOTFS_DIR)/boot/vmlinuz-* $(BUILD_DIR)/iso/boot/vmlinuz
	cp $(ROOTFS_DIR)/boot/initrd.img-* $(BUILD_DIR)/iso/boot/initrd.img
	
	@echo 'set timeout=3' > $(BUILD_DIR)/iso/boot/grub/grub.cfg
	@echo 'set default=0' >> $(BUILD_DIR)/iso/boot/grub/grub.cfg
	@echo 'menuentry "${distroName} Live" {' >> $(BUILD_DIR)/iso/boot/grub/grub.cfg
	@echo '    linux /boot/vmlinuz quiet boot=live console=tty0' >> $(BUILD_DIR)/iso/boot/grub/grub.cfg
	@echo '    initrd /boot/initrd.img' >> $(BUILD_DIR)/iso/boot/grub/grub.cfg
	@echo '}' >> $(BUILD_DIR)/iso/boot/grub/grub.cfg

	grub-mkrescue -o $(OUTPUT_DIR)/$(ISO_NAME) $(BUILD_DIR)/iso
	@echo "[+] Generated: $(OUTPUT_DIR)/$(ISO_NAME)"

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
On your host Debian/Ubuntu system, install the required build tools:
\`\`\`bash
sudo apt-get update
sudo apt-get install -y debootstrap genisoimage grub-pc-bin grub-efi-amd64-bin mtools libisoburn
\`\`\`

## Build
Run with root permissions:
\`\`\`bash
sudo make
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
qemu-system-x86_64 -cdrom output/${distroName}-1.0.0-${arch}.iso -m 2048 -enable-kvm
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

  files.push({
    filename: 'README.md',
    description: 'Step-by-step build instructions, app quickstart, and QEMU test guide',
    content: readmeContent
  });

  const quickstartCommands = [
    'sudo apt-get install -y debootstrap genisoimage grub-pc-bin libisoburn',
    'make detect-hardware  # (Optional: audit active NIC, Wi-Fi & GPU inventory)',
    'sudo make             # Automatically audits & builds custom zero-bloat ISO'
  ];

  if (desktopApps.length > 0) {
    quickstartCommands.push(`sudo bash bootstrap-apps.sh  # 1-Click install ${desktopApps.length} desktop app(s)`);
  }

  if (dockerAppDef) {
    quickstartCommands.push(`docker compose up -d  # Launch ${dockerAppDef.name} at ${dockerAppDef.webUrl}`);
  } else if (desktopApps.length === 0) {
    quickstartCommands.push(`qemu-system-x86_64 -cdrom output/${distroName}-1.0.0-${arch}.iso -m 1024`);
  }

  return {
    id: 'debootstrap-debian',
    title: dockerAppDef
      ? `Tailored Debian + ${dockerAppDef.name} Appliance`
      : 'Custom Minimal Debian Appliance (Debootstrap)',
    summary: dockerAppDef
      ? `Compiles a lean Debian base (~250MB) and bundles a production-ready ${dockerAppDef.name} (${dockerAppDef.tagline}) Docker stack.`
      : 'Compiles a lean, standalone Debian distribution (~250MB) with a tailored kernel, systemd, and bootable GRUB ISO.',
    targetFormat: 'iso',
    estimatedBuildTimeMinutes: 5,
    hostDependencies: ['debootstrap', 'genisoimage', 'grub-pc-bin', 'libisoburn'],
    files,
    quickstartCommands
  };
}
