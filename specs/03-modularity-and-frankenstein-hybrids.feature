Feature: Linux Modularity & Frankenstein Hybrid Builds
  As an advanced Linux user, sysadmin, or system hacker
  I want to mix and match components across distribution boundaries
  So that I can leverage Debian's rock-solid stability with Arch's bleeding-edge packages or interchange desktop environments

  Background:
    Given Linux userland, package managers, and display servers are modular decoupled components

  Scenario: Running Arch AUR packages on top of a Debian stable base via Distrobox
    Given the user selects a Debian-based custom appliance recipe
    When the user enables the Frankenstein hybrid option "ENABLE_DISTROBOX=1"
    Then the generated Makefile must install "podman" and "distrobox"
    And the documentation must provide the command "distrobox create --image archlinux"
    And the host Debian system must remain 100% clean and isolated from AUR dependencies

  Scenario: Interchanging Desktop Environments and Wayland Compositors
    Given a minimal bootable Linux recipe is configured
    When the builder sets "DESKTOP_ENV" in the Makefile
    Then setting "DESKTOP_ENV=cage" must configure the ultra-lean single-app Wayland compositor
    And setting "DESKTOP_ENV=xfce" must configure lightweight traditional desktop components
    And setting "DESKTOP_ENV=kde" must configure Plasma Wayland session
    And setting "DESKTOP_ENV=none" must produce a headless zero-X11 server image

  Scenario: Universal package sandboxing via Nix and Flatpak
    Given the core OS is configured with an immutable or minimal root filesystem
    When application layers are attached
    Then user applications must be isolated from the base system via Nix or Flatpak
    And base operating system upgrades must never break user application dependencies
