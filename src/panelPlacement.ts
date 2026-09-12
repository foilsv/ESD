import { overlap, type Rect } from './model';

type Size = { w: number; h: number };
export type PanelDirection = 'up' | 'down';
export interface PanelPlacement {
  toolbar: Rect;
  popover: Rect | null;
  direction: PanelDirection;
  connectorX: number;
  edgeAnchored: boolean;
}

export const PANEL_GAP = 14;
const SELECTION_GAP = 16;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
const inside = (r: Rect, v: Rect) =>
  r.x >= v.x - 0.5 &&
  r.y >= v.y - 0.5 &&
  r.x + r.w <= v.x + v.w + 0.5 &&
  r.y + r.h <= v.y + v.h + 0.5;
const bounds = (a: Rect, b: Rect | null): Rect =>
  b
    ? {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x),
        h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y),
      }
    : a;

/** Keep the row anchored; grow its popover away from the selection. */
export function placeFormattingPanel(
  selection: Rect,
  toolbarSize: Size,
  popoverSize: Size | null,
  viewport: Rect,
  triggerOffset = toolbarSize.w / 2,
  previous?: PanelPlacement,
): PanelPlacement {
  const bar = { w: Math.min(toolbarSize.w, viewport.w), h: toolbarSize.h };
  const panel = popoverSize && {
    w: Math.min(popoverSize.w, viewport.w),
    h: Math.min(popoverSize.h, Math.max(0, viewport.h - bar.h - PANEL_GAP)),
  };
  const totalHeight = bar.h + (panel ? panel.h + PANEL_GAP : 0);
  const oversized = selection.w >= viewport.w || selection.h >= viewport.h;
  const centerX = selection.x + (selection.w - bar.w) / 2;
  const make = (
    x: number,
    y: number,
    direction: PanelDirection,
    edgeAnchored = false,
  ): PanelPlacement => {
    const toolbar = { x: clamp(x, viewport.x, viewport.x + viewport.w - bar.w), y, ...bar };
    const connectorX = toolbar.x + clamp(triggerOffset, 14, bar.w - 14);
    const popover = panel
      ? {
          x: clamp(connectorX - panel.w / 2, viewport.x, viewport.x + viewport.w - panel.w),
          y: direction === 'up' ? y - PANEL_GAP - panel.h : y + bar.h + PANEL_GAP,
          ...panel,
        }
      : null;
    return { toolbar, popover, direction, connectorX, edgeAnchored };
  };
  const fits = (p: PanelPlacement) => inside(bounds(p.toolbar, p.popover), viewport);
  const obstruction = (p: PanelPlacement) => overlap(bounds(p.toolbar, p.popover), selection);
  const expandsAway = (p: PanelPlacement) => {
    if (p.toolbar.y + bar.h <= selection.y) return p.direction === 'up';
    if (p.toolbar.y >= selection.y + selection.h) return p.direction === 'down';
    return true; // A pair placed beside the selection can use either direction.
  };

  // Retain a successful flip/shift when closing or switching groups. This also
  // prevents taller popovers from repeatedly bouncing the row between sides.
  if (previous) {
    const retained = make(
      previous.toolbar.x,
      previous.toolbar.y,
      previous.direction,
      previous.edgeAnchored,
    );
    if (
      fits(retained) &&
      (oversized ? retained.edgeAnchored : obstruction(retained) === 0 && expandsAway(retained))
    )
      return retained;
  }

  const candidates = [
    make(centerX, selection.y - SELECTION_GAP - bar.h, 'up'),
    make(centerX, selection.y + selection.h + SELECTION_GAP, 'down'),
  ];
  // Tall selections may leave space only at the sides. Shift the entire pair,
  // including the trigger-centered popover, into that strip.
  for (const direction of ['up', 'down'] as const) {
    const y = clamp(
      selection.y + (selection.h - bar.h) / 2,
      viewport.y + (direction === 'up' ? totalHeight - bar.h : 0),
      viewport.y + viewport.h - (direction === 'down' ? totalHeight : bar.h),
    );
    const origin = make(centerX, y, direction);
    const extent = bounds(origin.toolbar, origin.popover);
    for (const side of ['right', 'left'] as const) {
      const targetX =
        side === 'right'
          ? selection.x + selection.w + SELECTION_GAP
          : selection.x - SELECTION_GAP - extent.w;
      const shift = targetX - extent.x;
      const candidate = make(origin.toolbar.x + shift, y, direction);
      // Re-clamping a panel can change the pair's width; validate the full pair.
      candidates.push(candidate);
    }
  }
  if (!oversized) {
    const clear = candidates.find((p) => fits(p) && obstruction(p) === 0 && expandsAway(p));
    if (clear) return clear;
  }

  // Oversized selections and exhausted free space use predictable viewport edges.
  // The popup scrolls internally if its natural height exceeds the available room.
  const edges = [
    make(centerX, viewport.y, 'down', true),
    make(centerX, viewport.y + viewport.h - bar.h, 'up', true),
    make(centerX, viewport.y + totalHeight - bar.h, 'up', true),
    make(centerX, viewport.y + viewport.h - totalHeight, 'down', true),
    ...(['up', 'down'] as const).flatMap((direction) => {
      const y = direction === 'up' ? viewport.y + totalHeight - bar.h : viewport.y;
      return [
        make(viewport.x, y, direction, true),
        make(viewport.x + viewport.w - bar.w, y, direction, true),
      ];
    }),
  ];
  // Score actual surfaces here: the empty space between them need not hide an object.
  const score = (p: PanelPlacement) =>
    overlap(p.toolbar, selection) + (p.popover ? overlap(p.popover, selection) : 0);
  const movement = (p: PanelPlacement) =>
    previous
      ? Math.abs(p.toolbar.x - previous.toolbar.x) + Math.abs(p.toolbar.y - previous.toolbar.y)
      : 0;
  return (
    edges
      .filter(fits)
      .sort(
        (a, b) =>
          score(a) - score(b) ||
          Number(expandsAway(b)) - Number(expandsAway(a)) ||
          movement(a) - movement(b),
      )[0] ?? edges[0]
  );
}
