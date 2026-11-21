import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDesktopAppSuite, renderDockerServiceSuite, renderNavigationAppSuite } from './app-suites.js';

test('App Suites: renders NOMMU notices and marks incompatible apps on microcontrollers', () => {
  const nommuCriteria = { architecture: 'nommu' as const };

  const dockerHtml = renderDockerServiceSuite(nommuCriteria, true);
  assert.ok(dockerHtml.includes('NOMMU microcontrollers'), 'Should display NOMMU notice in Docker suite');
  assert.ok(dockerHtml.includes('data-incompatible-reason'), 'Docker apps should have incompatibility attribute');
  assert.ok(dockerHtml.includes('Unsupported Hardware'));

  const desktopHtml = renderDesktopAppSuite(nommuCriteria, true);
  assert.ok(desktopHtml.includes('Microcontrollers (NOMMU) lack display compositors'));
  assert.ok(desktopHtml.includes('data-incompatible-reason'));

  const navHtml = renderNavigationAppSuite(nommuCriteria, true);
  assert.ok(navHtml.includes('Microcontrollers (NOMMU) lack graphical subsystems'));
  assert.ok(navHtml.includes('data-incompatible-reason'));
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

  const navHtml = renderNavigationAppSuite({ architecture: 'x86_64', maxRamMb: 128 }, true);
  // OpenCPN requires 256MB, mkgmap requires 512MB
  assert.ok(navHtml.includes('⚠️ 256M'), 'OpenCPN should display 256M warning on 128MB target');
  assert.ok(navHtml.includes('⚠️ 512M'), 'mkgmap should display 512M warning on 128MB target');
});

test('App Suites: renders cleanly without warnings on ample hardware', () => {
  const ampleCriteria = { architecture: 'x86_64' as const, maxRamMb: 16384 };

  const dockerHtml = renderDockerServiceSuite(ampleCriteria, true);
  assert.ok(!dockerHtml.includes('Unsupported Hardware'));
  assert.ok(!dockerHtml.includes('⚠️'));

  const desktopHtml = renderDesktopAppSuite(ampleCriteria, true);
  assert.ok(!desktopHtml.includes('data-incompatible-reason'));
  assert.ok(!desktopHtml.includes('⚠️'));

  const navHtml = renderNavigationAppSuite(ampleCriteria, true);
  assert.ok(!navHtml.includes('data-incompatible-reason'));
  assert.ok(!navHtml.includes('⚠️'));
});

test('App Suites: renderDesktopAppSuite groups apps by classifier categories', () => {
  const html = renderDesktopAppSuite({ architecture: 'x86_64', maxRamMb: 16384 }, true);
  for (const label of [
    'Browsers',
    'Development & Languages',
    'Media & Creative',
    'Office & Productivity',
    'Gaming & Stores',
    'System, Backup & Networking'
  ]) {
    assert.ok(html.includes(label), `Expected category heading "${label}"`);
  }
  assert.ok(html.includes('Syncthing'));
  assert.ok(html.includes('WireGuard VPN'));
  assert.ok(html.includes('Timeshift Snapshots'));
  assert.ok(html.includes('Restic Backup'));
  assert.ok(html.includes('Steam'));
  assert.ok(html.includes('Heroic (GOG & Epic)'));
  assert.ok(html.includes('Lutris Game Manager'));
});

test('App Suites: renderDockerServiceSuite groups services by classifier categories', () => {
  const html = renderDockerServiceSuite({ architecture: 'x86_64', maxRamMb: 16384 }, true);
  for (const label of [
    'AI & Machine Learning',
    'Media & Photos',
    'Cloud, Docs & Wiki',
    'Homelab, Security & Automation',
    'Smart Home',
    'Web Publishing & Proxy'
  ]) {
    assert.ok(html.includes(label), `Expected Docker category heading "${label}"`);
  }
  assert.ok(html.includes('Ghost CMS'));
  assert.ok(html.includes('Wiki.js'));
  assert.ok(html.includes('ComfyUI (AI Image Gen)'));
  assert.ok(html.includes('Paperless-ngx (Docs OCR)'));
  assert.ok(html.includes('n8n (Workflows)'));
  assert.ok(html.includes('data-suite-container="docker-services"'));
  assert.ok(html.includes('data-suite-pill="ai"'));
  assert.ok(html.includes('max-h-[420px]'));
});

test('App Suites: smart default category is prioritized first without nested collapsible friction', () => {
  const gamingHtml = renderDesktopAppSuite({ useCase: 'gaming', architecture: 'x86_64', maxRamMb: 16384 }, true);
  assert.ok(gamingHtml.indexOf('data-category-group="gaming"') < gamingHtml.indexOf('data-category-group="development"'));
  assert.doesNotMatch(gamingHtml, /<details data-category-group=/);
});

test('App Suites: primary suite renders as collapsible details open by default', () => {
  const html = renderDockerServiceSuite({ architecture: 'x86_64', maxRamMb: 16384 }, true);
  assert.match(html, /<details[^>]*data-panel-id="docker-services"[^>]*\bopen\b/);
  assert.match(html, /Turnkey Service Layer \(Docker Compose\)/);
});
