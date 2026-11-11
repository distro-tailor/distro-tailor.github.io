/**
 * Scoring regression snapshot for the DistroTailor matcher.
 *
 * Runs evaluateCriteria() over a deterministic set of ~8,400 criteria combinations
 * (every single value, pairwise combinations of the primary dimensions, and seeded random
 * mixes). Only a ~100-byte fingerprint (case count + digest of the complete output) is
 * committed; detailed before/after data is rebuilt on demand by running an older commit's
 * matcher straight from git, so no large snapshot files live in the repository.
 *
 * Usage:
 *   npm run scoring:check              Compare against the committed fingerprint (exit 1 on any change).
 *                                      On a mismatch, auto-compares with the commit that last updated
 *                                      the fingerprint and prints what changed.
 *   npm run scoring:update             Re-fingerprint after an intended algorithm change
 *   npm run scoring:compare -- <ref>   Compare a git ref's matcher (e.g. main, HEAD~3) with the working tree
 *
 * Add `--report <file.md>` to check or compare to write a compact Markdown review report:
 * summary counts plus one representative case per top-pick transition, showing the top
 * three distros before and after with scores, profile facts, and match reasons. It is
 * bounded in size so an AI assistant or human reviewer can read it in one pass and judge
 * whether each change is an improvement.
 *
 * Complements audit-matrix.ts: the audit checks that hand-picked archetypes get the right
 * answer, while this snapshot shows exactly which answers moved when the algorithm changes.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as core from '../packages/core/src/index.js';
import type { RecommendationOutput, UserCriteria } from '../packages/core/src/index.js';

type Evaluate = (criteria: UserCriteria) => RecommendationOutput;

interface SnapshotRecord {
  /** Criteria evaluated (canonical JSON key order from case generation). */
  c: Record<string, unknown>;
  /** Top five matches as "distro-id:score". */
  t: string[];
  /** Recommended recipe generator id, or "-" when none. */
  r: string;
  /** Hash of every match's score and reasons plus the full recipe output. */
  h: string;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FINGERPRINT_FILE = 'scripts/fixtures/scoring-fingerprint.json';
const FINGERPRINT_PATH = path.join(ROOT, FINGERPRINT_FILE);
const RANDOM_CASES = 4000;
const RANDOM_SEED = 42;
const MAX_EXAMPLES = 15;

// ---------------------------------------------------------------------------
// Deterministic case generation
// ---------------------------------------------------------------------------

function buildCases(): Record<string, unknown>[] {
  const values = (catalog: object) => Object.keys(catalog);
  const fields: Record<string, unknown[]> = {
    useCase: values(core.USE_CASE_VALUES),
    platform: values(core.PLATFORM_VALUES),
    architecture: values(core.ARCHITECTURE_VALUES),
    formFactor: values(core.FORM_FACTOR_VALUES),
    footprint: values(core.FOOTPRINT_VALUES),
    initPreference: values(core.INIT_PREFERENCE_VALUES),
    cLibPreference: values(core.CLIB_PREFERENCE_VALUES),
    statePreference: values(core.STATE_PREFERENCE_VALUES),
    experienceLevel: values(core.EXPERIENCE_LEVEL_VALUES),
    workflowStyle: values(core.WORKFLOW_STYLE_VALUES),
    releaseCadence: values(core.RELEASE_CADENCE_VALUES),
    driverPhilosophy: values(core.DRIVER_PHILOSOPHY_VALUES),
    bootMedium: values(core.BOOT_MEDIUM_VALUES),
    desktopEnv: values(core.DESKTOP_ENV_VALUES),
    dockerApp: values(core.DOCKER_APP_VALUES),
    maxRamMb: [256, 1024, 4096, 16384],
    prefersGui: [true, false],
    realtimeAudio: [true, false],
    requiresCustomBuild: [true, false],
    enableDistrobox: [true, false],
    enableNix: [true, false],
    peripherals: values(core.PERIPHERAL_VALUES)
      .map((p) => [p])
      .concat([['touchscreen', 'vr-headset', 'printer-scanner']]),
    desktopApps: [['firefox'], ['vscode', 'obs', 'gimp']]
  };

  // 1. Unconstrained baseline and every single field value on its own
  const cases: Record<string, unknown>[] = [{}];
  for (const [key, options] of Object.entries(fields)) {
    for (const value of options) cases.push({ [key]: value });
  }

  // 2. Primary dimensions paired with every other field
  const primary = ['useCase', 'platform', 'formFactor', 'architecture'];
  for (const a of primary) {
    for (const b of Object.keys(fields)) {
      if (a === b || (primary.includes(b) && b < a)) continue;
      for (const va of fields[a]) {
        for (const vb of fields[b]) cases.push({ [a]: va, [b]: vb });
      }
    }
  }

  // 3. Seeded random mixes (~35% of fields set per case)
  let seed = RANDOM_SEED;
  const random = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < RANDOM_CASES; i++) {
    const mix: Record<string, unknown> = {};
    for (const [key, options] of Object.entries(fields)) {
      if (random() < 0.35) mix[key] = options[Math.floor(random() * options.length)];
    }
    cases.push(mix);
  }
  return cases;
}

