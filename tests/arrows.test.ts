import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScene } from '../src/fixtures';
import { connectionArrows, cycleConnectionArrows } from '../src/model';
import { parseSnapshot } from '../src/storage';

test('connection arrows cycle all four states without moving their endpoints', () => {
  let objects = createScene('system');
  const original = objects.find((o) => o.id === 'pwm')!;
  for (const expected of ['both', 'none', 'left', 'right', 'both']) {
    const before = objects;
    objects = cycleConnectionArrows(objects, ['pwm']);
    const connection = objects.find((o) => o.id === 'pwm')!;
    assert.equal(connectionArrows(connection), expected);
    assert.equal(connection.source, original.source);
    assert.equal(connection.target, original.target);
    assert.notEqual(
      connection,
      before.find((o) => o.id === 'pwm'),
    );
    assert.equal(
      objects.find((o) => o.id === 'mcu'),
      before.find((o) => o.id === 'mcu'),
    );
  }
});
test('legacy arrow states remain readable and both arrows survive snapshot round trips', () => {
  const objects = createScene('system');
  const connection = objects.find((o) => o.id === 'pwm')!;
  assert.equal(connectionArrows({ ...connection, directional: false, reversed: true }), 'none');
  assert.equal(connectionArrows({ ...connection, reversed: true }), 'left');
  assert.equal(connectionArrows(connection), 'right');
  const snapshot = {
    version: 2,
    scene: 'system',
    behavior: 'grouped',
    sticky: true,
    objects: cycleConnectionArrows(objects, ['pwm']),
  };
  const restored = parseSnapshot(JSON.parse(JSON.stringify(snapshot)));
  assert.ok(restored);
  assert.equal(connectionArrows(restored.objects.find((o) => o.id === 'pwm')!), 'both');
  assert.equal(
    parseSnapshot({ ...snapshot, objects: [{ ...connection, arrowStyle: 'invalid' }] }),
    null,
  );
});
test('mixed connections converge to none then cycle together in one edit', () => {
  let objects = createScene('system').map((o) =>
    o.id === 'pwm' ? { ...o, directional: false } : o,
  );
  objects = cycleConnectionArrows(objects, ['pwm', 'spi', 'mcu']);
  assert.equal(connectionArrows(objects.find((o) => o.id === 'pwm')!), 'none');
  assert.equal(connectionArrows(objects.find((o) => o.id === 'spi')!), 'none');
  objects = cycleConnectionArrows(objects, ['pwm', 'spi']);
  assert.equal(connectionArrows(objects.find((o) => o.id === 'pwm')!), 'left');
  assert.equal(connectionArrows(objects.find((o) => o.id === 'spi')!), 'left');
});
