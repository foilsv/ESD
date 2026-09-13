import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Box,
  ChevronDown,
  Circle,
  Cpu,
  FlaskConical,
  Focus,
  Grid2X2,
  Keyboard,
  Maximize2,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  RotateCcw,
  Search,
  Shapes,
  Square,
  Type,
  Undo2,
  Waypoints,
  X,
} from 'lucide-react';
import DiagramCanvas from './DiagramCanvas';
import FormattingToolbar from './FormattingToolbar';
import WhatsNew from './WhatsNew';
import KeyboardShortcuts from './KeyboardShortcuts';
import CommandPalette from './CommandPalette';
import type { PaletteCommand } from './commandPaletteModel';
import {
  isCommandPaletteShortcut,
  resolveCanvasShortcut,
  nudgeObjects,
  toggleLabelEmphasis,
} from './keyboard';
import type { FormattingToolbarHandle } from './FormattingToolbar';
import {
  bounds,
  connectionArrows,
  cycleConnectionArrows,
  canEditLabel,
  defaultStyle,
  isLine,
  kinds,
  union,
  type Detail,
  type DiagramObject,
  type ObjectKind,
  type PanelBehavior,
  type Point,
  type Style,
} from './model';
import { createScene, scenes, type Scene } from './fixtures';
import {
  applyManufacturerStyle,
  manufacturerStyles,
  type ManufacturerStyle,
} from './manufacturerStyles';
import { loadSnapshot, saveSnapshot, parseSnapshot, type Snapshot } from './storage';
import { behaviors, compatibleDetail, detailOnTextEntry, toolbarContext } from './toolbarModel';
import { currentRelease } from './releaseNotes';
import { zoomViewAt, type View } from './viewport';
import { deriveTextColor, visibleStrokeColor } from './strokeColor';
import type { ColorKey, StrokeChoicePatch } from './FormattingControls';

