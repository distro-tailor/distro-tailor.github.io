import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateUrlParameters, CURRENT_SCHEMA_VERSION } from './url-schema.js';

test('URL Schema Migrations: Injects current schema version v=1 on unversioned legacy links', () => {
  const legacyParams = {
    useCase: 'smart-home',
    platform: 'embedded-sbc',
    architecture: 'arm64'
  };

  const result = migrateUrlParameters(legacyParams);
  assert.equal(result.version, CURRENT_SCHEMA_VERSION);
  assert.equal(result.params.v, '1');
  assert.equal(result.params.useCase, 'smart-home');
  assert.equal(result.migrated, true);
});

test('URL Schema Migrations: Preserves already versioned v=1 URLs without redundant migration', () => {
  const modernParams = {
    v: '1',
    tab: 'results',
    useCase: 'ai-gpu-compute',
    architecture: 'x86_64'
  };

  const result = migrateUrlParameters(modernParams);
  assert.equal(result.version, 1);
  assert.equal(result.params.v, '1');
  assert.equal(result.params.useCase, 'ai-gpu-compute');
  assert.equal(result.migrated, false);
});

test('URL Schema Migrations: Normalizes legacy aliases (e.g. aarch64 -> arm64, rpi -> embedded-sbc)', () => {
  const oldParams = {
    v: '1',
    useCase: 'home-automation',
    platform: 'rpi',
    architecture: 'aarch64'
  };

  const result = migrateUrlParameters(oldParams);
  assert.equal(result.params.useCase, 'smart-home');
  assert.equal(result.params.platform, 'embedded-sbc');
  assert.equal(result.params.architecture, 'arm64');
  assert.equal(result.migrated, true);
  assert.ok(result.warnings.length >= 3);
});

test('URL Schema Migrations: Intercepts unsupported older schemas (v=0) with clean fallback status', () => {
  const obsoleteParams = {
    v: '0',
    useCase: 'something-ancient'
  };

  const result = migrateUrlParameters(obsoleteParams);
  assert.equal(result.supported, false);
  assert.equal(result.status, 'unsupported-too-old');
  assert.ok(result.fallbackNotice?.includes('no longer supported'));
});

test('URL Schema Migrations: Intercepts future schemas (v=99) with clean fallback status', () => {
  const futureParams = {
    v: '99',
    useCase: 'quantum-computing'
  };

  const result = migrateUrlParameters(futureParams);
  assert.equal(result.supported, false);
  assert.equal(result.status, 'unsupported-too-new');
  assert.ok(result.fallbackNotice?.includes('newer version'));
});

test('URL Schema Serialization: cleanly serializes criteria and roundtrips with deserializer', async () => {
  const { serializeCriteriaToParams, serializeCriteriaToQuery, deserializeCriteriaFromParams } = await import('./url-schema.js');
  const criteria = {
    useCase: 'desktop' as const,
    architecture: 'x86_64' as const,
    maxRamMb: 8192,
    prefersGui: true,
    desktopApps: ['firefox', 'vscode']
  };

  const params = serializeCriteriaToParams(criteria, { tab: 'results' });
  assert.equal(params.v, '1');
  assert.equal(params.tab, 'results');
  assert.equal(params.useCase, 'desktop');
  assert.equal(params.desktopApps, 'firefox,vscode');

  const query = serializeCriteriaToQuery(criteria, { tab: 'results' });
  assert.ok(query.startsWith('?'));
  assert.ok(query.includes('useCase=desktop'));
  assert.ok(query.includes('desktopApps=firefox%2Cvscode'));

  const restored = deserializeCriteriaFromParams(params);
  assert.equal(restored.useCase, 'desktop');
  assert.equal(restored.architecture, 'x86_64');
  assert.equal(restored.maxRamMb, 8192);
  assert.equal(restored.prefersGui, true);
  assert.deepEqual(restored.desktopApps, ['firefox', 'vscode']);
});
