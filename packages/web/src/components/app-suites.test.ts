import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDesktopAppSuite, renderDockerServiceSuite } from './app-suites.js';

test('App Suites: renders NOMMU notices and marks incompatible apps on microcontrollers', () => {
  const nommuCriteria = { architecture: 'nommu' as const };

  const dockerHtml = renderDockerServiceSuite(nommuCriteria, true);
  assert.ok(dockerHtml.includes('NOMMU microcontrollers'), 'Should display NOMMU notice in Docker suite');
  assert.ok(dockerHtml.includes('data-incompatible-reason'), 'Docker apps should have incompatibility attribute');
  assert.ok(dockerHtml.includes('Unsupported Hardware'));

  const desktopHtml = renderDesktopAppSuite(nommuCriteria, true);
  assert.ok(desktopHtml.includes('Microcontrollers (NOMMU) lack display compositors'));
  assert.ok(desktopHtml.includes('data-incompatible-reason'));
});

test('App Suites: renders RAM warnings when application exceeds user memory budget', () => {
  const lowRamCriteria = { architecture: 'x86_64' as const, maxRamMb: 512 };

  const dockerHtml = renderDockerServiceSuite(lowRamCriteria, true);
  // Immich requires 4096MB, should display 4G warning
  assert.ok(dockerHtml.includes('⚠️ 4G'), 'Immich should display 4G RAM warning badge on 512MB target');

  const desktopHtml = renderDesktopAppSuite(lowRamCriteria, true);
  // Blender requires 4096MB, Chromium requires 2048MB
  assert.ok(desktopHtml.includes('⚠️ 4G'), 'Blender should display 4G RAM warning badge');
  assert.ok(desktopHtml.includes('⚠️ 2G'), 'Chromium should display 2G RAM warning badge');
});

test('App Suites: renders cleanly without warnings on ample hardware', () => {
  const ampleCriteria = { architecture: 'x86_64' as const, maxRamMb: 16384 };

  const dockerHtml = renderDockerServiceSuite(ampleCriteria, true);
  assert.ok(!dockerHtml.includes('Unsupported Hardware'));
  assert.ok(!dockerHtml.includes('⚠️'));

  const desktopHtml = renderDesktopAppSuite(ampleCriteria, true);
  assert.ok(!desktopHtml.includes('data-incompatible-reason'));
  assert.ok(!desktopHtml.includes('⚠️'));
});
