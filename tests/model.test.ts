import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScene } from '../src/fixtures';
import { commonCapabilities, commonValue, ends } from '../src/model';
import { validSnapshot } from '../src/storage';

test('mixed selection exposes only shared capabilities and preserves mixed fill state', () => {
  const objects = createScene('system');
  const blocks = objects.filter((o) => ['mcu', 'sensor'].includes(o.id));
  assert.deepEqual(commonCapabilities(blocks), ['fill', 'stroke']);
  assert.equal(commonValue(blocks, 'fill'), undefined);
  assert.deepEqual(commonCapabilities([blocks[0], objects.find((o) => o.id === 'spi')!]), [
    'stroke',
  ]);
});
test('label editing replaces object controls and omits geometry-driven alignment', () => {
  const objects = createScene('system');
  assert.deepEqual(commonCapabilities([objects.find((o) => o.id === 'mcu')!], true), [
    'text',
    'alignment',
  ]);
  assert.deepEqual(commonCapabilities([objects.find((o) => o.id === 'spi')!], true), ['text']);
});
test('attached connections follow moved block geometry', () => {
  const objects = createScene('system');
  const line = objects.find((o) => o.id === 'pwm')!;
  const old = ends(line, objects);
  const moved = objects.map((o) => (o.id === 'mcu' ? { ...o, y: o.y + 50 } : o));
  assert.equal(ends(line, moved)[0].y, old[0].y + 50);
  assert.deepEqual(ends(line, moved)[1], old[1]);
});
test('experiment snapshots validate versions, style values, IDs, and connection references', () => {
  const snapshot = {
    version: 2,
    objects: createScene('system'),
    scene: 'system',
    behavior: 'flat',
    sticky: true,
  };
  assert.ok(validSnapshot(snapshot));
  assert.equal(validSnapshot({ ...snapshot, version: 3 }), false);
  assert.equal(
    validSnapshot({ ...snapshot, objects: [...snapshot.objects, snapshot.objects[0]] }),
    false,
  );
  const broken = structuredClone(snapshot);
  broken.objects[0].style.fill = 'url(https://example.com)';
  assert.equal(validSnapshot(broken), false);
  const badReference = structuredClone(snapshot);
  badReference.objects.at(-1)!.source = 'missing';
  assert.equal(validSnapshot(badReference), false);
});