type Tool = 'select' | 'connect';
type DiagramState = { objects: DiagramObject[]; manufacturer: ManufacturerStyle };
type History = { past: DiagramState[]; present: DiagramState; future: DiagramState[] };
type Drag = {
  point: Point;
  before: DiagramState;
  ids: string[];
  kind: 'move' | 'pan' | 'resize';
  view: View;
  moved: boolean;
};
export default function App() {
  const [showWhatsNew, setShowWhatsNew] = useState(() => window.location.hash === '#whats-new');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [initial] = useState(loadSnapshot);
  const [scene, setScene] = useState<Scene>(initial?.scene ?? 'system');
  const [history, setHistory] = useState<History>({
    past: [],
    present: {
      objects: initial?.objects ?? createScene('system'),
      manufacturer: initial?.manufacturer ?? 'default',
    },
    future: [],
  });
  const { objects, manufacturer } = history.present;
  const [selected, setSelected] = useState<string[]>(
    objects.some((o) => o.id === 'mcu') ? ['mcu'] : [],
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [detail, setDetail] = useState<Detail>(null);
  const [behavior, setBehavior] = useState<PanelBehavior>(initial?.behavior ?? 'flat');
  const [sticky, setSticky] = useState(initial?.sticky ?? true);
  const [showPopoverHeaders, setShowPopoverHeaders] = useState(initial?.showPopoverHeaders ?? true);
  const [mergeStrokeControls, setMergeStrokeControls] = useState(
    initial?.mergeStrokeControls ?? true,
  );
  const [matchTextColorToFill, setMatchTextColorToFill] = useState(
    initial?.matchTextColorToFill ?? true,
  );
  const [groupedTextToolbar, setGroupedTextToolbar] = useState(initial?.groupedTextToolbar ?? true);
  const [compactTextAlignment, setCompactTextAlignment] = useState(
    initial?.compactTextAlignment ?? true,
  );
  const [fontSizeStepper, setFontSizeStepper] = useState(initial?.fontSizeStepper ?? false);
  const [showMoreActions, setShowMoreActions] = useState(initial?.showMoreActions ?? false);
  const [showShortcutHints, setShowShortcutHints] = useState(initial?.showShortcutHints ?? false);
  const [styleClipboard, setStyleClipboard] = useState<Style | null>(null);
  const [styleDefaults, setStyleDefaults] = useState<Partial<Record<ObjectKind, Style>>>({});
  const [labOpen, setLabOpen] = useState(() => window.innerWidth > 900);
  const [grid, setGrid] = useState(false);
  const [tool, setTool] = useState<Tool>('select');
  const [panning, setPanning] = useState(false);
  const [pointerActive, setPointerActive] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const spaceDown = useRef(false);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const drag = useRef<Drag | null>(null);
  const formattingToolbar = useRef<FormattingToolbarHandle>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ x: 30, y: 25, zoom: 0.9 });
  const chosen = objects.filter((o) => selected.includes(o.id));
  const selectedBounds = union(chosen.map((o) => bounds(o, objects)));
  const commit = useCallback(
    (objects: DiagramObject[], manufacturer?: ManufacturerStyle) =>
      setHistory((h) => {
        const next = { objects, manufacturer: manufacturer ?? h.present.manufacturer };
        return JSON.stringify(h.present) === JSON.stringify(next)
          ? h
          : { past: [...h.past.slice(-49), h.present], present: next, future: [] };
      }),
    [],
  );
  const announce = (message: string) => setNotice(message);
  const fit = useCallback(
    (items: DiagramObject[] = objects, geometryItems: DiagramObject[] = items) => {
      if (!items.length) return;
      const box = union(items.map((o) => bounds(o, geometryItems)));
      const available = {
        w: viewport.w - (labOpen && viewport.w > 900 ? 330 : 125),
        h: viewport.h - 125,
      };
      const zoom = Math.max(
        0.3,
        Math.min(1.15, available.w / Math.max(box.w, 200), available.h / Math.max(box.h, 200)),
      );
      setView({
        x: 90 + (available.w - box.w * zoom) / 2 - box.x * zoom,
        y: 55 + (available.h - box.h * zoom) / 2 - box.y * zoom,
        zoom,
      });
    },
    [objects, viewport, labOpen],
  );
  useLayoutEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setViewport({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && viewport.w > 0) {
      fit();
      fitted.current = true;
    }
  }, [viewport, fit]);
  useEffect(() => {
    const timeout = window.setTimeout(
      () =>
        setSaved(
          saveSnapshot({
            version: 2,
            objects,
            scene,
            behavior,
            sticky,
            showPopoverHeaders,
            mergeStrokeControls,
            matchTextColorToFill,
            groupedTextToolbar,
            compactTextAlignment,
            fontSizeStepper,
            showMoreActions,
            showShortcutHints,
            manufacturer,
          }),
        ),
      300,
    );
    return () => clearTimeout(timeout);
  }, [
    objects,
    scene,
    behavior,
    sticky,
    showPopoverHeaders,
    mergeStrokeControls,
    matchTextColorToFill,
    groupedTextToolbar,
    compactTextAlignment,
    fontSizeStepper,
    showMoreActions,
    showShortcutHints,
    manufacturer,
  ]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timeout);
  }, [notice]);

  function finishEdit(cancel = false) {
    if (editing && !cancel)
      commit(objects.map((o) => (o.id === editing ? { ...o, label: draft } : o)));
    setEditing(null);
    setDetail(null);
    focusCanvas();
  }
  function focusCanvas() {
    requestAnimationFrame(() => {
      const input = stage.current?.querySelector<HTMLInputElement>('[data-label-entry="true"]');
      if (input) {
        input.focus({ preventScroll: true });
        input.select();
      } else {
        stage.current
          ?.querySelector<SVGSVGElement>('.diagram-canvas')
          ?.focus({ preventScroll: true });
      }
    });
  }
  function select(id: string, shift: boolean) {
    if (editing) finishEdit();
    const nextIds = shift
      ? selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
      : [id];
    const next = objects.filter((o) => nextIds.includes(o.id));
    setDetail(
      toolbarContext(next).textOnly
        ? detailOnTextEntry(behavior)
        : compatibleDetail(detail, next, behavior, sticky, compactTextAlignment),
    );
    setSelected(nextIds);
  }
  function edit(id: string, replacement?: string) {
    const object = objects.find((o) => o.id === id);
    if (!object || !canEditLabel(object)) return;
    setSelected([id]);
    setEditing(id);
    setDraft(replacement ?? object.label);
    setDetail(detailOnTextEntry(behavior));
    setTool('select');
  }
  function patch(patch: Partial<Style>) {
    commit(
      objects.map((o) => (selected.includes(o.id) ? { ...o, style: { ...o.style, ...patch } } : o)),
    );
  }
  function patchColor(key: ColorKey, value: string) {
    if (key !== 'fill' || !matchTextColorToFill) {
      patch({ [key]: value });
      return;
    }
    const textColor = deriveTextColor(value);
    commit(
      objects.map((object) =>
        selected.includes(object.id)
          ? {
              ...object,
              style: {
                ...object.style,
                fill: value,
                textColor,
              },
            }
          : object,
      ),
    );
  }
  function patchStroke(patch: StrokeChoicePatch) {
    commit(
      objects.map((object) =>
        selected.includes(object.id)
          ? {
              ...object,
              style: {
                ...object.style,
                ...patch,
                stroke: visibleStrokeColor(
                  object.style.stroke,
                  isLine(object) ? 'transparent' : object.style.fill,
                ),
              },
            }
          : object,
      ),
    );
  }
  function patchObjects(patch: Partial<DiagramObject>) {
    commit(objects.map((o) => (selected.includes(o.id) ? { ...o, ...patch } : o)));
  }
  function emphasize(property: 'bold' | 'italic' | 'underline') {
    commit(toggleLabelEmphasis(objects, selected, property));
  }
  function copyStyle() {
    if (
      !chosen.length ||
      !chosen.every((o) => JSON.stringify(o.style) === JSON.stringify(chosen[0].style))
    ) {
      announce('Select objects with matching formatting to copy a style.');
      return;
    }
    setStyleClipboard({ ...chosen[0].style });
    announce('Style copied. Select another object and paste style.');
  }
  function pasteStyle() {
    if (!styleClipboard || !chosen.length) return;
    patch(styleClipboard);
    announce('Style applied to the selection.');
  }
  function changeManufacturer(next: ManufacturerStyle) {
    const current = editing
      ? objects.map((o) => (o.id === editing ? { ...o, label: draft } : o))
      : objects;
    commit(applyManufacturerStyle(current, next), next);
    setEditing(null);
    setDetail(null);
    announce(
      next === 'default'
        ? 'Original diagram colors restored.'
        : manufacturerStyles[next].label + ' colors applied to the diagram.',
    );
  }
  function changeScene(next: Scene) {
    const items = applyManufacturerStyle(createScene(next), manufacturer);
    commit(items);
    setScene(next);
    setSelected(items.some((o) => o.id === 'mcu') ? ['mcu'] : ['block']);
    setEditing(null);
    setDetail(null);
    setConnectSource(null);
    setTool('select');
    fit(items);
  }
  function add(kind: ObjectKind) {
    if (editing) finishEdit();
    const id = `${kind}-${crypto.randomUUID()}`;
    const object: DiagramObject = {
      id,
      kind,
      label: kind === 'text' ? 'New annotation' : kinds[kind],
      x: (viewport.w * 0.43 - view.x) / view.zoom,
      y: (viewport.h * 0.45 - view.y) / view.zoom,
      w: kind === 'port' ? 80 : kind === 'symbol' ? 64 : 185,
      h:
        kind === 'port'
          ? 36
          : kind === 'symbol'
            ? 64
            : kind === 'line'
              ? 0
              : kind === 'text'
                ? 48
                : 100,
      style: styleDefaults[kind]
        ? { ...styleDefaults[kind] }
        : { ...defaultStyle, fontSize: kind === 'text' ? 24 : 16 },
    };
    const existing = editing
      ? objects.map((o) => (o.id === editing ? { ...o, label: draft } : o))
      : objects;
    commit([...existing, ...applyManufacturerStyle([object], manufacturer)]);
    setSelected([id]);
    setDetail(kind === 'text' ? detailOnTextEntry(behavior) : null);
    setTool('select');
    focusCanvas();
  }
  function startObject(event: ReactPointerEvent, object: DiagramObject, resize = false) {
    if ((event.target as Element).closest('input')) return;
    if (event.button === 1 || event.button === 2 || (event.button === 0 && spaceDown.current)) {
      event.preventDefault();
      event.stopPropagation();
      startPan(event);
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    focusCanvas();
    if (tool === 'connect' && !isLine(object)) {
      if (!connectSource) {
        setConnectSource(object.id);
        setSelected([object.id]);
        announce('Now select the destination block.');
        return;
      }
      if (connectSource === object.id) return;
      const line: DiagramObject = {
        id: `connection-${crypto.randomUUID()}`,
        kind: 'connection',
        label: 'Signal',
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        source: connectSource,
        target: object.id,
        directional: true,
        reversed: false,
        style: styleDefaults.connection
          ? { ...styleDefaults.connection }
          : { ...defaultStyle, stroke: '#2563eb', width: 2, fontSize: 13 },
      };
      commit([...objects, ...applyManufacturerStyle([line], manufacturer)]);
      setSelected([line.id]);
      setConnectSource(null);
      setTool('select');
      return;
    }
    if (editing === object.id) return;
    const ids = event.shiftKey
      ? selected.includes(object.id)
        ? selected.filter((id) => id !== object.id)
        : [...selected, object.id]
      : selected.includes(object.id)
        ? selected
        : [object.id];
    if (event.shiftKey || !selected.includes(object.id)) select(object.id, event.shiftKey);
    if (!event.shiftKey && (!isLine(object) || !object.source)) {
      setPointerActive(true);
      const before = editing
        ? objects.map((o) => (o.id === editing ? { ...o, label: draft } : o))
        : objects;
      drag.current = {
        point: { x: event.clientX, y: event.clientY },
        before: { objects: before, manufacturer },
        ids,
        kind: resize ? 'resize' : 'move',
        view,
        moved: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }
  function startPan(event: ReactPointerEvent) {
    setPointerActive(true);
    setPanning(true);
    drag.current = {
      point: { x: event.clientX, y: event.clientY },
      before: history.present,
      ids: [],
      kind: 'pan',
      view,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function startCanvas(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button === 1 || event.button === 2 || (event.button === 0 && spaceDown.current)) {
      event.preventDefault();
      startPan(event);
      return;
    }
    if (event.button !== 0) return;
    event.preventDefault();
    finishEdit();
    setSelected([]);
    setConnectSource(null);
  }
  function move(point: Point) {
    const current = drag.current;
    if (!current) return;
    const dx = point.x - current.point.x,
      dy = point.y - current.point.y;
    if (Math.abs(dx) + Math.abs(dy) < 3 && !current.moved) return;
    current.moved = true;
    if (current.kind === 'pan') {
      setView({ ...current.view, x: current.view.x + dx, y: current.view.y + dy });
      return;
    }
    const next = current.before.objects.map((o) =>
      current.ids.includes(o.id)
        ? current.kind === 'resize'
          ? { ...o, w: Math.max(50, o.w + dx / view.zoom), h: Math.max(30, o.h + dy / view.zoom) }
          : { ...o, x: o.x + dx / view.zoom, y: o.y + dy / view.zoom }
        : o,
    );
    setHistory((h) => ({ ...h, present: { ...h.present, objects: next } }));
  }
  function end() {
    const current = drag.current;
    drag.current = null;
    setPointerActive(false);
    setPanning(false);
    if (current?.moved && current.kind !== 'pan')
      setHistory((h) => ({ ...h, past: [...h.past.slice(-49), current.before], future: [] }));
  }
  function undo() {
    setEditing(null);
    setDetail(null);
    setHistory((h) =>
      h.past.length
        ? { past: h.past.slice(0, -1), present: h.past.at(-1)!, future: [h.present, ...h.future] }
        : h,
    );
  }
  function redo() {
    setEditing(null);
    setDetail(null);
    setHistory((h) =>
      h.future.length
        ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) }
        : h,
    );
  }
  function deleteSelection() {
    if (!selected.length) return;
    setEditing(null);
    commit(
      objects.filter(
        (object) =>
          !selected.includes(object.id) &&
          !selected.includes(object.source ?? '') &&
          !selected.includes(object.target ?? ''),
      ),
    );
    setSelected([]);
    setDetail(null);
    focusCanvas();
  }
  function selectAllObjects() {
    if (editing) {
      commit(objects.map((object) => (object.id === editing ? { ...object, label: draft } : object)));
      setEditing(null);
    }
    setSelected(objects.map((object) => object.id));
    setDetail(null);
    focusCanvas();
  }
  function zoomBy(factor: number) {
    setView((v) => zoomViewAt(v, factor, { x: viewport.w / 2, y: viewport.h / 2 }));
  }
  function zoomWheel(event: ReactWheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const rect = stage.current?.getBoundingClientRect();
    if (!rect) return;
    const delta =
      event.deltaY *
      (event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? rect.height
          : 1);
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    setView((v) => zoomViewAt(v, Math.exp(-delta * 0.001), point));
  }
  useEffect(() => {
    const syncPage = () => setShowWhatsNew(window.location.hash === '#whats-new');
    window.addEventListener('popstate', syncPage);
    window.addEventListener('hashchange', syncPage);
    return () => {
      window.removeEventListener('popstate', syncPage);
      window.removeEventListener('hashchange', syncPage);
    };
  }, []);
  function openWhatsNew() {
    if (window.location.hash !== '#whats-new') {
      window.history.pushState({ ...window.history.state, esdPage: 'whats-new' }, '', '#whats-new');
    }
    setShowWhatsNew(true);
  }
  function closeWhatsNew() {
    if (window.history.state?.esdPage === 'whats-new') {
      window.history.back();
      return;
    }
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
    setShowWhatsNew(false);
  }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (!showShortcuts && !showWhatsNew && isCommandPaletteShortcut(event)) {
        event.preventDefault();
        setShowCommandPalette(true);
        return;
      }
      if (showShortcuts || showCommandPalette) return;
      if (showWhatsNew) {
        if (event.key === 'Escape') closeWhatsNew();
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest('.diagram-canvas')) return;
      const labelInput = target.closest('[data-label-entry="true"]');
      const activeEditor = target.closest('[data-label-editing="true"]');
      if (
        target.closest('input, textarea, select, [contenteditable], button') &&
        !labelInput &&
        !activeEditor
      )
        return;
      const action = resolveCanvasShortcut(event, {
        selectedCount: chosen.length,
        editableSelection: chosen.length === 1 && canEditLabel(chosen[0]),
        allLabelsEditable: chosen.length > 0 && chosen.every(canEditLabel),
        toolIdle: tool === 'select' && !drag.current,
      });
      if (!action) return;
      if (activeEditor && !['escape', 'copy-style', 'paste-style'].includes(action.type)) return;
      if (action.type === 'replace-label' || action.type === 'compose-label') {
        // The selected label's native input receives text and composition unchanged.
        // onInput then reveals that same input, preserving the first character and undo.
        const input = stage.current?.querySelector<HTMLInputElement>('[data-label-entry="true"]');
        if (input && document.activeElement !== input) {
          input.focus({ preventScroll: true });
          input.select();
        }
        return;
      }
      event.preventDefault();
      switch (action.type) {
        case 'escape':
          escapeCanvas();
          break;
        case 'edit-label':
          edit(chosen[0].id);
          break;
        case 'delete':
          deleteSelection();
          break;
        case 'undo':
          undo();
          break;
        case 'redo':
          redo();
          break;
        case 'select-all':
          selectAllObjects();
          break;
        case 'copy-style':
          copyStyle();
          break;
        case 'paste-style':
          pasteStyle();
          break;
        case 'emphasis':
          emphasize(action.property);
          break;
        case 'nudge':
          commit(nudgeObjects(objects, selected, action.dx, action.dy));
          break;
        case 'zoom':
          zoomBy(
            action.direction === 'reset'
              ? 1 / view.zoom
              : action.direction === 'in'
                ? 1.15
                : 1 / 1.15,
          );
          break;
        case 'fit':
          fit(action.target === 'selection' ? chosen : objects, objects);
          break;
        case 'pan-start':
          spaceDown.current = true;
          setSpaceHeld(true);
          break;
        case 'tool':
          if (action.tool === 'select' || action.tool === 'connect') {
            setTool(action.tool);
            setConnectSource(null);
          } else add(action.tool);
          break;
      }
    };
    const releaseSpace = (event?: Event) => {
      if (event instanceof KeyboardEvent && event.code !== 'Space' && event.key !== ' ') return;
      spaceDown.current = false;
      setSpaceHeld(false);
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', releaseSpace);
    window.addEventListener('blur', releaseSpace);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keyup', releaseSpace);
      window.removeEventListener('blur', releaseSpace);
    };
  });
  function escapeCanvas() {
    if (formattingToolbar.current?.dismiss()) return;
    if (editing) finishEdit(true);
    else if (tool !== 'select' || drag.current) {
      const before = drag.current?.before;
      if (before && drag.current?.moved && drag.current.kind !== 'pan')
        setHistory((h) => ({ ...h, present: before }));
      drag.current = null;
      setPointerActive(false);
      setPanning(false);
      setTool('select');
      setConnectSource(null);
      focusCanvas();
    } else {
      setSelected([]);
      setDetail(null);
      focusCanvas();
    }
  }
  function exportSnapshot() {
    const snapshot: Snapshot = {
      version: 2,
      objects: editing
        ? objects.map((o) => (o.id === editing ? { ...o, label: draft } : o))
        : objects,
      scene,
      behavior,
      sticky,
      showPopoverHeaders,
      mergeStrokeControls,
      matchTextColorToFill,
      groupedTextToolbar,
      compactTextAlignment,
      fontSizeStepper,
      showMoreActions,
      showShortcutHints,
      manufacturer,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'esd-experiment.json';
    link.click();
    URL.revokeObjectURL(url);
    announce('Experiment saved as JSON.');
  }
  async function importSnapshot(file?: File) {
    if (!file) return;
    if (file.size > 1_000_000) {
      announce('Choose an ESD experiment smaller than 1 MB.');
      return;
    }
    try {
      const snapshot = parseSnapshot(JSON.parse(await file.text()));
      if (!snapshot) throw new Error('Invalid file');
      commit(snapshot.objects, snapshot.manufacturer ?? 'default');
      setScene(snapshot.scene);
      setBehavior(snapshot.behavior);
      setSticky(snapshot.sticky);
      setShowPopoverHeaders(snapshot.showPopoverHeaders ?? true);
      setMergeStrokeControls(snapshot.mergeStrokeControls ?? true);
      setMatchTextColorToFill(snapshot.matchTextColorToFill ?? true);
      setGroupedTextToolbar(snapshot.groupedTextToolbar ?? true);
      setCompactTextAlignment(snapshot.compactTextAlignment ?? true);
      setFontSizeStepper(snapshot.fontSizeStepper ?? false);
      setShowMoreActions(snapshot.showMoreActions ?? false);
      setShowShortcutHints(snapshot.showShortcutHints ?? false);
      setSelected([]);
      setEditing(null);
      setDetail(null);
      fit(snapshot.objects);
      announce('Experiment restored.');
    } catch {
      announce('Could not open this file. Choose a JSON experiment exported from this lab.');
    }
  }
  const panelViewport = {
    x: 78,
    y: 14,
    w: Math.max(220, viewport.w - 95 - (labOpen && viewport.w > 900 ? 280 : 0)),
    h: viewport.h - 85,
  };
  const selectionScreen = {
    x: selectedBounds.x * view.zoom + view.x,
    y: selectedBounds.y * view.zoom + view.y,
    w: selectedBounds.w * view.zoom,
    h: selectedBounds.h * view.zoom,
  };
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? 'Cmd' : 'Ctrl';
  const alt = isMac ? 'Option' : 'Alt';
  const canCopyStyle =
    chosen.length > 0 &&
    chosen.every((object) => JSON.stringify(object.style) === JSON.stringify(chosen[0].style));
  const canFormatLabels = chosen.length > 0 && chosen.every(canEditLabel);
  const paletteCommands: PaletteCommand[] = [
    {
      id: 'select-tool',
      label: 'Select tool',
      group: 'Tools',
      shortcut: 'V',
      keywords: ['pointer'],
      run: () => {
        if (editing) finishEdit();
        setTool('select');
        setConnectSource(null);
        focusCanvas();
      },
    },
    {
      id: 'add-block',
      label: 'Add functional block',
      group: 'Tools',
      shortcut: 'B',
      run: () => add('block'),
    },
    {
      id: 'add-text',
      label: 'Add text',
      group: 'Tools',
      shortcut: 'T',
      run: () => add('text'),
    },
    {
      id: 'connect',
      label: 'Connect two objects',
      group: 'Tools',
      shortcut: 'L',
      keywords: ['line', 'connection'],
      run: () => {
        if (editing) finishEdit();
        setTool('connect');
        setConnectSource(null);
        announce('Select a source, then a destination.');
        focusCanvas();
      },
    },
    {
      id: 'add-rectangle',
      label: 'Add rectangle',
      group: 'Tools',
      shortcut: 'R',
      keywords: ['shape'],
      run: () => add('rectangle'),
    },
    {
      id: 'add-ellipse',
      label: 'Add ellipse',
      group: 'Tools',
      shortcut: 'O',
      keywords: ['circle', 'shape'],
      run: () => add('ellipse'),
    },
    {
      id: 'undo',
      label: 'Undo',
      group: 'Edit',
      shortcut: `${mod}+Z`,
      disabled: !history.past.length,
      run: undo,
    },
    {
      id: 'redo',
      label: 'Redo',
      group: 'Edit',
      shortcut: `${mod}+Shift+Z`,
      disabled: !history.future.length,
      run: redo,
    },
    {
      id: 'select-all',
      label: 'Select all objects',
      group: 'Edit',
      shortcut: `${mod}+A`,
      run: selectAllObjects,
    },
    {
      id: 'delete-selection',
      label: 'Delete selection',
      group: 'Edit',
      shortcut: 'Backspace',
      disabled: !selected.length,
      run: deleteSelection,
    },
    {
      id: 'bold',
      label: 'Toggle bold',
      group: 'Format',
      shortcut: `${mod}+B`,
      disabled: !canFormatLabels,
      run: () => emphasize('bold'),
    },
    {
      id: 'italic',
      label: 'Toggle italic',
      group: 'Format',
      shortcut: `${mod}+I`,
      disabled: !canFormatLabels,
      run: () => emphasize('italic'),
    },
    {
      id: 'underline',
      label: 'Toggle underline',
      group: 'Format',
      shortcut: `${mod}+U`,
      disabled: !canFormatLabels,
      run: () => emphasize('underline'),
    },
    {
      id: 'copy-style',
      label: 'Copy style',
      group: 'Format',
      shortcut: `${mod}+${alt}+C`,
      disabled: !canCopyStyle,
      run: copyStyle,
    },
    {
      id: 'paste-style',
      label: 'Paste style',
      group: 'Format',
      shortcut: `${mod}+${alt}+V`,
      disabled: !styleClipboard || !chosen.length,
      run: pasteStyle,
    },
    {
      id: 'zoom-in',
      label: 'Zoom in',
      group: 'View',
      shortcut: `${mod}+=`,
      run: () => zoomBy(1.15),
    },
    {
      id: 'zoom-out',
      label: 'Zoom out',
      group: 'View',
      shortcut: `${mod}+-`,
      run: () => zoomBy(1 / 1.15),
    },
    {
      id: 'actual-size',
      label: 'Reset zoom to 100%',
      group: 'View',
      shortcut: `${mod}+0`,
      keywords: ['actual size'],
      run: () => zoomBy(1 / view.zoom),
    },
    {
      id: 'fit-diagram',
      label: 'Fit diagram',
      group: 'View',
      shortcut: `${alt}+1`,
      run: () => fit(),
    },
    {
      id: 'fit-selection',
      label: 'Fit selection',
      group: 'View',
      shortcut: `${alt}+2`,
      disabled: !chosen.length,
      run: () => fit(chosen, objects),
    },
    {
      id: 'toggle-grid',
      label: grid ? 'Hide grid' : 'Show grid',
      group: 'View',
      keywords: ['toggle grid'],
      run: () => setGrid((current) => !current),
    },
    {
      id: 'toggle-shortcut-hints',
      label: showShortcutHints ? 'Hide toolbar shortcut hints' : 'Show toolbar shortcut hints',
      group: 'View',
      keywords: ['keys', 'badges'],
      run: () => setShowShortcutHints((current) => !current),
    },
    {
      id: 'toggle-lab',
      label: labOpen ? 'Close Interaction lab' : 'Open Interaction lab',
      group: 'App',
      keywords: ['experiment panel'],
      run: () => setLabOpen((current) => !current),
    },
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard shortcuts',
      group: 'App',
      keywords: ['help', 'keys'],
      run: () => setShowShortcuts(true),
    },
    {
      id: 'whats-new',
      label: "What's new",
      group: 'App',
      keywords: ['release notes', 'version'],
      run: openWhatsNew,
    },
    {
      id: 'open-experiment',
      label: 'Open experiment',
      group: 'App',
      keywords: ['load', 'import', 'json'],
      run: () => fileInput.current?.click(),
    },
    {
      id: 'save-experiment',
      label: 'Save experiment',
      group: 'App',
      keywords: ['export', 'json'],
      run: exportSnapshot,
    },
  ];
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark">
          <Waypoints size={22} />
        </div>
        <strong>ESD</strong>
        <span className="header-divider" />
        <span className="document-name">Formatting lab</span>
        <span className="prototype-tag">PROTOTYPE</span>
        <button
          className={`version-button ${showWhatsNew ? 'active' : ''}`}
          aria-label={
            showWhatsNew
              ? `Version ${currentRelease.version}. Back to lab`
              : `Version ${currentRelease.version}. View what's new`
          }
          aria-current={showWhatsNew ? 'page' : undefined}
          onClick={showWhatsNew ? closeWhatsNew : openWhatsNew}
        >
          <span>v{currentRelease.version}</span>
          <span className="version-link-label">What&apos;s new</span>
        </button>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label="Command palette"
            title={`Command palette · ${mod}+/`}
            onClick={() => setShowCommandPalette(true)}
          >
            <Search size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts"
            onClick={() => setShowShortcuts(true)}
          >
            <Keyboard size={18} />
          </button>
          <span className="save-status">
            {saved ? 'Saved in this browser' : 'Browser storage unavailable'}
          </span>
          <button
            className="icon-button"
            aria-label="Undo"
            title={`Undo · ${mod}+Z`}
            disabled={!history.past.length}
            onClick={undo}
          >
            <Undo2 size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Redo"
            title={`Redo · ${mod}+Shift+Z`}
            disabled={!history.future.length}
            onClick={redo}
          >
            <Redo2 size={18} />
          </button>
          <span className="header-divider" />
          <button
            className="plain-button import-button"
            onClick={() => fileInput.current?.click()}
            title="Load experiment JSON"
          >
            <ArrowUpFromLine size={16} />
            <span>Open</span>
          </button>
          <button
            className="plain-button"
            aria-label="Save experiment"
            title="Save experiment JSON"
            onClick={exportSnapshot}
          >
            <ArrowDownToLine size={16} />
            <span>Save experiment</span>
          </button>
          <button
            className={`lab-toggle ${labOpen ? 'active' : ''}`}
            aria-label="Toggle experiment panel"
            aria-expanded={labOpen}
            onClick={() => setLabOpen(!labOpen)}
          >
            <FlaskConical size={17} />
            <span>Experiment</span>
          </button>
        </div>
        <input
          ref={fileInput}
          className="visually-hidden"
          type="file"
          accept=".json"
          aria-label="Open experiment JSON"
          onChange={(e) => {
            void importSnapshot(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </header>
      {showWhatsNew && <WhatsNew onBack={closeWhatsNew} />}
      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
      {showCommandPalette && (
        <CommandPalette commands={paletteCommands} onClose={() => setShowCommandPalette(false)} />
      )}
      <main ref={stage} className="stage" hidden={showWhatsNew}>
        <DiagramCanvas
          objects={objects}
          selected={selected}
          editing={editing}
          setDraft={setDraft}
          startTyping={edit}
          emphasize={emphasize}
          textEntryEnabled={tool === 'select' && !pointerActive && !spaceHeld}
          view={view}
          grid={grid}
          panning={panning || spaceHeld}
          select={select}
          edit={edit}
          finishEdit={finishEdit}
          startObject={startObject}
          startCanvas={startCanvas}
          zoomWheel={zoomWheel}
          move={move}
          end={end}
        />
        <div className="scene-caption">
          {scenes[scene]}
          <span> / </span>
          <span>Sandbox</span>
        </div>
        <nav className="creation-tools floating-card" aria-label="Canvas tools">
          <button
            className={`tool-button ${tool === 'select' ? 'active' : ''}`}
            title="Select · V"
            aria-label="Select tool"
            onClick={() => {
              setTool('select');
              setConnectSource(null);
              focusCanvas();
            }}
          >
            <MousePointer2 size={20} />
            {showShortcutHints && (
              <span className="tool-shortcut" aria-hidden="true">
                V
              </span>
            )}
          </button>
          <button
            className="tool-button"
            title="Add functional block · B"
            aria-label="Add functional block"
            onClick={() => add('block')}
          >
            <Box size={20} />
            {showShortcutHints && (
              <span className="tool-shortcut" aria-hidden="true">
                B
              </span>
            )}
          </button>
          <button
            className={`tool-button ${tool === 'connect' ? 'active' : ''}`}
            title="Connect two objects · L (nothing selected)"
            aria-label="Connect objects"
            onClick={() => {
              setTool('connect');
              setConnectSource(null);
              finishEdit();
              announce('Select a source, then a destination.');
            }}
          >
            <Waypoints size={20} />
            {showShortcutHints && (
              <span className="tool-shortcut" aria-hidden="true">
                L
              </span>
            )}
          </button>
          <button
            className="tool-button"
            title="Add hardware component"
            aria-label="Add hardware component"
            onClick={() => add('hardware')}
          >
            <Cpu size={20} />
          </button>
          <span className="horizontal-divider" />
          <button
            className="tool-button"
            title="Add text · T"
            aria-label="Add text"
            onClick={() => add('text')}
          >
            <Type size={20} />
            {showShortcutHints && (
              <span className="tool-shortcut" aria-hidden="true">
                T
              </span>
            )}
          </button>
          <button
            className="tool-button"
            title="Add rectangle · R (nothing selected)"
            aria-label="Add rectangle"
            onClick={() => add('rectangle')}
          >
            <Square size={20} />
            {showShortcutHints && (
              <span className="tool-shortcut" aria-hidden="true">
                R
              </span>
            )}
          </button>
          <button
            className="tool-button"
            title="Add ellipse · O (nothing selected)"
            aria-label="Add ellipse"
            onClick={() => add('ellipse')}
          >
            <Circle size={20} />
            {showShortcutHints && (
              <span className="tool-shortcut" aria-hidden="true">
                O
              </span>
            )}
          </button>
        </nav>
        {chosen.length > 0 && (
          <FormattingToolbar
            ref={formattingToolbar}
            onEscape={escapeCanvas}
            key={chosen.map((o) => o.id).join(',')}
            objects={chosen}
            editing={Boolean(editing)}
            behavior={behavior}
            showPopoverHeaders={showPopoverHeaders}
            mergeStrokeControls={mergeStrokeControls}
            groupedTextToolbar={groupedTextToolbar}
            compactTextAlignment={compactTextAlignment}
            fontSizeStepper={fontSizeStepper}
            showMoreActions={showMoreActions}
            detail={detail}
            setDetail={setDetail}
            patch={patch}
            patchColor={patchColor}
            patchStroke={patchStroke}
            patchObjects={patchObjects}
            cycleArrows={() => {
              const next = cycleConnectionArrows(objects, selected);
              commit(next);
              const connection = next.find(
                (o) => selected.includes(o.id) && o.kind === 'connection',
              );
              if (connection) announce(`Connection arrows: ${connectionArrows(connection)}.`);
            }}
            selection={selectionScreen}
            viewport={panelViewport}
            finishEditing={() => finishEdit()}
            setDefaultStyle={() => {
              const first = chosen[0];
              if (!first || !chosen.every((object) => object.kind === first.kind)) return;
              setStyleDefaults((current) => ({ ...current, [first.kind]: { ...first.style } }));
              announce(`Default ${kinds[first.kind].toLowerCase()} style set for this session.`);
            }}
            copyStyle={copyStyle}
            pasteStyle={pasteStyle}
            canPasteStyle={Boolean(styleClipboard)}
          />
        )}
        {labOpen && (
          <aside className="experiment-panel floating-card" aria-label="Experiment settings">
            <div className="experiment-title">
              <div>
                <FlaskConical size={16} />
                <strong>Interaction lab</strong>
              </div>
              <button
                className="icon-button small"
                aria-label="Close experiment panel"
                onClick={() => setLabOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="experiment-section">
              <div className="eyebrow">TEST SCENE</div>
              <div className="scene-switcher" role="group" aria-label="Test scene">
                {(
                  [
                    ['system', Cpu],
                    ['dense', Grid2X2],
                    ['edge', Maximize2],
                    ['objects', Shapes],
                  ] as const
                ).map(([id, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    className={scene === id ? 'active' : ''}
                    aria-label={scenes[id]}
                    aria-pressed={scene === id}
                    title={scenes[id]}
                    onClick={() => changeScene(id)}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                  </button>
                ))}
              </div>
            </div>
            <div className="experiment-section">
              <label className="eyebrow" htmlFor="manufacturer-style">
                MANUFACTURER STYLE
              </label>
              <div className="select-wrap">
                <select
                  id="manufacturer-style"
                  value={manufacturer}
                  onChange={(e) => changeManufacturer(e.target.value as ManufacturerStyle)}
                >
                  {Object.entries(manufacturerStyles).map(([id, palette]) => (
                    <option key={id} value={id}>
                      {palette.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="manufacturer-swatches" aria-hidden="true">
                {[
                  ...new Set([
                    manufacturerStyles[manufacturer].primary,
                    manufacturerStyles[manufacturer].control,
                    manufacturerStyles[manufacturer].sensor,
                    manufacturerStyles[manufacturer].surface,
                    manufacturerStyles[manufacturer].connection,
                  ]),
                ].map((color) => (
                  <i key={color} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="experiment-section">
              <div className="eyebrow">PANEL BEHAVIOR</div>
              <div className="behavior-options" role="group" aria-label="Panel behavior">
                {behaviors.map((b, i) => (
                  <button
                    key={b.id}
                    className={behavior === b.id ? 'active' : ''}
                    aria-pressed={behavior === b.id}
                    title={b.title}
                    onClick={() => {
                      setBehavior(b.id);
                      setDetail(
                        editing || toolbarContext(chosen).textOnly ? detailOnTextEntry(b.id) : null,
                      );
                    }}
                  >
                    <span className={`mini-layout mini-${b.id}`}>
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>
                      {i + 1}. {b.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="behavior-description">
                {behaviors.find((b) => b.id === behavior)?.description}
              </p>
              <label className="switch-row">
                <span>
                  Merge stroke color and style
                  <span className="field-note">Flat and Inline</span>
                </span>
                <input
                  type="checkbox"
                  aria-label="Merge stroke color and style"
                  checked={mergeStrokeControls}
                  onChange={(e) => {
                    setMergeStrokeControls(e.target.checked);
                    if (detail === 'stroke') setDetail(null);
                  }}
                />
                <span className="switch" />
              </label>
              <label className="switch-row">
                <span>
                  Match text color to fill
                  <span className="field-note">When Fill changes</span>
                </span>
                <input
                  type="checkbox"
                  aria-label="Match text color to fill"
                  checked={matchTextColorToFill}
                  onChange={(event) => setMatchTextColorToFill(event.target.checked)}
                />
                <span className="switch" />
              </label>
              <label className="switch-row">
                <span>
                  Use compact text alignment
                  <span className="field-note">Flat, Grouped text row, Inline</span>
                </span>
                <input
                  type="checkbox"
                  aria-label="Use compact text alignment"
                  checked={compactTextAlignment}
                  onChange={(event) => setCompactTextAlignment(event.target.checked)}
                />
                <span className="switch" />
              </label>
              <label className="switch-row">
                <span>
                  Use one-line text toolbar
                  <span className="field-note">Grouped editing and text objects</span>
                </span>
                <input
                  type="checkbox"
                  aria-label="Use one-line text toolbar for Grouped editing and text objects"
                  checked={groupedTextToolbar}
                  onChange={(e) => {
                    setGroupedTextToolbar(e.target.checked);
                    if (
                      !e.target.checked &&
                      behavior === 'grouped' &&
                      (editing || toolbarContext(chosen).textOnly)
                    )
                      setDetail('text');
                  }}
                />
                <span className="switch" />
              </label>
              <label className="switch-row">
                <span>
                  Use font size stepper
                  <span className="field-note">Flat, Grouped text row, Inline</span>
                </span>
                <input
                  type="checkbox"
                  aria-label="Use font size stepper"
                  checked={fontSizeStepper}
                  onChange={(event) => setFontSizeStepper(event.target.checked)}
                />
                <span className="switch" />
              </label>
              <label className={`switch-row ${behavior === 'grouped' ? 'disabled' : ''}`}>
                <span>
                  Keep details open
                  <span className="field-note">
                    {behavior === 'grouped'
                      ? 'Unavailable for popovers'
                      : 'Non-popover groups across selections'}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={behavior !== 'grouped' && sticky}
                  disabled={behavior === 'grouped'}
                  onChange={(e) => setSticky(e.target.checked)}
                />
                <span className="switch" />
              </label>
              <label className="switch-row">
                <span>
                  Show popover headers<span className="field-note">Title and close button</span>
                </span>
                <input
                  type="checkbox"
                  aria-label="Show popover headers"
                  checked={showPopoverHeaders}
                  onChange={(e) => setShowPopoverHeaders(e.target.checked)}
                />
                <span className="switch" />
              </label>
              <label className="switch-row">
                <span>
                  Show more actions<span className="field-note">Rare style operations</span>
                </span>
                <input
                  type="checkbox"
                  aria-label="Show more formatting actions"
                  checked={showMoreActions}
                  onChange={(e) => setShowMoreActions(e.target.checked)}
                />
                <span className="switch" />
              </label>
              <label className="switch-row">
                <span>
                  Show toolbar shortcuts<span className="field-note">Tool key hints</span>
                </span>
                <input
                  type="checkbox"
                  aria-label="Show toolbar shortcut hints"
                  checked={showShortcutHints}
                  onChange={(event) => setShowShortcutHints(event.target.checked)}
                />
                <span className="switch" />
              </label>
            </div>
            <div className="experiment-section reset-section">
              <button
                className="plain-button reset-button"
                onClick={() => {
                  changeScene(scene);
                  announce('Scene reset. Undo restores your previous experiment.');
                }}
              >
                <RotateCcw size={14} />
                Reset scene
              </button>
            </div>
          </aside>
        )}
        <div className="viewport-tools floating-card">
          <button
            className="icon-button"
            aria-label="Zoom out"
            title={`Zoom out · ${mod}+-`}
            onClick={() => zoomBy(0.85)}
          >
            <Minus size={16} />
          </button>
          <button
            className="zoom-value"
            title={`Reset zoom to 100% · ${mod}+0`}
            onClick={() => zoomBy(1 / view.zoom)}
          >
            {Math.round(view.zoom * 100)}%
          </button>
          <button
            className="icon-button"
            aria-label="Zoom in"
            title={`Zoom in · ${mod}+=`}
            onClick={() => zoomBy(1.15)}
          >
            <Plus size={16} />
          </button>
          <span className="divider" />
          <button
            className="icon-button"
            title={`Fit diagram · ${alt}+1`}
            aria-label="Fit diagram"
            onClick={() => fit()}
          >
            <Maximize2 size={17} />
          </button>
          <button
            className={`icon-button ${grid ? 'active' : ''}`}
            title="Toggle grid"
            aria-label="Toggle grid"
            aria-pressed={grid}
            onClick={() => setGrid(!grid)}
          >
            <Grid2X2 size={17} />
          </button>
        </div>
        <div className="canvas-hint">
          <Focus size={14} />
          <span>
            {tool === 'connect'
              ? connectSource
                ? 'Select the destination'
                : 'Select the source'
              : editing
                ? 'Enter to finish · Escape to cancel label'
                : chosen.length === 1 && canEditLabel(chosen[0])
                  ? 'Type to replace label · Enter or F2 to edit · Shift-click to select multiple'
                  : chosen.length
                    ? 'Arrow keys to move · Shift-click to change selection · Escape to deselect'
                    : 'B block · T text · L connection · R rectangle · O ellipse · Space-drag to pan'}
          </span>
        </div>
        {notice && (
          <div role="status" className="toast">
            {notice}
          </div>
        )}
      </main>
    </div>
  );
}
