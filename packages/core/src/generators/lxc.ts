import { GeneratedRecipe, UserCriteria } from '../types.js';
import { CREDENTIAL_MAKE_VARS, credentialSetupSteps } from './credentials.js';

export function generateLxcRecipe(criteria: UserCriteria): GeneratedRecipe {
  const templateName = 'distro-tailor-lxc-debian';
  const arch = criteria.architecture || 'x86_64';

  const makefileContent = `SHELL       := /bin/bash
TEMPLATE    := ${templateName}
ARCH        := ${arch}
OUTPUT_DIR  := ./output

${CREDENTIAL_MAKE_VARS}

BUILD_DIR   := ./build/rootfs
TEMPLATE_XZ := $(OUTPUT_DIR)/$(TEMPLATE)-$(ARCH).tar.xz

DEBOOTSTRAP ?= debootstrap
XZ          ?= xz

.PHONY: all clean prepare rootfs configure template

all: clean prepare rootfs configure template
	@echo "===================================================="
	@echo " Proxmox / LXC Container Template Ready!"
	@echo " File: $(TEMPLATE_XZ)"
	@echo " Copy to Proxmox: /var/lib/vz/template/cache/"
	@echo "===================================================="

clean:
	@rm -rf ./build $(OUTPUT_DIR)

prepare:
	@mkdir -p ./build $(OUTPUT_DIR) $(BUILD_DIR)

rootfs: prepare
	@echo "[+] Bootstrapping stripped Debian container base..."
	sudo $(DEBOOTSTRAP) --arch=$(ARCH) --variant=minbase bookworm $(BUILD_DIR) http://deb.debian.org/debian/

configure: rootfs
	@echo "[+] Removing redundant kernel, bootloader & firmware..."
	sudo rm -rf $(BUILD_DIR)/boot/* $(BUILD_DIR)/lib/modules/*
	
	@echo "[+] Configuring container networking, DNS, and base packages..."
	sudo chroot $(BUILD_DIR) /bin/bash -c "\\
		apt-get update && \\
		DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \\
			systemd \\
			systemd-sysv \\
			iproute2 \\
			openssh-server \\
			curl \\
			sudo && \\
		apt-get clean && \\
		rm -rf /var/lib/apt/lists/*"
	
${credentialSetupSteps({ rootfs: '$(BUILD_DIR)', user: 'root', home: '/root', sudo: 'sudo ', expire: true })}

template: configure
	@echo "[+] Compressing LXC rootfs into high-efficiency XZ tarball..."
	cd $(BUILD_DIR) && sudo tar -c . | $(XZ) -T0 -9 > ../../$(TEMPLATE_XZ)
	@echo "[+] LXC Template Size: $$(du -h $(TEMPLATE_XZ) | cut -f1)"
`;

  const lxcTestScript = `#!/usr/bin/env bash
# Proxmox VE Container Creation One-Liner
CT_ID=100
TEMPLATE_PATH="/var/lib/vz/template/cache/${templateName}-${arch}.tar.xz"

if command -v pct &>/dev/null; then
    echo "[+] Creating Proxmox LXC Container ID $CT_ID..."
    pct create $CT_ID "$TEMPLATE_PATH" \\
        -cores 2 \\
        -memory 1024 \\
        -swap 512 \\
        -net0 name=eth0,bridge=vmbr0,ip=dhcp \\
        -storage local-zfs \\
        -ostype debian \\
        -unprivileged 1
    
    echo "[+] Starting Container $CT_ID..."
    pct start $CT_ID
    pct status $CT_ID
else
    echo "[-] Note: 'pct' command is only available directly on Proxmox VE hosts."
    echo "[*] Please copy $TEMPLATE_PATH to your Proxmox server."
fi
`;

  const readmeContent = `# ${templateName} Proxmox VE / LXC Container Template

This recipe generates a minimal, ultra-fast **LXC system container template** (\`.tar.xz\`) engineered specifically for **Proxmox VE**, **Incus**, and **LXD**.

Because containers share the host Linux kernel, this image strips out all kernels, initramfs, and hardware firmware, dropping memory usage to under **25MB RAM** on boot.

## Build
\`\`\`bash
make
\`\`\`

## Deploying on Proxmox VE

1. Copy the built archive to your Proxmox VE server:
\`\`\`bash
scp output/${templateName}-${arch}.tar.xz root@your-proxmox-ip:/var/lib/vz/template/cache/
\`\`\`

2. In the Proxmox Web GUI:
   - Click **Create CT** (top right)
   - Select Template \`${templateName}-${arch}.tar.xz\`
   - Set CPU cores and memory (e.g. 1GB RAM)
   - Finish and Start!

3. Or launch via Proxmox CLI:
\`\`\`bash
pct create 100 /var/lib/vz/template/cache/${templateName}-${arch}.tar.xz -cores 2 -memory 1024 -net0 name=eth0,bridge=vmbr0,ip=dhcp
pct start 100
pct enter 100
\`\`\`
Login: no fixed password. \`make\` sets a random root password (saved to \`output/credentials.txt\`, must be changed at first login) and authorizes your SSH public key if one is found (\`make SSH_PUBKEY=path/to/key.pub\` / \`LOGIN_PASSWORD=...\` to override). On Proxmox you can also set them per container with \`pct create --password\` / \`--ssh-public-keys\`.
`;

  return {
    id: 'proxmox-lxc',
    title: 'Proxmox VE / Incus LXC System Container Template',
    summary:
      'Creates a high-density, sub-second bootable .tar.xz container template for Proxmox VE and LXD with zero kernel overhead.',
    targetFormat: 'lxc-template',
    estimatedBuildTimeMinutes: 3,
    hostDependencies: ['debootstrap', 'tar', 'xz-utils'],
    files: [
      {
        filename: 'Makefile',
        description: 'Build automation script to bootstrap rootfs and generate .tar.xz template',
        content: makefileContent
      },
      {
        filename: 'lxc-create.sh',
        description: 'Proxmox VE container creation helper script',
        content: lxcTestScript,
        executable: true
      },
      {
        filename: 'README.md',
        description: 'Deployment and CLI instructions for Proxmox VE',
        content: readmeContent
      }
    ],
    quickstartCommands: [
      'make',
      `pct create 100 output/${templateName}-${arch}.tar.xz -cores 2 -memory 1024 -net0 name=eth0,bridge=vmbr0,ip=dhcp`,
      'pct start 100'
    ]
  };
}
