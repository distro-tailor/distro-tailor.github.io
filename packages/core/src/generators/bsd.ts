import { GeneratedRecipe, UserCriteria } from '../types.js';
import { dockerBuildTarget } from './cross-build.js';
import { generateDockerStackFiles, getSelectedDockerApps } from './docker-apps.js';

/** Generates an unattended FreeBSD pkg + OpenZFS + PF + Jails provisioning Makefile & scripts. */
export function generateFreeBsdRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture === 'arm64' ? 'arm64' : 'amd64';
  const dockerApps = getSelectedDockerApps(criteria);
  const dockerStack = generateDockerStackFiles(criteria);
  const desktopApps = criteria.desktopApps || [];

  const isGui = !!criteria.prefersGui;
  const pkgList = [
    'ca_root_nss',
    'curl',
    'sudo',
    criteria.networkingStack === 'nftables-pf' ? '' : '',
    criteria.virtHost === 'kvm-qemu' ? 'vm-bhyve bhyve-firmware grub2-bhyve' : '',
    criteria.virtHost === 'container-only' ? 'bastille podman-suite' : '',
    isGui ? 'xorg xfce lightdm lightdm-gtk-greeter' : '',
    desktopApps.includes('firefox') ? 'firefox' : '',
    desktopApps.includes('neovim') ? 'neovim' : '',
    desktopApps.includes('git-dev') ? 'git' : '',
    dockerApps.length > 0 ? 'podman-suite' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const pfConf = `# DistroTailor FreeBSD PF Firewall Rules
ext_if = "vtnet0"
set skip on lo0
scrub in all
block in all
pass out quick all keep state
pass in inet proto tcp from any to ($ext_if) port { 22 80 443 } keep state
pass in inet proto icmp all keep state
`;

  const bootstrapScript = `#!/bin/sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "[-] Error: Run as root (su - or sudo sh bootstrap-freebsd.sh)" >&2
  exit 1
fi

echo "[+] Bootstrapping FreeBSD (${arch}) packages..."
env ASSUME_ALWAYS_YES=yes pkg bootstrap -f
pkg update
pkg install -y ${pkgList}

echo "[+] Configuring rc.conf (sshd, pf, ${criteria.fileSystem === 'zfs' ? 'zfs, ' : ''}hostname)..."
sysrc hostname="TailoredFreeBSD"
sysrc sshd_enable="YES"
sysrc pf_enable="YES"
sysrc pf_rules="/etc/pf.conf"
${criteria.fileSystem === 'zfs' ? 'sysrc zfs_enable="YES"' : ''}
${criteria.virtHost === 'container-only' ? 'sysrc bastille_enable="YES"' : ''}

cp pf.conf /etc/pf.conf
pfctl -nf /etc/pf.conf
service sshd start || true
service pf start || pfctl -f /etc/pf.conf || true

echo "[✓] FreeBSD provisioning complete."
`;

  const dockerPlatform = criteria.architecture === 'arm64' ? 'linux/arm64' : 'linux/amd64';
  const isoName = `TailoredFreeBSD-${arch}.iso`;

  const makefileContent = `# DistroTailor FreeBSD Provisioning & PF/ZFS Recipe (${arch})
# Run on a fresh FreeBSD host as root: make install
# Or package provisioning bundle into an ISO: make iso (or make docker-build)

ARCH        ?= ${arch}
DISTRO_NAME ?= TailoredFreeBSD
BUILD_DIR   ?= ./build
OUTPUT_DIR  ?= ./output
ISO_NAME    := ${isoName}
PKGS        := ${pkgList}

.PHONY: all iso install check-pf docker-build clean

all: iso

check-pf:
\t@echo "[+] Validating pf.conf syntax (dry-run on FreeBSD)..."
\t@command -v pfctl >/dev/null 2>&1 && pfctl -nf pf.conf || echo "[!] pfctl not present on this host; skipping PF syntax check."

iso: check-pf
\t@mkdir -p $(BUILD_DIR)/iso $(OUTPUT_DIR)
\t@cp Makefile bootstrap-freebsd.sh pf.conf $(BUILD_DIR)/iso/
\t@if [ -d stacks ]; then cp -r stacks $(BUILD_DIR)/iso/; fi
\t@if [ -f docker-compose.yml ]; then cp docker-compose.yml $(BUILD_DIR)/iso/; fi
\txorriso -as mkisofs -R -J -V "$(DISTRO_NAME)" -o $(OUTPUT_DIR)/$(ISO_NAME) $(BUILD_DIR)/iso
\t@echo "[+] Built provisioning ISO: $(OUTPUT_DIR)/$(ISO_NAME)"

${dockerBuildTarget({
  image: 'alpine:3.21',
  platform: dockerPlatform,
  installCmd: 'apk add --no-cache make xorriso'
})}

install:
\tsh bootstrap-freebsd.sh

clean:
\t@rm -rf $(BUILD_DIR)
`;

  const files: GeneratedRecipe['files'] = [
    {
      filename: 'Makefile',
      description: 'FreeBSD provisioning Makefile with PF firewall validation and package setup',
      content: makefileContent
    },
    {
      filename: 'bootstrap-freebsd.sh',
      description: 'Unattended FreeBSD pkg, sysrc, ZFS, and PF firewall provisioning script',
      content: bootstrapScript,
      executable: true
    },
    {
      filename: 'pf.conf',
      description: 'Default-deny FreeBSD PF packet filter allowing SSH, HTTP/HTTPS, and ICMP',
      content: pfConf
    },
    ...dockerStack.files
  ];

  return {
    id: 'freebsd-pkg',
    title: dockerStack.summaryLabel
      ? `Tailored FreeBSD + ${dockerStack.summaryLabel} Provisioning`
      : 'FreeBSD ZFS, Jails & PF Provisioning Recipe',
    summary:
      'Provisions a fresh FreeBSD host with pkg packages, OpenZFS/rc.conf configuration, default-deny PF firewall, and a provisioning ISO.',
    targetFormat: 'iso',
    estimatedBuildTimeMinutes: 3,
    hostDependencies: ['pkg', 'sysrc', 'pfctl', 'xorriso'],
    files,
    quickstartCommands: [
      'sudo sh bootstrap-freebsd.sh  # Run on a fresh FreeBSD host',
      'make docker-build  # Build provisioning ISO on any host'
    ]
  };
}

