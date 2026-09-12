import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { type Rect } from './model';
import { placeFormattingPanel, type PanelPlacement } from './panelPlacement';

export function usePanelPlacement(
  toolbar: RefObject<HTMLDivElement | null>,
  popover: RefObject<HTMLDivElement | null>,
  selection: Rect,
  viewport: Rect,
  activeTrigger: string | null,
) {
  const [placement, setPlacement] = useState<PanelPlacement | null>(null);
  const previous = useRef<{ context: string; placement: PanelPlacement } | null>(null);
  const context = [
    selection.x,
    selection.y,
    selection.w,
    selection.h,
    viewport.x,
    viewport.y,
    viewport.w,
    viewport.h,
  ].join(',');
  const measure = () => {
    if (!toolbar.current) return;
    const bar = toolbar.current.getBoundingClientRect();
    const panelElement = activeTrigger ? popover.current : null;
    const panel = panelElement?.getBoundingClientRect();
    // Measure full content, not its already-capped height, so direction decisions
    // stay correct on resize and when switching to a taller popover.
    const naturalPanelHeight =
      panelElement && panel
        ? Math.max(
            panel.height,
            panelElement.scrollHeight + panelElement.offsetHeight - panelElement.clientHeight,
          )
        : 0;
    const trigger = activeTrigger
      ? toolbar.current
          .querySelector(`[data-popover-trigger="${activeTrigger}"]`)
          ?.getBoundingClientRect()
      : null;
    const next = placeFormattingPanel(
      selection,
      { w: bar.width, h: bar.height },
      panel ? { w: panel.width, h: naturalPanelHeight } : null,
      viewport,
      trigger ? trigger.x + trigger.width / 2 - bar.x : bar.width / 2,
      previous.current?.context === context ? previous.current.placement : undefined,
    );
    previous.current = { context, placement: next };
    setPlacement((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
  };
  // Measure each new composition synchronously before paint, including its trigger.
  useLayoutEffect(measure);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(measure);
    if (toolbar.current) observer.observe(toolbar.current);
    if (popover.current) observer.observe(popover.current);
    toolbar.current?.addEventListener('scroll', measure);
    const bar = toolbar.current;
    return () => {
      observer.disconnect();
      bar?.removeEventListener('scroll', measure);
    };
  }, [context, activeTrigger]);
  return placement;
}
