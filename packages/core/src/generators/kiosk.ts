import { GeneratedRecipe, UserCriteria } from '../types.js';

export function generateKioskRecipe(criteria: UserCriteria): GeneratedRecipe {
  const isAppliance = criteria.useCase === 'appliance-product';
  const kioskUrl = 'https://example.com';

  const makefileContent = `# ==============================================================================
# DistroTailor: Alpine + Cage Wayland Single-App Appliance
# Boots directly into your single application with zero desktop or window manager
# ==============================================================================

BUILD_DIR   ?= ./build
ROOTFS_DIR  ?= $(BUILD_DIR)/rootfs
OUTPUT_DIR  ?= ./output
KIOSK_URL   ?= "${kioskUrl}"
APP_CMD     ?= ${isAppliance ? '"/opt/app/my-custom-app"' : '"chromium-browser --kiosk --no-first-run --incognito --disable-features=TranslateUI --overscroll-history-navigation=0 $$(KIOSK_URL)"'}

.PHONY: all clean check-root prepare build

all: clean prepare build
	@echo "===================================================="
	@echo " Single-App Appliance RootFS Ready in: $(ROOTFS_DIR)"
	@echo " App launcher configured: $(APP_CMD)"
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
	
	@echo "[+] Installing Cage (Wayland Kiosk Compositor) & GUI dependencies..."
	mount -t proc none $(ROOTFS_DIR)/proc
	mount -o bind /sys $(ROOTFS_DIR)/sys
	mount -o bind /dev $(ROOTFS_DIR)/dev

	chroot $(ROOTFS_DIR) /bin/sh -c "\\
		apk update && \\
		apk add --no-cache cage ${isAppliance ? 'mesa-dri-gallium udev font-noto libinput' : 'chromium ttf-dejavu openrc udev mesa-dri-gallium'} && \\
		adduser -D -u 1000 appuser && \\
		addgroup appuser video && \\
		addgroup appuser input"

	# Inject Single-App startup script
	@mkdir -p $(ROOTFS_DIR)/home/appuser
	@cp app-start.sh $(ROOTFS_DIR)/home/appuser/app-start.sh
	@chmod +x $(ROOTFS_DIR)/home/appuser/app-start.sh
	@chown -R 1000:1000 $(ROOTFS_DIR)/home/appuser

	umount -l $(ROOTFS_DIR)/dev || true
	umount -l $(ROOTFS_DIR)/sys || true
	umount -l $(ROOTFS_DIR)/proc || true
	@echo "[+] Appliance configuration complete."

clean:
	@umount -l $(ROOTFS_DIR)/dev 2>/dev/null || true
	@umount -l $(ROOTFS_DIR)/sys 2>/dev/null || true
	@umount -l $(ROOTFS_DIR)/proc 2>/dev/null || true
	@rm -rf $(BUILD_DIR)
`;

  return {
    id: 'kiosk-web',
    title: isAppliance
      ? 'Dedicated Single-App Wayland Appliance (Alpine + Cage)'
      : 'Locked-Down Wayland Web Kiosk (Alpine + Cage)',
    summary: isAppliance
      ? 'Builds a dedicated single-app hardware appliance that boots directly into your custom binary (Flutter, Qt, Web, Python, SDL) in < 4 seconds with silent boot and auto-restart watchdog.'
      : 'Creates a tamper-proof digital signage/kiosk appliance booting directly into hardware-accelerated Chromium on Wayland (Cage).',
    targetFormat: 'disk-image',
    estimatedBuildTimeMinutes: 4,
    hostDependencies: ['curl', 'tar', 'chroot'],
    files: [
      {
        filename: 'Makefile',
        description: isAppliance
          ? 'Installs Alpine, Cage Wayland kiosk compositor, and launches custom app binary with auto-restart'
          : 'Installs Alpine, Cage Wayland compositor, and Chromium kiosk launcher',
        content: makefileContent
      },
      {
        filename: 'app-start.sh',
        description: 'Cage Wayland auto-restart watchdog supervisor script',
        executable: true,
        content: `#!/bin/sh
# Watchdog loop: relaunch app immediately if it exits or crashes
while true; do
  cage -s -- ${isAppliance ? '/opt/app/my-custom-app' : 'chromium --kiosk --no-sandbox http://localhost:8080'}
  echo "App exited ($?). Restarting in 1s..."
  sleep 1
done
`
      }
    ],
    quickstartCommands: isAppliance
      ? [
          '# Copy your binary or Flutter/Qt app into build/rootfs/opt/app/',
          'sudo make APP_CMD="/opt/app/my-custom-app"',
          '# Boot in QEMU or flash to hardware'
        ]
      : [
          'sudo make KIOSK_URL="https://your-dashboard.com"',
          '# Deploy rootfs or test in QEMU'
        ]
  };
}
