#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';
import {
  evaluateCriteria,
  isRecipeGeneratorId,
  RECIPE_GENERATORS,
  resolveRecipeGenerator,
  RecipeGeneratorId,
  UserCriteria,
  migrateUrlParameters,
  deserializeCriteriaFromParams,
  sanitizeCriteria
} from '@distro-tailor/core';
import { runInteractiveWizard } from './wizard.js';

const program = new Command();

function parseUrlCriteria(urlString: string): Record<string, string> {
  const queryString = urlString.includes('?') ? urlString.slice(urlString.indexOf('?') + 1) : urlString;
  const searchParams = new URLSearchParams(queryString);
  const raw: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) {
    raw[k] = v;
  }
  return raw;
}

program
  .name('distro-tailor')
  .description('Adaptive 20-Questions Linux selector & custom distro recipe generator')
  .version('0.1.0');

// Default action: Launch interactive wizard
program
  .action(async () => {
    await runInteractiveWizard();
  });

// Subcommand: Non-interactive recommendation (Ideal for AI agents, scripts, CI)
program
  .command('recommend')
  .description('Evaluate constraints and recommend distributions without interactive prompts')
  .option('--url <url>', 'Evaluate criteria directly from a DistroTailor shared URL or query string')
  .option('--use-case <useCase>', 'Primary use case (iot-embedded, container-base, k8s-cluster, kiosk-signage, server, desktop, browser-wasm)')
  .option('--platform <platform>', 'Platform target (bare-metal, vm, container, kiosk, embedded-sbc, microcontroller, browser-wasm)')
  .option('--arch <arch>', 'CPU Architecture (x86_64, arm64, armv7, riscv64, nommu, wasm32)')
  .option('--footprint <footprint>', 'Size constraint (micro, minimal, lean, standard, full)')
  .option('--state <state>', 'State model (mutable, declarative, immutable-ostree, stateless-ram, read-only-rootfs)')
  .option('--c-lib <libc>', 'C standard library (glibc, musl, uclibc-ng)')
  .option('--init <init>', 'Init system (systemd, openrc, runit, busybox)')
  .option('--filesystem <fs>', 'Root filesystem (ext4, btrfs, zfs, xfs, f2fs, fat32)')
  .option('--kernel <kernel>', 'Kernel flavor (lts-stable, realtime-rt, hardened, zen-liquorix)')
  .option('--bootloader <bootloader>', 'Bootloader preference (grub-hybrid, systemd-boot, u-boot, efistub)')
  .option('--security <security>', 'Security profile (standard-dac, selinux, apparmor, amnesic-ram)')
  .option('--network <network>', 'Networking stack (networkmanager, systemd-networkd, nftables-pf, busybox-minimal)')
  .option('--firmware <mode>', 'Firmware mode (uefi, legacy-bios)')
  .option('--secure-boot <policy>', 'Secure Boot policy (required, own-keys)')
  .option('--tpm <usage>', 'TPM 2.0 usage (measured-boot, disk-unlock)')
  .option('--virt-host <host>', 'Virtualization host (kvm-qemu, xen, bhyve, container-only)')
  .option('--passthrough <mode>', 'Device passthrough (gpu-vfio, pci-devices)')
  .option('--guest-platform <platform>', 'Guest hypervisor for VM images (kvm, vmware, hyperv, virtualbox)')
  .option('--json', 'Output results as machine-readable JSON')
  .action((options) => {
    let criteria: UserCriteria = sanitizeCriteria({
      useCase: options.useCase,
      platform: options.platform,
      architecture: options.arch,
      footprint: options.footprint,
      statePreference: options.state,
      cLibPreference: options.cLib,
      initPreference: options.init,
      fileSystem: options.filesystem,
      kernelFlavor: options.kernel,
      bootloader: options.bootloader,
      securityProfile: options.security,
      networkingStack: options.network,
      firmwareMode: options.firmware,
      secureBoot: options.secureBoot,
      tpmUsage: options.tpm,
      virtHost: options.virtHost,
      devicePassthrough: options.passthrough,
      guestPlatform: options.guestPlatform
    });

    if (options.url) {
      const raw = parseUrlCriteria(options.url);
      const migration = migrateUrlParameters(raw);

      if (!migration.supported) {
        console.error(pc.red(`\n✖ Schema Error: ${migration.fallbackNotice}`));
        process.exit(1);
      }

      if (!options.json && migration.migrated && migration.warnings.length > 0) {
        console.log(pc.yellow(`ℹ Normalized URL parameters (v${migration.version}): ${migration.warnings.join('; ')}`));
      }

      const urlCriteria = deserializeCriteriaFromParams(migration.params);
      criteria = {
        ...criteria,
        ...urlCriteria
      };
    }

    const result = evaluateCriteria(criteria);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(pc.bold(pc.cyan('\n🐧 DistroTailor Analysis Results\n')));
    console.log(pc.dim(result.summaryText));
    console.log('\nTop Matches:');
    result.topMatches.forEach((m, idx) => {
      console.log(`  ${idx + 1}. ${pc.bold(m.distro.name)} (${pc.green(`${m.score}% match`)})`);
      console.log(`     ${pc.dim(m.distro.tagline)}`);
      console.log(`     Link: ${pc.blue(m.distro.website)}`);
    });

    if (result.recommendedRecipe) {
      console.log(pc.bold('\nRecommended Build Recipe:'));
      console.log(`  Title:  ${result.recommendedRecipe.title}`);
      console.log(`  Files:  ${result.recommendedRecipe.files.map((f) => f.filename).join(', ')}`);
      console.log(`  Quickstart: ${result.recommendedRecipe.quickstartCommands[0] || 'make'}`);
      if (result.recommendedRecipe.warnings?.length) {
        for (const w of result.recommendedRecipe.warnings) {
          console.log(pc.yellow(`  ⚠ ${w}`));
        }
      }
    }
  });

