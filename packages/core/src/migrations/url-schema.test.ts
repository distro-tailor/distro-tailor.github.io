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
