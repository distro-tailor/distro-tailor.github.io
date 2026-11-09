import { GeneratedRecipe, UserCriteria } from '../types.js';

export function generateDebootstrapRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture === 'arm64' ? 'arm64' : 'amd64';
  const distroName = 'TailoredDebian';

  const makefileContent = `# ==============================================================================
# DistroTailor: Debootstrap Minimal Linux Builder
# Target: Debian Minimal (bootable ISO & rootfs)
# Architecture: ${arch}
# ==============================================================================

DISTRO_NAME ?= ${distroName}
VERSION     ?= 1.0.0
ARCH        ?= ${arch}
SUITE       ?= bookworm
MIRROR      ?= http://deb.debian.org/debian

BUILD_DIR   ?= ./build
ROOTFS_DIR  ?= $(BUILD_DIR)/rootfs
OUTPUT_DIR  ?= ./output
ISO_NAME    ?= $(DISTRO_NAME)-$(VERSION)-$(ARCH).iso

# Required host tools
DEBOOTSTRAP ?= debootstrap
GENISOIMAGE ?= genisoimage
MKSQUASHFS  ?= mksquashfs

.PHONY: all clean check-root prepare rootfs configure iso

all: clean prepare rootfs configure iso
	@echo "===================================================="
	@echo " Build Complete! Image: $(OUTPUT_DIR)/$(ISO_NAME)"
	@echo "===================================================="

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
			grub-pc-bin \\
			grub-efi-${arch}-bin \\
			iproute2 \\
			iputils-ping \\
			netbase \\
			ca-certificates \\
			curl && \\
		echo '${distroName}' > /etc/hostname && \\
		echo 'root:tailor' | chpasswd && \\
		apt-get clean && \\
		rm -rf /var/lib/apt/lists/*"

	# Safe unmount
	umount -l $(ROOTFS_DIR)/dev/pts || true
	umount -l $(ROOTFS_DIR)/dev || true
	umount -l $(ROOTFS_DIR)/sys || true
	umount -l $(ROOTFS_DIR)/proc || true

iso: configure
	@echo "[+] Generating bootable ISO..."
	mkdir -p $(BUILD_DIR)/iso/boot/grub
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

clean:
	@echo "[+] Cleaning artifacts..."
	umount -l $(ROOTFS_DIR)/dev/pts 2>/dev/null || true
	umount -l $(ROOTFS_DIR)/dev 2>/dev/null || true
	umount -l $(ROOTFS_DIR)/sys 2>/dev/null || true
	umount -l $(ROOTFS_DIR)/proc 2>/dev/null || true
	rm -rf $(BUILD_DIR)
`;

  const readmeContent = `# ${distroName} Build Instructions

This recipe builds a bare-metal bootable ISO based on a stripped Debian \`minbase\` core.

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

## Test with QEMU
\`\`\`bash
qemu-system-x86_64 -cdrom output/${distroName}-1.0.0-${arch}.iso -m 1024 -enable-kvm
\`\`\`
Default credentials: \`root\` / \`tailor\`
`;

  return {
    id: 'debootstrap-debian',
    title: 'Custom Minimal Debian Appliance (Debootstrap)',
    summary:
      'Compiles a lean, standalone Debian distribution (~250MB) with a tailored kernel, systemd, and bootable GRUB ISO.',
    targetFormat: 'iso',
    estimatedBuildTimeMinutes: 5,
    hostDependencies: ['debootstrap', 'genisoimage', 'grub-pc-bin', 'libisoburn'],
    files: [
      {
        filename: 'Makefile',
        description: 'Complete build automation target for rootfs bootstrapping, configuration, and ISO creation',
        content: makefileContent
      },
      {
        filename: 'README.md',
        description: 'Step-by-step build, requirements, and QEMU test guide',
        content: readmeContent
      }
    ],
    quickstartCommands: [
      'sudo apt-get install -y debootstrap genisoimage grub-pc-bin libisoburn',
      'sudo make',
      `qemu-system-x86_64 -cdrom output/${distroName}-1.0.0-${arch}.iso -m 1024`
    ]
  };
}
