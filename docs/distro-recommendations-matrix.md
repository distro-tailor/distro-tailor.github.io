# 🎯 DistroTailor Archetype Matrix Audit Report

> **Automated Sanity & AI Evaluation Matrix**
> Generated: `2026-11-11T13:45:51.245Z` | Evaluated Archetypes: **27** | Status: **✅ ALL CHECKS HEALTHY**

## 📊 Executive Summary

| Total Archetypes | ✅ Passed | ⚠️ Divergent / Review | ❌ Incompatible / Fail |
| :--- | :--- | :--- | :--- |
| **27** | **27** (100%) | **0** | **0** |

## 📂 Beginner Goals

| Status | Archetype | Hardware / Constraints | 🥇 Top Winner | 🥈 Runner-Up | 🥉 3rd Place | Audit Sanity Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 🟢 PASS | **Kids School & Coding (Old MacBook)**<br>_An old 2012 Intel MacBook with 4GB RAM revived for a 9-year-old school homework and Scratch coding._ | `x86_64 • 4096MB RAM • bare-metal` | **Endless OS** (96%) | antiX Linux (79%) | Linux Mint (79%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Kids School & Coding (Modern PC)**<br>_A spare desktop PC with 8GB RAM for elementary school student homework and educational games._ | `x86_64 • 8192MB RAM • bare-metal • standard` | **Endless OS** (100%) | antiX Linux (82%) | Debian (79%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Retro Gaming Console (Old PC)**<br>_Living room retro gaming console on a decommissioned office PC hooked to a 1080p TV with gamepads._ | `x86_64 • 4096MB RAM • bare-metal • lean` | **Batocera.linux** (100%) | Arch Linux (94%) | antiX Linux (82%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Living Room TV Media Center (Kodi)**<br>_Dedicated TV box or mini PC running Kodi with instant TV remote control and no desktop clutter._ | `x86_64 • 2048MB RAM • bare-metal` | **LibreELEC** (100%) | antiX Linux (62%) | Cage Wayland Appliance (62%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Family Photo/Video Backup NAS**<br>_Home file server and phone photo backup storage hub replacing Google Photos/iCloud subscriptions._ | `x86_64 • 4096MB RAM • bare-metal` | **OpenMediaVault (OMV)** (100%) | DietPi (62%) | Home Assistant OS (HAOS) (62%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Smart Home Automation Hub**<br>_24/7 Home Assistant controller running on a low-power single board computer or mini PC._ | `arm64 • 4096MB RAM • embedded-sbc` | **Home Assistant OS (HAOS)** (100%) | DietPi (57%) | Armbian (57%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Home Office & Freelance PC**<br>_Familiar Windows-like productivity desktop for spreadsheets, web browsing, Zoom, and document editing._ | `x86_64 • 8192MB RAM • bare-metal` | **Linux Mint** (100%) | Fedora Workstation (95%) | antiX Linux (80%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Creative Studio / DAW Audio / Video**<br>_Audio production workstation requiring realtime low-latency kernel and pre-installed multimedia tools._ | `x86_64 • 16384MB RAM • bare-metal` | **Ubuntu Studio** (96%) | Fedora Workstation (85%) | Debian (70%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **AI & Deep Learning Workstation**<br>_High-end desktop with dedicated NVIDIA GPU for PyTorch, LLM inference, and CUDA workloads._ | `x86_64 • 32768MB RAM • bare-metal` | **Pop!_OS (System76)** (95%) | HiveOS (85%) | Ubuntu (82%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Apple Silicon MacBook (M1/M2/M3)**<br>_Running native bare-metal Linux on newer ARM64 Apple Silicon hardware._ | `arm64 • bare-metal` | **Fedora Asahi Remix (Apple Silicon)** (100%) | Fedora Silverblue / Atomic (100%) | Fedora Workstation (97%) | Recommendation aligned with archetype goals. |

## 📂 Hardware Reclamation

| Status | Archetype | Hardware / Constraints | 🥇 Top Winner | 🥈 Runner-Up | 🥉 3rd Place | Audit Sanity Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 🟢 PASS | **Ancient PC (512MB RAM)**<br>_Reviving a 15-20 year old Pentium 4 or netbook with just 512MB RAM that Windows 10 rejects._ | `x86_64 • 512MB RAM • bare-metal • minimal` | **antiX Linux** (100%) | postmarketOS (pmOS) (93%) | Debian (67%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Ancient PC (1GB RAM)**<br>_Lightweight desktop for an older Core 2 Duo laptop with 1GB RAM._ | `x86_64 • 1024MB RAM • bare-metal • minimal` | **antiX Linux** (100%) | postmarketOS (pmOS) (93%) | Arch Linux (74%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Repurposed Smartphone / Tablet**<br>_Breathing second life into old Android or Linux mobile gadget hardware as a portable server._ | `arm64 • embedded-sbc` | **postmarketOS (pmOS)** (97%) | Fedora Asahi Remix (Apple Silicon) (58%) | Fedora Silverblue / Atomic (58%) | Recommendation aligned with archetype goals. |

## 📂 Sysadmin & Homelab

| Status | Archetype | Hardware / Constraints | 🥇 Top Winner | 🥈 Runner-Up | 🥉 3rd Place | Audit Sanity Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 🟢 PASS | **Homelab VM & Container Hypervisor**<br>_Used enterprise server rack running dozens of VMs and LXC system containers._ | `x86_64 • 32768MB RAM • server` | **Proxmox Virtual Environment (PVE)** (100%) | Debian (57%) | OpenMediaVault (OMV) (52%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Enterprise Multi-Bay ZFS Storage Server**<br>_Multi-terabyte rackmount storage appliance requiring enterprise ZFS, snapshots, and NFS/SMB shares._ | `x86_64 • 16384MB RAM • server • standard` | **OpenMediaVault (OMV)** (93%) | TrueNAS SCALE (74%) | Debian (64%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Immutable Kubernetes Cluster Node**<br>_Zero-SSH, API-managed minimal OS built exclusively to host K8s control plane and worker nodes._ | `x86_64` | **Talos Linux** (60%) | Alpine Linux (32%) | Batocera.linux (32%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Home Router & Hardware Firewall**<br>_Dedicated multi-port mini PC or home router replacing ISP-provided equipment with traffic shaping and VPN._ | `x86_64 • router-firewall` | **OpenWrt** (100%) | Buildroot (90%) | Alpine Linux (49%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Windows WSL2 Developer Environment**<br>_Fast, lightweight development environment running under Windows Subsystem for Linux 2._ | `x86_64 • wsl2` | **Debian** (100%) | Ubuntu (89%) | Fedora Workstation (33%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Cloud Virtual Machine (Cloud-Init)**<br>_Headless QCOW2 cloud image automated with user-data scripts for microservices._ | `x86_64 • vm` | **Debian** (100%) | Alpine Linux (97%) | DietPi (93%) | Recommendation aligned with archetype goals. |

## 📂 Specialized & Embedded

| Status | Archetype | Hardware / Constraints | 🥇 Top Winner | 🥈 Runner-Up | 🥉 3rd Place | Audit Sanity Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 🟢 PASS | **Microcontroller / NOMMU Hardware (<32MB)**<br>_Extreme micro footprint for microcontrollers without an MMU running from raw SPI flash._ | `nommu • micro` | **Buildroot** (100%) | Linux Mint (0%) | Ubuntu (0%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Minimal Container Base (Docker / OCI)**<br>_Zero-CVE micro-image for packaging Go/Rust/Node microservices with zero shell or package manager bloat._ | `any-arch • container • minimal` | **Alpine Linux** (100%) | Chainguard / Distroless (97%) | OpenWrt (3%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Public Web Kiosk / Digital Signage**<br>_Locked-down, tamper-proof full-screen browser terminal for hotel lobby or digital sign board._ | `x86_64 • kiosk` | **Porteus Kiosk** (100%) | Cage Wayland Appliance (98%) | Alpine Linux (91%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Single-App Appliance / Touch POS Screen**<br>_Boots directly into one dedicated Wayland application with silent splash screen and auto-restart._ | `x86_64` | **Cage Wayland Appliance** (92%) | Buildroot (73%) | DietPi (73%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **In-Browser WebAssembly Linux**<br>_Running a virtual x86 PC purely inside a web browser tab without local installation._ | `any-arch • web-browser` | **WebVM / v86 (Linux in WebAssembly)** (42%) | Linux Mint (0%) | Ubuntu (0%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Immutable Atomic Desktop (Silverblue)**<br>_Modern indestructible workstation with read-only rootfs, ostree atomic rollbacks, and Flatpak apps._ | `x86_64` | **Fedora Silverblue / Atomic** (72%) | Fedora Workstation (69%) | Debian (69%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **DIY Bleeding-Edge Rolling Desktop**<br>_Tinkerer who wants complete package customization, cutting-edge software, and AUR access._ | `x86_64` | **Arch Linux** (97%) | NixOS (83%) | Batocera.linux (79%) | Recommendation aligned with archetype goals. |
| 🟢 PASS | **Declarative Reproducible System (NixOS)**<br>_DevOps engineer wanting 100% reproducible configuration with atomic rollbacks._ | `x86_64` | **NixOS** (97%) | Arch Linux (68%) | Ubuntu (60%) | Recommendation aligned with archetype goals. |

## 🛡️ Invariant Rules Enforced by Matrix

1. **No Appliance Leakage to Desktop Goals:** Single-purpose appliances (`Porteus Kiosk`, `OpenWrt`, `LibreELEC`, `Talos`, `Home Assistant`, `TrueNAS`, `Proxmox`) must NEVER win on general desktop, educational, or home-office requests.
2. **Hardware Constraints Integrity:** Recommended winner must physically support target CPU architecture and fit inside installed RAM.
3. **Child & Educational Alignment:** Kid-safe school and coding laptops (including older MacBooks) must decisively recommend **Endless OS** or lightweight desktop lifesavers (e.g. antiX / Linux Mint), never web terminals.