/** Generates an unattended OpenBSD pkg_add + rcctl + PF provisioning Makefile & scripts. */
export function generateOpenBsdRecipe(criteria: UserCriteria): GeneratedRecipe {
  const arch = criteria.architecture === 'arm64' ? 'arm64' : 'amd64';
  const desktopApps = criteria.desktopApps || [];
  const isGui = !!criteria.prefersGui;

  const pkgList = [
    'curl',
    'doas',
    isGui ? 'xfce4' : '',
    desktopApps.includes('firefox') ? 'firefox' : '',
    desktopApps.includes('neovim') ? 'neovim' : '',
    desktopApps.includes('git-dev') ? 'git' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const pfConf = `# DistroTailor OpenBSD PF Firewall Rules (strict default-deny)
set skip on lo
block return
pass out quick inet keep state
pass in on egress inet proto tcp from any to (egress) port { 22 80 443 } keep state
pass in inet proto icmp all icmp-type echoreq keep state
`;

  const bootstrapScript = `#!/bin/sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "[-] Error: Run as root (doas sh bootstrap-openbsd.sh)" >&2
  exit 1
fi

echo "[+] Applying OpenBSD errata and installing packages (${arch})..."
syspatch || true
pkg_add -I ${pkgList}

echo "[+] Installing hardened PF rules and enabling sshd..."
cp pf.conf /etc/pf.conf
pfctl -nf /etc/pf.conf
pfctl -f /etc/pf.conf || true
rcctl enable sshd
rcctl start sshd || true

echo "[✓] OpenBSD provisioning complete."
`;

  const dockerPlatform = criteria.architecture === 'arm64' ? 'linux/arm64' : 'linux/amd64';
  const isoName = `TailoredOpenBSD-${arch}.iso`;

  const makefileContent = `# DistroTailor OpenBSD Security & PF Provisioning Recipe (${arch})
# Run on a fresh OpenBSD host as root: make install
# Or package provisioning bundle into an ISO: make iso (or make docker-build)

ARCH        ?= ${arch}
DISTRO_NAME ?= TailoredOpenBSD
BUILD_DIR   ?= ./build
OUTPUT_DIR  ?= ./output
ISO_NAME    := ${isoName}
PKGS        := ${pkgList}

.PHONY: all iso install check-pf docker-build clean

all: iso

check-pf:
\t@command -v pfctl >/dev/null 2>&1 && pfctl -nf pf.conf || echo "[!] pfctl not present on this host; skipping PF syntax check."

iso: check-pf
\t@mkdir -p $(BUILD_DIR)/iso $(OUTPUT_DIR)
\t@cp Makefile bootstrap-openbsd.sh pf.conf $(BUILD_DIR)/iso/
\txorriso -as mkisofs -R -J -V "$(DISTRO_NAME)" -o $(OUTPUT_DIR)/$(ISO_NAME) $(BUILD_DIR)/iso
\t@echo "[+] Built provisioning ISO: $(OUTPUT_DIR)/$(ISO_NAME)"

${dockerBuildTarget({
  image: 'alpine:3.21',
  platform: dockerPlatform,
  installCmd: 'apk add --no-cache make xorriso'
})}

install:
\tsh bootstrap-openbsd.sh

clean:
\t@rm -rf $(BUILD_DIR)
`;

  return {
    id: 'openbsd-pkg',
    title: 'OpenBSD Hardened PF & pkg_add Provisioning Recipe',
    summary:
      'Provisions a fresh OpenBSD host with syspatch security updates, pkg_add packages, rcctl services, strict PF rules, and a provisioning ISO.',
    targetFormat: 'iso',
    estimatedBuildTimeMinutes: 2,
    hostDependencies: ['pkg_add', 'rcctl', 'pfctl', 'syspatch', 'xorriso'],
    files: [
      {
        filename: 'Makefile',
        description: 'OpenBSD provisioning Makefile with PF validation, pkg_add install, and provisioning ISO target',
        content: makefileContent
      },
      {
        filename: 'bootstrap-openbsd.sh',
        description: 'Unattended OpenBSD syspatch, pkg_add, rcctl, and PF provisioning script',
        content: bootstrapScript,
        executable: true
      },
      {
        filename: 'pf.conf',
        description: 'OpenBSD PF firewall ruleset with strict default-deny ingress',
        content: pfConf
      }
    ],
    quickstartCommands: [
      'doas sh bootstrap-openbsd.sh  # Run on a fresh OpenBSD host',
      'make docker-build  # Build provisioning ISO on any host'
    ]
  };
}
