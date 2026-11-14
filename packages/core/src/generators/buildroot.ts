import { GeneratedRecipe, UserCriteria } from '../types.js';
import { BUILDROOT_DOWNLOADS, BUILDROOT_TARBALL_SHA256, BUILDROOT_VERSION } from './checksums.js';
import { generateBootstrapNavigationScript } from './navigation-apps.js';

export function generateBuildrootRecipe(criteria: UserCriteria): GeneratedRecipe {
  const isNoMmu = criteria.architecture === 'nommu';
  const targetArch = isNoMmu ? 'arm' : criteria.architecture === 'arm64' ? 'aarch64' : 'x86_64';
  const libc = isNoMmu ? 'uclibc' : 'musl';
  const navigationApps = criteria.navigationApps || [];

  const makefileContent = `# ==============================================================================
# DistroTailor: Buildroot Embedded Linux Toolchain & Kernel Generator
# Target Architecture: ${targetArch} (${isNoMmu ? 'NOMMU Microcontroller' : 'Embedded Board'})
# C Library: ${libc}
# ==============================================================================

BUILDROOT_VERSION ?= ${BUILDROOT_VERSION}
BUILDROOT_URL     ?= ${BUILDROOT_DOWNLOADS}/buildroot-$(BUILDROOT_VERSION).tar.gz
# Published SHA-256 from buildroot-$(BUILDROOT_VERSION).tar.gz.sign (override when changing version)
BUILDROOT_SHA256  ?= ${BUILDROOT_TARBALL_SHA256}
SRC_DIR           ?= buildroot-$(BUILDROOT_VERSION)

.PHONY: all fetch-buildroot configure build clean menuconfig

all: fetch-buildroot configure build
	@echo "===================================================="
	@echo " Build Complete!"
	@echo " Output Image: $(SRC_DIR)/output/images/rootfs.tar"
	@echo " Kernel:       $(SRC_DIR)/output/images/zImage"
	@echo "===================================================="

fetch-buildroot:
	@if [ ! -d "$(SRC_DIR)" ]; then \\
		echo "[+] Fetching Buildroot source tree..."; \\
		curl -fsSL $(BUILDROOT_URL) -o buildroot.tar.gz && \\
		echo "$(BUILDROOT_SHA256)  buildroot.tar.gz" | sha256sum -c - && \\
		tar -xzf buildroot.tar.gz && rm buildroot.tar.gz; \\
	fi

configure: fetch-buildroot
	@echo "[+] Injecting tailored defconfig into Buildroot..."
	cp distro.defconfig $(SRC_DIR)/configs/distro_tailor_defconfig
	$(MAKE) -C $(SRC_DIR) distro_tailor_defconfig

menuconfig: fetch-buildroot
	@echo "[+] Launching interactive menuconfig for fine-tuning..."
	$(MAKE) -C $(SRC_DIR) menuconfig

build:
	@echo "[+] Compiling toolchain, BusyBox, kernel, and assembling rootfs..."
	$(MAKE) -C $(SRC_DIR) -j$$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

clean:
	@if [ -d "$(SRC_DIR)" ]; then \\
		$(MAKE) -C $(SRC_DIR) clean; \\
	fi
`;

  const defconfigContent = `# DistroTailor Generated Buildroot Config
# Target: ${targetArch} | Libc: ${libc}

BR2_${targetArch}=y
${isNoMmu ? '# Cortex-M4 has no MMU; Buildroot derives BR2_USE_MMU from the CPU\nBR2_cortex_m4=y' : ''}

# Toolchain configuration
BR2_TOOLCHAIN_BUILDROOT=y
BR2_TOOLCHAIN_BUILDROOT_${libc === 'musl' ? 'MUSL' : 'UCLIBC'}=y
BR2_KERNEL_HEADERS_6_6=y

# Busybox core userspace
BR2_PACKAGE_BUSYBOX=y
BR2_PACKAGE_BUSYBOX_SHOW_OTHERS=y

# Minimal system tools
BR2_TARGET_GENERIC_HOSTNAME="distro-tailor-embedded"
BR2_TARGET_GENERIC_ISSUE="Welcome to DistroTailor Embedded Linux"
BR2_TARGET_GENERIC_GETTY_PORT="ttyS0"
BR2_TARGET_GENERIC_GETTY_BAUDRATE_115200=y

# Filesystem output
BR2_TARGET_ROOTFS_TAR=y
BR2_TARGET_ROOTFS_EXT2=y
BR2_TARGET_ROOTFS_EXT2_4=y
${
  criteria.fileSystem === 'f2fs'
    ? 'BR2_TARGET_ROOTFS_F2FS=y\n'
    : criteria.fileSystem === 'btrfs'
      ? 'BR2_TARGET_ROOTFS_BTRFS=y\n'
      : criteria.fileSystem === 'xfs' || criteria.fileSystem === 'zfs'
        ? `# Note: ${criteria.fileSystem} is not a built-in Buildroot rootfs target; using ext4\n`
        : ''
}${
  criteria.bootloader === 'u-boot'
    ? '\n# Bootloader: U-Boot\nBR2_TARGET_UBOOT=y\n'
    : criteria.bootloader === 'systemd-boot'
      ? '\n# Note: systemd-boot is not used with BusyBox/musl; configure GRUB2 or U-Boot\n'
      : ''
}${
  !isNoMmu && (targetArch === 'x86_64' || targetArch === 'aarch64') && (criteria.firmwareMode || criteria.bootloader === 'grub-hybrid')
    ? `
# Bootloader firmware mode: ${criteria.firmwareMode || 'uefi'}
${
  targetArch === 'aarch64'
    ? 'BR2_TARGET_GRUB2=y\nBR2_TARGET_GRUB2_ARM64_EFI=y'
    : criteria.firmwareMode === 'legacy-bios'
      ? 'BR2_TARGET_GRUB2=y\nBR2_TARGET_GRUB2_I386_PC=y'
      : 'BR2_TARGET_GRUB2=y\nBR2_TARGET_GRUB2_X86_64_EFI=y'
}
`
    : ''
}${
  criteria.networkingStack === 'nftables-pf'
    ? '\n# Networking: nftables\nBR2_PACKAGE_NFTABLES=y\n'
    : criteria.networkingStack === 'networkmanager' && !isNoMmu
      ? '\n# Networking: NetworkManager\nBR2_PACKAGE_NETWORK_MANAGER=y\n'
      : ''
}${
  criteria.virtHost === 'kvm-qemu' && !isNoMmu
    ? '\n# Virtualization host: QEMU/KVM\nBR2_PACKAGE_QEMU=y\nBR2_PACKAGE_QEMU_SYSTEM=y\n'
    : ''
}${
  criteria.kernelFlavor === 'realtime-rt'
    ? '\n# PREEMPT_RT: enable CONFIG_PREEMPT_RT in `make menuconfig` -> linux-menuconfig\n'
    : ''
}${
  criteria.devicePassthrough
    ? '\n# VFIO passthrough: enable CONFIG_VFIO and CONFIG_VFIO_PCI in `make menuconfig` -> linux-menuconfig\n'
    : ''
}${
  criteria.tpmUsage
    ? `
# TPM 2.0 userspace (${criteria.tpmUsage})
BR2_PACKAGE_TPM2_TOOLS=y
BR2_PACKAGE_TPM2_TSS=y
`
    : ''
}${
  criteria.secureBoot
    ? `
# Secure Boot (${criteria.secureBoot}): sign the kernel/GRUB images with sbsigntools after build
BR2_PACKAGE_HOST_SBSIGN_TOOLS=y
`
    : ''
}${
  navigationApps.length > 0
    ? `
# Offline Navigation & GPS Appliance
${navigationApps.includes('gpsd') || navigationApps.includes('navit') ? 'BR2_PACKAGE_GPSD=y\nBR2_PACKAGE_GPSD_CLIENTS=y' : ''}
${navigationApps.includes('navit') ? 'BR2_PACKAGE_NAVIT=y\nBR2_PACKAGE_TSLIB=y' : ''}
`
    : ''
}`;

  const files: GeneratedRecipe['files'] = [
    {
      filename: 'Makefile',
      description: 'Automation to fetch Buildroot, inject configuration, and parallel-compile',
      content: makefileContent
    },
    {
      filename: 'distro.defconfig',
      description: 'Buildroot configuration specifying architecture, libc, BusyBox, and output formats',
      content: defconfigContent
    }
  ];

  if (navigationApps.length > 0) {
    files.push({
      filename: 'bootstrap-navigation.sh',
      description: `Turnkey unattended installer for ${navigationApps.length} navigation tool(s), GPSd, and OpenStreetMap data`,
      content: generateBootstrapNavigationScript(navigationApps, criteria),
      executable: true
    });
  }

  const quickstartCommands = [
    'sudo apt-get install -y build-essential bison flex libncurses-dev rsync',
    'make configure',
    'make build'
  ];

  if (navigationApps.length > 0) {
    quickstartCommands.push(`sudo bash bootstrap-navigation.sh  # Provision GPSd & download offline OpenStreetMap vector data`);
  }

  return {
    id: 'buildroot-embedded',
    title: 'Cross-Compiled Embedded Linux (Buildroot)',
    summary:
      'Generates a tailored cross-compilation toolchain, BusyBox userspace, and Linux kernel (< 8MB footprint) for embedded boards and microcontrollers.',
    targetFormat: 'buildroot',
    estimatedBuildTimeMinutes: 25,
    hostDependencies: [
      'build-essential',
      'bison',
      'flex',
      'libncurses5-dev',
      'libssl-dev',
      'rsync',
      'unzip'
    ],
    files,
    quickstartCommands
  };
}
