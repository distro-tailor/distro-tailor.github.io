import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './dom.js';

test('DOM Utils: escapeHtml neutralizes common XSS injection vectors', () => {
  const attackPayloads = [
    { input: '<script>alert(1)</script>', expected: '&lt;script&gt;alert(1)&lt;/script&gt;' },
    { input: '<img src=x onerror=alert("XSS")>', expected: '&lt;img src=x onerror=alert(&quot;XSS&quot;)&gt;' },
    { input: '" onfocus="alert(1)"', expected: '&quot; onfocus=&quot;alert(1)&quot;' },
    { input: "javascript:alert('XSS')", expected: 'javascript:alert(&#039;XSS&#039;)' },
    { input: 'Tom & Jerry', expected: 'Tom &amp; Jerry' },
    { input: 'a < b && c > d', expected: 'a &lt; b &amp;&amp; c &gt; d' }
  ];

  for (const { input, expected } of attackPayloads) {
    assert.equal(escapeHtml(input), expected);
  }
});

test('DOM Utils: escapeHtml handles null, undefined, numbers, and empty strings gracefully', () => {
  assert.equal(escapeHtml(''), '');
  assert.equal(escapeHtml(undefined as any), '');
  assert.equal(escapeHtml(null as any), '');
  assert.equal(escapeHtml(12345 as any), '12345');
});
