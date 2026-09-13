export interface View {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewportPoint {
  x: number;
  y: number;
}

export function zoomViewAt(
  view: View,
  factor: number,
  point: ViewportPoint,
  minimum = 0.25,
  maximum = 2,
): View {
  const zoom = Math.max(minimum, Math.min(maximum, view.zoom * factor));
  return {
    zoom,
    x: point.x - ((point.x - view.x) * zoom) / view.zoom,
    y: point.y - ((point.y - view.y) * zoom) / view.zoom,
  };
}
