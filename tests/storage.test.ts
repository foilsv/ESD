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
    assert.deepEqual(restored.objects, snapshot.objects);
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
