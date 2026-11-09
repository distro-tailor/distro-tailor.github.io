#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';
import {
  evaluateCriteria,
  resolveRecipeGenerator,
  RecipeGeneratorId,
  UserCriteria
} from '@distro-tailor/core';
import { runInteractiveWizard } from './wizard.js';

const program = new Command();

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
  .option('--use-case <useCase>', 'Primary use case (iot-embedded, container-base, k8s-cluster, kiosk-signage, server, desktop, browser-wasm)')
  .option('--platform <platform>', 'Platform target (bare-metal, vm, container, kiosk, embedded-sbc, microcontroller, browser-wasm)')
  .option('--arch <arch>', 'CPU Architecture (x86_64, arm64, armv7, riscv64, nommu, wasm32)')
  .option('--footprint <footprint>', 'Size constraint (micro, minimal, lean, standard, full)')
  .option('--state <state>', 'State model (mutable, declarative, immutable-ostree, stateless-ram, read-only-rootfs)')
  .option('--c-lib <libc>', 'C standard library (glibc, musl, uclibc-ng)')
  .option('--init <init>', 'Init system (systemd, openrc, runit, busybox)')
  .option('--json', 'Output results as machine-readable JSON')
  .action((options) => {
    const criteria: UserCriteria = {
      useCase: options.useCase,
      platform: options.platform,
      architecture: options.arch,
      footprint: options.footprint,
      statePreference: options.state,
      cLibPreference: options.cLib,
      initPreference: options.init
    };

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
    }
  });

// Subcommand: Directly export a build recipe
program
  .command('export')
  .description('Directly export a custom distro build recipe (Makefile/Dockerfile)')
  .requiredOption('--recipe <recipeId>', 'Recipe ID (debootstrap-debian, alpine-chroot, buildroot-embedded, kiosk-web, distroless-docker, wasm-browser)')
  .option('--out <outputDir>', 'Destination directory', './distro-recipe')
  .option('--arch <arch>', 'CPU architecture', 'x86_64')
  .action(async (options) => {
    const recipeId = options.recipe as RecipeGeneratorId;
    const targetDir = path.resolve(process.cwd(), options.out);

    const recipe = resolveRecipeGenerator(recipeId, {
      architecture: options.arch
    });

    await fs.mkdir(targetDir, { recursive: true });

    for (const file of recipe.files) {
      const filePath = path.join(targetDir, file.filename);
      await fs.writeFile(filePath, file.content, 'utf-8');
      if (file.executable) {
        await fs.chmod(filePath, 0o755);
      }
    }

    console.log(pc.green(`\n✔ Recipe "${recipe.title}" exported to: ${pc.bold(targetDir)}`));
    console.log(pc.cyan(`Next command:\n  cd ${options.out} && ${recipe.quickstartCommands[0] || 'make'}\n`));
  });

program.parse();
