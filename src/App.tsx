import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
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
  Hand,
  Maximize2,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  RotateCcw,
  Square,
  Type,
  Undo2,
  Waypoints,
  X,
} from 'lucide-react';
import DiagramCanvas, { type View } from './DiagramCanvas';
import FormattingToolbar from './FormattingToolbar';
import WhatsNew from './WhatsNew';
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

type Tool = 'select' | 'hand' | 'connect';
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
  const [labOpen, setLabOpen] = useState(() => window.innerWidth > 900);
  const [grid, setGrid] = useState(false);
  const [tool, setTool] = useState<Tool>('select');
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const drag = useRef<Drag | null>(null);
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
    (items: DiagramObject[] = objects) => {
      const box = union(items.map((o) => bounds(o, items)));
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
            manufacturer,
          }),
        ),
      300,
    );
    return () => clearTimeout(timeout);
  }, [objects, scene, behavior, sticky, showPopoverHeaders, manufacturer]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timeout);
  }, [notice]);

  function finishEdit(cancel = false) {
    if (editing && !cancel)
      commit(objects.map((o) => (o.id === editing ? { ...o, label: draft.trim() || o.label } : o)));
    setEditing(null);
    setDetail(null);
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
        : compatibleDetail(detail, next, behavior, sticky),
    );
    setSelected(nextIds);
  }
  function edit(id: string) {
    const object = objects.find((o) => o.id === id);
    if (!object || !canEditLabel(object)) return;
    setSelected([id]);
    setEditing(id);
    setDraft(object.label);
    setDetail(detailOnTextEntry(behavior));
    setTool('select');
  }
  function patch(patch: Partial<Style>) {
    commit(
      objects.map((o) => (selected.includes(o.id) ? { ...o, style: { ...o.style, ...patch } } : o)),
    );
  }
  function patchObjects(patch: Partial<DiagramObject>) {
    commit(objects.map((o) => (selected.includes(o.id) ? { ...o, ...patch } : o)));
  }
  function changeManufacturer(next: ManufacturerStyle) {
    const current = editing
      ? objects.map((o) => (o.id === editing ? { ...o, label: draft.trim() || o.label } : o))
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
      style: { ...defaultStyle, fontSize: kind === 'text' ? 24 : 16 },
    };
    const existing = editing
      ? objects.map((o) => (o.id === editing ? { ...o, label: draft.trim() || o.label } : o))
      : objects;
    commit([...existing, ...applyManufacturerStyle([object], manufacturer)]);
    setSelected([id]);
    setDetail(kind === 'text' ? detailOnTextEntry(behavior) : null);
    setTool('select');
  }
  function startObject(event: ReactPointerEvent, object: DiagramObject, resize = false) {
    if ((event.target as Element).closest('input')) return;
    event.stopPropagation();
    if (event.button !== 0) return;
    if (tool === 'hand') {
      startPan(event);
      return;
    }
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
        style: { ...defaultStyle, stroke: '#2563eb', width: 2, fontSize: 13 },
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
      const before = editing
        ? objects.map((o) => (o.id === editing ? { ...o, label: draft.trim() || o.label } : o))
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
    if (tool === 'hand' || event.button === 1) {
      event.preventDefault();
      startPan(event);
      return;
    }
    if (event.button !== 0) return;
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
  function zoomBy(factor: number) {
    setView((v) => {
      const zoom = Math.max(0.25, Math.min(2, v.zoom * factor));
      const p = { x: viewport.w / 2, y: viewport.h / 2 };
      return {
        zoom,
        x: p.x - ((p.x - v.x) * zoom) / v.zoom,
        y: p.y - ((p.y - v.y) * zoom) / v.zoom,
      };
    });
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
      if (showWhatsNew) {
        if (event.key === 'Escape') closeWhatsNew();
        return;
      }
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable]'))
        return;
      if (event.key === 'Escape') {
        if (editing) finishEdit(true);
        else {
          setSelected([]);
          setDetail(null);
        }
        setTool('select');
        setConnectSource(null);
      }
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
      if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        commit(
          objects.filter(
            (o) =>
              !selected.includes(o.id) &&
              !selected.includes(o.source ?? '') &&
              !selected.includes(o.target ?? ''),
          ),
        );
        setSelected([]);
        setEditing(null);
      }
      if (!modifier && !(event.target as HTMLElement).closest('button')) {
        if (event.key.toLowerCase() === 'v') setTool('select');
        if (event.key.toLowerCase() === 'h') setTool('hand');
        if (event.key.toLowerCase() === 'b') add('block');
        if (event.key.toLowerCase() === 't') add('text');
        if (event.key.toLowerCase() === 'c') {
          setTool('connect');
          setConnectSource(null);
        }
        if (event.key === 'Enter' && chosen.length === 1) {
          event.preventDefault();
          edit(chosen[0].id);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });
  function exportSnapshot() {
    const snapshot: Snapshot = {
      version: 2,
      objects: editing
        ? objects.map((o) => (o.id === editing ? { ...o, label: draft.trim() || o.label } : o))
        : objects,
      scene,
      behavior,
      sticky,
      showPopoverHeaders,
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
          <span className="save-status">
            {saved ? 'Saved in this browser' : 'Browser storage unavailable'}
          </span>
          <button
            className="icon-button"
            aria-label="Undo"
            title="Undo · Ctrl+Z"
            disabled={!history.past.length}
            onClick={undo}
          >
            <Undo2 size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Redo"
            title="Redo · Ctrl+Shift+Z"
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
      <main ref={stage} className="stage" hidden={showWhatsNew}>
        <DiagramCanvas
          objects={objects}
          selected={selected}
          editing={editing}
          draft={draft}
          setDraft={setDraft}
          view={view}
          grid={grid}
          hand={tool === 'hand'}
          select={select}
          edit={edit}
          finishEdit={finishEdit}
          startObject={startObject}
          startCanvas={startCanvas}
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
            onClick={() => setTool('select')}
          >
            <MousePointer2 size={20} />
          </button>
          <button
            className={`tool-button ${tool === 'hand' ? 'active' : ''}`}
            title="Pan · H"
            aria-label="Pan tool"
            onClick={() => setTool('hand')}
          >
            <Hand size={20} />
          </button>
          <span className="horizontal-divider" />
          <button
            className="tool-button"
            title="Add functional block · B"
            aria-label="Add functional block"
            onClick={() => add('block')}
          >
            <Box size={20} />
          </button>
          <button
            className={`tool-button ${tool === 'connect' ? 'active' : ''}`}
            title="Connect two objects · C"
            aria-label="Connect objects"
            onClick={() => {
              setTool('connect');
              setConnectSource(null);
              finishEdit();
              announce('Select a source, then a destination.');
            }}
          >
            <Waypoints size={20} />
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
          </button>
          <button
            className="tool-button"
            title="Add rectangle"
            aria-label="Add rectangle"
            onClick={() => add('rectangle')}
          >
            <Square size={20} />
          </button>
          <button
            className="tool-button"
            title="Add ellipse"
            aria-label="Add ellipse"
            onClick={() => add('ellipse')}
          >
            <Circle size={20} />
          </button>
        </nav>
        {chosen.length > 0 && (
          <FormattingToolbar
            key={chosen.map((o) => o.id).join(',')}
            objects={chosen}
            editing={Boolean(editing)}
            behavior={behavior}
            showPopoverHeaders={showPopoverHeaders}
            detail={detail}
            setDetail={setDetail}
            patch={patch}
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
              <label className="eyebrow" htmlFor="scene">
                TEST SCENE
              </label>
              <div className="select-wrap">
                <select
                  id="scene"
                  value={scene}
                  onChange={(e) => changeScene(e.target.value as Scene)}
                >
                  {Object.entries(scenes).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} />
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
                  aria-describedby="manufacturer-style-note"
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
              <p id="manufacturer-style-note" className="manufacturer-note">
                Applies to all objects. Individual colors remain editable.
              </p>
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
                  Keep details open
                  <span className="field-note">Across compatible selections</span>
                </span>
                <input
                  type="checkbox"
                  checked={sticky}
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
            title="Zoom out"
            onClick={() => zoomBy(0.85)}
          >
            <Minus size={16} />
          </button>
          <button
            className="zoom-value"
            title="Reset zoom to 100%"
            onClick={() => zoomBy(1 / view.zoom)}
          >
            {Math.round(view.zoom * 100)}%
          </button>
          <button
            className="icon-button"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => zoomBy(1.15)}
          >
            <Plus size={16} />
          </button>
          <span className="divider" />
          <button
            className="icon-button"
            title="Fit diagram"
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
                : 'Drag to move · Double-click to edit · Shift-click to select multiple'}
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
