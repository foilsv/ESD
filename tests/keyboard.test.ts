import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createScene } from '../src/fixtures';
import {
  isCommandPaletteShortcut,
  nudgeObjects,
  resolveCanvasShortcut,
  toggleLabelEmphasis,
  type CanvasKeyEvent,
  type CanvasShortcutContext,
} from '../src/keyboard';
import { defaultStyle, ends, type DiagramObject } from '../src/model';

const selected: CanvasShortcutContext = {
  selectedCount: 1,
  editableSelection: true,
  allLabelsEditable: true,
  toolIdle: true,
};
const empty = { ...selected, selectedCount: 0, editableSelection: false, allLabelsEditable: false };
const resolve = (key: string, event: Partial<CanvasKeyEvent> = {}, context = selected) =>
  resolveCanvasShortcut({ key, ...event }, context);

test('the command palette chord is app-wide and exact', () => {
  for (const modifier of [{ ctrlKey: true }, { metaKey: true }]) {
    assert.equal(isCommandPaletteShortcut({ key: '/', code: 'Slash', ...modifier }), true);
    assert.equal(
      isCommandPaletteShortcut({ key: 'Unidentified', code: 'Slash', ...modifier }),
      true,
    );
    assert.equal(
      isCommandPaletteShortcut({ key: '/', code: 'Slash', ...modifier, repeat: true }),
      false,
    );
  }
  for (const event of [
    { key: '/' },
    { key: '/', ctrlKey: true, shiftKey: true },
    { key: '/', ctrlKey: true, altKey: true },
    { key: '/', ctrlKey: true, isComposing: true },
    { key: '/', ctrlKey: true, getModifierState: () => true },
  ]) {
    assert.equal(isCommandPaletteShortcut(event), false);
  }
});

test('typing takes precedence over tool letters and preserves punctuation and Unicode', () => {
  for (const key of ['b', 't', 'l', 'v', 'r', 'o', 'B', '1', ':', '!', '@', 'é', '字', '🔌']) {
    assert.deepEqual(resolve(key, { shiftKey: key === 'B' || key === '@' }), {
      type: 'replace-label',
      text: key,
    });
  }
  assert.deepEqual(resolve(' '), { type: 'pan-start' });
  for (const key of ['Tab', 'Shift', 'Control', 'Unidentified', '\n'])
    assert.equal(resolve(key), null);
});

test('multi-selection, unsupported labels, and active tools never create or edit on typing', () => {
  for (const context of [
    { ...selected, selectedCount: 2, editableSelection: false },
    { ...selected, editableSelection: false },
    { ...selected, toolIdle: false },
  ]) {
    for (const key of ['b', 't', 'l', 'v', 'B', '?', 'Enter', 'F2', 'Dead', 'Process']) {
      assert.equal(resolve(key, {}, context), null);
    }
  }
});

test('empty-selection tools use the advertised keys without repeat creation or old C binding', () => {
  for (const [key, tool] of Object.entries({
    b: 'block',
    t: 'text',
    l: 'connect',
    v: 'select',
    r: 'rectangle',
    o: 'ellipse',
  })) {
    assert.deepEqual(resolve(key, {}, empty), { type: 'tool', tool });
    assert.equal(resolve(key, { repeat: true }, empty), null);
    assert.equal(resolve(key, {}, { ...empty, toolIdle: false }), null);
  }
  assert.equal(resolve('c', {}, empty), null);
  assert.equal(resolve('B', { shiftKey: true }, empty), null);
});

test('Enter/F2 request caret editing; composition confirmation never commits or cancels', () => {
  assert.deepEqual(resolve('Enter'), { type: 'edit-label' });
  assert.deepEqual(resolve('F2'), { type: 'edit-label' });
  for (const key of ['Enter', 'Escape', 'b']) {
    assert.deepEqual(resolve(key, { isComposing: true }), { type: 'compose-label' });
  }
  assert.deepEqual(resolve('Dead', { altKey: true }), { type: 'compose-label' });
  assert.deepEqual(resolve('Process'), { type: 'compose-label' });
  assert.deepEqual(resolve('Unidentified', { keyCode: 229 }), { type: 'compose-label' });
  assert.equal(resolve('Process', {}, empty), null);
  assert.equal(resolve('z', { ctrlKey: true, isComposing: true }), null);
});

test('Option and AltGr text survives while exact fit and style chords remain commands', () => {
  assert.deepEqual(resolve('å', { altKey: true, code: 'KeyA' }), {
    type: 'replace-label',
    text: 'å',
  });
  assert.deepEqual(resolve('@', { ctrlKey: true, altKey: true, code: 'KeyQ' }), {
    type: 'replace-label',
    text: '@',
  });
  assert.deepEqual(
    resolve('c', {
      ctrlKey: true,
      altKey: true,
      getModifierState: (key) => key === 'AltGraph',
    }),
    { type: 'replace-label', text: 'c' },
  );
  assert.deepEqual(resolve('¡', { altKey: true, code: 'Digit1' }), {
    type: 'fit',
    target: 'diagram',
  });
  assert.deepEqual(resolve('™', { altKey: true, code: 'Digit2' }), {
    type: 'fit',
    target: 'selection',
  });
  assert.equal(resolve('2', { altKey: true, code: 'Digit2' }, empty), null);
  assert.deepEqual(resolve('!', { shiftKey: true, code: 'Digit1' }), {
    type: 'replace-label',
    text: '!',
  });
  assert.deepEqual(
    resolve('€', {
      ctrlKey: true,
      altKey: true,
      code: 'Digit2',
      getModifierState: () => true,
    }),
    { type: 'replace-label', text: '€' },
  );
  for (const modifier of [{ ctrlKey: true }, { metaKey: true }]) {
    assert.deepEqual(resolve('c', { ...modifier, altKey: true }), { type: 'copy-style' });
    assert.deepEqual(resolve('v', { ...modifier, altKey: true }), { type: 'paste-style' });
  }
});