// Subcommand: Directly export a build recipe
program
  .command('export')
  .description('Directly export a custom distro build recipe (Makefile/Dockerfile)')
  .option('--url <url>', 'Export recipe derived directly from a DistroTailor shared URL or query string')
  .option('--recipe <recipeId>', `Recipe ID (${Object.keys(RECIPE_GENERATORS).join(', ')})`)
  .option('--out <outputDir>', 'Destination directory', './distro-recipe')
  .option('--arch <arch>', 'CPU architecture', 'x86_64')
  .action(async (options) => {
    if (options.recipe !== undefined && !isRecipeGeneratorId(options.recipe)) {
      console.error(pc.red(`\n✖ Unknown recipe "${options.recipe}". Valid recipes: ${Object.keys(RECIPE_GENERATORS).join(', ')}`));
      process.exit(1);
    }
    let recipeId: RecipeGeneratorId | undefined = options.recipe;
    let arch = options.arch;
    let exportCriteria: UserCriteria = sanitizeCriteria({ architecture: arch });

    if (options.url) {
      const raw = parseUrlCriteria(options.url);
      const migration = migrateUrlParameters(raw);

      if (!migration.supported) {
        console.error(pc.red(`\n✖ Schema Error: ${migration.fallbackNotice}`));
        process.exit(1);
      }

      exportCriteria = deserializeCriteriaFromParams(migration.params);
      const evalResult = evaluateCriteria(exportCriteria);
      if (evalResult.recommendedRecipe) {
        recipeId = evalResult.recommendedRecipe.id;
        arch = exportCriteria.architecture || arch;
        console.log(pc.cyan(`ℹ Inferred recipe "${recipeId}" from shared URL (${evalResult.bestMatch.distro.name})`));
      } else {
        console.error(pc.red('\n✖ No specific build recipe mapped for the criteria in this URL.'));
        process.exit(1);
      }
    }

    if (!recipeId) {
      console.error(pc.red('\n✖ Error: Please specify either --recipe <recipeId> or --url <sharedUrl>.'));
      process.exit(1);
      return;
    }

    const targetDir = path.resolve(process.cwd(), options.out);
    const recipe = resolveRecipeGenerator(recipeId, { ...exportCriteria, architecture: arch });

    await fs.mkdir(targetDir, { recursive: true });

    for (const file of recipe.files) {
      const filePath = path.join(targetDir, file.filename);
      await fs.writeFile(filePath, file.content, 'utf-8');
      if (file.executable) {
        await fs.chmod(filePath, 0o755);
      }
    }

    console.log(pc.green(`\n✔ Recipe "${recipe.title}" exported to: ${pc.bold(targetDir)}`));
    if (recipe.warnings?.length) {
      for (const w of recipe.warnings) {
        console.log(pc.yellow(`⚠ ${w}`));
      }
    }
    const hasDockerBuild = recipe.files.some(
      (f) => f.filename === 'Makefile' && /^docker-build:/m.test(f.content)
    );
    if (process.platform !== 'linux' && hasDockerBuild) {
      console.log(pc.cyan(`Next command (Docker on ${process.platform}):\n  cd ${options.out} && make docker-build\n`));
    } else {
      console.log(pc.cyan(`Next command:\n  cd ${options.out} && ${recipe.quickstartCommands[0] || 'make'}`));
      if (hasDockerBuild) {
        console.log(pc.dim(`  # Or via Docker (cross-arch / non-Debian host): cd ${options.out} && make docker-build`));
      }
      console.log('');
    }
  });

program.parse();
