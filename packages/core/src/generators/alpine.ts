import { GeneratedRecipe, UserCriteria } from '../types.js';
import { getDockerApp } from './docker-apps.js';
import { generateBootstrapAppsScript } from './desktop-apps.js';
import { ALPINE_MINIROOTFS_SHA256 } from './checksums.js';

export function generateAlpineRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture === 'arm64' ? 'aarch64' : 'x86_64';
  const distroName = 'TailoredAlpine';
  const dockerAppDef = getDockerApp(criteria.dockerApp);
  const desktopApps = criteria.desktopApps || [];
  const dockerApp = dockerAppDef ? dockerAppDef.id : 'none';

  const makefileContent = `# ==============================================================================
# DistroTailor: Alpine Linux Minimal RootFS / Diskless Builder
# Target: Alpine Linux (${arch}) with musl libc + OpenRC
# ==============================================================================

DISTRO_NAME ?= ${distroName}
VERSION     ?= 3.20.0
ARCH        ?= ${arch}
ALPINE_MIRROR ?= https://dl-cdn.alpinelinux.org/alpine/v3.20
# Published SHA-256 of alpine-minirootfs-$(VERSION)-$(ARCH).tar.gz (override when changing VERSION/ARCH)
ALPINE_SHA256 ?= ${ALPINE_MINIROOTFS_SHA256[arch]}

# Turnkey Docker App Layer
DOCKER_APP  ?= ${dockerApp}

BUILD_DIR   ?= ./build
ROOTFS_DIR  ?= $(BUILD_DIR)/rootfs
OUTPUT_DIR  ?= ./output
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
		apk add --no-cache openrc util-linux ca-certificates openssh-server curl && \\
		rc-update add bootmisc boot && \\
		rc-update add hostname boot && \\
		rc-update add networking boot && \\
		if [ '$(DOCKER_APP)' != 'none' ]; then \\
			apk add --no-cache docker docker-cli-compose && \\
			rc-update add docker default && \\
			mkdir -p /opt/$(DOCKER_APP); \\
		fi && \\
		echo '${distroName}' > /etc/hostname && \\
		echo 'root:tailor' | chpasswd"

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

  const quickstartCommands = ['sudo make'];
  if (desktopApps.length > 0) {
    quickstartCommands.push(`sudo bash bootstrap-apps.sh  # 1-Click install ${desktopApps.length} desktop app(s)`);
  }
  if (dockerAppDef) {
    quickstartCommands.push(`docker compose up -d  # Launch ${dockerAppDef.name} at ${dockerAppDef.webUrl}`);
  } else if (desktopApps.length === 0) {
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
