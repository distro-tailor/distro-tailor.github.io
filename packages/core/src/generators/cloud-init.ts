import { GeneratedRecipe, UserCriteria } from '../types.js';
import { debootstrapCrossArchRootfsStep, debootstrapCrossArchVars, dockerBuildTarget } from './cross-build.js';
import { getDockerApp } from './docker-apps.js';

export function generateCloudInitRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture || 'x86_64';
  const debArch = arch === 'arm64' ? 'arm64' : 'amd64';
  const vmName = 'distro-tailor-cloud';
  const dockerAppDef = getDockerApp(criteria.dockerApp);
  const appDir = dockerAppDef ? dockerAppDef.id : 'app';
  const isUefi = criteria.firmwareMode === 'uefi' || criteria.secureBoot !== undefined;
  const partitionTable = isUefi ? 'gpt' : 'mbr';
  const ovmfCode = criteria.secureBoot === 'required'
    ? '/usr/share/OVMF/OVMF_CODE_4M.secboot.fd'
    : '/usr/share/OVMF/OVMF_CODE_4M.fd';
  const qemuFirmwareFlags = isUefi
    ? ` -drive if=pflash,format=raw,readonly=on,file=${ovmfCode}`
    : '';
  const qemuTpmFlags = criteria.tpmUsage
    ? ' -chardev socket,id=chrtpm,path=/tmp/swtpm-sock -tpmdev emulator,id=tpm0,chardev=chrtpm -device tpm-tis,tpmdev=tpm0'
    : '';
  const guest = criteria.guestPlatform || 'kvm';
  const GUEST_AGENTS: Record<string, { pkg: string; service: string }> = {
    kvm: { pkg: 'qemu-guest-agent', service: 'qemu-guest-agent' },
    vmware: { pkg: 'open-vm-tools', service: 'open-vm-tools' },
    hyperv: { pkg: 'hyperv-daemons', service: 'hv-kvp-daemon' },
    virtualbox: { pkg: '', service: '' }
  };
  const guestAgent = GUEST_AGENTS[guest];
  const tpmNote = criteria.tpmUsage
    ? '\t@echo "[i] TPM 2.0: start a software TPM first: swtpm socket --tpm2 --tpmstate dir=/tmp --ctrl type=unixio,path=/tmp/swtpm-sock"\n'
    : '';
  const fsType = criteria.fileSystem === 'btrfs' ? 'btrfs' : criteria.fileSystem === 'xfs' ? 'xfs' : 'ext4';

  const userConfigYaml = `#cloud-config
hostname: __HOSTNAME__
manage_etc_hosts: true
timezone: __TIMEZONE__
locale: __LOCALE__

users:
  - name: __ADMIN_USER__
    gecos: DistroTailor Cloud Admin
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    lock_passwd: false
    # Filled in by "make" with your SSH public key (removed when none is found)
    ssh_authorized_keys:
      - __SSH_PUBKEY__

# "make" sets this to false when an SSH key is authorized
ssh_pwauth: __SSH_PWAUTH__
# No fixed password: cloud-init generates a random one on first boot, prints it to the
# VM console (and /var/log/cloud-init-output.log), and requires a change at first login.
chpasswd:
  expire: true
  users:
    - name: __ADMIN_USER__
      type: RANDOM

packages:
${guestAgent.pkg ? `  - ${guestAgent.pkg}\n` : ''}  - curl
  - htop
  - net-tools${dockerAppDef ? `
  - docker.io
  - docker-compose` : ''}

runcmd:
${guestAgent.service ? `  - systemctl enable --now ${guestAgent.service}\n` : '  # VirtualBox: attach VBoxGuestAdditions.iso inside the VM if guest tools are needed\n'}  - echo "DistroTailor Cloud-Init VM initialized successfully!" > /etc/motd${dockerAppDef ? `
  - systemctl enable --now docker
  - mkdir -p /opt/${appDir}
  - cd /opt/${appDir} && docker compose up -d` : ''}
`;

  const metaDataYaml = `instance-id: distro-tailor-001
local-hostname: __HOSTNAME__
`;

  const makefileContent = `SHELL       := /bin/bash
IMAGE_NAME  := ${vmName}
DISK_SIZE   := 10G
# GUEST_PLATFORM: kvm | vmware | hyperv | virtualbox (selects the guest agent installed in the image)
GUEST_PLATFORM ?= ${guest}
ARCH        := ${debArch}
OUTPUT_DIR  := ./output

# --- SYSTEM INSTALLATION & LOCALIZATION (Installer Defaults) ---
HOSTNAME    ?= $(IMAGE_NAME)
ADMIN_USER  ?= tailor
TIMEZONE    ?= UTC
LOCALE      ?= en_US.UTF-8

# SSH public key to authorize for the $(ADMIN_USER) user (default: your id_ed25519 / id_ecdsa / id_rsa .pub)
INVOKING_HOME ?= $(shell getent passwd "$\${SUDO_USER:-$$(id -un)}" | cut -d: -f6)
SSH_PUBKEY    ?= $(firstword $(wildcard $(INVOKING_HOME)/.ssh/id_ed25519.pub $(INVOKING_HOME)/.ssh/id_ecdsa.pub $(INVOKING_HOME)/.ssh/id_rsa.pub))
ROOTFS_DIR  := ./build/rootfs
QCOW2_FILE  := $(OUTPUT_DIR)/$(IMAGE_NAME).qcow2

QEMU_IMG    ?= qemu-img
DEBOOTSTRAP ?= debootstrap
${debootstrapCrossArchVars()}

.PHONY: all clean prepare rootfs configure qcow2 test-qemu docker-build

all: clean prepare rootfs configure qcow2
	@echo "===================================================="
	@echo " Cloud-Init VM Disk Ready: $(QCOW2_FILE)"
	@echo " Proxmox / KVM / OpenStack compatible"
	@echo " Login: user tailor, SSH key from SSH_PUBKEY or the random password"
	@echo "        printed on the VM console at first boot"
	@echo "===================================================="

clean:
	@echo "[+] Cleaning artifacts..."
	@rm -rf ./build $(OUTPUT_DIR)

prepare:
	@mkdir -p ./build $(OUTPUT_DIR) $(ROOTFS_DIR)

rootfs: prepare
	@echo "[+] Bootstrapping stripped Debian Cloud base..."
${debootstrapCrossArchRootfsStep({ sudoPrefix: 'sudo ', suite: 'bookworm', mirror: 'http://deb.debian.org/debian/' })}

configure: rootfs
	@echo "[+] Installing cloud-init, Linux cloud kernel, and QEMU guest agent..."
	sudo chroot $(ROOTFS_DIR) /bin/bash -c "\\
		apt-get update && \\
		DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \\
			linux-image-cloud-${debArch} \\
			systemd-sysv \\
			cloud-init \\
			${guestAgent.pkg ? `${guestAgent.pkg} \\\n\t\t\t` : ''}openssh-server \\
			sudo && \\
		apt-get clean && \\
		rm -rf /var/lib/apt/lists/*"
	
	@echo "[+] Injecting cloud-init seed configuration..."
	sudo mkdir -p $(ROOTFS_DIR)/var/lib/cloud/seed/nocloud-net
	@set -e; key=''; \\
	if [ -n '$(SSH_PUBKEY)' ] && [ -f '$(SSH_PUBKEY)' ]; then key=$$(head -n 1 '$(SSH_PUBKEY)'); fi; \\
	sed -e "s|__HOSTNAME__|$(HOSTNAME)|g" \\
	    -e "s|__ADMIN_USER__|$(ADMIN_USER)|g" \\
	    -e "s|__TIMEZONE__|$(TIMEZONE)|g" \\
	    -e "s|__LOCALE__|$(LOCALE)|g" \\
	    user-data > ./build/user-data; \\
	if [ -n "$$key" ]; then \\
		sed -i -e "s|__SSH_PUBKEY__|$$key|" -e 's|__SSH_PWAUTH__|false|' ./build/user-data; \\
		echo "[+] Authorized SSH key $(SSH_PUBKEY); SSH password login disabled"; \\
	else \\
		sed -i -e '/ssh_authorized_keys:/,+1d' -e 's|__SSH_PWAUTH__|true|' ./build/user-data; \\
		echo "[!] No SSH public key found (set SSH_PUBKEY=path/to/key.pub); random console password only"; \\
	fi
	sudo install -m 600 ./build/user-data $(ROOTFS_DIR)/var/lib/cloud/seed/nocloud-net/user-data
	sed -e "s|__HOSTNAME__|$(HOSTNAME)|g" meta-data > ./build/meta-data
	sudo install -m 600 ./build/meta-data $(ROOTFS_DIR)/var/lib/cloud/seed/nocloud-net/meta-data

	@if [ -f docker-compose.yml ]; then \\
		echo "[+] Bundling docker-compose.yml into /opt/${appDir}..."; \\
		sudo mkdir -p $(ROOTFS_DIR)/opt/${appDir}; \\
		sudo cp docker-compose.yml $(ROOTFS_DIR)/opt/${appDir}/docker-compose.yml; \\
	fi

qcow2: configure
	@echo "[+] Generating sparse bootable QCOW2 virtual disk image ($(DISK_SIZE))..."
	$(QEMU_IMG) create -f qcow2 $(QCOW2_FILE) $(DISK_SIZE)
	@echo "[+] Converting rootfs to partitioned QCOW2 (${fsType})..."
	sudo rm -f $(ROOTFS_DIR)/usr/bin/$(QEMU_USER_STATIC)
	sudo virt-make-fs --partition=${partitionTable} --type=${fsType} --format=qcow2 --size=$(DISK_SIZE) $(ROOTFS_DIR) $(QCOW2_FILE)

${dockerBuildTarget({
  image: 'debian:bookworm',
  platform: debArch === 'arm64' ? 'linux/arm64' : 'linux/amd64',
  installCmd: 'apt-get update && apt-get install -y --no-install-recommends make sudo debootstrap qemu-utils libguestfs-tools'
})}

test-qemu:
	@echo "[+] Booting VM with QEMU (Forwarding SSH to localhost:2222)..."
${tpmNote}	qemu-system-x86_64 -m 2048 -enable-kvm${qemuFirmwareFlags}${qemuTpmFlags} -hda $(QCOW2_FILE) -net nic -net user,hostfwd=tcp::2222-:22
`;

  const readmeContent = `# ${vmName} Cloud-Init QCOW2 Appliance

This recipe compiles a stripped, bootable **QCOW2 virtual machine disk image** pre-configured with **cloud-init** and the **QEMU Guest Agent**.

## Prerequisites
On Debian/Ubuntu host:
\`\`\`bash
sudo apt-get update
sudo apt-get install -y qemu-utils debootstrap libguestfs-tools
\`\`\`

## Build
\`\`\`bash
make               # Debian/Ubuntu Linux host
make docker-build  # macOS, Windows, or cross-architecture host via Docker
\`\`\`

## 1. Import into Proxmox VE (Server Racks / Homelabs)
\`\`\`bash
# Create VM ID 9000
qm create 9000 --name ${vmName} --memory 2048 --net0 virtio,bridge=vmbr0 --cores 2 --cpu host

# Import the built QCOW2 disk into local-zfs (or local-lvm)
qm importdisk 9000 output/${vmName}.qcow2 local-zfs

# Attach disk as boot drive
qm set 9000 --scsihw virtio-scsi-pci --scsi0 local-zfs:vm-9000-disk-0
qm set 9000 --boot order=scsi0

# Enable QEMU guest agent and start
qm set 9000 --agent enabled=1
qm start 9000
\`\`\`

## 2. Test Locally with QEMU
\`\`\`bash
make test-qemu
# Connect via SSH in another tab:
ssh -p 2222 tailor@localhost
\`\`\`

## Logging In
There is no default password. \`make\` authorizes your SSH public key for the \`tailor\` user
(override with \`make SSH_PUBKEY=path/to/key.pub\`) and disables SSH password login.
Without a key, cloud-init generates a random password on first boot, prints it to the VM
console and \`/var/log/cloud-init-output.log\`, and requires you to change it at first login.
`;

  const files = [
    {
      filename: 'Makefile',
      description: 'Build automation target to bootstrap rootfs and generate QCOW2 image',
      content: makefileContent
    },
    {
      filename: 'user-data',
      description: 'Cloud-config declaration for tailor user, SSH keys, and packages',
      content: userConfigYaml
    },
    {
      filename: 'meta-data',
      description: 'Instance ID and hostname metadata',
      content: metaDataYaml
    }
  ];

  if (dockerAppDef) {
    files.push({
      filename: 'docker-compose.yml',
      description: `Turnkey Docker Compose configuration for ${dockerAppDef.name} (${dockerAppDef.tagline})`,
      content: dockerAppDef.generateCompose(criteria)
    });
  }

  files.push({
    filename: 'README.md',
    description: 'Proxmox VE import and QEMU testing instructions',
    content: readmeContent
  });

  const quickstartCommands = [
    'sudo apt-get install -y qemu-utils debootstrap libguestfs-tools',
    'make               # Linux host (or: make docker-build on macOS / Windows / cross-arch)'
  ];

  if (dockerAppDef) {
    quickstartCommands.push(`docker compose up -d  # Launch ${dockerAppDef.name} at ${dockerAppDef.webUrl}`);
  } else {
    quickstartCommands.push(`qm importdisk 9000 output/${vmName}.qcow2 local-zfs  # (Proxmox VE import)`);
  }

  return {
    id: 'cloud-init-qcow2',
    title: dockerAppDef
      ? `Cloud-Init QCOW2 + ${dockerAppDef.name} Appliance`
      : 'Cloud-Init QCOW2 Virtual Machine Disk',
    summary: dockerAppDef
      ? `Builds a Proxmox/KVM cloud-init virtual disk configured with Docker and pre-seeded with ${dockerAppDef.name} (${dockerAppDef.tagline}).`
      : 'Builds a sparse QCOW2 virtual disk image configured with cloud-init and QEMU guest agent for Proxmox VE, KVM, and OpenStack.',
    targetFormat: 'qcow2',
    estimatedBuildTimeMinutes: 4,
    hostDependencies: ['qemu-img', 'debootstrap', 'libguestfs-tools'],
    files,
    quickstartCommands
  };
}
