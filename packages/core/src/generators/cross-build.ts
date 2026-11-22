/**
 * Shared Makefile helpers for host-independent builds (`make docker-build`) and
 * cross-architecture rootfs assembly (`qemu-user-static` + `debootstrap --foreign`).
 */

export interface DockerBuildOptions {
  image: string;
  platform: 'linux/amd64' | 'linux/arm64';
  installCmd: string;
  makeTarget?: string;
}

export function dockerBuildTarget(opts: DockerBuildOptions): string {
  const target = opts.makeTarget || 'all';
  return `DOCKER ?= docker
# Build inside a privileged Linux container (works on macOS, Windows, and cross-arch hosts)
# BUILD_DIR=/tmp/dt-build keeps rootfs/mknod on native Linux overlayfs instead of macOS/Windows bind mounts
docker-build:
	$(DOCKER) run --rm --privileged --platform ${opts.platform} -v "$(CURDIR)":/work -w /work ${opts.image} sh -c '${opts.installCmd} && make BUILD_DIR=/tmp/dt-build ${target}'`;
}

export function debootstrapCrossArchVars(): string {
  return `HOST_ARCH         := $(shell uname -m)
TARGET_UNAME_ARCH := $(if $(filter arm64,$(ARCH)),aarch64,x86_64)
QEMU_USER_STATIC  := qemu-$(TARGET_UNAME_ARCH)-static`;
}

export function debootstrapCrossArchRootfsStep(opts: {
  sudoPrefix: string;
  suite: string;
  mirror: string;
}): string {
  const s = opts.sudoPrefix;
  return `	@if [ "$(HOST_ARCH)" = "$(TARGET_UNAME_ARCH)" ]; then \\
		${s}$(DEBOOTSTRAP) --arch=$(ARCH) --variant=minbase ${opts.suite} $(ROOTFS_DIR) ${opts.mirror}; \\
	else \\
		command -v $(QEMU_USER_STATIC) >/dev/null || (echo "[-] Install qemu-user-static for cross-arch builds (or run: make docker-build)"; exit 1); \\
		${s}$(DEBOOTSTRAP) --arch=$(ARCH) --foreign --variant=minbase ${opts.suite} $(ROOTFS_DIR) ${opts.mirror}; \\
		${s}cp "$$(command -v $(QEMU_USER_STATIC))" $(ROOTFS_DIR)/usr/bin/; \\
		${s}chroot $(ROOTFS_DIR) /debootstrap/debootstrap --second-stage; \\
	fi`;
}
