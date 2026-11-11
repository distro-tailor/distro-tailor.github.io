import { GeneratedRecipe, UserCriteria } from '../types.js';
import { BUILDROOT_TARBALL_SHA256 } from './checksums.js';

export function generateBuildrootRecipe(criteria: UserCriteria): GeneratedRecipe {
  const isNoMmu = criteria.architecture === 'nommu';
  const targetArch = isNoMmu ? 'arm' : criteria.architecture === 'arm64' ? 'aarch64' : 'x86_64';
  const libc = isNoMmu ? 'uclibc' : 'musl';

  const makefileContent = `# ==============================================================================
# DistroTailor: Buildroot Embedded Linux Toolchain & Kernel Generator
# Target Architecture: ${targetArch} (${isNoMmu ? 'NOMMU Microcontroller' : 'Embedded Board'})
# C Library: ${libc}
# ==============================================================================

BUILDROOT_VERSION ?= 2024.02.1
BUILDROOT_URL     ?= https://buildroot.org/downloads/buildroot-$(BUILDROOT_VERSION).tar.gz
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
${isNoMmu ? 'BR2_USE_MMU=n\nBR2_ARM_CPU_ARM_CORTEX_M4=y' : ''}

# Toolchain configuration
BR2_TOOLCHAIN_BUILDROOT=y
BR2_TOOLCHAIN_BUILDROOT_LIBC="${libc}"
BR2_PACKAGE_HOST_LINUX_HEADERS_CUSTOM_6_6=y

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
`;

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
    files: [
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
    ],
    quickstartCommands: [
      'sudo apt-get install -y build-essential bison flex libncurses-dev rsync',
      'make configure',
      'make build'
    ]
  };
}