function snapshot(evaluate: Evaluate, cases: Record<string, unknown>[]): SnapshotRecord[] {
  return cases.map((c) => {
    const result = evaluate(c as UserCriteria);
    const full = JSON.stringify([
      result.allMatches.map((m) => [m.distro.id, m.score, m.reasons]),
      result.recommendedRecipe ?? null,
      result.summaryText
    ]);
    return {
      c,
      t: result.topMatches.slice(0, 5).map((m) => `${m.distro.id}:${m.score}`),
      r: result.recommendedRecipe?.id ?? '-',
      h: createHash('sha1').update(full).digest('hex').slice(0, 16)
    };
  });
}

// ---------------------------------------------------------------------------
// Comparison report
// ---------------------------------------------------------------------------

interface Comparison {
  total: number;
  added: number;
  removed: number;
  topPickChanged: Array<[SnapshotRecord, SnapshotRecord]>;
  recipeChanged: Array<[SnapshotRecord, SnapshotRecord]>;
  rankingChanged: number;
  detailOnlyChanged: number;
}

const caseKey = (r: SnapshotRecord) => JSON.stringify(r.c);
const topId = (r: SnapshotRecord) => r.t[0]?.split(':')[0] ?? '-';

function compare(before: SnapshotRecord[], after: SnapshotRecord[]): Comparison {
  const beforeByKey = new Map(before.map((r) => [caseKey(r), r]));
  const afterKeys = new Set(after.map(caseKey));
  const result: Comparison = {
    total: after.length,
    added: 0,
    removed: before.filter((r) => !afterKeys.has(caseKey(r))).length,
    topPickChanged: [],
    recipeChanged: [],
    rankingChanged: 0,
    detailOnlyChanged: 0
  };

  for (const next of after) {
    const prev = beforeByKey.get(caseKey(next));
    if (!prev) {
      result.added++;
      continue;
    }
    if (prev.h === next.h) continue;
    const topMoved = topId(prev) !== topId(next);
    const recipeMoved = prev.r !== next.r;
    if (topMoved) result.topPickChanged.push([prev, next]);
    if (recipeMoved) result.recipeChanged.push([prev, next]);
    if (!topMoved && !recipeMoved) {
      if (prev.t.join() !== next.t.join()) result.rankingChanged++;
      else result.detailOnlyChanged++;
    }
  }
  return result;
}

function hasChanges(c: Comparison): boolean {
  return (
    c.added + c.removed + c.topPickChanged.length + c.recipeChanged.length + c.rankingChanged + c.detailOnlyChanged > 0
  );
}

