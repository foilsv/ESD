import { connectionArrows, linePoints, pointsPath, type DiagramObject } from './model';

export function arrowMarkerSize(width: number) {
  return Math.max(9, Math.min(24, width * 3));
}

// Triangles span six units of their eight-unit viewBox: tip to base = 3/4 size.
// Visible stroke and arrow placement must use separate paths; painting a marker
// over the full shaft lets thick stroke caps protrude through the triangle tip.
export function connectionGeometry(object: DiagramObject, objects: DiagramObject[]) {
  const points = linePoints(object, objects);
  const fullPath = pointsPath(points);
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const arrows = connectionArrows(object);
  const depth = arrowMarkerSize(object.style.width) * 0.75;
  const visible = object.style.width > 0 && total > 0;
  let startDepth = visible && ['left', 'both'].includes(arrows) ? Math.min(depth, lengths[0]) : 0;
  let endDepth =
    visible && ['right', 'both'].includes(arrows) ? Math.min(depth, lengths.at(-1)!) : 0;
  // A short straight connection may have two heads but no room for a shaft.
  // Reduce both together so they meet at their bases instead of crossing.
  if (startDepth + endDepth > total) {
    const scale = total / (startDepth + endDepth);
    startDepth *= scale;
    endDepth *= scale;
  }
  const shaft = points.map((p) => ({ ...p }));
  if (startDepth) {
    shaft[0].x += ((points[1].x - points[0].x) * startDepth) / lengths[0];
    shaft[0].y += ((points[1].y - points[0].y) * startDepth) / lengths[0];
  }
  if (endDepth) {
    const i = points.length - 1;
    shaft[i].x += ((points[i - 1].x - points[i].x) * endDepth) / lengths[i - 1];
    shaft[i].y += ((points[i - 1].y - points[i].y) * endDepth) / lengths[i - 1];
  }
  return {
    fullPath,
    shaftPath: total > startDepth + endDepth ? pointsPath(shaft) : '',
    startSize: startDepth / 0.75,
    endSize: endDepth / 0.75,
    points,
    // A round cap centered on a triangle base must fit between its sloping sides.
    roundCapsFit: [startDepth, endDepth].every(
      (d) => !d || d >= (object.style.width * Math.sqrt(5)) / 2,
    ),
  };
}
