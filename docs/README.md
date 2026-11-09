# 📚 DistroTailor Documentation Portal

Welcome to the central documentation index for **DistroTailor**—the 20-Questions Linux selector and turnkey build recipe generator.

---

## 📑 Core Documentation Index

- **[Vision & Goals](01-vision-and-goals.md)**
  - The Core Problem: Kitchen-Sink Bloat vs. Systems Engineering Wall
  - The DistroTailor 2-Phase Solution
  - The 4 Core Architectural Invariants (20 Questions, Zero-Bloat, Modularity/Frankenstein, Hardware Reclamation)
  - Target Personas & Use Cases

- **[Architecture & System Design](02-architecture.md)**
  - Monorepo Topology (`core`, `web`, `cli`)
  - Decision Engine & Normalized Weighted Matching Algorithm (`matcher.ts`)
  - Recipe Generator Pipeline (Debootstrap, Cage Wayland, Buildroot, Alpine)
  - Bootloader Topology (UEFI ESP, Legacy BIOS MBR, Apple 32-bit EFI, ARM GPU boot)

- **[Design Rationale, Q&A & Architectural Decisions](03-design-rationale-and-qa.md)**
  - Inverted Funnel Philosophy (300+ distros down to 1 champion + 2 contenders)
  - 3-Layer Composable Architecture (Anchor Distros, Desktop Modifiers, Flathub/AppStream apps)
  - Hardware Epochs & 4 Kernel Tracks (Modern HWE, Enterprise LTS, Specialized Silicon, Low-Latency)
  - PCPartPicker Modular Rigs vs. Fixed Closed Hardware (Apple Silicon, Raspberry Pi)
  - Enterprise Server Racks (Craigslist/eBay) with Proxmox VE & TrueNAS SCALE
  - Freelance Home Office & Creative Multimedia Studios (Linux Mint, Fedora, Ubuntu Studio)
  - URL Sharing Invariants, Schema Migration Engine, and Universal CLI/Web/API Parity

---

## 🥒 Behavior-Driven Living Specifications (`specs/`)

All functional behaviors, persona flows, and UX invariants are specified in Gherkin `.feature` files:

1. **[01-goal-oriented-selection.feature](../specs/01-goal-oriented-selection.feature):** Novice user goals (Media Center, Photo NAS, Smart Home, Custom App) and on-the-fly mode switching.
2. **[02-hardware-targeting-and-driver-pruning.feature](../specs/02-hardware-targeting-and-driver-pruning.feature):** Reclaiming old MacBooks, Android TV boxes, repurposed gadgets, and the Zero-Bloat comparison metrics.
3. **[03-modularity-and-frankenstein-hybrids.feature](../specs/03-modularity-and-frankenstein-hybrids.feature):** Multi-distro mixing via Distrobox (Arch AUR on Debian), desktop switching (Cage, XFCE, KDE), and Nix/Flatpak sandboxing.
4. **[04-gpu-specialized-workloads.feature](../specs/04-gpu-specialized-workloads.feature):** Pop!_OS for AI/LLM/Data Science and HiveOS for multi-GPU mining/compute.
5. **[05-recipe-generation-and-build.feature](../specs/05-recipe-generation-and-build.feature):** Makefiles, defconfigs, hybrid ISOs, and QEMU test verification.

---

## 🧪 Verification & Test Suite

The core package contains 16 automated tests covering the entire matching matrix:

```bash
# Run the test suite
npm test
```