function printReport(c: Comparison, beforeLabel: string, afterLabel: string): void {
  const pct = (n: number) => `${((n / Math.max(1, c.total)) * 100).toFixed(1)}%`;
  console.log(`\nScoring snapshot: ${beforeLabel} → ${afterLabel} (${c.total} criteria cases)`);
  console.log('─'.repeat(64));
  console.log(`Top pick changed          : ${c.topPickChanged.length} (${pct(c.topPickChanged.length)})`);
  console.log(`Recipe changed            : ${c.recipeChanged.length} (${pct(c.recipeChanged.length)})`);
  console.log(`Top-5 scores/order changed: ${c.rankingChanged} (top pick and recipe unchanged)`);
  console.log(`Other changes             : ${c.detailOnlyChanged} (lower-ranked scores or reason text)`);
  if (c.added || c.removed) {
    console.log(`Cases added / removed     : ${c.added} / ${c.removed} (criteria catalogs changed)`);
  }

  if (c.topPickChanged.length > 0) {
    const transitions = new Map<string, number>();
    for (const [prev, next] of c.topPickChanged) {
      const key = `${topId(prev)} → ${topId(next)}`;
      transitions.set(key, (transitions.get(key) ?? 0) + 1);
    }
    console.log('\nMost common top-pick transitions:');
    [...transitions.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_EXAMPLES)
      .forEach(([key, count]) => console.log(`  ${String(count).padStart(5)}  ${key}`));

    console.log('\nExamples:');
    for (const [prev, next] of c.topPickChanged.slice(0, MAX_EXAMPLES)) {
      console.log(`  ${JSON.stringify(prev.c)}`);
      console.log(`      before: ${prev.t.slice(0, 3).join(', ')}`);
      console.log(`      after : ${next.t.slice(0, 3).join(', ')}`);
    }
  }

  if (c.recipeChanged.length > 0) {
    console.log('\nRecipe change examples:');
    for (const [prev, next] of c.recipeChanged.slice(0, MAX_EXAMPLES)) {
      console.log(`  ${JSON.stringify(prev.c)}: ${prev.r} → ${next.r}`);
    }
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Fingerprint I/O and git ref loading
// ---------------------------------------------------------------------------

interface Fingerprint {
  cases: number;
  digest: string;
}

function fingerprintOf(records: SnapshotRecord[]): Fingerprint {
  const hash = createHash('sha256');
  for (const r of records) hash.update(JSON.stringify(r) + '\n');
  return { cases: records.length, digest: hash.digest('hex') };
}

function readFingerprint(): Fingerprint {
  if (!fs.existsSync(FINGERPRINT_PATH)) {
    console.error(`No fingerprint at ${FINGERPRINT_FILE}. Run: npm run scoring:update`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(FINGERPRINT_PATH, 'utf8')) as Fingerprint;
}

function writeFingerprint(fingerprint: Fingerprint): void {
  fs.mkdirSync(path.dirname(FINGERPRINT_PATH), { recursive: true });
  fs.writeFileSync(FINGERPRINT_PATH, JSON.stringify(fingerprint, null, 2) + '\n', 'utf8');
}

/** The commit that last updated the fingerprint, i.e. the last accepted scoring behaviour. */
function lastFingerprintCommit(): string | undefined {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%h', '--', FINGERPRINT_FILE], { cwd: ROOT });
    return out.toString().trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Extracts packages/core/src at a git ref into a temp dir and loads its evaluateCriteria. */
async function loadEvaluateAtRef(ref: string): Promise<{ evaluate: Evaluate; cleanup: () => void }> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'distro-tailor-scoring-'));
  const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });
  try {
    const archive = execFileSync('git', ['archive', ref, 'packages/core/src'], { cwd: ROOT });
    execFileSync('tar', ['-x', '-C', dir], { input: archive });
    const entry = pathToFileURL(path.join(dir, 'packages/core/src/index.ts')).href;
    const mod = (await import(entry)) as { evaluateCriteria: Evaluate };
    return { evaluate: (criteria) => mod.evaluateCriteria(criteria), cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Markdown review report (for AI / human review of intended changes)
// ---------------------------------------------------------------------------

const REPORT_TOP_N = 3;

function describeTop(evaluate: Evaluate, criteria: Record<string, unknown>): string[] {
  const result = evaluate(criteria as UserCriteria);
  const lines: string[] = [];
  result.topMatches.slice(0, REPORT_TOP_N).forEach((m, i) => {
    // Profile facts expose differences that identical reason text hides (e.g. exact footprint tier).
    const d = m.distro;
    lines.push(
      `${i + 1}. **${d.id}** ${m.score}% (footprint ${d.footprint}, ${d.minRamMb} MB min RAM, ` +
        `${d.experienceLevel}, use cases: ${d.primaryUseCases.join('/')})`
    );
    for (const r of m.reasons) lines.push(`   - ${r.matched ? '✔' : '✖'} ${r.feature}: ${r.explanation}`);
  });
  lines.push('', `Recipe: \`${result.recommendedRecipe?.id ?? 'none'}\``);
  return lines;
}

function buildMarkdownReport(
  c: Comparison,
  beforeLabel: string,
  afterLabel: string,
  evaluateBefore: Evaluate,
  evaluateAfter: Evaluate
): string {
  const pct = (n: number) => `${((n / Math.max(1, c.total)) * 100).toFixed(1)}%`;
  const out: string[] = [
    `# Scoring Change Report: \`${beforeLabel}\` → \`${afterLabel}\``,
    '',
    `Generated by \`scripts/scoring-snapshot.ts\` over ${c.total} deterministic criteria cases.`,
    '',
    '## Summary',
    '',
    '| Change | Cases | Share |',
    '| :--- | ---: | ---: |',
    `| Top pick changed | ${c.topPickChanged.length} | ${pct(c.topPickChanged.length)} |`,
    `| Recipe changed | ${c.recipeChanged.length} | ${pct(c.recipeChanged.length)} |`,
    `| Top-5 scores/order changed (same top pick and recipe) | ${c.rankingChanged} | ${pct(c.rankingChanged)} |`,
    `| Other (lower-ranked scores or reason text) | ${c.detailOnlyChanged} | ${pct(c.detailOnlyChanged)} |`,
    `| Cases added / removed | ${c.added} / ${c.removed} | |`,
    '',
    '## Review Guidance',
    '',
    '- For each transition below, judge whether the new top pick is a better recommendation for the criteria shown.',
    '- Score shifts without a top-pick change are usually rescaling; focus on transitions and recipe changes.',
    '- Run `npm run audit:matrix` to confirm hand-picked archetypes still get their expected distro.',
    ''
  ];

  const groups = new Map<string, Array<[SnapshotRecord, SnapshotRecord]>>();
  for (const pair of c.topPickChanged) {
    const key = `${topId(pair[0])} → ${topId(pair[1])}`;
    groups.set(key, [...(groups.get(key) ?? []), pair]);
  }

  if (groups.size > 0) {
    const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
    out.push('## Top-Pick Transitions', '', '| Transition | Cases |', '| :--- | ---: |');
    for (const [key, pairs] of ordered) out.push(`| ${key} | ${pairs.length} |`);
    out.push('');

    const shown = ordered.slice(0, MAX_EXAMPLES);
    out.push(`## Representative Cases (${shown.length} of ${ordered.length} transitions; simplest criteria per transition)`, '');
    for (const [key, pairs] of shown) {
      // Fewest criteria keys first: the simplest case best isolates why the pick changed.
      const [prev] = [...pairs].sort((a, b) => Object.keys(a[0].c).length - Object.keys(b[0].c).length)[0];
      out.push(`### ${key} (${pairs.length} case${pairs.length === 1 ? '' : 's'})`, '');
      out.push(`Criteria: \`${JSON.stringify(prev.c)}\``, '');
      out.push(`**Before (${beforeLabel})**`, '');
      out.push(...describeTop(evaluateBefore, prev.c));
      out.push('', `**After (${afterLabel})**`, '', ...describeTop(evaluateAfter, prev.c), '');
    }
  }

  const recipeOnly = c.recipeChanged.filter(([prev, next]) => topId(prev) === topId(next));
  if (recipeOnly.length > 0) {
    out.push('## Recipe Changes With Same Top Pick', '');
    for (const [prev, next] of recipeOnly.slice(0, MAX_EXAMPLES)) {
      out.push(`- \`${JSON.stringify(prev.c)}\`: \`${prev.r}\` → \`${next.r}\``);
    }
    out.push('');
  }

  if (!hasChanges(c)) out.push('No differences: every case produced identical output.', '');
  return out.join('\n');
}

function writeReport(reportPath: string | undefined, markdown: string): void {
  if (!reportPath) return;
  fs.writeFileSync(path.resolve(reportPath), markdown, 'utf8');
  console.log(`Review report written to ${reportPath}`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const reportFlag = args.indexOf('--report');
  const reportPath = reportFlag !== -1 ? args[reportFlag + 1] : undefined;
  if (reportFlag !== -1 && !reportPath) {
    console.error('--report requires a file path, e.g. --report scoring-report.md');
    process.exit(1);
  }
  const positional = reportFlag === -1 ? args : args.filter((_, i) => i !== reportFlag && i !== reportFlag + 1);
  const [command = 'check', ref] = positional;
  const cases = buildCases();
  const evaluateCurrent: Evaluate = (c) => core.evaluateCriteria(c);
  const current = () => snapshot(evaluateCurrent, cases);

  /** Diffs a git ref's matcher against the working tree; returns whether anything changed. */
  const compareWithRef = async (baseRef: string): Promise<{ changed: boolean; reproduces?: boolean }> => {
    const base = await loadEvaluateAtRef(baseRef);
    try {
      const before = snapshot(base.evaluate, cases);
      const comparison = compare(before, current());
      printReport(comparison, baseRef, 'working tree');
      writeReport(reportPath, buildMarkdownReport(comparison, baseRef, 'working tree', base.evaluate, evaluateCurrent));
      return { changed: hasChanges(comparison), reproduces: fingerprintOf(before).digest === readFingerprint().digest };
    } finally {
      base.cleanup();
    }
  };

  if (command === 'update') {
    const fingerprint = fingerprintOf(current());
    writeFingerprint(fingerprint);
    console.log(`Fingerprinted ${fingerprint.cases} cases into ${FINGERPRINT_FILE}`);
    return;
  }

  if (command === 'check') {
    const expected = readFingerprint();
    const actual = fingerprintOf(current());
    if (actual.digest === expected.digest && actual.cases === expected.cases) {
      console.log(`✔ Scoring snapshot matches fingerprint (${actual.cases} criteria cases).`);
      return;
    }

    console.error(`✖ Matcher output differs from ${FINGERPRINT_FILE}.`);
    const baseRef = lastFingerprintCommit();
    if (baseRef) {
      try {
        const { changed, reproduces } = await compareWithRef(baseRef);
        if (!changed || !reproduces) {
          console.error(
            `  Note: ${baseRef} (last fingerprint commit) does not reproduce the committed fingerprint, so the` +
              ' fingerprint is stale or was edited by hand. Compare against another ref with scoring:compare.'
          );
        }
      } catch {
        console.error(`  Could not load ${baseRef} for a detailed diff (shallow clone?). Use scoring:compare locally.`);
      }
    }
    console.error('  If this change is intended, review the report, then run: npm run scoring:update');
    console.error('  For an AI-reviewable report: npm run scoring:compare -- <ref> --report scoring-report.md');
    process.exit(1);
  }

  if (command === 'compare') {
    if (!ref) {
      console.error('Usage: npm run scoring:compare -- <git-ref>   (e.g. main, HEAD~1, a1b2c3d)');
      process.exit(1);
    }
    const { changed } = await compareWithRef(ref);
    if (!changed) console.log('✔ Identical output for every case.');
    return;
  }

  console.error(`Unknown command "${command}". Use check, update, or compare <ref>.`);
  process.exit(1);
}

await main();
