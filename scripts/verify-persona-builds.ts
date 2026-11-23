#!/usr/bin/env tsx
/**
 * On-demand CI/CD and local build verifier for persona-based custom recipes.
 *
 * Exports a persona's generated build recipe, installs required host packages
 * (on Debian/Ubuntu), executes the recipe Makefile, and verifies the resulting
 * artifact (ISO, QCOW2, tarball, rootfs, or Nix flake).
 */

import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveRecipeGenerator, isRecipeGeneratorId } from '../packages/core/src/index.js';
import { getPersonaPresetById, PersonaPreset } from '../packages/web/src/data/persona-presets.js';

export type VerifyTier = 'fast' | 'heavy';

export interface QemuSmokeConfig {
  /** Shell command that prints the QEMU command (so globs like output/*.qcow2 expand). */
  command: string;
  /** Regex pattern matched against serial console output to confirm a successful boot. */
  successPattern: string;
  /** Timeout in milliseconds (software TCG emulation on CI runners can take 1-3 minutes). */
  timeoutMs: number;
}

export interface PersonaBuildSpec {
  personaId: string;
  tier: VerifyTier;
  aptPackages: string[];
  requiresLinuxBuild?: boolean;
  requiresNix?: boolean;
  buildCommand: string;
  verifyCommand: string;
  smokeCommand?: string;
  qemuSmoke?: QemuSmokeConfig;
}

export const PERSONA_BUILD_SPECS: readonly PersonaBuildSpec[] = [
  {
    personaId: 'in-browser-v86',
    tier: 'fast',
    aptPackages: ['make', 'curl'],
    buildCommand: 'make fetch',
    verifyCommand: 'test -s linux.iso && test -s bochs-bios.bin && test -s bochs-vgabios.bin'
  },
  {
    personaId: 'wayland-kiosk-appliance',
    tier: 'fast',
    aptPackages: ['make', 'curl', 'ca-certificates', 'tar'],
    requiresLinuxBuild: true,
    buildCommand: 'sudo make',
    verifyCommand: 'test -d build/rootfs && test -x build/rootfs/home/appuser/app-start.sh',
    smokeCommand: 'sudo chroot build/rootfs /bin/sh -c "command -v cage && test -x /home/appuser/app-start.sh"'
  },
  {
    personaId: 'wsl2-developer-box',
    tier: 'fast',
    aptPackages: ['make', 'debootstrap', 'tar'],
    requiresLinuxBuild: true,
    buildCommand: 'sudo make',
    verifyCommand: 'tar -tzf output/*.tar.gz | head -n 20',
    smokeCommand:
      'IMG_ID=$(docker import output/*.tar.gz) && docker run --rm "$IMG_ID" /bin/sh -c "cat /etc/os-release && command -v systemctl" && docker rmi "$IMG_ID"'
  },
  {
    personaId: 'proxmox-lxc-container',
    tier: 'fast',
    aptPackages: ['make', 'debootstrap', 'tar', 'xz-utils'],
    requiresLinuxBuild: true,
    buildCommand: 'sudo make',
    verifyCommand: 'tar -tJf output/*.tar.xz | head -n 20',
    smokeCommand:
      'sudo chroot build/rootfs /bin/sh -c "cat /etc/os-release && command -v systemctl"'
  },
  {
    personaId: 'cloud-init-vm',
    tier: 'heavy',
    aptPackages: ['make', 'debootstrap', 'qemu-utils', 'libguestfs-tools', 'qemu-system-x86'],
    requiresLinuxBuild: true,
    buildCommand: 'sudo make',
    verifyCommand: 'qemu-img info output/*.qcow2',
    qemuSmoke: {
      command:
        'qemu-system-x86_64 -m 1024 -nographic -no-reboot -kernel build/rootfs/boot/vmlinuz-* -initrd build/rootfs/boot/initrd.img-* -hda output/*.qcow2 -append "root=/dev/sda1 rw console=ttyS0"',
      successPattern: 'login:|Cloud-init.*finished',
      timeoutMs: 180_000
    }
  },
  {
    personaId: 'debootstrap-live-iso',
    tier: 'heavy',
    aptPackages: [
      'make',
      'debootstrap',
      'genisoimage',
      'squashfs-tools',
      'grub-pc-bin',
      'grub-efi-amd64-bin',
      'mtools',
      'xorriso',
      'curl',
      'ca-certificates',
      'qemu-system-x86'
    ],
    requiresLinuxBuild: true,
    buildCommand: 'sudo make',
    verifyCommand: 'xorriso -indev output/*.iso -toc',
    qemuSmoke: {
      command:
        'qemu-system-x86_64 -m 1024 -nographic -no-reboot -kernel build/iso/boot/vmlinuz -initrd build/iso/boot/initrd.img -cdrom output/*.iso -append "boot=live console=ttyS0"',
      successPattern: 'login:|Started .*\\.service|Reached target',
      timeoutMs: 180_000
    }
  },
  {
    personaId: 'nixos-declarative',
    tier: 'heavy',
    aptPackages: ['make'],
    requiresNix: true,
    buildCommand: 'make check',
    verifyCommand: 'test -f flake.nix && test -f configuration.nix'
  }
];

