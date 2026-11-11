/**
 * Verifies the pinned downloads used by generated recipes (packages/core/src/generators/checksums.ts).
 *
 *   npm run check:pins
 *
 * 1. Downloads every pinned artifact and compares its SHA-256 with the pinned checksum, so an
 *    upstream file that was replaced or removed is caught before users hit a failed build.
 * 2. Checks that pinned Alpine and Buildroot releases are still supported upstream, warning
 *    ahead of the end-of-support date and failing once it has passed.
 *
 * Runs monthly in CI (.github/workflows/check-pins.yml). Exits 1 when anything needs action and
 * writes a Markdown summary to $GITHUB_STEP_SUMMARY when available.
 */
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import {
  ALPINE_BRANCH,
  ALPINE_MINIROOTFS_SHA256,
  ALPINE_VERSION,
  AlpineArch,
  alpineMinirootfsUrl,
  BUILDROOT_DOWNLOADS,
  BUILDROOT_TARBALL_SHA256,
  BUILDROOT_VERSION,
  V86_ASSET_SHA256,
  V86_BIOS_BASE,
  V86_CDN,
  V86_ISO_URL,
  V86_NPM_VERSION
} from '../packages/core/src/generators/checksums.js';
import { CheckResult, parseBuildrootSeries, Status, supportStatus } from './pin-support.js';


const FETCH_ATTEMPTS = 3;

/** fetch() with retries, so a transient network error does not fail the monthly check. */
async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status} ${res.statusText}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < FETCH_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
  }
  throw lastError;
}

function describeError(error: unknown): string {
  const err = error as Error & { cause?: { code?: string; message?: string } };
  const cause = err.cause?.code ?? err.cause?.message;
  return cause ? `${err.message} (${cause})` : err.message;
}

async function sha256OfUrl(url: string): Promise<string> {
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex');
}

async function checkChecksum(name: string, url: string, expected: string): Promise<CheckResult> {
  try {
    const actual = await sha256OfUrl(url);
    return actual === expected
      ? { name, status: 'ok', detail: 'checksum matches' }
      : { name, status: 'fail', detail: `checksum changed upstream: expected ${expected}, got ${actual} (${url})` };
  } catch (error) {
    return { name, status: 'fail', detail: `download failed: ${describeError(error)} (${url})` };
  }
}

async function checkReachable(name: string, url: string): Promise<CheckResult> {
  try {
    const res = await fetchWithRetry(url, { method: 'HEAD' });
    return res.ok
      ? { name, status: 'ok', detail: 'available' }
      : { name, status: 'fail', detail: `HTTP ${res.status} ${res.statusText} (${url})` };
  } catch (error) {
    return { name, status: 'fail', detail: `request failed: ${describeError(error)} (${url})` };
  }
}

async function checkAlpineSupport(today: Date): Promise<CheckResult> {
  const name = `Alpine ${ALPINE_VERSION} support`;
  try {
    const res = await fetchWithRetry('https://alpinelinux.org/releases.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      release_branches: Array<{ rel_branch: string; eol_date?: string; releases?: Array<{ version: string }> }>;
    };
    const branches = data.release_branches.filter((b) => b.rel_branch !== 'edge' && b.eol_date);
    const pinned = branches.find((b) => b.rel_branch === ALPINE_BRANCH);
    const newest = branches[0]?.releases?.[0]?.version ?? 'the latest release';
    if (!pinned?.eol_date) return { name, status: 'fail', detail: `${ALPINE_BRANCH} is not listed in releases.json` };
    return supportStatus(name, new Date(pinned.eol_date), today, `Upgrade to Alpine ${newest}.`);
  } catch (error) {
    return { name, status: 'fail', detail: `could not read Alpine releases.json: ${describeError(error)}` };
  }
}

