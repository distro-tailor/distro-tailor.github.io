import { GeneratedRecipe, UserCriteria } from '../types.js';
import { getDockerApp } from './docker-apps.js';

export function generateCloudInitRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture || 'x86_64';
  const vmName = 'distro-tailor-cloud';
  const dockerAppDef = getDockerApp(criteria.dockerApp);
  const appDir = dockerAppDef ? dockerAppDef.id : 'app';

  const userConfigYaml = `#cloud-config
hostname: ${vmName}
manage_etc_hosts: true

users:
  - name: tailor
    gecos: DistroTailor Cloud Admin
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    lock_passwd: false
    # Default password: tailor (hashed for safety)
    passwd: $6$rounds=4096$tailor$JvYj5l1h1r0Y1s2P1.z7vUqE0WvY5hX1m0R9o3W8vK1

ssh_pwauth: true
chpasswd:
  expire: false

packages:
  - qemu-guest-agent
  - curl
  - htop
  - net-tools${dockerAppDef ? `
  - docker.io
  - docker-compose-v2` : ''}

runcmd:
  - systemctl enable --now qemu-guest-agent
  - echo "DistroTailor Cloud-Init VM initialized successfully!" > /etc/motd${dockerAppDef ? `
  - systemctl enable --now docker
  - mkdir -p /opt/${appDir}
  - cd /opt/${appDir} && docker compose up -d` : ''}
`;

  const metaDataYaml = `instance-id: distro-tailor-001
local-hostname: ${vmName}
`;

  const makefileContent = `SHELL       := /bin/bash
IMAGE_NAME  := ${vmName}
DISK_SIZE   := 10G
ARCH        := ${arch}
OUTPUT_DIR  := ./output
ROOTFS_DIR  := ./build/rootfs
QCOW2_FILE  := $(OUTPUT_DIR)/$(IMAGE_NAME).qcow2

QEMU_IMG    ?= qemu-img
DEBOOTSTRAP ?= debootstrap

.PHONY: all clean prepare rootfs configure qcow2 test-qemu

all: clean prepare rootfs configure qcow2
	@echo "===================================================="
	@echo " Cloud-Init VM Disk Ready: $(QCOW2_FILE)"
	@echo " Proxmox / KVM / OpenStack compatible"
	@echo " Default User: tailor / tailor"
	@echo "===================================================="

clean:
	@echo "[+] Cleaning artifacts..."
	@rm -rf ./build $(OUTPUT_DIR)

prepare:
	@mkdir -p ./build $(OUTPUT_DIR) $(ROOTFS_DIR)

rootfs: prepare
	@echo "[+] Bootstrapping stripped Debian Cloud base..."
	sudo $(DEBOOTSTRAP) --arch=$(ARCH) --variant=minbase bookworm $(ROOTFS_DIR) http://deb.debian.org/debian/

configure: rootfs
	@echo "[+] Installing cloud-init, Linux cloud kernel, and QEMU guest agent..."
	sudo chroot $(ROOTFS_DIR) /bin/bash -c "\\
		apt-get update && \\
		DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \\
			linux-image-cloud-amd64 \\
			systemd-sysv \\
			cloud-init \\
			qemu-guest-agent \\
			openssh-server \\
			sudo && \\
		apt-get clean && \\
		rm -rf /var/lib/apt/lists/*"
	
	@echo "[+] Injecting cloud-init seed configuration..."
	sudo mkdir -p $(ROOTFS_DIR)/var/lib/cloud/seed/nocloud-net
	sudo cp user-data $(ROOTFS_DIR)/var/lib/cloud/seed/nocloud-net/user-data
	sudo cp meta-data $(ROOTFS_DIR)/var/lib/cloud/seed/nocloud-net/meta-data

	@if [ -f docker-compose.yml ]; then \\
		echo "[+] Bundling docker-compose.yml into /opt/${appDir}..."; \\
		sudo mkdir -p $(ROOTFS_DIR)/opt/${appDir}; \\
		sudo cp docker-compose.yml $(ROOTFS_DIR)/opt/${appDir}/docker-compose.yml; \\
	fi

qcow2: configure
	@echo "[+] Generating sparse bootable QCOW2 virtual disk image ($(DISK_SIZE))..."
	$(QEMU_IMG) create -f qcow2 $(QCOW2_FILE) $(DISK_SIZE)
	@echo "[+] Converting rootfs to partitioned QCOW2..."
	sudo virt-make-fs --partition=mbr --type=ext4 --format=qcow2 --size=$(DISK_SIZE) $(ROOTFS_DIR) $(QCOW2_FILE)

test-qemu:
	@echo "[+] Booting VM with QEMU (Forwarding SSH to localhost:2222)..."
	qemu-system-x86_64 -m 2048 -enable-kvm -hda $(QCOW2_FILE) -net nic -net user,hostfwd=tcp::2222-:22
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
make
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
Default credentials: \`tailor\` / \`tailor\`
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
    'make'
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
