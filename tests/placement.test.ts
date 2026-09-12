import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overlap, type Rect } from '../src/model';
import { PANEL_GAP, placeFormattingPanel, type PanelPlacement } from '../src/panelPlacement';

const viewport = { x: 78, y: 14, w: 900, h: 660 };
const bar = { w: 416, h: 44 };
const popup = { w: 288, h: 160 };
function checkClear(p: PanelPlacement, selection: Rect, v = viewport) {
  for (const rect of [p.toolbar, p.popover].filter(Boolean) as Rect[]) {
    assert.equal(overlap(rect, selection), 0);
    assert.ok(rect.x >= v.x && rect.y >= v.y);
    assert.ok(rect.x + rect.w <= v.x + v.w && rect.y + rect.h <= v.y + v.h);
  }
}

test('opening, switching, and closing popovers keeps the toolbar anchored above the object', () => {
  const selection = { x: 440, y: 400, w: 195, h: 130 };
  let placement = placeFormattingPanel(selection, bar, null, viewport);
  const anchor = placement.toolbar;
  for (const size of [popup, { w: 288, h: 220 }, { w: 288, h: 110 }, null, popup]) {
    placement = placeFormattingPanel(selection, bar, size, viewport, 280, placement);
    assert.deepEqual(placement.toolbar, anchor);
    assert.equal(placement.direction, 'up');
    if (placement.popover)
      assert.equal(placement.popover.y + placement.popover.h + PANEL_GAP, anchor.y);
    checkClear(placement, selection);
  }
});

test('top-edge selections place the pair below and expand downward', () => {
  const selection = { x: 100, y: 20, w: 180, h: 100 };
  const placement = placeFormattingPanel(selection, bar, popup, viewport);
  assert.equal(placement.direction, 'down');
  assert.ok(placement.toolbar.y >= selection.y + selection.h);
  assert.equal(placement.popover!.y, placement.toolbar.y + bar.h + PANEL_GAP);
  checkClear(placement, selection);
});

test('insufficient headroom flips once and closing does not bounce back', () => {
  const selection = { x: 440, y: 180, w: 195, h: 110 };
  const closed = placeFormattingPanel(selection, bar, null, viewport);
  assert.equal(closed.direction, 'up');
  const open = placeFormattingPanel(selection, bar, popup, viewport, 210, closed);
  assert.equal(open.direction, 'down');
  checkClear(open, selection);
  const reclosed = placeFormattingPanel(selection, bar, null, viewport, 210, open);
  assert.deepEqual(reclosed.toolbar, open.toolbar);
  const reopened = placeFormattingPanel(selection, bar, popup, viewport, 300, reclosed);
  assert.deepEqual(reopened.toolbar, open.toolbar);
});

test('popovers track their trigger and shift within both viewport edges without shifting the row', () => {
  for (const x of [85, 790]) {
    const selection = { x, y: 400, w: 180, h: 100 };
    let p = placeFormattingPanel(selection, bar, null, viewport);
    const anchor = p.toolbar;
    for (const trigger of [25, 250, 390]) {
      p = placeFormattingPanel(selection, bar, popup, viewport, trigger, p);
      assert.deepEqual(p.toolbar, anchor);
      assert.equal(p.connectorX, anchor.x + trigger);
      assert.ok(p.connectorX >= p.popover!.x && p.connectorX <= p.popover!.x + popup.w);
      checkClear(p, selection);
    }
  }
});

test('bottom and tall selections keep the complete pair clear, using the side strip when needed', () => {
  for (const selection of [
    { x: 550, y: 550, w: 180, h: 110 },
    { x: 80, y: 60, w: 180, h: 570 },
    { x: 740, y: 60, w: 180, h: 570 },
  ])
    checkClear(placeFormattingPanel(selection, bar, popup, viewport, 350), selection);
});

test('oversized selections dock to a viewport edge and keep both surfaces reachable', () => {
  const selection = { x: -400, y: -500, w: 1800, h: 1600 };
  const p = placeFormattingPanel(selection, bar, popup, viewport);
  assert.equal(p.edgeAnchored, true);
  assert.equal(p.toolbar.y, viewport.y);
  assert.equal(p.direction, 'down');
  for (const r of [p.toolbar, p.popover!]) {
    assert.ok(r.x >= viewport.x && r.y >= viewport.y);
    assert.ok(r.x + r.w <= viewport.x + viewport.w);
    assert.ok(r.y + r.h <= viewport.y + viewport.h);
  }
  assert.ok(overlap(p.toolbar, selection) > 0); // Unavoidable, explicit fallback.
  const closed = placeFormattingPanel(selection, bar, null, viewport, 210, p);
  assert.deepEqual(closed.toolbar, p.toolbar);
  const switched = placeFormattingPanel(selection, bar, { w: 288, h: 210 }, viewport, 310, closed);
  assert.deepEqual(switched.toolbar, p.toolbar);
});

test('a short viewport limits popover height while preserving the toolbar and connection gap', () => {
  const small = { x: 78, y: 14, w: 360, h: 180 };
  const selection = { x: 90, y: 0, w: 800, h: 800 };
  const p = placeFormattingPanel(selection, bar, { w: 288, h: 500 }, small);
  assert.equal(p.toolbar.w, 360);
  assert.equal(p.popover!.h, small.h - bar.h - PANEL_GAP);
  assert.ok(p.popover!.y + p.popover!.h <= small.y + small.h);
});

test('a selection wider than the viewport still expands away when there is free vertical space', () => {
  for (const y of [30, 540]) {
    const selection = { x: -100, y, w: 1500, h: 100 };
    const p = placeFormattingPanel(selection, bar, popup, viewport);
    assert.equal(p.edgeAnchored, true);
    assert.equal(p.direction, y === 30 ? 'down' : 'up');
    checkClear(p, selection);
  }
});
