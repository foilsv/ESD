import assert from 'node:assert/strict';
import test from 'node:test';
import { zoomViewAt } from '../src/viewport';

test('zoom keeps the diagram point under the cursor fixed', () => {
  const view = { x: 30, y: 25, zoom: 0.9 };
  const cursor = { x: 480, y: 320 };
  const diagramPoint = {
    x: (cursor.x - view.x) / view.zoom,
    y: (cursor.y - view.y) / view.zoom,
  };
  const zoomed = zoomViewAt(view, 1.2, cursor);
  assert.equal(diagramPoint.x * zoomed.zoom + zoomed.x, cursor.x);
  assert.equal(diagramPoint.y * zoomed.zoom + zoomed.y, cursor.y);
});

test('zoom respects the canvas limits while retaining the focal point', () => {
  const cursor = { x: 200, y: 150 };
  const minimum = zoomViewAt({ x: 0, y: 0, zoom: 1 }, 0.01, cursor);
  const maximum = zoomViewAt({ x: 0, y: 0, zoom: 1 }, 100, cursor);
  assert.equal(minimum.zoom, 0.25);
  assert.equal(maximum.zoom, 2);
  assert.deepEqual({ x: minimum.x, y: minimum.y }, { x: 150, y: 112.5 });
  assert.deepEqual({ x: maximum.x, y: maximum.y }, { x: -200, y: -150 });
});
