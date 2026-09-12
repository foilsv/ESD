import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createScene } from '../src/fixtures';
import DiagramCanvas from '../src/DiagramCanvas';
import { arrowMarkerSize, connectionGeometry } from '../src/connectionGeometry';
import {
  connectionArrows,
  cycleConnectionArrows,
  defaultStyle,
  ends,
  type ArrowStyle,
  type DiagramObject,
} from '../src/model';
import { parseSnapshot } from '../src/storage';

test('connection arrow markers scale visibly with thicker strokes', () => {
  assert.deepEqual([1, 2, 4, 8].map(arrowMarkerSize), [9, 9, 12, 24]);
  assert.equal(arrowMarkerSize(20), 24);
});

test('rendering separates the trimmed visible shaft from the unpainted arrow carrier', () => {
  const objects = createScene('system').map((object) =>
    object.id === 'pwm'
      ? { ...object, arrowStyle: 'both' as const, style: { ...object.style, width: 8 } }
      : object,
  );
  const markup = renderToStaticMarkup(
    createElement(DiagramCanvas, {
      objects,
      selected: [],
      editing: null,
      draft: '',
      setDraft() {},
      view: { x: 0, y: 0, zoom: 1 },
      grid: false,
      hand: false,
      select() {},
      edit() {},
      finishEdit() {},
      startObject() {},
      startCanvas() {},
      move() {},
      end() {},
    }),
  );
  assert.match(markup, /id="arrow-start-pwm"[^>]*markerWidth="24"[^>]*refX="1"/);
  assert.match(markup, /id="arrow-end-pwm"[^>]*markerWidth="24"[^>]*refX="7"/);
  assert.match(markup, /marker-start="url\(#arrow-start-pwm\)"/);
  assert.match(markup, /marker-end="url\(#arrow-end-pwm\)"/);
  const connection = objects.find((o) => o.id === 'pwm')!;
  const geometry = connectionGeometry(connection, objects);
  assert.notEqual(geometry.shaftPath, geometry.fullPath);
  const shafts = [...markup.matchAll(/<path class="connection-shaft"[^>]*>/g)].map((m) => m[0]);
  assert.ok(
    shafts.some(
      (s) => s.includes(`d="${geometry.shaftPath}"`) && s.includes('stroke-linecap="butt"'),
    ),
  );
  const carriers = [...markup.matchAll(/<path class="connection-arrowheads"[^>]*>/g)].map(
    (m) => m[0],
  );
  assert.ok(
    carriers.some(
      (s) =>
        s.includes('arrow-end-pwm') &&
        s.includes('stroke="none"') &&
        s.includes(`d="${geometry.fullPath}"`),
    ),
  );
});

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

function freeConnection(width: number, arrowStyle: ArrowStyle, w = 100, h = 60): DiagramObject {
  return {
    id: 'geometry',
    kind: 'connection',
    label: '',
    x: 0,
    y: 0,
    w,
    h,
    style: { ...defaultStyle, width },
    arrowStyle,
  };
}

test('4 and 8 px shafts stop at triangle bases in all four arrow states', () => {
  for (const [width, depth] of [
    [4, 9],
    [8, 18],
  ]) {
    for (const arrows of ['none', 'left', 'right', 'both'] as const) {
      const object = freeConnection(width, arrows);
      const original = structuredClone(object);
      const geometry = connectionGeometry(object, []);
      const start = arrows === 'left' || arrows === 'both';
      const end = arrows === 'right' || arrows === 'both';
      assert.equal(
        geometry.shaftPath,
        `M ${start ? depth : 0} 0 L 50 0 L 50 60 L ${end ? 100 - depth : 100} 60`,
      );
      assert.equal(geometry.fullPath, 'M 0 0 L 50 0 L 50 60 L 100 60');
      assert.equal(geometry.startSize * 0.75, start ? depth : 0);
      assert.equal(geometry.endSize * 0.75, end ? depth : 0);
      assert.deepEqual(object, original);
      assert.deepEqual([geometry.points[0], geometry.points.at(-1)], ends(object, []));
    }
  }
});

test('arrow trims follow reversed, vertical and straight routes without zero-length tangents', () => {
  assert.equal(
    connectionGeometry(freeConnection(8, 'both', -100, 60), []).shaftPath,
    'M -18 0 L -50 0 L -50 60 L -82 60',
  );
  assert.equal(
    connectionGeometry(freeConnection(8, 'both', 0, 100), []).shaftPath,
    'M 0 18 L 0 82',
  );
  assert.equal(
    connectionGeometry(freeConnection(8, 'both', 0, -100), []).shaftPath,
    'M 0 -18 L 0 -82',
  );
  assert.equal(
    connectionGeometry(freeConnection(8, 'both', 100, 0), []).shaftPath,
    'M 18 0 L 82 0',
  );
});

test('short routes never reverse their shaft or move arrow tips past a bend', () => {
  const short = connectionGeometry(freeConnection(8, 'both', 10, 0), []);
  assert.equal(short.shaftPath, '');
  assert.equal(short.startSize * 0.75, 5);
  assert.equal(short.endSize * 0.75, 5);
  assert.equal(short.fullPath, 'M 0 0 L 10 0');
  const bent = connectionGeometry(freeConnection(8, 'both', 10, 100), []);
  assert.equal(bent.startSize * 0.75, 5);
  assert.equal(bent.endSize * 0.75, 5);
  assert.equal(bent.shaftPath, 'M 5 0 L 5 0 L 5 100 L 5 100');
  const empty = connectionGeometry(freeConnection(8, 'both', 0, 0), []);
  assert.equal(empty.shaftPath, '');
  assert.equal(empty.startSize, 0);
  assert.equal(empty.endSize, 0);
  const hidden = connectionGeometry(freeConnection(0, 'both'), []);
  assert.equal(hidden.startSize, 0);
  assert.equal(hidden.endSize, 0);
});

test('patterns share the same shaft endpoints, while ordinary unarrowed lines keep their full length', () => {
  for (const pattern of ['solid', 'dashed', 'dotted'] as const) {
    const object = freeConnection(8, 'both');
    object.style.pattern = pattern;
    assert.equal(connectionGeometry(object, []).shaftPath, 'M 18 0 L 50 0 L 50 60 L 82 60');
  }
  const line = { ...freeConnection(8, 'none', 100, 100), kind: 'line' as const };
  const geometry = connectionGeometry(line, []);
  assert.equal(geometry.shaftPath, geometry.fullPath);
  assert.equal(geometry.shaftPath, 'M 0 0 L 100 100');
});

test('rounded dash caps fit inside full-size triangles but are disabled for tiny heads', () => {
  for (const width of [1, 2, 4, 8]) {
    assert.equal(connectionGeometry(freeConnection(width, 'both'), []).roundCapsFit, true);
  }
  const tiny = connectionGeometry(freeConnection(8, 'right', 3, 0), []);
  assert.equal(tiny.shaftPath, '');
  assert.equal(tiny.roundCapsFit, false);
});
