import { GeneratedRecipe, UserCriteria } from '../types.js';

export function generateKioskRecipe(criteria: UserCriteria): GeneratedRecipe {
  const kioskUrl = 'https://example.com';

  const makefileContent = `# ==============================================================================
# DistroTailor: Alpine + Cage Wayland Kiosk Appliance
# Boots directly into full-screen Chromium with zero window manager or desktop
# ==============================================================================

BUILD_DIR   ?= ./build
ROOTFS_DIR  ?= $(BUILD_DIR)/rootfs
OUTPUT_DIR  ?= ./output
KIOSK_URL   ?= "${kioskUrl}"

.PHONY: all clean check-root prepare build

all: clean prepare build
	@echo "===================================================="
	@echo " Kiosk Appliance RootFS Ready in: $(ROOTFS_DIR)"
	@echo "===================================================="

check-root:
	@if [ $$(id -u) -ne 0 ]; then \\
		echo "[-] Run with sudo make"; \\
		exit 1; \\
	fi

prepare: check-root
	@mkdir -p $(ROOTFS_DIR) $(OUTPUT_DIR)

build: prepare
	@echo "[+] Bootstrapping Alpine Base..."
	curl -sSL "https://dl-cdn.alpinelinux.org/alpine/v3.20/releases/x86_64/alpine-minirootfs-3.20.0-x86_64.tar.gz" | tar -xz -C $(ROOTFS_DIR)
	
	@echo "[+] Installing Cage (Wayland Kiosk Compositor) & Chromium..."
	mount -t proc none $(ROOTFS_DIR)/proc
	mount -o bind /sys $(ROOTFS_DIR)/sys
	mount -o bind /dev $(ROOTFS_DIR)/dev

	chroot $(ROOTFS_DIR) /bin/sh -c "\\
		apk update && \\
		apk add --no-cache cage chromium ttf-dejavu openrc udev mesa-dri-gallium && \\
		adduser -D -u 1000 kiosk && \\
		addgroup kiosk video && \\
		addgroup kiosk input"

	# Inject Kiosk startup script
	@echo '#!/bin/sh' > $(ROOTFS_DIR)/home/kiosk/kiosk-start.sh
	@echo 'exec cage -- chromium-browser --kiosk --no-first-run --incognito --disable-features=TranslateUI --overscroll-history-navigation=0 "$(KIOSK_URL)"' >> $(ROOTFS_DIR)/home/kiosk/kiosk-start.sh
	@chmod +x $(ROOTFS_DIR)/home/kiosk/kiosk-start.sh
	@chown 1000:1000 $(ROOTFS_DIR)/home/kiosk/kiosk-start.sh

	umount -l $(ROOTFS_DIR)/dev || true
	umount -l $(ROOTFS_DIR)/sys || true
	umount -l $(ROOTFS_DIR)/proc || true
	@echo "[+] Kiosk configuration complete."

clean:
	@umount -l $(ROOTFS_DIR)/dev 2>/dev/null || true
	@umount -l $(ROOTFS_DIR)/sys 2>/dev/null || true
	@umount -l $(ROOTFS_DIR)/proc 2>/dev/null || true
	@rm -rf $(BUILD_DIR)
`;

  return {
    id: 'kiosk-web',
    title: 'Locked-Down Wayland Web Kiosk (Alpine + Cage)',
    summary:
      'Creates a tamper-proof digital signage/kiosk appliance booting directly into hardware-accelerated Chromium on Wayland (Cage).',
    targetFormat: 'disk-image',
    estimatedBuildTimeMinutes: 4,
    hostDependencies: ['curl', 'tar', 'chroot'],
    files: [
      {
        filename: 'Makefile',
        description: 'Installs Alpine, Cage Wayland compositor, and Chromium kiosk launcher',
        content: makefileContent
      }
    ],
    quickstartCommands: [
      'sudo make KIOSK_URL="https://your-dashboard.com"',
      '# Deploy rootfs or test in QEMU'
    ]
  };
}
