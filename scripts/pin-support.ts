/**
 * Pure helpers for scripts/check-pins.ts (kept separate so they can be unit tested offline).
 */

export type Status = 'ok' | 'warn' | 'fail';

export interface CheckResult {
  name: string;
  status: Status;
  detail: string;
}

/** Warn this many days before a pinned release reaches end of support. */
export const EOL_WARNING_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export function supportStatus(name: string, eol: Date, today: Date, upgradeHint: string): CheckResult {
  const eolText = eol.toISOString().slice(0, 10);
  const daysLeft = Math.floor((eol.getTime() - today.getTime()) / DAY_MS);
  if (daysLeft < 0) return { name, status: 'fail', detail: `end of support was ${eolText}. ${upgradeHint}` };
  if (daysLeft <= EOL_WARNING_DAYS) {
    return { name, status: 'warn', detail: `end of support on ${eolText} (${daysLeft} days). ${upgradeHint}` };
  }
  return { name, status: 'ok', detail: `supported until ${eolText}` };
}

export interface BuildrootSeries {
  series: string;
  /** Last day of the end-of-life month (UTC). */
  eol: Date;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * Parses the maintained-series table on buildroot.org/download.html
 * ("Series | End of Life", e.g. "2025.02.x ... March 2028"). Series not listed are unmaintained.
 */
export function parseBuildrootSeries(html: string): BuildrootSeries[] {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const series: BuildrootSeries[] = [];
  for (const [, name, monthName, year] of text.matchAll(/(\d{4}\.\d{2})(?:\.\d+)*\.x ([A-Za-z]+) (\d{4})/g)) {
    const month = MONTHS.indexOf(monthName.toLowerCase());
    if (month === -1 || series.some((s) => s.series === name)) continue;
    series.push({ series: name, eol: new Date(Date.UTC(Number(year), month + 1, 0)) });
  }
  return series;
}