test('history, selection, formatting, and zoom use modifiers and retain reserved clipboard keys', () => {
  for (const modifier of [{ ctrlKey: true }, { metaKey: true }]) {
    assert.deepEqual(resolve('z', modifier), { type: 'undo' });
    assert.deepEqual(resolve('Z', { ...modifier, shiftKey: true }), { type: 'redo' });
    assert.deepEqual(resolve('a', modifier), { type: 'select-all' });
    for (const [key, property] of Object.entries({ b: 'bold', i: 'italic', u: 'underline' })) {
      assert.deepEqual(resolve(key, modifier), { type: 'emphasis', property });
      assert.equal(resolve(key, modifier, { ...selected, allLabelsEditable: false }), null);
    }
    assert.deepEqual(resolve('+', { ...modifier, shiftKey: true }), {
      type: 'zoom',
      direction: 'in',
    });
    assert.deepEqual(resolve('=', modifier), { type: 'zoom', direction: 'in' });
    assert.deepEqual(resolve('-', modifier), { type: 'zoom', direction: 'out' });
    assert.deepEqual(resolve('0', modifier), { type: 'zoom', direction: 'reset' });
    for (const key of ['c', 'x', 'v', 'd']) assert.equal(resolve(key, modifier), null);
  }
  assert.deepEqual(resolve('y', { ctrlKey: true }), { type: 'redo' });
  assert.equal(resolve('y', { metaKey: true }), null);
  assert.equal(resolve('z', { defaultPrevented: true, ctrlKey: true }), null);
});

test('selection deletion and nudging are bounded to idle canvas selection', () => {
  assert.deepEqual(resolve('ArrowLeft'), { type: 'nudge', dx: -1, dy: 0 });
  assert.deepEqual(resolve('ArrowRight', { shiftKey: true }), { type: 'nudge', dx: 10, dy: 0 });
  assert.deepEqual(resolve('ArrowUp', { shiftKey: true, repeat: true }), {
    type: 'nudge',
    dx: 0,
    dy: -10,
  });
  assert.deepEqual(resolve('ArrowDown'), { type: 'nudge', dx: 0, dy: 1 });
  for (const key of ['Delete', 'Backspace']) assert.deepEqual(resolve(key), { type: 'delete' });
  for (const key of ['Delete', 'Backspace', 'ArrowLeft']) {
    assert.equal(resolve(key, {}, empty), null);
    assert.equal(resolve(key, {}, { ...selected, toolIdle: false }), null);
    assert.equal(resolve(key, { altKey: true }), null);
  }
  assert.deepEqual(resolve('Escape', {}, { ...empty, toolIdle: false }), { type: 'escape' });
  assert.equal(resolve('Escape', { repeat: true }), null);
});

test('nudging mixed selection moves nodes once and retains connection attachment and endpoints', () => {
  const objects = createScene('system');
  const connection = objects.find((object) => object.id === 'pwm')!;
  const oldEnds = ends(connection, objects);
  const ids = [connection.source!, connection.target!, connection.id];
  const moved = nudgeObjects(objects, ids, 10, -1);
  assert.equal(
    moved.find((object) => object.id === connection.id),
    connection,
  );
  assert.deepEqual(
    ends(connection, moved),
    oldEnds.map((point) => ({ x: point.x + 10, y: point.y - 1 })),
  );
  assert.equal(nudgeObjects(objects, [connection.id], 10, 0), objects);
  assert.equal(nudgeObjects(objects, [], 10, 0), objects);
  assert.equal(nudgeObjects(objects, ids, 0, 0), objects);
  assert.deepEqual(ends(connection, objects), oldEnds);
});

test('unattached lines translate both endpoints when nudged', () => {
  const line: DiagramObject = {
    id: 'free-line',
    kind: 'line',
    label: '',
    x: 5,
    y: 10,
    w: 70,
    h: -20,
    style: { ...defaultStyle },
  };
  const moved = nudgeObjects([line], [line.id], -1, 10);
  assert.deepEqual(ends(moved[0], moved), [
    { x: 4, y: 20 },
    { x: 74, y: 0 },
  ]);
  assert.equal(moved[0].w, line.w);
  assert.equal(moved[0].h, line.h);
});

test('whole-label emphasis enables mixed values, disables all-enabled, and rejects unsupported selections', () => {
  const objects = createScene('system').map((object, index) => ({
    ...object,
    style: { ...object.style, bold: index === 0 },
  }));
  const ids = objects.slice(0, 2).map((object) => object.id);
  const enabled = toggleLabelEmphasis(objects, ids, 'bold');
  assert.ok(
    enabled.filter((object) => ids.includes(object.id)).every((object) => object.style.bold),
  );
  assert.equal(enabled[2], objects[2]);
  const disabled = toggleLabelEmphasis(enabled, ids, 'bold');
  assert.ok(
    disabled.filter((object) => ids.includes(object.id)).every((object) => !object.style.bold),
  );
  const unsupported: DiagramObject = { ...objects[0], id: 'symbol', kind: 'symbol' };
  const mixed = [...objects, unsupported];
  assert.equal(toggleLabelEmphasis(mixed, [ids[0], unsupported.id], 'bold'), mixed);
  assert.equal(toggleLabelEmphasis(objects, [], 'italic'), objects);
});
