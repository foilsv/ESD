import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addCustomColor,
  defaultCustomColors,
  listenForColorCommit,
  parseCustomColors,
} from '../src/customColors';

test('custom palettes begin with four defaults and recover from invalid storage', () => {
  assert.equal(defaultCustomColors.length, 4);
  assert.equal(new Set(defaultCustomColors).size, 4);
  for (const serialized of [null, '{broken', '{}', '[]', '["invalid"]']) {
    assert.deepEqual(parseCustomColors(serialized), defaultCustomColors);
  }
});

test('custom colors round-trip, normalize duplicates, and keep the eight most recent choices', () => {
  const saved = parseCustomColors('["#0A70CF","#0a70cf",false,"#123456","invalid"]');
  assert.deepEqual(saved, ['#0a70cf', '#123456']);
  const next = addCustomColor(saved, '#123456');
  assert.deepEqual(next, ['#123456', '#0a70cf']);
  assert.deepEqual(parseCustomColors(JSON.stringify(next)), next);
  let recent = [...defaultCustomColors];
  for (let i = 0; i < 12; i++)
    recent = addCustomColor(recent, '#' + i.toString(16).padStart(6, '0'));
  assert.equal(recent.length, 8);
  assert.equal(recent[0], '#00000b');
});

test('dragging the native picker saves only the committed color, not intermediate shades', () => {
  const picker = Object.assign(new EventTarget(), { value: '#000000' });
  const committed: string[] = [];
  const cleanup = listenForColorCommit(picker, (color) => committed.push(color));
  for (const color of ['#b56e1c', '#b76e1a', '#b56b17', '#be6e13']) {
    picker.value = color;
    picker.dispatchEvent(new Event('input'));
  }
  assert.deepEqual(committed, []);
  picker.dispatchEvent(new Event('change'));
  assert.deepEqual(committed, ['#be6e13']);
  cleanup();
  picker.dispatchEvent(new Event('change'));
  assert.equal(committed.length, 1);
});
