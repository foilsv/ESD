import { kinds, fonts, type DiagramObject, type PanelBehavior } from './model';
import { createScene, type Scene, scenes } from './fixtures';
import { manufacturerStyles, type ManufacturerStyle } from './manufacturerStyles';

const key = 'esd-formatting-lab.v2';
export interface Snapshot {
  version: 2;
  objects: DiagramObject[];
  scene: Scene;
  behavior: PanelBehavior;
  sticky: boolean;
  showPopoverHeaders?: boolean;
  mergeStrokeControls?: boolean;
  groupedTextToolbar?: boolean;
  showMoreActions?: boolean;
  manufacturer?: ManufacturerStyle;
}
export function validSnapshot(input: unknown): input is Snapshot {
  if (!input || typeof input !== 'object') return false;
  const data = input as Snapshot;
  return (
    data.version === 2 &&
    Object.hasOwn(scenes, data.scene) &&
    ['flat', 'grouped', 'inline'].includes(data.behavior) &&
    typeof data.sticky === 'boolean' &&
    (data.showPopoverHeaders === undefined || typeof data.showPopoverHeaders === 'boolean') &&
    (data.mergeStrokeControls === undefined || typeof data.mergeStrokeControls === 'boolean') &&
    (data.groupedTextToolbar === undefined || typeof data.groupedTextToolbar === 'boolean') &&
    (data.showMoreActions === undefined || typeof data.showMoreActions === 'boolean') &&
    (data.manufacturer === undefined ||
      (typeof data.manufacturer === 'string' &&
        Object.hasOwn(manufacturerStyles, data.manufacturer))) &&
    Array.isArray(data.objects) &&
    data.objects.length <= 200 &&
    new Set(data.objects.map((o) => o?.id)).size === data.objects.length &&
    data.objects.every(
      (o) =>
        o &&
        typeof o.id === 'string' &&
        Object.hasOwn(kinds, o.kind) &&
        typeof o.label === 'string' &&
        o.label.length <= 500 &&
        (o.subtitle === undefined || typeof o.subtitle === 'string') &&
        [o.x, o.y, o.w, o.h].every(
          (v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 20000,
        ) &&
        o.w >= 0 &&
        o.h >= 0 &&
        (o.colorRole === undefined || ['control', 'sensor'].includes(o.colorRole)) &&
        (o.originalColors === undefined ||
          (o.originalColors &&
            [o.originalColors.fill, o.originalColors.stroke, o.originalColors.textColor].every(
              (c) => typeof c === 'string' && (/^#[0-9a-f]{6}$/i.test(c) || c === 'transparent'),
            ))) &&
        o.style &&
        [o.style.fill, o.style.stroke, o.style.textColor].every(
          (c) => typeof c === 'string' && (/^#[0-9a-f]{6}$/i.test(c) || c === 'transparent'),
        ) &&
        [0, 1, 1.5, 2, 4, 8].includes(o.style.width) &&
        ['solid', 'dashed', 'dotted'].includes(o.style.pattern) &&
        Number.isFinite(o.style.fontSize) &&
        o.style.fontSize >= 8 &&
        o.style.fontSize <= 72 &&
        Object.hasOwn(fonts, o.style.fontFamily) &&
        typeof o.style.bold === 'boolean' &&
        typeof o.style.italic === 'boolean' &&
        typeof o.style.underline === 'boolean' &&
        typeof o.style.strikethrough === 'boolean' &&
        ['top', 'middle', 'bottom'].includes(o.style.verticalAlign) &&
        ['left', 'center', 'right'].includes(o.style.align) &&
        (o.directional === undefined || typeof o.directional === 'boolean') &&
        (o.reversed === undefined || typeof o.reversed === 'boolean') &&
        (o.arrowStyle === undefined || ['none', 'left', 'right', 'both'].includes(o.arrowStyle)) &&
        [o.source, o.target].every(
          (id) =>
            id === undefined ||
            (typeof id === 'string' &&
              data.objects.some((n) => n.id === id && !['connection', 'line'].includes(n.kind))),
        ),
    )
  );
}
export function parseSnapshot(input: unknown): Snapshot | null {
  if (!input || typeof input !== 'object') return null;
  const data = input as Record<string, unknown>;
  if (![1, 2].includes(Number(data.version)) || !Array.isArray(data.objects)) return null;
  const legacyNames: Record<string, PanelBehavior> = { replace: 'flat', stack: 'grouped' };
  const fixture =
    typeof data.scene === 'string' && Object.hasOwn(scenes, data.scene)
      ? createScene(data.scene as Scene)
      : [];
  const migrated = {
    ...data,
    version: 2,
    manufacturer: data.manufacturer === undefined ? 'default' : data.manufacturer,
    showPopoverHeaders: data.showPopoverHeaders === undefined ? true : data.showPopoverHeaders,
    mergeStrokeControls: data.mergeStrokeControls === undefined ? true : data.mergeStrokeControls,
    groupedTextToolbar: data.groupedTextToolbar === undefined ? true : data.groupedTextToolbar,
    showMoreActions: data.showMoreActions === undefined ? false : data.showMoreActions,
    behavior:
      typeof data.behavior === 'string'
        ? (legacyNames[data.behavior] ?? data.behavior)
        : data.behavior,
    objects: data.objects.map((object) =>
      object && typeof object === 'object'
        ? {
            ...object,
            colorRole:
              object.colorRole === undefined
                ? fixture.find((item) => item.id === object.id && item.kind === object.kind)
                    ?.colorRole
                : object.colorRole,
            style: {
              underline: false,
              strikethrough: false,
              verticalAlign: 'middle',
              ...object.style,
            },
          }
        : object,
    ),
  };
  return validSnapshot(migrated) ? migrated : null;
}
export function loadSnapshot(): Snapshot | null {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(key) ?? localStorage.getItem('esd-formatting-lab.v1') ?? 'null',
    );
    return parseSnapshot(data);
  } catch {
    return null;
  }
}
export function saveSnapshot(snapshot: Snapshot) {
  try {
    localStorage.setItem(key, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}
