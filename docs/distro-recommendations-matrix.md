# 🎯 DistroTailor Archetype Matrix Audit Report

> **Automated Sanity & AI Evaluation Matrix**
> Generated: `2026-11-11T15:35:32.966Z` | Evaluated Archetypes: **27** | Status: **✅ ALL CHECKS HEALTHY**

## 📊 Executive Summary

| Total Archetypes | ✅ Passed | ⚠️ Divergent / Review | ❌ Incompatible / Fail |
| :--- | :--- | :--- | :--- |
| **27** | **27** (100%) | **0** | **0** |

## 📂 Beginner Goals

| Status | Archetype | Hardware / Constraints | 🥇 Top Winner | ⚡ Build Recipe / VM Target | 🔗 Permalink (URL State) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 🟢 PASS | **Kids School & Coding (Old MacBook)**<br>_An old 2012 Intel MacBook with 4GB RAM revived for a 9-year-old school homework and Scratch coding._ | `x86_64 • 4096MB RAM • bare-metal` | **Endless OS** (96%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=beginner&useCase=education-kids&platform=bare-metal&architecture=x86_64&maxRamMb=4096&prefersGui=true&releaseCadence=standard&driverPhilosophy=no-preference&bootMedium=nvme-ssd&realtimeAudio=false) |
| 🟢 PASS | **Kids School & Coding (Modern PC)**<br>_A spare desktop PC with 8GB RAM for elementary school student homework and educational games._ | `x86_64 • 8192MB RAM • bare-metal • standard` | **Endless OS** (100%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=beginner&useCase=education-kids&footprint=standard&platform=bare-metal&architecture=x86_64&maxRamMb=8192&prefersGui=true) |
| 🟢 PASS | **Retro Gaming Console (Old PC)**<br>_Living room retro gaming console on a decommissioned office PC hooked to a 1080p TV with gamepads._ | `x86_64 • 4096MB RAM • bare-metal • lean` | **Batocera.linux** (100%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=beginner&useCase=gaming&footprint=lean&platform=bare-metal&architecture=x86_64&maxRamMb=4096&prefersGui=true) |
| 🟢 PASS | **Living Room TV Media Center (Kodi)**<br>_Dedicated TV box or mini PC running Kodi with instant TV remote control and no desktop clutter._ | `x86_64 • 2048MB RAM • bare-metal` | **LibreELEC** (100%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=beginner&useCase=media-center&platform=bare-metal&architecture=x86_64&maxRamMb=2048&prefersGui=true) |
| 🟢 PASS | **Family Photo/Video Backup NAS**<br>_Home file server and phone photo backup storage hub replacing Google Photos/iCloud subscriptions._ | `x86_64 • 4096MB RAM • bare-metal` | **OpenMediaVault (OMV)** (100%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=beginner&useCase=nas-storage&platform=bare-metal&architecture=x86_64&maxRamMb=4096&prefersGui=false) |
| 🟢 PASS | **Smart Home Automation Hub**<br>_24/7 Home Assistant controller running on a low-power single board computer or mini PC._ | `arm64 • 4096MB RAM • embedded-sbc` | **Home Assistant OS (HAOS)** (100%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=beginner&useCase=smart-home&platform=embedded-sbc&architecture=arm64&maxRamMb=4096) |
| 🟢 PASS | **Home Office & Freelance PC**<br>_Familiar Windows-like productivity desktop for spreadsheets, web browsing, Zoom, and document editing._ | `x86_64 • 8192MB RAM • bare-metal` | **Linux Mint** (100%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=beginner&useCase=home-office&platform=bare-metal&architecture=x86_64&maxRamMb=8192&prefersGui=true) |
| 🟢 PASS | **Creative Studio / DAW Audio / Video**<br>_Audio production workstation requiring realtime low-latency kernel and pre-installed multimedia tools._ | `x86_64 • 16384MB RAM • bare-metal` | **Ubuntu Studio** (96%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&useCase=creative-studio&platform=bare-metal&architecture=x86_64&realtimeAudio=true&maxRamMb=16384&prefersGui=true) |
| 🟢 PASS | **AI & Deep Learning Workstation**<br>_High-end desktop with dedicated NVIDIA GPU for PyTorch, LLM inference, and CUDA workloads._ | `x86_64 • 32768MB RAM • bare-metal` | **Pop!_OS (System76)** (95%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&useCase=ai-gpu-compute&platform=bare-metal&architecture=x86_64&maxRamMb=32768&driverPhilosophy=seamless-proprietary) |
| 🟢 PASS | **Apple Silicon MacBook (M1/M2/M3)**<br>_Running native bare-metal Linux on newer ARM64 Apple Silicon hardware._ | `arm64 • bare-metal` | **Fedora Asahi Remix (Apple Silicon)** (100%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&platform=bare-metal&architecture=arm64&useCase=desktop) |

## 📂 Hardware Reclamation

