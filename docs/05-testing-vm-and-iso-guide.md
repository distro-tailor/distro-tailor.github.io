# 🧪 Developer Guide: Testing Generated Distro Recipes in VMs & Emulators

DistroTailor produces reproducible, zero-bloat build harnesses (`Makefiles`, `defconfigs`, cloud-init profiles, and container templates) directly from criteria. Because every recommendation is deterministically encoded in the URL state, developers can test, reproduce, and verify custom image builds locally inside virtual machines without modifying their host operating system.

> **Note for Contributors & Maintainers:**
> The Example Personas catalog is a developer testing fixture designed to stress-test the decision engine and build harnesses across hypervisors, containers, and live USB bootloaders. They are intentionally kept in documentation rather than end-user onboarding.

---

## 📋 Prerequisites

| Host Platform | Recommended Tools | Installation Command |
| :--- | :--- | :--- |
| **macOS** | QEMU, UTM, Nix | `brew install qemu` or download [UTM](https://mac.getutm.app/) |
| **Debian / Ubuntu** | QEMU, debootstrap, xorriso, squashfs-tools | `sudo apt-get install -y qemu-system-x86 qemu-utils debootstrap xorriso squashfs-tools` |
| **Fedora / RHEL** | QEMU, qemu-img, xorriso, squashfs-tools | `sudo dnf install -y qemu-system-x86 qemu-img xorriso squashfs-tools` |
| **Arch Linux** | QEMU, debootstrap, xorriso, squashfs-tools | `sudo pacman -S qemu-desktop debootstrap xorriso squashfs-tools` |

---

## 📊 Developer Testing Personas Matrix

| Persona ID | Description | Champion Distro | Recipe ID | Build Target | Deterministic Query |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `nixos-declarative` | Declarative NixOS Workstation | **NixOS** | `nixos-flake` | `make test-vm` (QEMU) | `?v=1&tab=results&statePreference=declarative&useCase=desktop&architecture=x86_64&prefersGui=true&desktopEnv=gnome&desktopApps=firefox%2Cvscode` |
| `cloud-init-vm` | Debian Cloud Virtual Machine | **Debian** | `cloud-init-qcow2` | `make image` (QCOW2 Disk) | `?v=1&tab=results&useCase=server&platform=vm&architecture=x86_64&prefersGui=false&dockerApp=nextcloud` |
| `debootstrap-live-iso` | Debian Live Boot Hybrid ISO | **Debian** | `debootstrap-debian` | `make iso` (Hybrid Live ISO) | `?v=1&tab=results&useCase=desktop&platform=bare-metal&architecture=x86_64&prefersGui=true&desktopApps=firefox&requiresCustomBuild=true` |
| `wayland-kiosk-appliance` | Cage Wayland Kiosk Screen | **Cage Appliance (Alpine)** | `kiosk-web` | `make rootfs` (Alpine + Cage) | `?v=1&tab=results&useCase=kiosk-signage&platform=kiosk&architecture=x86_64&prefersGui=true` |
| `wsl2-developer-box` | Windows WSL2 Developer Box | **Debian** | `wsl2-debian` | `make tarball` (WSL2 RootFS) | `?v=1&tab=results&useCase=server&platform=wsl2&architecture=x86_64&prefersGui=false` |
| `proxmox-lxc-container` | Homelab Proxmox LXC Template | **Proxmox VE / Debian** | `proxmox-lxc` | `make tarball` (LXC RootFS) | `?v=1&tab=results&useCase=hypervisor-vms&platform=bare-metal&architecture=x86_64` |
| `in-browser-v86` | In-Browser WebAssembly Linux | **WebVM / v86** | `wasm-browser` | `make serve` (Local HTTP) | `?v=1&tab=results&experienceLevel=beginner&useCase=browser-wasm&platform=browser-wasm&architecture=x86_64` |
| `retro-gaming-batocera` | Living Room Retro Gaming | **Batocera.linux** | *Turnkey* | Flash Image to USB | `?v=1&tab=results&experienceLevel=beginner&useCase=gaming&platform=bare-metal&architecture=x86_64&footprint=lean&maxRamMb=4096&prefersGui=true` |
| `home-office-mint` | Home Office & Freelance PC | **Linux Mint** | *Turnkey* | Turnkey Installer ISO | `?v=1&tab=results&experienceLevel=beginner&useCase=home-office&platform=bare-metal&architecture=x86_64&maxRamMb=8192&prefersGui=true` |

---

## 🎯 Test Guide 1: Declarative NixOS Flake & Instant VM Sandbox

NixOS allows declaring the entire operating system in a `flake.nix` and booting an isolated test-drive VM in a single command.

### 1. Export Recipe via CLI
```bash
npx distro-tailor export \
  --url "?v=1&tab=results&statePreference=declarative&useCase=desktop&architecture=x86_64" \
  --out ./build-test/nixos
cd ./build-test/nixos
```

### 2. Inspect Generated Files
- `flake.nix`: Locks Nixpkgs to `nixos-24.11` and outputs `nixosConfigurations.tailor-nixos`.
- `configuration.nix`: Declares GNOME desktop, user accounts, and package suites.
- `Makefile`: Provides build and preview automation.

### 3. Test-Drive in Disposable VM
```bash
make test-vm
```
- Nix builds the system toplevel and boots an ephemeral QEMU window.
- Login with username `tailor` and password `changeme`.
- Any changes made in the VM are completely disposable (safe sandbox).
- Press `Ctrl+A` then `X` to exit if running headless.

---

## 🎯 Test Guide 2: Debian Cloud-Init Virtual Machine Disk (QCOW2)

Generates an automated cloud or homelab virtual machine image configured with SSH keys, non-root user accounts, and turnkey container services (e.g. Nextcloud).

### 1. Export Recipe via CLI
```bash
npx distro-tailor export \
  --url "?v=1&tab=results&useCase=server&platform=vm&architecture=x86_64&prefersGui=false&dockerApp=nextcloud" \
  --out ./build-test/cloud-vm
cd ./build-test/cloud-vm
```

### 2. Build the QCOW2 Disk
```bash
make image
```
- Creates a sparse QCOW2 virtual disk `output/tailor-debian.qcow2`.
- Credentials and SSH keys are placed in `output/credentials.txt`.

### 3. Boot the Disk Image in QEMU
```bash
qemu-system-x86_64 \
  -m 2048 \
  -smp 2 \
  -drive file=output/tailor-debian.qcow2,format=qcow2 \
  -net nic -net user,hostfwd=tcp::2222-:22 \
  -nographic
```
- Connect via SSH: `ssh -p 2222 tailor@localhost`

---

## 🎯 Test Guide 3: Debian Minimal Live Boot Hybrid ISO

Creates a bootable live USB/ISO system with a compressed squashfs rootfs and hybrid BIOS/UEFI GRUB bootloader.

### 1. Export Recipe via CLI
```bash
npx distro-tailor export \
  --url "?v=1&tab=results&useCase=desktop&platform=bare-metal&architecture=x86_64&prefersGui=true&desktopApps=firefox&requiresCustomBuild=true" \
  --out ./build-test/live-iso
cd ./build-test/live-iso
```

### 2. Compile the Live ISO
```bash
sudo make iso
```
- Bootstraps Debian base rootfs with `debootstrap`.
- Compresses the live filesystem with `mksquashfs`.
- Generates `build/debian-live.iso`.

### 3. Test the Bootable ISO in QEMU
```bash
qemu-system-x86_64 \
  -m 2048 \
  -cdrom build/debian-live.iso \
  -boot d \
  -vga std
```
- GRUB menu appears with live boot options.
- Boots straight to live shell or desktop without touching local drives.

---

## 🎯 Test Guide 4: Cage Wayland Kiosk & Appliance Screen

Creates a stripped-down Alpine Linux rootfs configured with the Cage Wayland compositor and an auto-restart watchdog loop.

### 1. Export Recipe via CLI
```bash
npx distro-tailor export \
  --url "?v=1&tab=results&useCase=kiosk-signage&platform=kiosk&architecture=x86_64&prefersGui=true" \
  --out ./build-test/kiosk
cd ./build-test/kiosk
```

### 2. Build Alpine Kiosk RootFS
```bash
sudo make rootfs KIOSK_URL="https://example.com"
```
- Fetches checksum-verified Alpine minirootfs.
- Installs `cage` compositor and Chromium/Firefox in kiosk mode.

---

## 🎯 Test Guide 5: Windows WSL2 Developer Container Tarball

Produces an unbloated Debian rootfs archive formatted specifically for importing into Windows Subsystem for Linux 2.

### 1. Export Recipe via CLI
```bash
npx distro-tailor export \
  --url "?v=1&tab=results&useCase=server&platform=wsl2&architecture=x86_64&prefersGui=false" \
  --out ./build-test/wsl2
cd ./build-test/wsl2
```

### 2. Build the RootFS Tarball
```bash
make tarball
```
- Generates `output/wsl2-rootfs.tar.gz`.

### 3. Import and Run in WSL2
```powershell
wsl --import CustomDebian C:\WSL\CustomDebian output\wsl2-rootfs.tar.gz --version 2
wsl -d CustomDebian
```

---

## 🎯 Test Guide 6: Homelab Proxmox VE System Container (LXC)

Builds an XZ-compressed container template configured for instantaneous deployment inside Proxmox VE clusters.

### 1. Export Recipe via CLI
```bash
npx distro-tailor export \
  --url "?v=1&tab=results&useCase=hypervisor-vms&platform=bare-metal&architecture=x86_64" \
  --out ./build-test/proxmox
cd ./build-test/proxmox
```

### 2. Build the LXC Archive
```bash
make tarball
```
- Generates `output/proxmox-template.tar.xz`.

### 3. Deploy on Proxmox Node
```bash
pct create 100 output/proxmox-template.tar.xz \
  --ostype debian \
  --cores 2 \
  --memory 1024 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp
pct start 100
```

---

## 🎯 Test Guide 7: In-Browser WebAssembly Linux (WebVM / v86)

Test-drives a full virtual x86 PC running completely inside a web browser tab using WebAssembly.

### 1. Export Recipe via CLI
```bash
npx distro-tailor export \
  --url "?v=1&tab=results&experienceLevel=beginner&useCase=browser-wasm&platform=browser-wasm&architecture=x86_64" \
  --out ./build-test/webvm
cd ./build-test/webvm
```

### 2. Launch Local Test Sandbox
```bash
make serve
```
- Downloads checksum-verified Bochs BIOS and demo Linux ISO.
- Launches local HTTP server at `http://localhost:8000`.
- Open `http://localhost:8000` in your web browser to test-drive Linux in WebAssembly!

---

## 💡 Troubleshooting & Build Tips

1. **Permission Denied during chroot**:
   - `debootstrap` and `mount` operations require root access: run `sudo make <target>`.
2. **QEMU Acceleration on macOS / Linux**:
   - On Linux with KVM: add `-enable-kvm` to QEMU commands for native near-bare-metal speed.
   - On macOS with Apple Silicon: UTM uses Hypervisor.framework for ARM64 or TCG for x86_64 emulation.
3. **Loop Device Cleanup**:
   - If an interrupted build leaves mounts attached:
     ```bash
     sudo umount -f build/rootfs/proc build/rootfs/sys build/rootfs/dev 2>/dev/null || true
     make clean
     ```
