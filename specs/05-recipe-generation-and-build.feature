Feature: Reproducible Recipe Generation & Turnkey Build Harness
  As an embedded systems engineer or appliance builder
  I want DistroTailor to generate reproducible Makefiles, defconfigs, and Dockerfiles
  So that I can compile a customized operating system image from source on my local machine

  Scenario: Generating a Debootstrap Minimal Live ISO Recipe
    Given the criteria specify Debian as the target base
    When the recipe generator resolves "debootstrap-debian"
    Then the generated files must include a "Makefile" and a "README.md"
    And the Makefile must contain targets "prepare", "rootfs", "configure", "iso", and "clean"
    And the ISO target must generate a hybrid BIOS/UEFI boot image using "grub-mkrescue"

  Scenario: Generating a Wayland Kiosk Appliance Recipe
    Given the criteria specify a single-app appliance or digital signage kiosk
    When the recipe generator resolves "kiosk-web"
    Then the generated Makefile must bootstrap an Alpine Linux rootfs
    And the Makefile must install the "cage" Wayland kiosk compositor
    And the Makefile must create an auto-restart watchdog loop for the target binary

  Scenario: Generating an Embedded Buildroot Compilation Recipe
    Given the criteria specify an embedded SBC or NOMMU microcontroller
    When the recipe generator resolves "buildroot-embedded"
    Then the generated files must include "distro.defconfig"
    And the Makefile must fetch the official Buildroot source tree
    And the Makefile must support "make menuconfig" for fine-grained interactive tuning

  Scenario: Generating a Cloud-Init QCOW2 Virtual Machine Disk Recipe
    Given the criteria specify a virtual machine server or Proxmox KVM node
    When the recipe generator resolves "cloud-init-qcow2"
    Then the generated files must include "Makefile", "user-data", and "meta-data"
    And the user-data file must configure the "tailor" user and SSH keys
    And the Makefile must generate a sparse QCOW2 disk image

  Scenario: Generating a Windows Subsystem for Linux (WSL2) Distro Package
    Given the criteria specify "wsl2" as the target platform
    When the recipe generator resolves "wsl2-debian"
    Then the generated files must include "Makefile", "wsl.conf", and "install-wsl.ps1"
    And the wsl.conf must enable systemd and automounting
    And the generated tarball must omit redundant Linux kernels and firmware

  Scenario: Generating a Proxmox LXC Container Template
    Given the criteria specify homelab virtualization or high-density containers
    When the recipe generator resolves "proxmox-lxc"
    Then the generated files must include "Makefile", "lxc-create.sh", and "README.md"
    And the Makefile must output an XZ-compressed rootfs archive ".tar.xz"
    And the rootfs must exclude kernel and bootloader binaries

  Scenario: Generating a Declarative NixOS Flake Recipe
    Given the criteria specify declarative immutability or NixOS as the target base
    When the recipe generator resolves "nixos-flake"
    Then the generated files must include "flake.nix", "configuration.nix", and "Makefile"
    And the flake.nix must define a reproducible system flake for the target architecture
    And the Makefile must support building a test VM with "make test-vm"
    And the configuration.nix must configure the tailor user, SSH keys, and selected applications

  Scenario: Providing a 3-Tier Testing and Verification Ladder
    Given any generated recipe or recommended image
    When the results view is displayed to the user
    Then the system must provide testing instructions across three tiers:
      | Tier | Testing Method | Verification Goal |
      | Tier 1 | In-Browser Instant Sandbox | WebAssembly v86 emulator test-drive with zero drive risk |
      | Tier 2 | Safe Virtual Machine Sandbox | Local QEMU, VirtualBox, or UTM hypervisor testing |
      | Tier 3 | Bare-Metal Live USB Boot | Flash via BalenaEtcher/Rufus and boot physical BIOS/UEFI |

  Scenario: Generated recipes verify every downloaded artifact before use
    Given a recipe downloads a base image, toolchain, BIOS, or ISO (Alpine, Buildroot, kiosk, WebVM)
    When the user runs "make"
    Then each download is checked against a pinned SHA-256 checksum before it is extracted or booted
    And a mismatch stops the build with instructions to update the checksum variable
    And third-party URLs are pinned to a fixed version or commit instead of "latest" or "master"
    And the in-browser WebVM verifies its BIOS and ISO buffers with SubtleCrypto before booting

  Scenario: CLI export rejects unknown recipe identifiers
    Given a user runs "distro-tailor export --recipe not-a-recipe"
    When the CLI validates the recipe id
    Then it exits with an error listing the valid recipe ids
    And it does not silently fall back to a Debian recipe

  Scenario: Generated images never ship a fixed, publicly known login
    Given a user builds a debootstrap, Alpine, LXC, cloud-init, or WSL2 recipe
    When "make" creates the image
    Then the user's SSH public key is authorized when one is found (override with SSH_PUBKEY) and SSH password login is disabled
    And otherwise a random password is generated at build time, never passed on a command line, and saved to an owner-only "output/credentials.txt"
    And Debian-based images require that password to be changed at first login
    And cloud-init images get a random first-boot password from cloud-init itself, shown on the VM console
    And WSL2 images lock the password because WSL signs the user in automatically
    And bundled services such as Pi-hole generate their own admin password instead of using a preset one

  Scenario: Pinned recipe downloads are re-verified every month
    Given recipe downloads are pinned to versions and SHA-256 checksums in "checksums.ts"
    When the monthly "Check Recipe Download Pins" workflow runs
    Then every pinned artifact is downloaded again and compared with its checksum
    And pinned Alpine and Buildroot releases warn 60 days before and fail after their upstream end of support
    And the job summary lists which pins need updating

  Scenario: Bundling Gaming Emulators & Gamepad Rules in Recipe Generation
    Given the criteria specify "retroarch" and "dosbox-staging" in emulatorApps
    When the recipe generator resolves "debootstrap-debian"
    Then the generated files must include "bootstrap-emulators.sh"
    And the bootstrap script must install gamepad udev rules for controller hotplug
    And the bootstrap script must scaffold user ROM and BIOS directory trees
    And the recipe quickstart commands must include "bootstrap-emulators.sh"

  Scenario: Generating a Debootstrap Recipe with Custom Root Filesystem and Realtime Kernel
    Given the criteria specify "btrfs" as root filesystem
    And the criteria specify "realtime-rt" as kernel flavor
    When the recipe generator resolves "debootstrap-debian"
    Then the generated Makefile must set "ROOT_FS ?= btrfs"
    And the generated Makefile must install "btrfs-progs" and "linux-image-rt-amd64"

  Scenario: Generating Recipes that Honor Firmware Mode, Secure Boot, and TPM
    Given the criteria specify firmware mode "uefi", Secure Boot "required", and TPM usage "disk-unlock"
    When the recipe generator resolves "debootstrap-debian"
    Then the generated Makefile must set "FIRMWARE_MODE", "SECURE_BOOT", and "TPM_USAGE"
    And the Makefile must install "shim-signed" and "grub-efi-amd64-signed" instead of unsigned GRUB
    And the Makefile must install TPM 2.0 tooling including "clevis-tpm2"
    And selecting "own-keys" Secure Boot must add a "sign-boot" target that signs the kernel with "sbsign"
    And the NixOS recipe must enable lanzaboote for "own-keys" and legacy GRUB for "legacy-bios"

  Scenario: Generating a KVM Host Recipe with GPU Passthrough
    Given the criteria specify virtualization host "kvm-qemu" and device passthrough "gpu-vfio"
    When the recipe generator resolves "debootstrap-debian"
    Then the generated Makefile must install QEMU, libvirt, and OVMF packages
    And the Makefile must add "intel_iommu=on amd_iommu=on iommu=pt" kernel arguments and load the vfio modules
    And the Makefile must expose a "VFIO_IDS" variable for binding devices at boot
    And the NixOS recipe must enable libvirtd with a single user group list

  Scenario: Generating a VM Image for a Specific Guest Hypervisor
    Given the criteria specify guest platform "vmware"
    When the recipe generator resolves "cloud-init-qcow2"
    Then the image must install "open-vm-tools" instead of "qemu-guest-agent"
    And the Makefile must expose a "GUEST_PLATFORM" variable

  Scenario: Surfacing Recipe Compatibility Warnings for Unsupported Options
    Given the criteria specify Secure Boot "required" and filesystem "zfs"
    When the recipe generator resolves "wsl2-debian"
    Then the recipe must include warnings noting that Secure Boot and Filesystem are not configured by "wsl2-debian"

  Scenario: Wiring Expert Options into Alpine and Buildroot Recipes
    Given the criteria specify kernel flavor "lts-stable", filesystem "btrfs", virtualization host "kvm-qemu", and networking stack "nftables-pf"
    When the recipe generator resolves "alpine-chroot"
    Then the generated Makefile must install "linux-lts", "btrfs-progs", "qemu-system-x86_64", and "nftables"
    And when the recipe generator resolves "buildroot-embedded" with "f2fs" and "u-boot"
    Then "distro.defconfig" must enable "BR2_TARGET_ROOTFS_F2FS=y" and "BR2_TARGET_UBOOT=y"

  Scenario: Selecting Architecture-Appropriate Packages on ARM64
    Given the criteria specify architecture "arm64"
    When the recipe generator resolves "debootstrap-debian" and "cloud-init-qcow2"
    Then "debootstrap-debian" must use "grub-efi-arm64-bin" without "grub-pc-bin"
    And "cloud-init-qcow2" must use "ARCH := arm64" and "linux-image-cloud-arm64"
