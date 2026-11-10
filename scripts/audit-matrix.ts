import { evaluateCriteria, DISTRO_REGISTRY, UserCriteria } from '../packages/core/src/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Archetype {
  id: string;
  name: string;
  category: 'Beginner Goals' | 'Sysadmin & Homelab' | 'Hardware Reclamation' | 'Specialized & Embedded';
  description: string;
  criteria: UserCriteria;
  expectedDistroId?: string | string[];
}

const ARCHETYPES: Archetype[] = [
  // --- BEGINNER GOALS ---
  {
    id: 'kids-macbook',
    name: 'Kids School & Coding (Old MacBook)',
    category: 'Beginner Goals',
    description: 'An old 2012 Intel MacBook with 4GB RAM revived for a 9-year-old school homework and Scratch coding.',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'education-kids',
      platform: 'bare-metal',
      architecture: 'x86_64',
      maxRamMb: 4096,
      prefersGui: true,
      releaseCadence: 'standard',
      driverPhilosophy: 'no-preference',
      bootMedium: 'nvme-ssd',
      realtimeAudio: false
    },
    expectedDistroId: 'endless-os'
  },
  {
    id: 'kids-pc-ample',
    name: 'Kids School & Coding (Modern PC)',
    category: 'Beginner Goals',
    description: 'A spare desktop PC with 8GB RAM for elementary school student homework and educational games.',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'education-kids',
      footprint: 'standard',
      platform: 'bare-metal',
      architecture: 'x86_64',
      maxRamMb: 8192,
      prefersGui: true
    },
    expectedDistroId: 'endless-os'
  },
  {
    id: 'retro-gaming-pc',
    name: 'Retro Gaming Console (Old PC)',
    category: 'Beginner Goals',
    description: 'Living room retro gaming console on a decommissioned office PC hooked to a 1080p TV with gamepads.',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'gaming',
      footprint: 'lean',
      platform: 'bare-metal',
      architecture: 'x86_64',
      maxRamMb: 4096,
      prefersGui: true
    },
    expectedDistroId: 'batocera'
  },
  {
    id: 'media-center-tv',
    name: 'Living Room TV Media Center (Kodi)',
    category: 'Beginner Goals',
    description: 'Dedicated TV box or mini PC running Kodi with instant TV remote control and no desktop clutter.',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'media-center',
      platform: 'bare-metal',
      architecture: 'x86_64',
      maxRamMb: 2048,
      prefersGui: true
    },
    expectedDistroId: 'libreelec'
  },
  {
    id: 'family-nas-backup',
    name: 'Family Photo/Video Backup NAS',
    category: 'Beginner Goals',
    description: 'Home file server and phone photo backup storage hub replacing Google Photos/iCloud subscriptions.',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'nas-storage',
      platform: 'bare-metal',
      architecture: 'x86_64',
      maxRamMb: 4096,
      prefersGui: false
    },
    expectedDistroId: 'openmediavault'
  },
  {
    id: 'smart-home-hub',
    name: 'Smart Home Automation Hub',
    category: 'Beginner Goals',
    description: '24/7 Home Assistant controller running on a low-power single board computer or mini PC.',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'smart-home',
      platform: 'embedded-sbc',
      architecture: 'arm64',
      maxRamMb: 4096
    },
    expectedDistroId: 'home-assistant-os'
  },
  {
    id: 'home-office-mint',
    name: 'Home Office & Freelance PC',
    category: 'Beginner Goals',
    description: 'Familiar Windows-like productivity desktop for spreadsheets, web browsing, Zoom, and document editing.',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'home-office',
      platform: 'bare-metal',
      architecture: 'x86_64',
      maxRamMb: 8192,
      prefersGui: true
    },
    expectedDistroId: ['linux-mint', 'fedora']
  },
  {
    id: 'creative-studio-mac-alt',
    name: 'Creative Studio / DAW Audio / Video',
    category: 'Beginner Goals',
    description: 'Audio production workstation requiring realtime low-latency kernel and pre-installed multimedia tools.',
    criteria: {
      experienceLevel: 'intermediate',
      useCase: 'creative-studio',
      platform: 'bare-metal',
      architecture: 'x86_64',
      realtimeAudio: true,
      maxRamMb: 16384,
      prefersGui: true
    },
    expectedDistroId: 'ubuntu-studio'
  },
  {
    id: 'ai-gpu-workstation',
    name: 'AI & Deep Learning Workstation',
    category: 'Beginner Goals',
    description: 'High-end desktop with dedicated NVIDIA GPU for PyTorch, LLM inference, and CUDA workloads.',
    criteria: {
      experienceLevel: 'intermediate',
      useCase: 'ai-gpu-compute',
      platform: 'bare-metal',
      architecture: 'x86_64',
      maxRamMb: 32768,
      driverPhilosophy: 'seamless-proprietary'
    },
    expectedDistroId: 'pop-os'
  },
  {
    id: 'apple-silicon-m-series',
    name: 'Apple Silicon MacBook (M1/M2/M3)',
    category: 'Beginner Goals',
    description: 'Running native bare-metal Linux on newer ARM64 Apple Silicon hardware.',
    criteria: {
      experienceLevel: 'intermediate',
      platform: 'bare-metal',
      architecture: 'arm64',
      useCase: 'desktop'
    },
    expectedDistroId: 'asahi-linux'
  },

  // --- HARDWARE RECLAMATION ---
  {
    id: 'ancient-pc-512mb',
    name: 'Ancient PC (512MB RAM)',
    category: 'Hardware Reclamation',
    description: 'Reviving a 15-20 year old Pentium 4 or netbook with just 512MB RAM that Windows 10 rejects.',
    criteria: {
      experienceLevel: 'beginner',
      platform: 'bare-metal',
      architecture: 'x86_64',
      maxRamMb: 512,
      footprint: 'minimal',
      useCase: 'desktop'
    },
    expectedDistroId: 'antix'
  },
  {
    id: 'ancient-pc-1gb',
    name: 'Ancient PC (1GB RAM)',
    category: 'Hardware Reclamation',
    description: 'Lightweight desktop for an older Core 2 Duo laptop with 1GB RAM.',
    criteria: {
      experienceLevel: 'beginner',
      platform: 'bare-metal',
      architecture: 'x86_64',
      maxRamMb: 1024,
      footprint: 'minimal',
      useCase: 'desktop'
    },
    expectedDistroId: 'antix'
  },
  {
    id: 'repurposed-phone',
    name: 'Repurposed Smartphone / Tablet',
    category: 'Hardware Reclamation',
    description: 'Breathing second life into old Android or Linux mobile gadget hardware as a portable server.',
    criteria: {
      experienceLevel: 'intermediate',
      platform: 'embedded-sbc',
      architecture: 'arm64',
      useCase: 'desktop'
    },
    expectedDistroId: ['postmarketos', 'dietpi']
  },

  // --- SYSADMIN & HOMELAB ---
  {
    id: 'homelab-hypervisor',
    name: 'Homelab VM & Container Hypervisor',
    category: 'Sysadmin & Homelab',
    description: 'Used enterprise server rack running dozens of VMs and LXC system containers.',
    criteria: {
      experienceLevel: 'intermediate',
      useCase: 'hypervisor-vms',
      platform: 'server',
      architecture: 'x86_64',
      maxRamMb: 32768
    },
    expectedDistroId: 'proxmox-ve'
  },
  {
    id: 'enterprise-zfs-nas',
    name: 'Enterprise Multi-Bay ZFS Storage Server',
    category: 'Sysadmin & Homelab',
    description: 'Multi-terabyte rackmount storage appliance requiring enterprise ZFS, snapshots, and NFS/SMB shares.',
    criteria: {
      experienceLevel: 'intermediate',
      useCase: 'nas-storage',
      platform: 'server',
      architecture: 'x86_64',
      footprint: 'standard',
      maxRamMb: 16384
    },
    expectedDistroId: ['truenas-scale', 'openmediavault']
  },
  {
    id: 'kubernetes-node',
    name: 'Immutable Kubernetes Cluster Node',
    category: 'Sysadmin & Homelab',
    description: 'Zero-SSH, API-managed minimal OS built exclusively to host K8s control plane and worker nodes.',
    criteria: {
      experienceLevel: 'systems-engineer',
      useCase: 'k8s-cluster',
      statePreference: 'stateless-ram',
      architecture: 'x86_64'
    },
    expectedDistroId: 'talos'
  },
  {
    id: 'home-router-firewall',
    name: 'Home Router & Hardware Firewall',
    category: 'Sysadmin & Homelab',
    description: 'Dedicated multi-port mini PC or home router replacing ISP-provided equipment with traffic shaping and VPN.',
    criteria: {
      experienceLevel: 'intermediate',
      useCase: 'router-networking',
      platform: 'router-firewall',
      architecture: 'x86_64'
    },
    expectedDistroId: 'openwrt'
  },
  {
    id: 'wsl2-developer',
    name: 'Windows WSL2 Developer Environment',
    category: 'Sysadmin & Homelab',
    description: 'Fast, lightweight development environment running under Windows Subsystem for Linux 2.',
    criteria: {
      experienceLevel: 'intermediate',
      platform: 'wsl2',
      architecture: 'x86_64'
    },
    expectedDistroId: ['debian', 'ubuntu']
  },
  {
    id: 'cloud-vm-cloud-init',
    name: 'Cloud Virtual Machine (Cloud-Init)',
    category: 'Sysadmin & Homelab',
    description: 'Headless QCOW2 cloud image automated with user-data scripts for microservices.',
    criteria: {
      experienceLevel: 'intermediate',
      platform: 'vm',
      useCase: 'server',
      architecture: 'x86_64'
    },
    expectedDistroId: ['debian', 'ubuntu']
  },

  // --- SPECIALIZED & EMBEDDED ---
  {
    id: 'nommu-microcontroller',
    name: 'Microcontroller / NOMMU Hardware (<32MB)',
    category: 'Specialized & Embedded',
    description: 'Extreme micro footprint for microcontrollers without an MMU running from raw SPI flash.',
    criteria: {
      experienceLevel: 'systems-engineer',
      architecture: 'nommu',
      footprint: 'micro',
      useCase: 'iot-embedded'
    },
    expectedDistroId: 'buildroot'
  },
  {
    id: 'minimal-container-base',
    name: 'Minimal Container Base (Docker / OCI)',
    category: 'Specialized & Embedded',
    description: 'Zero-CVE micro-image for packaging Go/Rust/Node microservices with zero shell or package manager bloat.',
    criteria: {
      experienceLevel: 'intermediate',
      useCase: 'container-base',
      footprint: 'minimal',
      platform: 'container'
    },
    expectedDistroId: ['chainguard-distroless', 'alpine']
  },
  {
    id: 'public-web-kiosk',
    name: 'Public Web Kiosk / Digital Signage',
    category: 'Specialized & Embedded',
    description: 'Locked-down, tamper-proof full-screen browser terminal for hotel lobby or digital sign board.',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'kiosk-signage',
      platform: 'kiosk',
      architecture: 'x86_64',
      prefersGui: true
    },
    expectedDistroId: ['porteus-kiosk', 'cage-appliance']
  },
  {
    id: 'single-app-pos-product',
    name: 'Single-App Appliance / Touch POS Screen',
    category: 'Specialized & Embedded',
    description: 'Boots directly into one dedicated Wayland application with silent splash screen and auto-restart.',
    criteria: {
      experienceLevel: 'intermediate',
      useCase: 'appliance-product',
      architecture: 'x86_64',
      prefersGui: true
    },
    expectedDistroId: 'cage-appliance'
  },
  {
    id: 'browser-wasm-v86',
    name: 'In-Browser WebAssembly Linux',
    category: 'Specialized & Embedded',
    description: 'Running a virtual x86 PC purely inside a web browser tab without local installation.',
    criteria: {
      experienceLevel: 'beginner',
      useCase: 'browser-wasm',
      platform: 'web-browser'
    },
    expectedDistroId: 'webvm-v86'
  },
  {
    id: 'immutable-atomic-desktop',
    name: 'Immutable Atomic Desktop (Silverblue)',
    category: 'Specialized & Embedded',
    description: 'Modern indestructible workstation with read-only rootfs, ostree atomic rollbacks, and Flatpak apps.',
    criteria: {
      experienceLevel: 'intermediate',
      useCase: 'desktop',
      statePreference: 'immutable-atomic',
      architecture: 'x86_64',
      prefersGui: true
    },
    expectedDistroId: 'fedora-silverblue'
  },
  {
    id: 'power-user-arch',
    name: 'DIY Bleeding-Edge Rolling Desktop',
    category: 'Specialized & Embedded',
    description: 'Tinkerer who wants complete package customization, cutting-edge software, and AUR access.',
    criteria: {
      experienceLevel: 'advanced',
      useCase: 'gaming',
      releaseCadence: 'rolling',
      architecture: 'x86_64',
      prefersGui: true
    },
    expectedDistroId: 'arch'
  },
  {
    id: 'declarative-nixos',
    name: 'Declarative Reproducible System (NixOS)',
    category: 'Specialized & Embedded',
    description: 'DevOps engineer wanting 100% reproducible configuration with atomic rollbacks.',
    criteria: {
      experienceLevel: 'advanced',
      useCase: 'desktop',
      statePreference: 'declarative',
      architecture: 'x86_64'
    },
    expectedDistroId: 'nixos'
  }
];

