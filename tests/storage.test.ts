import test from 'node:test';
import assert from 'node:assert/strict';
import { createScene } from '../src/fixtures';
import { parseSnapshot, type Snapshot } from '../src/storage';

const snapshot: Snapshot = {
  version: 2,
  objects: createScene('system'),
  scene: 'system',
  behavior: 'grouped',
  sticky: true,
};

test('older experiments keep popover headers visible', () => {
  for (const experiment of [snapshot, { ...snapshot, version: 1, behavior: 'stack' }]) {
    const restored = parseSnapshot(experiment);
    assert.ok(restored);
    assert.equal(restored.showPopoverHeaders, true);
    assert.equal(restored.mergeStrokeControls, true);
    assert.equal(restored.groupedTextToolbar, true);
    assert.equal(restored.compactTextAlignment, true);
    assert.equal(restored.showMoreActions, false);
    assert.equal(restored.showShortcutHints, false);
    assert.deepEqual(restored.objects, snapshot.objects);
  }
});

test('Grouped text toolbar preference defaults on, survives round trips, and rejects invalid values', () => {
  for (const groupedTextToolbar of [false, true]) {
    const restored = parseSnapshot(JSON.parse(JSON.stringify({ ...snapshot, groupedTextToolbar })));
    assert.ok(restored);
    assert.equal(restored.groupedTextToolbar, groupedTextToolbar);
  }
  for (const groupedTextToolbar of [null, 'true', 1, {}]) {
    assert.equal(parseSnapshot({ ...snapshot, groupedTextToolbar }), null);
  }
});

test('compact text alignment defaults on, survives round trips, and rejects invalid values', () => {
  for (const compactTextAlignment of [false, true]) {
    const restored = parseSnapshot(
      JSON.parse(JSON.stringify({ ...snapshot, compactTextAlignment })),
    );
    assert.ok(restored);
    assert.equal(restored.compactTextAlignment, compactTextAlignment);
  }
  for (const compactTextAlignment of [null, 'true', 1, {}]) {
    assert.equal(parseSnapshot({ ...snapshot, compactTextAlignment }), null);
  }
});

test('more-actions preference defaults off, survives round trips, and rejects invalid values', () => {
  for (const showMoreActions of [false, true]) {
    const restored = parseSnapshot(JSON.parse(JSON.stringify({ ...snapshot, showMoreActions })));
    assert.ok(restored);
    assert.equal(restored.showMoreActions, showMoreActions);
  }
  for (const showMoreActions of [null, 'true', 1, {}]) {
    assert.equal(parseSnapshot({ ...snapshot, showMoreActions }), null);
  }
});

test('toolbar shortcut hints default off, survive round trips, and reject invalid values', () => {
  for (const showShortcutHints of [false, true]) {
    const restored = parseSnapshot(JSON.parse(JSON.stringify({ ...snapshot, showShortcutHints })));
    assert.ok(restored);
    assert.equal(restored.showShortcutHints, showShortcutHints);
  }
  for (const showShortcutHints of [null, 'true', 1, {}]) {
    assert.equal(parseSnapshot({ ...snapshot, showShortcutHints }), null);
  }
});

test('popover header preference survives JSON round trips, including disabled headers', () => {
  for (const showPopoverHeaders of [false, true]) {
    const restored = parseSnapshot(JSON.parse(JSON.stringify({ ...snapshot, showPopoverHeaders })));
    assert.ok(restored);
    assert.equal(restored.showPopoverHeaders, showPopoverHeaders);
    assert.equal(restored.behavior, 'grouped');
  }
});

test('snapshot validation rejects malformed header preferences', () => {
  for (const showPopoverHeaders of [null, 'false', 0, {}]) {
    assert.equal(parseSnapshot({ ...snapshot, showPopoverHeaders }), null);
  }
});

test('stroke control merging preference survives JSON round trips and rejects invalid values', () => {
  for (const mergeStrokeControls of [false, true]) {
    const restored = parseSnapshot(
      JSON.parse(JSON.stringify({ ...snapshot, mergeStrokeControls })),
    );
    assert.ok(restored);
    assert.equal(restored.mergeStrokeControls, mergeStrokeControls);
  }
  for (const mergeStrokeControls of [null, 'false', 0, {}]) {
    assert.equal(parseSnapshot({ ...snapshot, mergeStrokeControls }), null);
  }
});

test('new stroke widths survive export and import while legacy widths remain readable', () => {
  for (const width of [0, 1, 1.5, 2, 4, 8]) {
    const experiment = {
      ...snapshot,
      objects: snapshot.objects.map((object) => ({
        ...object,
        style: { ...object.style, width },
      })),
    };
    const restored = parseSnapshot(JSON.parse(JSON.stringify(experiment)));
    assert.ok(restored, 'Expected width ' + width + ' to load');
    assert.equal(restored.objects[0].style.width, width);
  }
});
