import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EOL_WARNING_DAYS, parseBuildrootSeries, supportStatus } from './pin-support.js';

test('Pin Support: status is ok, warn within the warning window, and fail after end of support', () => {
  const today = new Date('2026-11-11T00:00:00Z');
  const days = (n: number) => new Date(today.getTime() + n * 24 * 60 * 60 * 1000);
  assert.equal(supportStatus('x', days(EOL_WARNING_DAYS + 1), today, '').status, 'ok');
  assert.equal(supportStatus('x', days(EOL_WARNING_DAYS), today, '').status, 'warn');
  assert.equal(supportStatus('x', days(-1), today, 'Upgrade.').status, 'fail');
  assert.match(supportStatus('x', days(-1), today, 'Upgrade.').detail, /end of support was 2026-11-10\. Upgrade\./);
});

test('Pin Support: parses the Buildroot maintained-series table', () => {
  const html = `
    <tr><td>Stable</td><td>2026.08.1.x</td><td>December 2026</td></tr>
    <tr><td>Old stable</td><td>2026.05.x</td><td>September 2026</td></tr>
    <tr><td>Long-term support</td><td>2025.02.x</td><td>March 2028</td></tr>`;
  const series = parseBuildrootSeries(html);
  assert.deepEqual(
    series.map((s) => [s.series, s.eol.toISOString().slice(0, 10)]),
    [
      ['2026.08', '2026-12-31'],
      ['2026.05', '2026-09-30'],
      ['2025.02', '2028-03-31']
    ]
  );
});

test('Pin Support: unparseable pages yield no series (reported as a failure by check-pins)', () => {
  assert.deepEqual(parseBuildrootSeries('<html>Download page redesigned</html>'), []);
});
