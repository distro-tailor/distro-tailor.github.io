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
