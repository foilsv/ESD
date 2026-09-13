import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ColorPalette from '../src/ColorPalette';
import type { ColorKey } from '../src/FormattingControls';

function render(kind: ColorKey) {
  return renderToStaticMarkup(
    createElement(ColorPalette, {
      kind,
      value: undefined,
      onChange() {},
      onChoose() {},
    }),
  );
}

test('fill and stroke palettes begin with a contextual no-color option', () => {
  const fill = render('fill');
  const stroke = render('stroke');

  assert.ok(fill.indexOf('aria-label="No fill"') < fill.indexOf('aria-label="Fill color #ffffff"'));
  assert.ok(
    stroke.indexOf('aria-label="No stroke"') < stroke.indexOf('aria-label="Stroke color #ffffff"'),
  );
  assert.doesNotMatch(render('textColor'), /aria-label="No (?:fill|stroke)"/);
});
