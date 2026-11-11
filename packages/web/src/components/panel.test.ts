import test from 'node:test';
import assert from 'node:assert/strict';
import { isPanelOpen, panelAttributes } from './panel.js';

test('Panel: follows its default until the user toggles it', () => {
  assert.equal(isPanelOpen(undefined, 'build-recipe', true), true);
  assert.equal(isPanelOpen({}, 'build-recipe', false), false);
  assert.equal(isPanelOpen({ 'build-recipe': false }, 'build-recipe', true), false, 'user closed an auto-open panel');
  assert.equal(isPanelOpen({ 'build-recipe': true }, 'build-recipe', false), true, 'user opened a closed panel');
});

test('Panel: attributes carry id, default, and open state for the toggle handler', () => {
  assert.equal(panelAttributes({}, 'head-to-head', false), 'data-panel-id="head-to-head" data-panel-default="closed"');
  assert.equal(
    panelAttributes({ 'head-to-head': true }, 'head-to-head', false),
    'data-panel-id="head-to-head" data-panel-default="closed" open'
  );
});
