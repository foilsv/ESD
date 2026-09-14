import assert from 'node:assert/strict';
import test from 'node:test';
import { canAlignObjects, releasedContextTarget } from '../src/contextMenuModel';
import { createScene } from '../src/fixtures';

test('object alignment requires multiple independently movable objects', () => {
  const scene = createScene('system');
  const block = scene.find((object) => object.id === 'mcu')!;
  const hardware = scene.find((object) => object.kind === 'hardware')!;
  const connection = scene.find((object) => object.kind === 'connection')!;
  assert.equal(canAlignObjects([]), false);
  assert.equal(canAlignObjects([block]), false);
  assert.equal(canAlignObjects([block, hardware]), true);
  assert.equal(canAlignObjects([block, connection]), false);
  assert.equal(canAlignObjects([block, hardware, connection]), false);
  assert.equal(
    canAlignObjects([block, { ...connection, source: undefined, target: undefined }]),
    true,
  );
  assert.equal(canAlignObjects([block, { ...connection, source: undefined }]), false);
});

test('secondary clicks distinguish an object target from empty canvas', () => {
  assert.equal(releasedContextTarget({ moved: false, contextTarget: 'mcu' }, 'pointerup'), 'mcu');
  assert.equal(releasedContextTarget({ moved: false, contextTarget: null }, 'pointerup'), null);
});

test('right-drag panning and cancelled gestures cannot open a context menu', () => {
  for (const contextTarget of ['mcu', null]) {
    assert.equal(releasedContextTarget({ moved: true, contextTarget }, 'pointerup'), undefined);
    assert.equal(
      releasedContextTarget({ moved: false, contextTarget }, 'pointercancel'),
      undefined,
    );
    assert.equal(releasedContextTarget({ moved: false, contextTarget }, 'pointerdown'), undefined);
  }
});

test('ordinary move, resize, and pan gestures never become secondary clicks', () => {
  assert.equal(releasedContextTarget({ moved: false }, 'pointerup'), undefined);
  assert.equal(releasedContextTarget({ moved: true }, 'pointerup'), undefined);
  assert.equal(releasedContextTarget(null, 'pointerup'), undefined);
  assert.equal(releasedContextTarget({ moved: false, contextTarget: 'mcu' }), undefined);
});
