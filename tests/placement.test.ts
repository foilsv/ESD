import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overlap, type Rect } from '../src/model';
import { PANEL_GAP, placeFormattingPanel, type PanelPlacement } from '../src/panelPlacement';

const viewport = { x: 78, y: 14, w: 900, h: 660 };
const bar = { w: 416, h: 44 };
const popup = { w: 288, h: 160 };
function checkContained(p: PanelPlacement, v = viewport) {
  for (const rect of [p.toolbar, p.popover].filter(Boolean) as Rect[]) {
    assert.ok(rect.x >= v.x && rect.y >= v.y);
    assert.ok(rect.x + rect.w <= v.x + v.w && rect.y + rect.h <= v.y + v.h);
  }
}
function checkClear(p: PanelPlacement, selection: Rect, v = viewport) {
  checkContained(p, v);
  for (const rect of [p.toolbar, p.popover].filter(Boolean) as Rect[])
    assert.equal(overlap(rect, selection), 0);
}
function checkConnected(p: PanelPlacement) {
  if (!p.popover) return;
  assert.equal(
    p.direction === 'up'
      ? p.popover.y + p.popover.h + PANEL_GAP
      : p.toolbar.y + p.toolbar.h + PANEL_GAP,
    p.direction === 'up' ? p.toolbar.y : p.popover.y,
  );
}

test('opening, switching, and closing popovers keeps the toolbar anchored above the object', () => {
  const selection = { x: 440, y: 400, w: 195, h: 130 };
  let placement = placeFormattingPanel(selection, bar, null, viewport);
  const anchor = placement.toolbar;
  for (const size of [popup, { w: 288, h: 220 }, { w: 288, h: 110 }, null, popup]) {
    placement = placeFormattingPanel(selection, bar, size, viewport, 280, placement);
    assert.deepEqual(placement.toolbar, anchor);
    assert.equal(placement.direction, 'up');
    checkConnected(placement);
    checkClear(placement, selection);
  }
});

test('top-edge selections place the toolbar below and expand downward when there is room', () => {
  const selection = { x: 100, y: 20, w: 180, h: 100 };
  const closed = placeFormattingPanel(selection, bar, null, viewport);
  const placement = placeFormattingPanel(selection, bar, popup, viewport, 210, closed);
  assert.deepEqual(placement.toolbar, closed.toolbar);
  assert.equal(placement.direction, 'down');
  assert.ok(placement.toolbar.y >= selection.y + selection.h);
  checkConnected(placement);
  checkClear(placement, selection);
});

test('insufficient popover headroom flips only the popover and permits selection overlap', () => {
  const selection = { x: 440, y: 180, w: 195, h: 110 };
  const closed = placeFormattingPanel(selection, bar, null, viewport);
  assert.ok(closed.toolbar.y + closed.toolbar.h < selection.y);
  const open = placeFormattingPanel(selection, bar, popup, viewport, 210, closed);
  assert.deepEqual(open.toolbar, closed.toolbar);
  assert.equal(open.direction, 'down');
  assert.equal(overlap(open.toolbar, selection), 0);
  assert.ok(overlap(open.popover!, selection) > 0);
  checkConnected(open);
  checkContained(open);
  const reclosed = placeFormattingPanel(selection, bar, null, viewport, 210, open);
  assert.deepEqual(reclosed.toolbar, closed.toolbar);
  const reopened = placeFormattingPanel(selection, bar, popup, viewport, 300, reclosed);
  assert.deepEqual(reopened.toolbar, closed.toolbar);
  assert.equal(reopened.direction, 'down');
  const shorter = placeFormattingPanel(selection, bar, { w: 288, h: 80 }, viewport, 300, reopened);
  assert.deepEqual(shorter.toolbar, closed.toolbar);
  assert.equal(shorter.direction, 'up');
  checkClear(shorter, selection);
});

test('a toolbar below the selection also stays fixed when its popover must open upward', () => {
  const selection = { x: 440, y: 20, w: 195, h: 400 };
  const closed = placeFormattingPanel(selection, bar, null, viewport);
  assert.ok(closed.toolbar.y > selection.y + selection.h);
  const small = placeFormattingPanel(selection, bar, popup, viewport, 210, closed);
  assert.equal(small.direction, 'down');
  assert.deepEqual(small.toolbar, closed.toolbar);
  checkClear(small, selection);
  const large = placeFormattingPanel(selection, bar, { w: 288, h: 260 }, viewport, 210, small);
  assert.deepEqual(large.toolbar, closed.toolbar);
  assert.equal(large.direction, 'up');
  assert.ok(overlap(large.popover!, selection) > 0);
  checkContained(large);
  checkConnected(large);
  const reclosed = placeFormattingPanel(selection, bar, null, viewport, 210, large);
  assert.deepEqual(reclosed.toolbar, closed.toolbar);
});

