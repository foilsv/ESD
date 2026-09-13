import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterPaletteCommands,
  nextEnabledCommandIndex,
  type PaletteCommand,
} from '../src/commandPaletteModel';

const noop = () => undefined;
const commands: PaletteCommand[] = [
  { id: 'select', label: 'Select tool', group: 'Tools', shortcut: 'V', run: noop },
  {
    id: 'rectangle',
    label: 'Add rectangle',
    group: 'Tools',
    keywords: ['shape'],
    disabled: true,
    run: noop,
  },
  { id: 'fit', label: 'Fit diagram', group: 'View', keywords: ['zoom'], run: noop },
];

test('palette search matches labels, groups, keywords, and multiple terms', () => {
  assert.deepEqual(filterPaletteCommands(commands, ''), commands);
  assert.deepEqual(filterPaletteCommands(commands, 'RECT'), [commands[1]]);
  assert.deepEqual(filterPaletteCommands(commands, 'tools shape'), [commands[1]]);
  assert.deepEqual(filterPaletteCommands(commands, 'zoom'), [commands[2]]);
  assert.deepEqual(filterPaletteCommands(commands, 'missing'), []);
});

test('palette navigation wraps and skips unavailable commands', () => {
  assert.equal(nextEnabledCommandIndex(commands, 0, 1), 2);
  assert.equal(nextEnabledCommandIndex(commands, 2, 1), 0);
  assert.equal(nextEnabledCommandIndex(commands, 0, -1), 2);
  assert.equal(
    nextEnabledCommandIndex(
      commands.map((command) => ({ ...command, disabled: true })),
      0,
      1,
    ),
    -1,
  );
});
