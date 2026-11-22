import test from 'node:test';
import assert from 'node:assert/strict';
import { extractComposeImages } from './check-compose.js';
import { DOCKER_APPS_REGISTRY, generateDockerStackFiles } from '../packages/core/src/index.js';

test('extractComposeImages extracts image references from every DOCKER_APPS_REGISTRY template', () => {
  for (const app of DOCKER_APPS_REGISTRY) {
    const stack = generateDockerStackFiles({ architecture: 'x86_64', dockerApp: app.id });
    assert.equal(stack.files.length, 1, `${app.id}: expected 1 compose file`);
    const images = extractComposeImages(stack.files[0].content);
    assert.ok(images.length > 0, `${app.id}: expected at least one image`);
  }
});

test('fast-moving multi-container stacks include upstreamComposeUrl reference comments', () => {
  for (const id of ['immich', 'ollama', 'paperless-ngx', 'frigate'] as const) {
    const stack = generateDockerStackFiles({ architecture: 'x86_64', dockerApp: id });
    assert.match(stack.files[0].content, /^# Upstream Compose Reference: https:\/\//m);
  }
});