async function checkBuildrootSupport(today: Date): Promise<CheckResult> {
  const name = `Buildroot ${BUILDROOT_VERSION} support`;
  const pinnedSeries = BUILDROOT_VERSION.split('.').slice(0, 2).join('.');
  try {
    const res = await fetchWithRetry('https://buildroot.org/download.html');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const maintained = parseBuildrootSeries(await res.text());
    if (maintained.length === 0) {
      return { name, status: 'fail', detail: 'could not parse the support table on buildroot.org/download.html' };
    }
    const lts = maintained.find((s) => s.series.endsWith('.02'))?.series;
    const hint = lts ? `Upgrade to the ${lts}.x long-term support series.` : 'Upgrade to a maintained series.';
    const pinned = maintained.find((s) => s.series === pinnedSeries);
    if (!pinned) return { name, status: 'fail', detail: `the ${pinnedSeries}.x series is no longer maintained. ${hint}` };
    return supportStatus(name, pinned.eol, today, hint);
  } catch (error) {
    return { name, status: 'fail', detail: `could not read buildroot.org/download.html: ${describeError(error)}` };
  }
}

function writeSummary(results: CheckResult[]): void {
  const icon: Record<Status, string> = { ok: '✅', warn: '⚠️', fail: '❌' };
  const lines = [
    '## Recipe download pins',
    '',
    '| | Pin | Result |',
    '| :---: | :--- | :--- |',
    ...results.map((r) => `| ${icon[r.status]} | ${r.name} | ${r.detail.replace(/\|/g, '\\|')} |`),
    '',
    'Pins live in `packages/core/src/generators/checksums.ts`; bump instructions are at the top of that file.'
  ];
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) fs.appendFileSync(summaryPath, lines.join('\n') + '\n');
}

async function main(): Promise<void> {
  const today = new Date();
  const alpineArches = Object.keys(ALPINE_MINIROOTFS_SHA256) as AlpineArch[];

  const results = await Promise.all([
    ...alpineArches.map((arch) =>
      checkChecksum(`Alpine ${ALPINE_VERSION} minirootfs (${arch})`, alpineMinirootfsUrl(arch), ALPINE_MINIROOTFS_SHA256[arch])
    ),
    checkChecksum(
      `Buildroot ${BUILDROOT_VERSION} source`,
      `${BUILDROOT_DOWNLOADS}/buildroot-${BUILDROOT_VERSION}.tar.gz`,
      BUILDROOT_TARBALL_SHA256
    ),
    checkChecksum('v86 Bochs BIOS', `${V86_BIOS_BASE}/bochs-bios.bin`, V86_ASSET_SHA256.bochsBios),
    checkChecksum('v86 Bochs VGA BIOS', `${V86_BIOS_BASE}/bochs-vgabios.bin`, V86_ASSET_SHA256.bochsVgaBios),
    checkChecksum('v86 demo Linux ISO', V86_ISO_URL, V86_ASSET_SHA256.linuxIso),
    checkReachable(`v86 ${V86_NPM_VERSION} engine (libv86.mjs)`, `${V86_CDN}/libv86.mjs`),
    checkReachable(`v86 ${V86_NPM_VERSION} engine (v86.wasm)`, `${V86_CDN}/v86.wasm`),
    checkAlpineSupport(today),
    checkBuildrootSupport(today)
  ]);

  const icon: Record<Status, string> = { ok: '✔', warn: '⚠', fail: '✖' };
  for (const r of results) console.log(`${icon[r.status]} ${r.name}: ${r.detail}`);
  writeSummary(results);

  const failed = results.filter((r) => r.status === 'fail').length;
  const warned = results.filter((r) => r.status === 'warn').length;
  console.log(`\n${results.length} checks: ${results.length - failed - warned} ok, ${warned} warning(s), ${failed} failure(s).`);
  if (failed + warned > 0) {
    console.log('Update the pins in packages/core/src/generators/checksums.ts (instructions at the top of the file).');
  }
  if (failed > 0) process.exit(1);
}

await main();
