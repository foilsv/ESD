import test from 'node:test';
import assert from 'node:assert/strict';
import { createScene, scenes } from '../src/fixtures';
import {
  applyManufacturerStyle,
  manufacturerStyles,
  type ManufacturerStyle,
} from '../src/manufacturerStyles';
import { commonValue, ends, isLine } from '../src/model';
import { parseSnapshot } from '../src/storage';

const styles = Object.keys(manufacturerStyles) as ManufacturerStyle[];
const snapshot = {
  version: 2,
  objects: createScene('system'),
  scene: 'system',
  behavior: 'grouped',
  sticky: true,
};

test('every manufacturer changes only colors and preserves geometry, labels, and arrows', () => {
  for (const scene of Object.keys(scenes) as (keyof typeof scenes)[]) {
    const original = createScene(scene);
    for (const manufacturer of styles) {
      const result = applyManufacturerStyle(original, manufacturer);
      assert.deepEqual(original, createScene(scene), 'Input must not be mutated');
      result.forEach((object, index) => {
        const { style, originalColors: _baseline, ...properties } = object;
        const { style: beforeStyle, ...beforeProperties } = original[index];
        assert.deepEqual(properties, beforeProperties);
        const { fill: _f, stroke: _s, textColor: _t, ...format } = style;
        const { fill: _bf, stroke: _bs, textColor: _bt, ...beforeFormat } = beforeStyle;
        assert.deepEqual(format, beforeFormat);
        if (isLine(object)) assert.deepEqual(ends(object, result), ends(original[index], original));
      });
    }
  }
});

test('switching manufacturers preserves original custom colors for an exact restore', () => {
  const original = createScene('system');
  original[0].style.fill = '#123456';
  original[0].style.stroke = 'transparent';
  let result = original;
  for (const manufacturer of styles.filter((id) => id !== 'default')) {
    result = applyManufacturerStyle(result, manufacturer);
    assert.deepEqual(applyManufacturerStyle(result, manufacturer), result);
  }
  assert.deepEqual(applyManufacturerStyle(result, 'default'), original);
});

test('category accents survive label edits and mixed selections remain mixed', () => {
  const original = createScene('system');
  original.find((o) => o.id === 'mcu')!.label = 'Renamed processor';
  const infineon = applyManufacturerStyle(original, 'infineon');
  assert.equal(infineon.find((o) => o.id === 'mcu')!.style.fill, '#bd2d87');
  assert.equal(infineon.find((o) => o.id === 'sensor')!.style.fill, '#ff9933');
  assert.equal(infineon.find((o) => o.id === 'regulator')!.style.fill, '#399b91');
  assert.equal(
    commonValue(
      infineon.filter((o) => ['mcu', 'sensor'].includes(o.id)),
      'fill',
    ),
    undefined,
  );
  const stm = applyManufacturerStyle(infineon, 'stm');
  assert.equal(stm.find((o) => o.id === 'pwm')!.style.stroke, '#ff168b');
  assert.equal(
    applyManufacturerStyle(original, 'nxp').find((o) => o.id === 'mcu')!.style.fill,
    '#ff8000',
  );
});

function luminance(color: string) {
  const rgb = color
    .slice(1)
    .match(/../g)!
    .map((hex) => {
      const value = parseInt(hex, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

test('manufacturer block and port labels have at least 4.5:1 contrast', () => {
  for (const manufacturer of styles.filter((id) => id !== 'default')) {
    const objects = applyManufacturerStyle(
      [...createScene('system'), ...createScene('objects')],
      manufacturer,
    );
    for (const object of objects.filter(
      (o) => !isLine(o) && !['text', 'symbol'].includes(o.kind),
    )) {
      const values = [luminance(object.style.fill), luminance(object.style.textColor)].sort(
        (a, b) => b - a,
      );
      assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, manufacturer + ': ' + object.id);
    }
  }
});

test('manufacturer, object overrides, and original colors survive export/import', () => {
  for (const manufacturer of styles) {
    const objects = applyManufacturerStyle(createScene('system'), manufacturer);
    objects[0].style.fill = '#abcdef';
    const restored = parseSnapshot(
      JSON.parse(JSON.stringify({ ...snapshot, manufacturer, objects })),
    );
    assert.ok(restored);
    assert.equal(restored.manufacturer, manufacturer);
    assert.deepEqual(
      JSON.parse(JSON.stringify(restored.objects)),
      JSON.parse(JSON.stringify(objects)),
    );
  }
});

test('legacy snapshots retain colors and acquire fixture roles without guessing from labels', () => {
  const legacy = {
    ...snapshot,
    version: 1,
    behavior: 'stack',
    objects: snapshot.objects.map(({ colorRole: _role, ...object }) => object),
  };
  const restored = parseSnapshot(legacy)!;
  assert.equal(restored.manufacturer, 'default');
  assert.deepEqual(
    restored.objects.map((o) => o.style),
    legacy.objects.map((o) => o.style),
  );
  const themed = applyManufacturerStyle(restored.objects, 'nxp');
  assert.equal(themed.find((o) => o.id === 'mcu')!.style.fill, '#ff8000');
});

test('invalid manufacturer names, roles, and saved colors are rejected', () => {
  for (const manufacturer of [null, 'unknown', 'constructor', '__proto__', 0, {}]) {
    assert.equal(parseSnapshot({ ...snapshot, manufacturer }), null);
  }
  for (const bad of [
    { colorRole: 'unknown' },
    { originalColors: null },
    { originalColors: { fill: '#fff', stroke: '#123456', textColor: '#123456' } },
    {
      originalColors: { fill: 'url(https://example.com)', stroke: '#123456', textColor: '#123456' },
    },
  ]) {
    assert.equal(
      parseSnapshot({ ...snapshot, objects: [{ ...snapshot.objects[0], ...bad }] }),
      null,
    );
  }
});