| Status | Archetype | Hardware / Constraints | 🥇 Top Winner | ⚡ Build Recipe / VM Target | 🔗 Permalink (URL State) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 🟢 PASS | **Ancient PC (512MB RAM)**<br>_Reviving a 15-20 year old Pentium 4 or netbook with just 512MB RAM that Windows 10 rejects._ | `x86_64 • 512MB RAM • bare-metal • minimal` | **antiX Linux** (100%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=beginner&platform=bare-metal&architecture=x86_64&maxRamMb=512&footprint=minimal&useCase=desktop) |
| 🟢 PASS | **Ancient PC (1GB RAM)**<br>_Lightweight desktop for an older Core 2 Duo laptop with 1GB RAM._ | `x86_64 • 1024MB RAM • bare-metal • minimal` | **antiX Linux** (100%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=beginner&platform=bare-metal&architecture=x86_64&maxRamMb=1024&footprint=minimal&useCase=desktop) |
| 🟢 PASS | **Repurposed Smartphone / Tablet**<br>_Breathing second life into old Android or Linux mobile gadget hardware as a portable server._ | `arm64 • embedded-sbc` | **postmarketOS (pmOS)** (97%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&platform=embedded-sbc&architecture=arm64&useCase=desktop) |

## 📂 Sysadmin & Homelab

| Status | Archetype | Hardware / Constraints | 🥇 Top Winner | ⚡ Build Recipe / VM Target | 🔗 Permalink (URL State) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 🟢 PASS | **Homelab VM & Container Hypervisor**<br>_Used enterprise server rack running dozens of VMs and LXC system containers._ | `x86_64 • 32768MB RAM • server` | **Proxmox Virtual Environment (PVE)** (100%) | **Proxmox VE / Incus LXC System Container Template**<br><code>make</code> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&useCase=hypervisor-vms&platform=server&architecture=x86_64&maxRamMb=32768) |
| 🟢 PASS | **Enterprise Multi-Bay ZFS Storage Server**<br>_Multi-terabyte rackmount storage appliance requiring enterprise ZFS, snapshots, and NFS/SMB shares._ | `x86_64 • 16384MB RAM • server • standard` | **OpenMediaVault (OMV)** (93%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&useCase=nas-storage&platform=server&architecture=x86_64&footprint=standard&maxRamMb=16384) |
| 🟢 PASS | **Immutable Kubernetes Cluster Node**<br>_Zero-SSH, API-managed minimal OS built exclusively to host K8s control plane and worker nodes._ | `x86_64` | **Talos Linux** (60%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=systems-engineer&useCase=k8s-cluster&statePreference=stateless-ram&architecture=x86_64) |
| 🟢 PASS | **Home Router & Hardware Firewall**<br>_Dedicated multi-port mini PC or home router replacing ISP-provided equipment with traffic shaping and VPN._ | `x86_64 • router-firewall` | **OpenWrt** (100%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&useCase=router-networking&platform=router-firewall&architecture=x86_64) |
| 🟢 PASS | **Windows WSL2 Developer Environment**<br>_Fast, lightweight development environment running under Windows Subsystem for Linux 2._ | `x86_64 • wsl2` | **Debian** (100%) | **Windows Subsystem for Linux 2 (WSL2) Distro Package**<br><code>make</code> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&platform=wsl2&architecture=x86_64) |
| 🟢 PASS | **Cloud Virtual Machine (Cloud-Init)**<br>_Headless QCOW2 cloud image automated with user-data scripts for microservices._ | `x86_64 • vm` | **Debian** (100%) | **Cloud-Init QCOW2 Virtual Machine Disk**<br><code>sudo apt-get install -y qemu-utils debootstrap libguestfs-tools</code> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&platform=vm&useCase=server&architecture=x86_64) |

## 📂 Specialized & Embedded