export function getPersonaBuildSpec(personaId: string): PersonaBuildSpec | undefined {
  return PERSONA_BUILD_SPECS.find((s) => s.personaId === personaId);
}

export function resolvePersonasToVerify(selection: string): PersonaBuildSpec[] {
  if (selection === 'all') {
    return [...PERSONA_BUILD_SPECS];
  }
  if (selection === 'all-fast') {
    return PERSONA_BUILD_SPECS.filter((s) => s.tier === 'fast');
  }
  const spec = getPersonaBuildSpec(selection);
  if (!spec) {
    const valid = ['all-fast', 'all', ...PERSONA_BUILD_SPECS.map((s) => s.personaId)];
    throw new Error(`Unknown persona "${selection}". Valid options: ${valid.join(', ')}`);
  }
  return [spec];
}

export interface ParsedVerifyArgs {
  persona: string;
  outDir: string;
  dryRun: boolean;
  docker: boolean;
  skipApt: boolean;
  skipSmoke: boolean;
  list: boolean;
  matrix?: string;
}

export function parseArgs(argv: string[]): ParsedVerifyArgs {
  const defaultOutDir = path.join(os.homedir(), '.cache', 'distro-tailor-verify');
  const parsed: ParsedVerifyArgs = {
    persona: 'all-fast',
    outDir: defaultOutDir,
    dryRun: false,
    docker: false,
    skipApt: false,
    skipSmoke: false,
    list: false
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--persona' && argv[i + 1]) {
      parsed.persona = argv[++i];
    } else if (arg === '--out' && argv[i + 1]) {
      parsed.outDir = argv[++i];
    } else if (arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '--docker') {
      parsed.docker = true;
    } else if (arg === '--skip-apt') {
      parsed.skipApt = true;
    } else if (arg === '--skip-smoke') {
      parsed.skipSmoke = true;
    } else if (arg === '--list') {
      parsed.list = true;
    } else if (arg === '--matrix' && argv[i + 1]) {
      parsed.matrix = argv[++i];
    }
  }
  return parsed;
}

export async function exportPersonaRecipe(
  personaId: string,
  targetDir: string
): Promise<{ preset: PersonaPreset; recipeId: string; files: string[] }> {
  const preset = getPersonaPresetById(personaId);
  if (!preset || !preset.recipeId || !isRecipeGeneratorId(preset.recipeId)) {
    throw new Error(`Persona "${personaId}" does not map to a custom build recipe.`);
  }

  const recipe = resolveRecipeGenerator(preset.recipeId, preset.criteria);
  await fs.mkdir(targetDir, { recursive: true });

  const written: string[] = [];
  for (const file of recipe.files) {
    const filePath = path.join(targetDir, file.filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.content, 'utf-8');
    if (file.executable) {
      await fs.chmod(filePath, 0o755);
    }
    written.push(file.filename);
  }

  return { preset, recipeId: recipe.id, files: written };
}

function runShell(command: string, cwd?: string): void {
  console.log(`$ ${command}`);
  execSync(command, { cwd, stdio: 'inherit', shell: '/bin/bash' });
}

