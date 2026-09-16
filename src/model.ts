export type ObjectKind =
  | 'block'
  | 'hardware'
  | 'software'
  | 'port'
  | 'connection'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'symbol';
export type FontFamily = 'normal' | 'classic' | 'compact' | 'mono';
export type Pattern = 'solid' | 'dashed' | 'dotted';
export type Capability =
  | 'fill'
  | 'stroke'
  | 'lineColor'
  | 'direction'
  | 'symbolColor'
  | 'text'
  | 'alignment';
export type PanelBehavior = 'flat' | 'grouped' | 'inline' | 'panel' | 'semi-flat';
export type ArrowStyle = 'none' | 'left' | 'right' | 'both';
export type Detail = 'stroke' | 'text' | 'alignment' | 'arrows' | null;
export interface Style {
  fill: string;
  stroke: string;
  width: number;
  pattern: Pattern;
  textColor: string;
  fontSize: number;
  fontFamily: FontFamily;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  verticalAlign: 'top' | 'middle' | 'bottom';
  align: 'left' | 'center' | 'right';
}
export interface DiagramObject {
  id: string;
  kind: ObjectKind;
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  style: Style;
  colorRole?: 'control' | 'sensor';
  originalColors?: Pick<Style, 'fill' | 'stroke' | 'textColor'>;
  source?: string;
  target?: string;
  directional?: boolean;
  reversed?: boolean;
  arrowStyle?: ArrowStyle;
  hyperlink?: string;
  ports?: string[];
  hardwareComponents?: string[];
  softwareComponents?: string[];
}
export const arrowStyles: ArrowStyle[] = ['none', 'left', 'right', 'both'];
export function connectionArrows(object: DiagramObject): ArrowStyle {
  return object.arrowStyle ?? (!object.directional ? 'none' : object.reversed ? 'left' : 'right');
}
export function cycleConnectionArrows(objects: DiagramObject[], ids: string[]): DiagramObject[] {
  const chosen = objects.filter((o) => ids.includes(o.id) && o.kind === 'connection');
  if (!chosen.length) return objects;
  const current = connectionArrows(chosen[0]);
  const next = chosen.every((o) => connectionArrows(o) === current)
    ? arrowStyles[(arrowStyles.indexOf(current) + 1) % arrowStyles.length]
    : 'none';
  return objects.map((o) =>
    ids.includes(o.id) && o.kind === 'connection'
      ? { ...o, arrowStyle: next, directional: next !== 'none', reversed: next === 'left' }
      : o,
  );
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Point {
  x: number;
  y: number;
}
export const kinds: Record<ObjectKind, string> = {
  block: 'Functional block',
  hardware: 'Hardware component',
  software: 'Software block',
  port: 'Port',
  connection: 'Connection',
  line: 'Simple line',
  rectangle: 'Rectangle',
  ellipse: 'Ellipse',
  text: 'Text',
  symbol: 'Symbol',
};
export const fonts: Record<FontFamily, { label: string; css: string }> = {
  normal: { label: 'Normal', css: 'Inter, sans-serif' },
  classic: { label: 'Classic', css: 'Arial, sans-serif' },
  compact: { label: 'Compact', css: '"Roboto Condensed", sans-serif' },
  mono: { label: 'Mono', css: '"Courier New", monospace' },
};
export const fills = ['#ffffff', '#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#e9d5ff'];
export const inks = ['#334155', '#2563eb', '#15803d', '#d97706', '#db2777', '#7c3aed'];
export const defaultStyle: Style = {
  fill: '#ffffff',
  stroke: '#64748b',
  width: 1.5,
  pattern: 'solid',
  textColor: '#1e293b',
  fontSize: 16,
  fontFamily: 'normal',
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  verticalAlign: 'middle',
  align: 'center',
};
export function capabilities(object: DiagramObject, editing = false): Capability[] {
  if (editing || object.kind === 'text') {
    return [
      'text',
      ...(['port', 'connection'].includes(object.kind) ? [] : ['alignment' as const]),
    ];
  }
  switch (object.kind) {
    case 'connection':
      return ['lineColor', 'stroke', 'direction'];
    case 'line':
      return ['lineColor', 'stroke'];
    case 'port':
      return ['fill'];
    case 'symbol':
      return ['symbolColor'];
    default:
      return ['fill', 'stroke'];
  }
}
export function commonCapabilities(objects: DiagramObject[], editing = false): Capability[] {
  if (!objects.length) return [];
  return capabilities(objects[0], editing).filter((cap) =>
    objects.every((object) => capabilities(object, editing).includes(cap)),
  );
}
export function commonValue<K extends keyof Style>(
  objects: DiagramObject[],
  key: K,
): Style[K] | undefined {
  if (!objects.length) return undefined;
  const value = objects[0].style[key];
  return objects.every((object) => object.style[key] === value) ? value : undefined;
}
export function canEditLabel(object: DiagramObject) {
  return !['line', 'symbol'].includes(object.kind);
}
export function isLine(object: DiagramObject) {
  return ['connection', 'line'].includes(object.kind);
}
export function ends(object: DiagramObject, objects: DiagramObject[]): [Point, Point] {
  const source = objects.find((item) => item.id === object.source);
  const target = objects.find((item) => item.id === object.target);
  if (!source || !target)
    return [
      { x: object.x, y: object.y },
      { x: object.x + object.w, y: object.y + object.h },
    ];
  const fromRight = source.x + source.w / 2 <= target.x + target.w / 2;
  return [
    { x: source.x + (fromRight ? source.w : 0), y: source.y + source.h / 2 },
    { x: target.x + (fromRight ? 0 : target.w), y: target.y + target.h / 2 },
  ];
}
export function linePoints(object: DiagramObject, objects: DiagramObject[]): Point[] {
  const [a, b] = ends(object, objects);
  const mid = (a.x + b.x) / 2;
  const route = object.kind === 'line' ? [a, b] : [a, { x: mid, y: a.y }, { x: mid, y: b.y }, b];
  const points: Point[] = [];
  for (const point of route) {
    const last = points.at(-1);
    if (last && last.x === point.x && last.y === point.y) continue;
    points.push(point);
    if (points.length < 3) continue;
    const [p, q, r] = points.slice(-3);
    if ((p.x === q.x && q.x === r.x) || (p.y === q.y && q.y === r.y))
      points.splice(points.length - 2, 1);
  }
  return points;
}
export function pointsPath(points: Point[]) {
  return points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
}
export function pathFor(object: DiagramObject, objects: DiagramObject[]) {
  return pointsPath(linePoints(object, objects));
}
export function bounds(object: DiagramObject, objects: DiagramObject[]): Rect {
  if (!isLine(object)) return object;
  const [a, b] = ends(object, objects);
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y) - 18,
    w: Math.abs(a.x - b.x),
    h: Math.max(36, Math.abs(a.y - b.y) + 36),
  };
}
export function union(rects: Rect[]): Rect {
  if (!rects.length) return { x: 0, y: 0, w: 0, h: 0 };
  const x = Math.min(...rects.map((r) => r.x)),
    y = Math.min(...rects.map((r) => r.y));
  return {
    x,
    y,
    w: Math.max(...rects.map((r) => r.x + r.w)) - x,
    h: Math.max(...rects.map((r) => r.y + r.h)) - y,
  };
}
export function labelBounds(object: DiagramObject, objects: DiagramObject[]): Rect {
  if (isLine(object)) {
    const [a, b] = ends(object, objects);
    return { x: (a.x + b.x) / 2 - 65, y: (a.y + b.y) / 2 - 32, w: 130, h: 30 };
  }
  const height = Math.min(34, Math.max(20, object.h - 12));
  const groupHeight = height + (object.subtitle ? 18 : 0);
  const inset = Math.min(8, Math.max(0, (object.h - groupHeight) / 2));
  const offset =
    object.style.verticalAlign === 'top'
      ? inset
      : object.style.verticalAlign === 'bottom'
        ? object.h - groupHeight - inset
        : (object.h - groupHeight) / 2;
  return {
    x: object.x + 8,
    y: object.y + offset,
    w: object.w - 16,
    h: height,
  };
}
export function overlap(a: Rect, b: Rect) {
  return (
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
  );
}
export function patternDash(pattern: Pattern) {
  return pattern === 'dashed' ? '8 5' : pattern === 'dotted' ? '1 5' : undefined;
}
