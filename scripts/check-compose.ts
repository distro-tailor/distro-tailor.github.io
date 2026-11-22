#!/usr/bin/env tsx
/**
 * Validates every generated Docker Compose stack in DOCKER_APPS_REGISTRY:
 * 1. Runs `docker compose -f - config -q` to verify valid Compose YAML & schema.
 * 2. With `--check-images`, runs `docker manifest inspect <image>` to verify upstream tags exist.
 */

import { execFileSync, execSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DOCKER_APPS_REGISTRY, generateDockerStackFiles } from '../packages/core/src/index.js';

export function extractComposeImages(composeYaml: string): string[] {
  const images = new Set<string>();
  for (const line of composeYaml.split('\n')) {
    const match = line.match(/^\s*image:\s*['"]?([^\s'"#]+)['"]?/);
    if (match) {
      images.add(match[1]);
    }
  }
  return Array.from(images);
}

function hasDockerCompose(): boolean {
  try {
    execSync('docker compose version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const checkImages = process.argv.includes('--check-images');
  const dockerAvailable = hasDockerCompose();

  if (!dockerAvailable) {
    console.error('docker compose is required to run check:compose.');
    process.exit(1);
  }

  const allImages = new Set<string>();
  let checked = 0;

  for (const app of DOCKER_APPS_REGISTRY) {
    const stack = generateDockerStackFiles({ architecture: 'x86_64', dockerApp: app.id });
    for (const file of stack.files) {
      execFileSync('docker', ['compose', '-f', '-', 'config', '-q'], {
        input: file.content,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      for (const img of extractComposeImages(file.content)) {
        allImages.add(img);
      }
      checked++;
    }
  }

  console.log(`✔ Validated ${checked} Docker Compose templates with 'docker compose config'.`);

  if (checkImages) {
    let imageFailures = 0;
    for (const image of allImages) {
      try {
        execFileSync('docker', ['manifest', 'inspect', image], { stdio: 'ignore' });
        console.log(`✔ image ok: ${image}`);
      } catch {
        console.error(`✖ image manifest failed: ${image}`);
        imageFailures++;
      }
    }
    if (imageFailures > 0) {
      process.exit(1);
    }
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
