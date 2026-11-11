import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB limit
const BANNED_EXTENSIONS = [
  /\.(iso|img|qcow2|vdi|vmdk|raw|box|appimage)$/i,
  /\.(tar\.gz|tgz|tar\.xz|tar\.bz2|zip|7z)$/i,
  /\.(exe|bin|dylib|so)$/i
];

test('Repo Hygiene: no tracked file in git exceeds the 2 MB file size limit', () => {
  const trackedFilesOutput = execSync('git ls-files', { encoding: 'utf-8' });
  const files = trackedFilesOutput.split('\n').filter(Boolean);

  const oversizedFiles: Array<{ file: string; sizeBytes: number; sizeMB: string }> = [];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const stat = fs.statSync(file);
    if (stat.size > MAX_FILE_SIZE_BYTES) {
      oversizedFiles.push({
        file,
        sizeBytes: stat.size,
        sizeMB: (stat.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
    }
  }

  assert.deepEqual(
    oversizedFiles,
    [],
    `Found files exceeding the 2 MB limit: ${JSON.stringify(oversizedFiles, null, 2)}`
  );
});

test('Repo Hygiene: no tracked file has prohibited VM image or binary archive extensions', () => {
  const trackedFilesOutput = execSync('git ls-files', { encoding: 'utf-8' });
  const files = trackedFilesOutput.split('\n').filter(Boolean);

  const illegalFiles: string[] = [];

  for (const file of files) {
    for (const regex of BANNED_EXTENSIONS) {
      if (regex.test(file)) {
        illegalFiles.push(file);
        break;
      }
    }
  }

  assert.deepEqual(
    illegalFiles,
    [],
    `Found tracked files with prohibited binary/archive extensions: ${illegalFiles.join(', ')}`
  );
});

test('Repo Hygiene: .gitignore explicitly ignores VM disk images and archive formats', () => {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf-8');
  const requiredPatterns = ['*.iso', '*.img', '*.qcow2', '*.vdi', '*.vmdk', '*.raw'];

  for (const pattern of requiredPatterns) {
    assert.ok(
      gitignoreContent.includes(pattern),
      `.gitignore must contain '${pattern}' to prevent accidental binary commits`
    );
  }
});

test('Repo Hygiene: .githooks/pre-commit exists and is executable', () => {
  const hookPath = path.join('.githooks', 'pre-commit');
  assert.ok(fs.existsSync(hookPath), '.githooks/pre-commit must exist');
  // Verify executable bit
  fs.accessSync(hookPath, fs.constants.X_OK);
});
