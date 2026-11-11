import { GeneratedRecipe, UserCriteria } from '../types.js';

export function generateWslRecipe(criteria: UserCriteria): GeneratedRecipe {
  const distroName = 'distro-tailor-wsl';
  const arch = criteria.architecture || 'x86_64';

  const wslConfContent = `[boot]
systemd=true

[automount]
enabled=true
mountFsTab=true
root=/mnt/
options="metadata,uid=1000,gid=1000,umask=22,fmask=11"

[network]
generateHosts=true
generateResolvConf=true

[interop]
enabled=true
appendWindowsPath=true

[user]
default=tailor
`;

  const installScriptPs1 = `# DistroTailor WSL2 One-Click Installer for Windows 10/11
$DistroName = "${distroName}"
$InstallDir = "$env:LOCALAPPDATA\\DistroTailor\\wsl"
$Tarball = ".\\output\\rootfs.tar.gz"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " DistroTailor WSL2 Instance Registration" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

if (-not (Test-Path $Tarball)) {
    Write-Error "[-] Error: Tarball $Tarball not found! Please build it first."
    exit 1
}

if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

Write-Host "[+] Importing $DistroName into WSL2..." -ForegroundColor Green
wsl --import $DistroName $InstallDir $Tarball --version 2

Write-Host "[+] Launching $DistroName..." -ForegroundColor Green
wsl -d $DistroName
`;

  const makefileContent = `SHELL       := /bin/bash
DISTRO_NAME := ${distroName}
ARCH        := ${arch}
OUTPUT_DIR  := ./output
BUILD_DIR   := ./build/rootfs
TARBALL     := $(OUTPUT_DIR)/rootfs.tar.gz

DEBOOTSTRAP ?= debootstrap

.PHONY: all clean prepare rootfs configure package

all: clean prepare rootfs configure package
	@echo "===================================================="
	@echo " WSL2 Package Ready: $(TARBALL)"
	@echo " Import into Windows via:"
	@echo "   wsl --import $(DISTRO_NAME) C:\\WSL\\$(DISTRO_NAME) output\\rootfs.tar.gz --version 2"
	@echo "===================================================="

clean:
	@rm -rf ./build $(OUTPUT_DIR)

prepare:
	@mkdir -p ./build $(OUTPUT_DIR) $(BUILD_DIR)

rootfs: prepare
	@echo "[+] Bootstrapping stripped Debian minbase for WSL2 (Zero kernel bloat)..."
	sudo $(DEBOOTSTRAP) --arch=$(ARCH) --variant=minbase bookworm $(BUILD_DIR) http://deb.debian.org/debian/

configure: rootfs
	@echo "[+] Configuring WSL2 userspace, sudo, and development essentials..."
	sudo chroot $(BUILD_DIR) /bin/bash -c "\\
		apt-get update && \\
		DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \\
			sudo \\
			curl \\
			git \\
			ca-certificates \\
			locales \\
			bash-completion && \\
		useradd -m -s /bin/bash -u 1000 tailor && \\
		passwd -l tailor >/dev/null && \\
		echo 'tailor ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/tailor && \\
		chmod 0440 /etc/sudoers.d/tailor && \\
		apt-get clean && \\
		rm -rf /var/lib/apt/lists/*"
	
	@echo "[+] Injecting /etc/wsl.conf..."
	sudo cp wsl.conf $(BUILD_DIR)/etc/wsl.conf

package: configure
	@echo "[+] Packaging WSL2 root filesystem into $(TARBALL)..."
	cd $(BUILD_DIR) && sudo tar -czf ../../$(TARBALL) *
	@echo "[+] Package size: $$(du -h $(TARBALL) | cut -f1)"
`;

  const readmeContent = `# ${distroName} for Windows Subsystem for Linux (WSL2)

This recipe produces a lean, customized root filesystem package tailored for **WSL2 on Windows 10/11**.

Because WSL2 runs on Microsoft's unified virtualization kernel, all redundant Linux kernel images, modules, bootloaders, and firmware are stripped out, yielding an ultra-fast rootfs (~120MB).

## How to Import on Windows

1. Copy \`output/rootfs.tar.gz\` to your Windows machine.
2. Open PowerShell and run:
\`\`\`powershell
# Create destination directory and import
mkdir C:\\WSL\\${distroName}
wsl --import ${distroName} C:\\WSL\\${distroName} output\\rootfs.tar.gz --version 2
\`\`\`
3. Launch your new distro:
\`\`\`powershell
wsl -d ${distroName}
\`\`\`
4. Default user: \`tailor\` (signed in automatically by WSL, with passwordless sudo). The account has no password; set one with \`sudo passwd tailor\` if you need it.
`;

  return {
    id: 'wsl2-debian',
    title: 'Windows Subsystem for Linux 2 (WSL2) Distro Package',
    summary:
      'Compiles a streamlined, zero-bloat rootfs tarball and wsl.conf for one-click import into Windows 10/11 WSL2.',
    targetFormat: 'wsl2',
    estimatedBuildTimeMinutes: 3,
    hostDependencies: ['debootstrap', 'tar'],
    files: [
      {
        filename: 'Makefile',
        description: 'Build script to bootstrap rootfs and generate rootfs.tar.gz',
        content: makefileContent
      },
      {
        filename: 'wsl.conf',
        description: 'WSL2 system configuration with systemd, automount, and default user',
        content: wslConfContent
      },
      {
        filename: 'install-wsl.ps1',
        description: 'PowerShell 1-click import script for Windows',
        content: installScriptPs1
      },
      {
        filename: 'README.md',
        description: 'Import instructions and command examples for Windows users',
        content: readmeContent
      }
    ],
    quickstartCommands: [
      'make',
      `wsl --import ${distroName} C:\\WSL\\${distroName} output\\rootfs.tar.gz --version 2`,
      `wsl -d ${distroName}`
    ]
  };
}