function runQemuSmokeTest(config: QemuSmokeConfig, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`$ ${config.command}`);
    const child = spawn('/bin/bash', ['-lc', config.command], {
      cwd,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const matcher = new RegExp(config.successPattern, 'i');
    let output = '';
    let settled = false;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdout?.destroy();
      child.stderr?.destroy();
      if (child.pid) {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          // Process group already exited.
        }
      }
      if (err) reject(err);
      else resolve();
    };

    const onChunk = (chunk: Buffer) => {
      if (settled) return;
      const text = chunk.toString('utf-8');
      process.stdout.write(text);
      output += text;
      if (output.length > 64_000) {
        output = output.slice(-32_000);
      }
      if (matcher.test(output)) {
        console.log(`\n✔ QEMU boot smoke test matched /${config.successPattern}/`);
        finish();
      }
    };

    child.stdout.on('data', onChunk);
    child.stderr.on('data', onChunk);

    child.on('error', (err) => finish(err));
    child.on('exit', (code) => {
      if (!settled) {
        finish(new Error(`QEMU exited early with code ${code ?? 'unknown'} before matching /${config.successPattern}/`));
      }
    });

    const timer = setTimeout(() => {
      finish(new Error(`QEMU boot smoke test timed out after ${config.timeoutMs}ms waiting for /${config.successPattern}/`));
    }, config.timeoutMs);
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    for (const spec of PERSONA_BUILD_SPECS) {
      console.log(`${spec.personaId} (${spec.tier}) -> ${spec.buildCommand}`);
    }
    return;
  }

  if (args.matrix !== undefined) {
    const specs = resolvePersonasToVerify(args.matrix);
    console.log(JSON.stringify(specs.map((s) => s.personaId)));
    return;
  }

  const specs = resolvePersonasToVerify(args.persona);
  const baseOut = path.resolve(process.cwd(), args.outDir);

  for (const spec of specs) {
    const targetDir = path.join(baseOut, spec.personaId);
    console.log(`\n=== [${spec.personaId}] (${spec.tier}) ===`);
    const exported = await exportPersonaRecipe(spec.personaId, targetDir);
    console.log(`Exported ${exported.recipeId} -> ${targetDir} (${exported.files.join(', ')})`);

    const useDocker = Boolean(spec.requiresLinuxBuild && (args.docker || process.platform !== 'linux'));

    if (args.dryRun) {
      if (useDocker) {
        console.log(`[dry-run] mode:   docker (--privileged --platform linux/amd64 debian:bookworm)`);
      }
      if (spec.aptPackages.length > 0) {
        console.log(`[dry-run] apt-get install: ${spec.aptPackages.join(' ')}`);
      }
      console.log(`[dry-run] build:  ${spec.buildCommand}`);
      console.log(`[dry-run] verify: ${spec.verifyCommand}`);
      if (!args.skipSmoke) {
        if (spec.smokeCommand) {
          console.log(`[dry-run] smoke:  ${spec.smokeCommand}`);
        }
        if (spec.qemuSmoke) {
          console.log(`[dry-run] qemu:   ${spec.qemuSmoke.command} (expect /${spec.qemuSmoke.successPattern}/)`);
        }
      }
      continue;
    }

    if (useDocker) {
      const needsContainerKernel = spec.aptPackages.includes('libguestfs-tools');
      const containerApt = Array.from(
        new Set([
          'sudo',
          ...spec.aptPackages.filter((p) => p !== 'qemu-system-x86'),
          ...(needsContainerKernel ? ['linux-image-cloud-amd64'] : [])
        ])
      );
      const chrootSmokeInsideDocker =
        !args.skipSmoke && spec.smokeCommand?.includes('chroot ') ? spec.smokeCommand : null;
      const copyBack = [
        'if [ -d output ]; then mkdir -p /work/output && cp -a --no-preserve=ownership output/. /work/output/; fi',
        'if [ -d build/iso/boot ]; then mkdir -p /work/build/iso/boot && cp -a --no-preserve=ownership build/iso/boot/. /work/build/iso/boot/; fi',
        'if [ -d build/rootfs/boot ]; then mkdir -p /work/build/rootfs/boot && cp -a --no-preserve=ownership build/rootfs/boot/. /work/build/rootfs/boot/; fi'
      ].join(' && ');
      const innerSteps = [
        'set -e',
        `apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ${containerApt.join(' ')}`,
        'rm -rf /tmp/work && mkdir -p /tmp/work && cp -a /work/. /tmp/work/ && cd /tmp/work',
        spec.buildCommand,
        spec.verifyCommand,
        ...(chrootSmokeInsideDocker ? [chrootSmokeInsideDocker] : []),
        copyBack
      ].join(' && ');
      runShell(
        `docker run --rm --privileged --platform linux/amd64 -v "${targetDir}:/work" debian:bookworm /bin/bash -lc '${innerSteps.replace(/'/g, "'\\''")}'`,
        targetDir
      );
      if (!args.skipSmoke) {
        if (spec.smokeCommand && !chrootSmokeInsideDocker) {
          runShell(spec.smokeCommand, targetDir);
        }
        if (spec.qemuSmoke) {
          await runQemuSmokeTest(spec.qemuSmoke, targetDir);
        }
      }
    } else {
      if (!args.skipApt && spec.aptPackages.length > 0) {
        runShell(
          `sudo apt-get update && sudo apt-get install -y --no-install-recommends ${spec.aptPackages.join(' ')}`
        );
      }

      runShell(spec.buildCommand, targetDir);
      runShell(spec.verifyCommand, targetDir);

      if (!args.skipSmoke) {
        if (spec.smokeCommand) {
          runShell(spec.smokeCommand, targetDir);
        }
        if (spec.qemuSmoke) {
          await runQemuSmokeTest(spec.qemuSmoke, targetDir);
        }
      }
    }

    console.log(`✔ [${spec.personaId}] Build and artifact verification succeeded.`);
  }
}

const isEntrypoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
