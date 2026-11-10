import test from 'node:test';
import assert from 'node:assert/strict';
import { isServerContext, SUPPORTED_DESKTOP_ENVS } from './context-detector.js';

test('Context Detector: accurately categorizes server vs desktop environments', () => {
  // Explicit headless
  assert.equal(isServerContext({ prefersGui: false }), true);

  // Server platforms
  assert.equal(isServerContext({ platform: 'server' }), true);
  assert.equal(isServerContext({ platform: 'vm' }), true);
  assert.equal(isServerContext({ platform: 'container' }), true);
  assert.equal(isServerContext({ platform: 'router-firewall' }), true);

  // Server use cases
  assert.equal(isServerContext({ useCase: 'nas-storage' }), true);
  assert.equal(isServerContext({ useCase: 'smart-home' }), true);
  assert.equal(isServerContext({ useCase: 'k8s-cluster' }), true);
  assert.equal(isServerContext({ useCase: 'hypervisor-vms' }), true);

  // Desktop / Consumer workstations
  assert.equal(isServerContext({ platform: 'bare-metal', useCase: 'gaming', prefersGui: true }), false);
  assert.equal(isServerContext({ platform: 'bare-metal', useCase: 'desktop', prefersGui: true }), false);
  assert.equal(isServerContext({ useCase: 'home-office' }), false);
  assert.equal(isServerContext({ useCase: 'creative-studio' }), false);
});

test('Context Detector: provides complete list of supported desktop environments', () => {
  assert.deepEqual(SUPPORTED_DESKTOP_ENVS, ['none', 'cage', 'xfce', 'kde', 'gnome']);
});
