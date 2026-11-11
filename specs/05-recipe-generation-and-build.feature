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