// Single-purpose appliances that must NEVER win for a general desktop or educational request
const APPLIANCE_DISTRO_IDS = [
  'porteus-kiosk',
  'cage-appliance',
  'libreelec',
  'openwrt',
  'talos',
  'home-assistant-os',
  'openmediavault',
  'truenas-scale',
  'proxmox-ve'
];

interface AuditResult {
  archetype: Archetype;
  winnerId: string;
  winnerName: string;
  winnerScore: number;
  runnerUpId: string;
  runnerUpName: string;
  runnerUpScore: number;
  thirdId: string;
  thirdName: string;
  thirdScore: number;
  sanityStatus: 'PASS' | 'WARN' | 'FAIL';
  sanityNote: string;
}

export function runMatrixAudit(): { results: AuditResult[]; summary: { total: number; passed: number; warned: number; failed: number } } {
  const results: AuditResult[] = [];
  let passed = 0;
  let warned = 0;
  let failed = 0;

  for (const arc of ARCHETYPES) {
    const output = evaluateCriteria(arc.criteria, DISTRO_REGISTRY);
    const top = output.topMatches;
    const winner = top[0];
    const runnerUp = top[1];
    const third = top[2];

    const winnerId = winner.distro.id;
    const winnerName = winner.distro.name;
    const winnerScore = winner.score;

    let sanityStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    let sanityNote = 'Recommendation aligned with archetype goals.';

    // Rule 1: No appliance win on general desktop / education / office goals
    const isDesktopGoal = ['education-kids', 'home-office', 'creative-studio', 'desktop'].includes(
      arc.criteria.useCase || ''
    );
    if (isDesktopGoal && APPLIANCE_DISTRO_IDS.includes(winnerId)) {
      sanityStatus = 'FAIL';
      sanityNote = `FATAL: Single-purpose appliance (${winnerName}) won for a desktop/education goal!`;
    }

    // Rule 2: Architecture compatibility check
    if (arc.criteria.architecture && !winner.distro.architectures.includes(arc.criteria.architecture)) {
      sanityStatus = 'FAIL';
      sanityNote = `FATAL: Winner does not support target architecture ${arc.criteria.architecture}!`;
    }

    // Rule 3: RAM budget check
    if (arc.criteria.maxRamMb && winner.distro.minRamMb > arc.criteria.maxRamMb) {
      sanityStatus = 'FAIL';
      sanityNote = `FATAL: Winner requires ${winner.distro.minRamMb}MB RAM, exceeding hardware budget ${arc.criteria.maxRamMb}MB!`;
    }

    // Rule 4: Expected winner check (if specified)
    if (arc.expectedDistroId) {
      const allowed = Array.isArray(arc.expectedDistroId) ? arc.expectedDistroId : [arc.expectedDistroId];
      if (!allowed.includes(winnerId)) {
        if (sanityStatus !== 'FAIL') {
          sanityStatus = 'WARN';
          sanityNote = `Expected ${allowed.join(' or ')}, but got ${winnerId} (${winnerScore}%). Runner up: ${runnerUp?.distro.id} (${runnerUp?.score}%).`;
        }
      }
    }

    if (sanityStatus === 'PASS') passed++;
    else if (sanityStatus === 'WARN') warned++;
    else failed++;

    results.push({
      archetype: arc,
      winnerId,
      winnerName,
      winnerScore,
      runnerUpId: runnerUp?.distro.id || '',
      runnerUpName: runnerUp?.distro.name || '',
      runnerUpScore: runnerUp?.score || 0,
      thirdId: third?.distro.id || '',
      thirdName: third?.distro.name || '',
      thirdScore: third?.score || 0,
      sanityStatus,
      sanityNote
    });
  }

  return {
    results,
    summary: {
      total: ARCHETYPES.length,
      passed,
      warned,
      failed
    }
  };
}

