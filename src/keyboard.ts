import { canEditLabel, isLine, type DiagramObject } from './model';

/** The caller owns focus/editor scoping and decides whether to prevent the event. */
export interface CanvasKeyEvent {
  key: string;
  code?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
  isComposing?: boolean;
  keyCode?: number;
  defaultPrevented?: boolean;
  getModifierState?: (key: string) => boolean;
}

export interface CanvasShortcutContext {
  selectedCount: number;
  editableSelection: boolean;
  allLabelsEditable: boolean;
  /** Select mode, with no active pointer gesture or connection operation. */
  toolIdle: boolean;
}

export type LabelEmphasis = 'bold' | 'italic' | 'underline';
export type CanvasShortcut =
  | { type: 'replace-label'; text: string }
  | { type: 'compose-label' }
  | { type: 'edit-label' }
  | { type: 'escape' }
  | { type: 'delete' }
  | { type: 'undo' | 'redo' | 'select-all' | 'copy-style' | 'paste-style' | 'pan-start' }
  | { type: 'emphasis'; property: LabelEmphasis }
  | { type: 'zoom'; direction: 'in' | 'out' | 'reset' }
  | { type: 'fit'; target: 'diagram' | 'selection' }
  | { type: 'tool'; tool: 'select' | 'connect' | 'block' | 'text' | 'rectangle' | 'ellipse' }
  | { type: 'nudge'; dx: number; dy: number };

function isPrintable(key: string) {
  return [...key].length === 1 && key !== ' ' && !/[\u0000-\u001f\u007f]/u.test(key);
}

/** The palette is app-wide, including while a field or label editor has focus. */
export function isCommandPaletteShortcut(event: CanvasKeyEvent) {
  return Boolean(
    !event.defaultPrevented &&
    !event.repeat &&
    !event.isComposing &&
    event.keyCode !== 229 &&
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.getModifierState?.('AltGraph') !== true &&
    (event.key === '/' || event.code === 'Slash')
  );
}

export function resolveCanvasShortcut(
  event: CanvasKeyEvent,
  context: CanvasShortcutContext,
): CanvasShortcut | null {
  if (event.defaultPrevented) return null;
  const { key, code, ctrlKey: ctrl, metaKey: meta, altKey: alt, shiftKey: shift } = event;
  const altGraph = event.getModifierState?.('AltGraph') === true;
  const modifier = (ctrl || meta) && !altGraph;
  const canType = context.toolIdle && context.selectedCount === 1 && context.editableSelection;
  const textModifiers = !meta && (!ctrl || alt || altGraph);

  // Dead keys and IME input must be delivered through a native input, without
  // inserting "Dead"/"Process" or interpreting Enter/Escape as canvas commands.
  if (event.isComposing || event.keyCode === 229 || key === 'Dead' || key === 'Process') {
    return canType && textModifiers ? { type: 'compose-label' } : null;
  }

  if (key === 'Escape' && !ctrl && !meta && !alt) {
    return event.repeat ? null : { type: 'escape' };
  }

  if (modifier) {
    const lower = key.toLowerCase();
    if (alt) {
      if (!shift && !event.repeat && (lower === 'c' || lower === 'v')) {
        return context.selectedCount
          ? { type: lower === 'c' ? 'copy-style' : 'paste-style' }
          : null;
      }
      // Ctrl+Alt can be text-producing AltGr on keyboards/browsers that do not
      // report AltGraph. Only the exact advertised style chords take precedence.
      return canType && textModifiers && isPrintable(key)
        ? { type: 'replace-label', text: key }
        : null;
    }
    if (lower === 'z') return { type: shift ? 'redo' : 'undo' };
    if (lower === 'y' && ctrl && !meta && !shift) return { type: 'redo' };
    if (lower === 'a' && !shift) return { type: 'select-all' };
    if (!shift && !event.repeat && context.selectedCount && context.allLabelsEditable) {
      const property = { b: 'bold', i: 'italic', u: 'underline' }[lower] as
        | LabelEmphasis
        | undefined;
      if (property) return { type: 'emphasis', property };
    }
    if (key === '+' || key === '=') return { type: 'zoom', direction: 'in' };
    if (key === '-') return { type: 'zoom', direction: 'out' };
    if (key === '0' && !shift) return { type: 'zoom', direction: 'reset' };
    return null;
  }

  if (alt && !altGraph && !ctrl && !meta && !shift) {
    // Option changes event.key on macOS; physical digit codes retain this chord.
    if (code === 'Digit1' || (!code && key === '1')) return { type: 'fit', target: 'diagram' };
    if (code === 'Digit2' || (!code && key === '2')) {
      return context.selectedCount ? { type: 'fit', target: 'selection' } : null;
    }
  }

  if (canType && textModifiers && isPrintable(key)) return { type: 'replace-label', text: key };
  if (ctrl || meta || alt || altGraph) return null;

  if ((key === 'Enter' || key === 'F2') && !shift && canType && !event.repeat) {
    return { type: 'edit-label' };
  }
  if (key === ' ' && !shift && !event.repeat) return { type: 'pan-start' };
  if (!context.toolIdle) return null;

  if (context.selectedCount) {
    if ((key === 'Delete' || key === 'Backspace') && !shift && !event.repeat) {
      return { type: 'delete' };
    }
    const step = shift ? 10 : 1;
    switch (key) {
      case 'ArrowLeft':
        return { type: 'nudge', dx: -step, dy: 0 };
      case 'ArrowRight':
        return { type: 'nudge', dx: step, dy: 0 };
      case 'ArrowUp':
        return { type: 'nudge', dx: 0, dy: -step };
      case 'ArrowDown':
        return { type: 'nudge', dx: 0, dy: step };
    }
    return null;
  }

  if (event.repeat || shift) return null;
  switch (key.toLowerCase()) {
    case 'v':
      return { type: 'tool', tool: 'select' };
    case 'l':
      return { type: 'tool', tool: 'connect' };
    case 'b':
      return { type: 'tool', tool: 'block' };
    case 't':
      return { type: 'tool', tool: 'text' };
    case 'r':
      return { type: 'tool', tool: 'rectangle' };
    case 'o':
      return { type: 'tool', tool: 'ellipse' };
    default:
      return null;
  }
}

/** Attached lines derive their geometry from their nodes, never detach on nudge. */
export function nudgeObjects(objects: DiagramObject[], ids: string[], dx: number, dy: number) {
  if ((!dx && !dy) || !Number.isFinite(dx) || !Number.isFinite(dy)) return objects;
  const selected = new Set(ids);
  let changed = false;
  const next = objects.map((object) => {
    if (!selected.has(object.id) || (isLine(object) && (object.source || object.target))) {
      return object;
    }
    changed = true;
    return { ...object, x: object.x + dx, y: object.y + dy };
  });
  return changed ? next : objects;
}

/** Mixed emphasis becomes enabled; unsupported selections remain untouched. */
export function toggleLabelEmphasis(
  objects: DiagramObject[],
  ids: string[],
  property: LabelEmphasis,
) {
  const selected = new Set(ids);
  const chosen = objects.filter((object) => selected.has(object.id));
  if (!chosen.length || !chosen.every(canEditLabel)) return objects;
  const enabled = !chosen.every((object) => object.style[property]);
  return objects.map((object) =>
    selected.has(object.id)
      ? { ...object, style: { ...object.style, [property]: enabled } }
      : object,
  );
}
