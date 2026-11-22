import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRecipeGenerator } from '@distro-tailor/core';
import { generateRecipeBundleScript } from './recipe-bundle.js';

test('generateRecipeBundleScript bundles all files, nested stacks, chmod +x, and quickstart steps', () => {
  const recipe = resolveRecipeGenerator('debootstrap-debian', {
    architecture: 'x86_64',
    desktopApps: ['firefox'],
    dockerApps: ['immich', 'jellyfin']
  });

  const script = generateRecipeBundleScript(recipe);
  assert.match(script, /^#!\/usr\/bin\/env bash/);
  assert.match(script, /mkdir -p 'stacks\/immich'/);
  assert.match(script, /cat <<'__DISTRO_TAILOR_FILE_0__' > 'Makefile'/);
  assert.match(script, /chmod \+x 'bootstrap-apps\.sh'/);
  assert.match(script, /stacks\/jellyfin\/docker-compose\.yml/);
  assert.match(script, /Next steps:/);
});

test('generateRecipeBundleScript avoids delimiter collisions inside file content', () => {
  const script = generateRecipeBundleScript({
    id: 'alpine-chroot',
    title: 'Test',
    summary: 'Test',
    targetFormat: 'tarball',
    estimatedBuildTimeMinutes: 1,
    hostDependencies: [],
    quickstartCommands: ['sudo make'],
    files: [
      {
        filename: 'Makefile',
        description: 'test',
        content: 'echo __DISTRO_TAILOR_FILE_0__\n'
      }
    ]
  });
  assert.match(script, /__DISTRO_TAILOR_FILE_0___X/);
});