export function generateMatrixMarkdown(audit: ReturnType<typeof runMatrixAudit>): string {
  const { results, summary } = audit;
  const timestamp = new Date().toISOString();

  let md = `# 🎯 DistroTailor Archetype Matrix Audit Report\n\n`;
  md += `> **Automated Sanity & AI Evaluation Matrix**\n`;
  md += `> Generated: \`${timestamp}\` | Evaluated Archetypes: **${summary.total}** | Status: **${summary.failed === 0 ? '✅ ALL CHECKS HEALTHY' : '❌ ANOMALIES DETECTED'}**\n\n`;

  md += `## 📊 Executive Summary\n\n`;
  md += `| Total Archetypes | ✅ Passed | ⚠️ Divergent / Review | ❌ Incompatible / Fail |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  md += `| **${summary.total}** | **${summary.passed}** (${Math.round((summary.passed / summary.total) * 100)}%) | **${summary.warned}** | **${summary.failed}** |\n\n`;

  const categories = Array.from(new Set(results.map(r => r.archetype.category)));

  for (const cat of categories) {
    md += `## 📂 ${cat}\n\n`;
    md += `| Status | Archetype | Hardware / Constraints | 🥇 Top Winner | 🥈 Runner-Up | 🥉 3rd Place | Audit Sanity Notes |\n`;
    md += `| :---: | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    const catResults = results.filter(r => r.archetype.category === cat);
    for (const r of catResults) {
      const statusIcon = r.sanityStatus === 'PASS' ? '🟢 PASS' : r.sanityStatus === 'WARN' ? '🟡 REVIEW' : '🔴 FAIL';
      const c = r.archetype.criteria;
      const hw = [
        c.architecture || 'any-arch',
        c.maxRamMb ? `${c.maxRamMb}MB RAM` : '',
        c.platform || '',
        c.footprint || ''
      ].filter(Boolean).join(' • ');

      const winnerText = `**${r.winnerName}** (${r.winnerScore}%)`;
      const runnerText = `${r.runnerUpName} (${r.runnerUpScore}%)`;
      const thirdText = `${r.thirdName} (${r.thirdScore}%)`;

      md += `| ${statusIcon} | **${r.archetype.name}**<br>_${r.archetype.description}_ | \`${hw}\` | ${winnerText} | ${runnerText} | ${thirdText} | ${r.sanityNote} |\n`;
    }
    md += `\n`;
  }

  md += `## 🛡️ Invariant Rules Enforced by Matrix\n\n`;
  md += `1. **No Appliance Leakage to Desktop Goals:** Single-purpose appliances (\`Porteus Kiosk\`, \`OpenWrt\`, \`LibreELEC\`, \`Talos\`, \`Home Assistant\`, \`TrueNAS\`, \`Proxmox\`) must NEVER win on general desktop, educational, or home-office requests.\n`;
  md += `2. **Hardware Constraints Integrity:** Recommended winner must physically support target CPU architecture and fit inside installed RAM.\n`;
  md += `3. **Child & Educational Alignment:** Kid-safe school and coding laptops (including older MacBooks) must decisively recommend **Endless OS** or lightweight desktop lifesavers (e.g. antiX / Linux Mint), never web terminals.\n`;

  return md;
}

// If executed directly
const audit = runMatrixAudit();
const markdown = generateMatrixMarkdown(audit);

const docsPath = path.resolve(process.cwd(), 'docs/distro-recommendations-matrix.md');
fs.writeFileSync(docsPath, markdown, 'utf8');

console.log(`\n=============================================================`);
console.log(`🎯 DistroTailor Archetype Matrix Audit Complete`);
console.log(`=============================================================`);
console.log(`Total Archetypes Evaluated : ${audit.summary.total}`);
console.log(`Passed                     : ${audit.summary.passed}`);
console.log(`Warnings / Review          : ${audit.summary.warned}`);
console.log(`Failures                   : ${audit.summary.failed}`);
console.log(`Report Written To          : ${docsPath}`);
console.log(`=============================================================\n`);

if (audit.summary.failed > 0) {
  process.exit(1);
}
