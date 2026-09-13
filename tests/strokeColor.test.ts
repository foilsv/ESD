import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANVAS_BACKGROUND,
  contrastRatio,
  deriveStrokeColor,
  deriveTextColor,
  relativeLuminance,
  visibleStrokeColor,
} from '../src/strokeColor';

test('automatic borders preserve a visible edge around pale and dark fills', () => {
  for (const fill of ['#dbeafe', '#fcd34d', '#0f172a']) {
    const stroke = deriveStrokeColor(fill);
    assert.match(stroke, /^#[0-9a-f]{6}$/);
    assert.ok(contrastRatio(stroke, fill) >= 3, `${fill}: ${stroke} against fill`);
    assert.ok(contrastRatio(stroke, CANVAS_BACKGROUND) >= 3, `${fill}: ${stroke} against canvas`);
  }
});

test('transparent fills derive a neutral canvas border and visible strokes stay unchanged', () => {
  const stroke = deriveStrokeColor('transparent');
  assert.equal(visibleStrokeColor('#2563eb', '#ffffff'), '#2563eb');
  assert.equal(visibleStrokeColor('transparent', '#ffffff'), deriveStrokeColor('#ffffff'));
  assert.ok(contrastRatio(stroke, CANVAS_BACKGROUND) >= 3);
  const channels = stroke
    .slice(1)
    .match(/../g)!
    .map((channel) => parseInt(channel, 16));
  assert.ok(Math.max(...channels) - Math.min(...channels) <= 1, stroke);
});

test('fill-related borders choose the closest qualifying lightness direction', () => {
  const paleFill = '#93c5fd';
  const darkFill = '#0f172a';
  assert.ok(relativeLuminance(deriveStrokeColor(paleFill)) < relativeLuminance(paleFill));
  assert.ok(relativeLuminance(deriveStrokeColor(darkFill)) > relativeLuminance(darkFill));
});

test('chromatic fills retain their recognizable color family', () => {
  const channels = (color: string) =>
    color
      .slice(1)
      .match(/../g)!
      .map((channel) => parseInt(channel, 16));
  const [blueRed, , blue] = channels(deriveStrokeColor('#dbeafe'));
  const [greenRed, green, greenBlue] = channels(deriveStrokeColor('#dcfce7'));
  const [yellowRed, yellowGreen, yellowBlue] = channels(deriveStrokeColor('#fcd34d'));
  assert.ok(blue > blueRed);
  assert.ok(green > greenRed && green > greenBlue);
  assert.ok(yellowRed > yellowGreen && yellowGreen > yellowBlue);
});

test('automatic text colors reach ordinary-text contrast on opaque and transparent fills', () => {
  for (const fill of ['#dbeafe', '#fcd34d', '#0f172a', 'transparent']) {
    const background = fill === 'transparent' ? CANVAS_BACKGROUND : fill;
    const textColor = deriveTextColor(fill);
    assert.match(textColor, /^#[0-9a-f]{6}$/);
    assert.ok(contrastRatio(textColor, background) >= 4.5, `${fill}: ${textColor}`);
  }
});

test('automatic text colors use the closest readable lightness direction', () => {
  const paleFill = '#93c5fd';
  const darkFill = '#0f172a';
  assert.ok(relativeLuminance(deriveTextColor(paleFill)) < relativeLuminance(paleFill));
  assert.ok(relativeLuminance(deriveTextColor(darkFill)) > relativeLuminance(darkFill));
});
