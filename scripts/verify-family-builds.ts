#!/usr/bin/env tsx
/**
 * Optional reproducible build verifier for every Linux family DIY recipe generator.
 *
 * Usage:
 *   npm run verify:families                  # dry-run (`make -n`) all family Makefiles
 *   npm run verify:families -- --live        # full `make docker-build` in Docker containers
 *   npm run verify:families -- --live --only fedora-dnf,void-xbps
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { RecipeGeneratorId, resolveRecipeGenerator } from '../packages/core/src/index.js';

export const FAMILY_BUILD_IDS: readonly RecipeGeneratorId[] = [
  'debootstrap-debian',
  'fedora-dnf',
  'opensuse-zypper',
  'void-xbps',
  'arch-pacstrap',
  'gentoo-portage',
  'alpine-chroot'
];

export interface FamilyVerifyOptions {
  live: boolean;
  only?: RecipeGeneratorId[];
  workRoot: string;
}

export function parseFamilyVerifyArgs(argv: string[]): FamilyVerifyOptions {
  let live = false;
  let only: RecipeGeneratorId[] | undefined;
  let workRoot = path.join(process.cwd(), '.tmp-verify-families');

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--live') {
      live = true;
    } else if (arg === '--only' && argv[i + 1]) {
      only = argv[++i]
        .split(',')
        .map((s) => s.trim())
        .filter((s): s is RecipeGeneratorId => (FAMILY_BUILD_IDS as readonly string[]).includes(s));
    } else if (arg === '--out' && argv[i + 1]) {
      workRoot = path.resolve(argv[++i]);
    }
  }

  return { live, only, workRoot };
}

export async function verifyFamilyRecipe(
  id: RecipeGeneratorId,
  workDir: string,
  live: boolean
): Promise<void> {
  await fs.rm(workDir, { recursive: true, force: true });
  await fs.mkdir(workDir, { recursive: true });

  const recipe = resolveRecipeGenerator(id, { architecture: 'x86_64', dockerApps: ['pihole'] });
  for (const file of recipe.files) {
    const target = path.join(workDir, file.filename);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.content, 'utf8');
  }

  // Always verify Makefile syntax with `make -n`
  execSync('make -n >/dev/null', { cwd: workDir, stdio: 'inherit' });

  if (live) {
    execSync('make docker-build', { cwd: workDir, stdio: 'inherit' });
    const outFiles = await fs.readdir(path.join(workDir, 'output'));
    const expectedExt = recipe.targetFormat === 'iso' ? '.iso' : '.tar.gz';
    const hasArtifact = outFiles.some((f) => f.endsWith(expectedExt));
    if (!hasArtifact) {
      throw new Error(`${id}: docker-build completed but no ${expectedExt} artifact found in output/`);
    }
  }
}

async function main(): Promise<void> {
  const opts = parseFamilyVerifyArgs(process.argv.slice(2));
  const ids = opts.only && opts.only.length > 0 ? opts.only : FAMILY_BUILD_IDS;
  console.log(`Verifying ${ids.length} family recipe(s) [mode=${opts.live ? 'live docker-build' : 'dry-run make -n'}]...`);

  try {
    for (const id of ids) {
      console.log(`\n==> ${id}`);
      await verifyFamilyRecipe(id, path.join(opts.workRoot, id), opts.live);
      console.log(`✔ ${id} passed`);
    }
  } finally {
    await fs.rm(opts.workRoot, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
