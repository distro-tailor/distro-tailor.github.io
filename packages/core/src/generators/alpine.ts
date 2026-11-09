import { GeneratedRecipe, UserCriteria } from '../types.js';

export function generateAlpineRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture === 'arm64' ? 'aarch64' : 'x86_64';
  const distroName = 'TailoredAlpine';

  const makefileContent = `# ==============================================================================
# DistroTailor: Alpine Linux Minimal RootFS / Diskless Builder
# Target: Alpine Linux (${arch}) with musl libc + OpenRC
# ==============================================================================

DISTRO_NAME ?= ${distroName}
VERSION     ?= 3.20.0
ARCH        ?= ${arch}
ALPINE_MIRROR ?= https://dl-cdn.alpinelinux.org/alpine/v3.20

BUILD_DIR   ?= ./build
ROOTFS_DIR  ?= $(BUILD_DIR)/rootfs
OUTPUT_DIR  ?= ./output
TARBALL_NAME ?= $(DISTRO_NAME)-$(ARCH).tar.gz

.PHONY: all clean check-root prepare rootfs configure tarball

all: clean prepare rootfs configure tarball
	@echo "===================================================="
	@echo " Build Complete! RootFS Tarball: $(OUTPUT_DIR)/$(TARBALL_NAME)"
	@echo " Footprint: ~15MB compressed"
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
	curl -sSL "$(ALPINE_MIRROR)/releases/$(ARCH)/alpine-minirootfs-$(VERSION)-$(ARCH).tar.gz" -o $(BUILD_DIR)/base.tar.gz
	tar -xzf $(BUILD_DIR)/base.tar.gz -C $(ROOTFS_DIR)

configure: rootfs
	@echo "[+] Configuring OpenRC services and network..."
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
		echo '${distroName}' > /etc/hostname && \\
		echo 'root:tailor' | chpasswd"

	umount -l $(ROOTFS_DIR)/dev || true
	umount -l $(ROOTFS_DIR)/sys || true
	umount -l $(ROOTFS_DIR)/proc || true

tarball: configure
	@echo "[+] Bundling rootfs into portable tarball..."
	cd $(ROOTFS_DIR) && tar -czf ../../$(OUTPUT_DIR)/$(TARBALL_NAME) .
	@echo "[+] Built: $(OUTPUT_DIR)/$(TARBALL_NAME)"

clean:
	@umount -l $(ROOTFS_DIR)/dev 2>/dev/null || true
	@umount -l $(ROOTFS_DIR)/sys 2>/dev/null || true
	@umount -l $(ROOTFS_DIR)/proc 2>/dev/null || true
	@rm -rf $(BUILD_DIR)
`;

  return {
    id: 'alpine-chroot',
    title: 'Ultra-Minimal Alpine musl/OpenRC RootFS',
    summary:
      'Creates a high-speed, sub-20MB Alpine Linux root filesystem using musl libc and OpenRC for containers, chroots, or diskless PXE boots.',
    targetFormat: 'tarball',
    estimatedBuildTimeMinutes: 2,
    hostDependencies: ['curl', 'tar', 'chroot'],
    files: [
      {
        filename: 'Makefile',
        description: 'Automated Alpine mini-rootfs hydration, OpenRC service enablement, and packaging',
        content: makefileContent
      }
    ],
    quickstartCommands: [
      'sudo make',
      `tar -tzf output/${distroName}-${arch}.tar.gz | head -n 20`
    ]
  };
}