test('initial toolbar anchor is independent of popover dimensions and trigger position', () => {
  for (const selection of [
    { x: 85, y: 180, w: 180, h: 100 },
    { x: 790, y: 20, w: 180, h: 100 },
    { x: 550, y: 550, w: 180, h: 110 },
    { x: 80, y: 60, w: 180, h: 570 },
    { x: 740, y: 60, w: 180, h: 570 },
  ]) {
    const closed = placeFormattingPanel(selection, bar, null, viewport);
    for (const size of [popup, { w: 500, h: 220 }, { w: 700, h: 900 }]) {
      for (const trigger of [25, 250, 390]) {
        const open = placeFormattingPanel(selection, bar, size, viewport, trigger);
        assert.deepEqual(open.toolbar, closed.toolbar);
        checkContained(open);
        checkConnected(open);
      }
    }
  }
});

test('popovers track their trigger and shift within viewport edges without shifting the row', () => {
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

test('neither side fitting a popover uses the larger space and caps height without moving the toolbar', () => {
  for (const y of [180, 480]) {
    const selection = { x: 440, y, w: 195, h: 100 };
    const closed = placeFormattingPanel(selection, bar, null, viewport);
    const spaceUp = closed.toolbar.y - viewport.y - PANEL_GAP;
    const spaceDown = viewport.y + viewport.h - closed.toolbar.y - bar.h - PANEL_GAP;
    const open = placeFormattingPanel(selection, bar, { w: 288, h: 900 }, viewport, 210, closed);
    assert.deepEqual(open.toolbar, closed.toolbar);
    assert.equal(open.direction, spaceUp > spaceDown ? 'up' : 'down');
    assert.equal(open.popoverMaxHeight, Math.max(spaceUp, spaceDown));
    assert.equal(open.popover!.h, open.popoverMaxHeight);
    checkContained(open);
    checkConnected(open);
    const switched = placeFormattingPanel(selection, bar, popup, viewport, 310, open);
    assert.deepEqual(switched.toolbar, closed.toolbar);
    checkContained(switched);
  }
});

test('oversized selections dock to a viewport edge independently of popover size', () => {
  const selection = { x: -400, y: -500, w: 1800, h: 1600 };
  let p = placeFormattingPanel(selection, bar, null, viewport);
  const anchor = p.toolbar;
  assert.equal(p.edgeAnchored, true);
  assert.equal(anchor.y, viewport.y);
  assert.ok(overlap(anchor, selection) > 0); // Unavoidable, explicit fallback.
  for (const size of [popup, { w: 288, h: 900 }, null, { w: 500, h: 210 }]) {
    const initial = placeFormattingPanel(selection, bar, size, viewport);
    assert.deepEqual(initial.toolbar, anchor);
    p = placeFormattingPanel(selection, bar, size, viewport, 310, p);
    assert.deepEqual(p.toolbar, anchor);
    assert.equal(p.edgeAnchored, true);
    assert.equal(p.direction, 'down');
    checkContained(p);
    checkConnected(p);
  }
});

test('a short viewport limits popover height while preserving the toolbar and connection gap', () => {
  const small = { x: 78, y: 14, w: 360, h: 180 };
  const selection = { x: 90, y: 0, w: 800, h: 800 };
  const closed = placeFormattingPanel(selection, bar, null, small);
  const p = placeFormattingPanel(selection, bar, { w: 288, h: 500 }, small, 210, closed);
  assert.deepEqual(p.toolbar, closed.toolbar);
  assert.equal(p.toolbar.w, 360);
  assert.equal(p.popoverMaxHeight, small.h - bar.h - PANEL_GAP);
  assert.equal(p.popover!.h, p.popoverMaxHeight);
  checkContained(p, small);
  checkConnected(p);
});

test('a selection wider than the viewport keeps a stable clear anchor where vertical space permits', () => {
  for (const y of [30, 540]) {
    const selection = { x: -100, y, w: 1500, h: 100 };
    const closed = placeFormattingPanel(selection, bar, null, viewport);
    const p = placeFormattingPanel(selection, bar, popup, viewport, 210, closed);
    const initialOpen = placeFormattingPanel(selection, bar, popup, viewport);
    assert.equal(p.edgeAnchored, true);
    assert.deepEqual(p.toolbar, closed.toolbar);
    assert.deepEqual(initialOpen.toolbar, closed.toolbar);
    checkClear(p, selection);
    checkConnected(p);
  }
});