| Status | Archetype | Hardware / Constraints | 🥇 Top Winner | ⚡ Build Recipe / VM Target | 🔗 Permalink (URL State) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 🟢 PASS | **Microcontroller / NOMMU Hardware (<32MB)**<br>_Extreme micro footprint for microcontrollers without an MMU running from raw SPI flash._ | `nommu • micro` | **Buildroot** (100%) | **Cross-Compiled Embedded Linux (Buildroot)**<br><code>sudo apt-get install -y build-essential bison flex libncurses-dev rsync</code> | [`Load Persona`](?v=1&tab=results&experienceLevel=systems-engineer&architecture=nommu&footprint=micro&useCase=iot-embedded) |
| 🟢 PASS | **Minimal Container Base (Docker / OCI)**<br>_Zero-CVE micro-image for packaging Go/Rust/Node microservices with zero shell or package manager bloat._ | `any-arch • container • minimal` | **Alpine Linux** (100%) | **Ultra-Minimal Alpine musl/OpenRC RootFS**<br><code>sudo make</code> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&useCase=container-base&footprint=minimal&platform=container) |
| 🟢 PASS | **Public Web Kiosk / Digital Signage**<br>_Locked-down, tamper-proof full-screen browser terminal for hotel lobby or digital sign board._ | `x86_64 • kiosk` | **Porteus Kiosk** (100%) | **Locked-Down Wayland Web Kiosk (Alpine + Cage)**<br><code>sudo make KIOSK_URL="https://your-dashboard.com"</code> | [`Load Persona`](?v=1&tab=results&experienceLevel=beginner&useCase=kiosk-signage&platform=kiosk&architecture=x86_64&prefersGui=true) |
| 🟢 PASS | **Single-App Appliance / Touch POS Screen**<br>_Boots directly into one dedicated Wayland application with silent splash screen and auto-restart._ | `x86_64` | **Cage Wayland Appliance** (92%) | **Dedicated Single-App Wayland Appliance (Alpine + Cage)**<br><code># Copy your binary or Flutter/Qt app into build/rootfs/opt/app/</code> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&useCase=appliance-product&architecture=x86_64&prefersGui=true) |
| 🟢 PASS | **In-Browser WebAssembly Linux**<br>_Running a virtual x86 PC purely inside a web browser tab without local installation._ | `any-arch • browser-wasm` | **WebVM / v86 (Linux in WebAssembly)** (100%) | **In-Browser WebAssembly Linux (v86)**<br><code>make</code> | [`Load Persona`](?v=1&tab=results&experienceLevel=beginner&useCase=browser-wasm&platform=browser-wasm) |
| 🟢 PASS | **Immutable Atomic Desktop (Silverblue)**<br>_Modern indestructible workstation with read-only rootfs, ostree atomic rollbacks, and Flatpak apps._ | `x86_64` | **Fedora Silverblue / Atomic** (100%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=intermediate&useCase=desktop&statePreference=immutable-ostree&architecture=x86_64&prefersGui=true) |
| 🟢 PASS | **DIY Bleeding-Edge Rolling Desktop**<br>_Tinkerer who wants complete package customization, cutting-edge software, and AUR access._ | `x86_64` | **Arch Linux** (97%) | <em>Turnkey Official Image</em> | [`Load Persona`](?v=1&tab=results&experienceLevel=advanced&useCase=gaming&releaseCadence=rolling&architecture=x86_64&prefersGui=true) |
| 🟢 PASS | **Declarative Reproducible System (NixOS)**<br>_DevOps engineer wanting 100% reproducible configuration with atomic rollbacks._ | `x86_64` | **NixOS** (97%) | **NixOS Declarative Flake & VM Harness**<br><code>make test-vm       # Instant test-drive in isolated QEMU virtual machine</code> | [`Load Persona`](?v=1&tab=results&experienceLevel=advanced&useCase=desktop&statePreference=declarative&architecture=x86_64) |

## 🧪 Testing Persona Builds & VMs Locally

Every archetype above is deterministically reproducible from its URL state. You can evaluate and export its complete build harness directly with the DistroTailor CLI:

```bash
# 1. Declarative NixOS Workstation Flake -> Disposable QEMU VM
npm run cli export -- --url "?v=1&tab=results&statePreference=declarative&useCase=desktop&architecture=x86_64" --out ./build-test/nixos
cd ./build-test/nixos && make test-vm

# 2. Debian Cloud Virtual Machine Disk -> QCOW2 image
npm run cli export -- --url "?v=1&tab=results&useCase=server&platform=vm&architecture=x86_64" --out ./build-test/cloud-vm
cd ./build-test/cloud-vm && make image

# 3. Debian Minimal Live Bootable ISO -> Hybrid BIOS/UEFI ISO
npm run cli export -- --url "?v=1&tab=results&useCase=desktop&platform=bare-metal&requiresCustomBuild=true" --out ./build-test/live-iso
cd ./build-test/live-iso && sudo make iso

# 4. Cage Wayland Signage Kiosk -> Alpine RootFS Watchdog
npm run cli export -- --url "?v=1&tab=results&useCase=kiosk-signage&platform=kiosk&architecture=x86_64" --out ./build-test/kiosk
cd ./build-test/kiosk && sudo make rootfs
```

## 🛡️ Invariant Rules Enforced by Matrix

1. **No Appliance Leakage to Desktop Goals:** Single-purpose appliances (`Porteus Kiosk`, `OpenWrt`, `LibreELEC`, `Talos`, `Home Assistant`, `TrueNAS`, `Proxmox`) must NEVER win on general desktop, educational, or home-office requests.
2. **Hardware Constraints Integrity:** Recommended winner must physically support target CPU architecture and fit inside installed RAM.
3. **Child & Educational Alignment:** Kid-safe school and coding laptops (including older MacBooks) must decisively recommend **Endless OS** or lightweight desktop lifesavers (e.g. antiX / Linux Mint), never web terminals.
