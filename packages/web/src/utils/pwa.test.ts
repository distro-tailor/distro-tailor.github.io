import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(DIR, '../../public');
const INDEX_HTML_PATH = path.resolve(DIR, '../../index.html');

test('PWA Manifest: exists, parses valid JSON, and defines standalone mobile metadata', () => {
  const manifestPath = path.join(PUBLIC_DIR, 'manifest.webmanifest');
  assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest must exist in public/');

  const content = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(content);

  assert.equal(manifest.name, 'DistroTailor — OS Selector & Recipe Generator');
  assert.equal(manifest.short_name, 'DistroTailor');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.background_color, '#020617');
  assert.equal(manifest.theme_color, '#020617');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);

  for (const icon of manifest.icons) {
    assert.ok(icon.src, 'Icon must define a src');
    const iconFilePath = path.join(PUBLIC_DIR, icon.src);
    assert.ok(fs.existsSync(iconFilePath), `Icon file ${icon.src} must exist in public/`);
  }
});

test('PWA Service Worker: exists and registers lifecycle event handlers', () => {
  const swPath = path.join(PUBLIC_DIR, 'sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js must exist in public/');

  const swContent = fs.readFileSync(swPath, 'utf-8');
  assert.ok(swContent.includes("addEventListener('install'"), 'Must handle install event');
  assert.ok(swContent.includes("addEventListener('activate'"), 'Must handle activate event');
  assert.ok(swContent.includes("addEventListener('fetch'"), 'Must handle fetch event');
  assert.ok(swContent.includes('CACHE_NAME'), 'Must specify CACHE_NAME');
});

test('PWA HTML Shell: links manifest and theme-color meta tags', () => {
  const html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  assert.ok(html.includes('rel="manifest"'), 'index.html must link web manifest');
  assert.ok(html.includes('name="theme-color"'), 'index.html must define theme-color');
  assert.ok(html.includes('name="apple-mobile-web-app-capable"'), 'index.html must support iOS mobile web app mode');
});
