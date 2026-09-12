import { overlap, type Rect } from './model';

type Size = { w: number; h: number };
export type PanelDirection = 'up' | 'down';
export interface PanelPlacement {
  toolbar: Rect;
  popover: Rect | null;
  direction: PanelDirection;
  popoverMaxHeight: number;
  connectorX: number;
  edgeAnchored: boolean;
}

export const PANEL_GAP = 14;
const SELECTION_GAP = 16;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
const inside = (r: Rect, v: Rect) =>
  r.x >= v.x - 1e-6 &&
  r.y >= v.y - 1e-6 &&
  r.x + r.w <= v.x + v.w + 1e-6 &&
  r.y + r.h <= v.y + v.h + 1e-6;

/** Anchor the toolbar first. A popover may flip or scroll, but cannot move it. */
export function placeFormattingPanel(
  selection: Rect,
  toolbarSize: Size,
  popoverSize: Size | null,
  viewport: Rect,
  triggerOffset = toolbarSize.w / 2,
  previous?: PanelPlacement,
): PanelPlacement {
  const bar = { w: Math.min(toolbarSize.w, viewport.w), h: toolbarSize.h };
  const right = viewport.x + viewport.w;
  const bottom = viewport.y + viewport.h;
  const centerX = clamp(selection.x + (selection.w - bar.w) / 2, viewport.x, right - bar.w);
  const above = { x: centerX, y: selection.y - SELECTION_GAP - bar.h, ...bar };
  const below = { x: centerX, y: selection.y + selection.h + SELECTION_GAP, ...bar };
  let edgeAnchored = selection.w >= viewport.w || selection.h >= viewport.h;
  let toolbar: Rect;
  const retained = previous && {
    x: clamp(previous.toolbar.x, viewport.x, right - bar.w),
    y: previous.toolbar.y,
    ...bar,
  };

  // The caller only supplies previous for the same selection and viewport.
  // Popup dimensions and trigger position never participate in choosing this anchor.
  if (retained && inside(retained, viewport)) {
    toolbar = retained;
    edgeAnchored = previous!.edgeAnchored;
  } else if (inside(above, viewport)) {
    toolbar = above;
  } else if (inside(below, viewport)) {
    toolbar = below;
  } else {
    edgeAnchored = true;
    const edges = [
      { x: centerX, y: viewport.y, ...bar },
      { x: centerX, y: Math.max(viewport.y, bottom - bar.h), ...bar },
    ];
    // Equally clear edges should keep the controls near the selected object.
    // Otherwise a block moving just beyond the bottom jumps to the top edge.
    const distance = (r: Rect) => Math.abs(r.y + r.h / 2 - (selection.y + selection.h / 2));
    toolbar = edges.sort(
      (a, b) => overlap(a, selection) - overlap(b, selection) || distance(a) - distance(b),
    )[0];
  }

  const available = {
    up: Math.max(0, toolbar.y - viewport.y - PANEL_GAP),
    down: Math.max(0, bottom - toolbar.y - bar.h - PANEL_GAP),
  };
  const outward: PanelDirection =
    toolbar.y + bar.h <= selection.y
      ? 'up'
      : toolbar.y >= selection.y + selection.h
        ? 'down'
        : available.down >= available.up
          ? 'down'
          : 'up';
  const opposite = outward === 'up' ? 'down' : 'up';
  let direction = outward;
  if (popoverSize && popoverSize.h > available[outward]) {
    // Prefer the other side only when the outward side cannot fit the popup.
    // If neither fits, use the larger side and scroll within it.
    if (popoverSize.h <= available[opposite] || available[opposite] > available[outward])
      direction = opposite;
  }

  const popoverMaxHeight = available[direction];
  const connectorX =
    toolbar.x + clamp(triggerOffset, Math.min(14, bar.w / 2), Math.max(bar.w / 2, bar.w - 14));
  const panel = popoverSize && {
    w: Math.min(popoverSize.w, viewport.w),
    h: Math.min(popoverSize.h, popoverMaxHeight),
  };
  const popover = panel
    ? {
        x: clamp(connectorX - panel.w / 2, viewport.x, right - panel.w),
        y: direction === 'up' ? toolbar.y - PANEL_GAP - panel.h : toolbar.y + bar.h + PANEL_GAP,
        ...panel,
      }
    : null;
  return { toolbar, popover, direction, popoverMaxHeight, connectorX, edgeAnchored };
}
