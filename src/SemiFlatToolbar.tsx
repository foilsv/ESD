import { useId, useRef, useState, useImperativeHandle, type Ref } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  IterationCw,
  Link2,
  Minus,
  Type,
} from 'lucide-react';
import {
  arrowStyles,
  commonValue,
  connectionArrows,
  fonts,
  isLine,
  type DiagramObject,
  type Rect,
  type Style,
} from './model';
import { toolbarContext } from './toolbarModel';
import { PANEL_GAP } from './panelPlacement';
import { usePanelPlacement } from './usePanelPlacement';
import ColorPalette from './ColorPalette';
import {
  AlignmentGrid,
  AlignmentStateIcon,
  ColorButton,
  EmphasisControls,
  FontSizeStepper,
  type ColorKey,
  type StrokeChoicePatch,
} from './FormattingControls';
import type { FormattingToolbarHandle } from './FormattingToolbar';

function BidirectionalArrow({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h16" />
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
    </svg>
  );
}

type Popover = 'fill' | 'stroke' | 'textColor' | 'align' | 'link' | 'textStyle' | 'strokePattern' | 'strokeWidth' | null;

interface Props {
  ref?: Ref<FormattingToolbarHandle>;
  onEscape: () => void;
  objects: DiagramObject[];
  patch: (patch: Partial<Style>) => void;
  patchColor: (key: ColorKey, value: string) => void;
  patchStroke: (patch: StrokeChoicePatch) => void;
  patchObjects: (patch: Partial<DiagramObject>) => void;
  cycleArrows: () => void;
  selection: Rect;
  viewport: Rect;
}

export default function SemiFlatToolbar({
  ref,
  onEscape,
  objects,
  patch,
  patchColor,
  patchStroke,
  patchObjects,
  cycleArrows,
  selection,
  viewport,
}: Props) {
  const context = toolbarContext(objects);
  const value = <K extends keyof Style>(key: K) => commonValue(objects, key);
  const toolbar = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const isTextOnly = objects.length > 0 && objects.every((o) => o.kind === 'text');
  const isAllLine = objects.length > 0 && objects.every(isLine);
  const [textMode, setTextMode] = useState(isTextOnly);
  const [activePopover, setActivePopover] = useState<Popover>(null);
  const [linkDraft, setLinkDraft] = useState('');
  const [textStyleView, setTextStyleView] = useState<'main' | 'custom'>('main');
  const [triggerX, setTriggerX] = useState<number | null>(null);
  const lastButtonX = useRef<number | null>(null);

  const placement = usePanelPlacement(toolbar, panel, selection, viewport, activePopover);

  const openPopover = (p: Popover) =>
    setActivePopover((prev) => {
      if (prev === p) { setTriggerX(null); return null; }
      setTriggerX(lastButtonX.current);
      return p;
    });
  const closePopover = () => { setActivePopover(null); setTextStyleView('main'); setTriggerX(null); };

  useImperativeHandle(ref, () => ({
    dismiss: () => {
      if (activePopover) {
        closePopover();
        return true;
      }
      if (textMode && !isTextOnly) {
        setTextMode(false);
        return true;
      }
      return false;
    },
    dismissPopovers: closePopover,
  }));

  const colorButton = (key: ColorKey, label: string) => (
    <ColorButton
      key={key}
      value={value(key)}
      kind={key}
      label={label}
      active={activePopover === key}
      controlsId={panelId}
      onClick={() => openPopover(key as Popover)}
    />
  );

  const arrowState =
    objects.length > 0 && objects.every((o) => connectionArrows(o) === connectionArrows(objects[0]))
      ? connectionArrows(objects[0])
      : 'mixed';
  const nextArrows =
    arrowState === 'mixed' ? 'none' : arrowStyles[(arrowStyles.indexOf(arrowState) + 1) % 4];
  const ArrowIcon =
    arrowState === 'none'
      ? Minus
      : arrowState === 'left'
        ? ArrowLeft
        : arrowState === 'right'
          ? ArrowRight
          : BidirectionalArrow;

  const patternButtons = (
    <div className="segmented sft-pattern-group" role="group" aria-label="Stroke pattern">
      {(['solid', 'dashed', 'dotted'] as const).map((pat) => (
        <button
          key={pat}
          className={`sft-pattern-btn ${value('pattern') === pat ? 'active' : ''}`}
          aria-label={pat}
          aria-pressed={value('pattern') === pat}
          onClick={() => patchStroke({ pattern: pat })}
        >
          <svg width="22" height="10" aria-hidden="true">
            <path
              d="M2 5 H20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray={pat === 'solid' ? undefined : pat === 'dashed' ? '4 3' : '1.5 3'}
              strokeLinecap="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );

  const widthButtons = (
    <div className="segmented sft-width-group" role="group" aria-label="Stroke width">
      {([1, 2, 4, 8] as const).map((w) => (
        <button
          key={w}
          className={`sft-width-btn ${value('width') === w ? 'active' : ''}`}
          aria-label={`Width ${w}`}
          aria-pressed={value('width') === w}
          onClick={() => patchStroke({ width: w })}
        >
          <svg width="18" height="12" aria-hidden="true">
            <path
              d="M2 6 H16"
              fill="none"
              stroke="currentColor"
              strokeWidth={Math.min(w, 4)}
              strokeLinecap="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );

  const strokePatternButton = (
    <button
      className={`property-button ${activePopover === 'strokePattern' ? 'active' : ''}`}
      aria-label="Stroke pattern"
      title="Stroke pattern"
      aria-expanded={activePopover === 'strokePattern'}
      aria-controls={activePopover === 'strokePattern' ? panelId : undefined}
      onClick={() => openPopover('strokePattern')}
    >
      <svg width="22" height="12" aria-hidden="true">
        <path
          d="M2 6 H20"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeDasharray={
            (value('pattern') ?? 'solid') === 'dashed'
              ? '4 3'
              : (value('pattern') ?? 'solid') === 'dotted'
                ? '1.5 3'
                : undefined
          }
          strokeLinecap="round"
        />
      </svg>
      <ChevronDown size={10} />
    </button>
  );

  const strokeWidthButton = (
    <button
      className={`property-button ${activePopover === 'strokeWidth' ? 'active' : ''}`}
      aria-label="Stroke width"
      title="Stroke width"
      aria-expanded={activePopover === 'strokeWidth'}
      aria-controls={activePopover === 'strokeWidth' ? panelId : undefined}
      onClick={() => openPopover('strokeWidth')}
    >
      <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', letterSpacing: 0 }}>
        {value('width') ?? 1}px
      </span>
      <ChevronDown size={10} />
    </button>
  );

  const textStyleLabel = (() => {
    const ff = value('fontFamily');
    if (ff === 'mono') return 'Code';
    if (ff === 'classic') return 'Classic';
    if (ff === 'compact') return 'Compact';
    return fonts[ff as keyof typeof fonts]?.label ?? 'Custom';
  })();

  const fontSizeStepper = <FontSizeStepper value={value} patch={patch} />;

  const linkButton = (
    <button
      className={`icon-button ${activePopover === 'link' ? 'active' : ''}`}
      aria-label="Hyperlink"
      title="Hyperlink"
      onClick={() => {
        setLinkDraft(objects[0]?.hyperlink ?? '');
        openPopover('link');
      }}
    >
      <Link2 size={17} />
    </button>
  );

  const textModeRow = (
    <>
      {!isTextOnly && (
        <button
          className="icon-button"
          aria-label="Back to object formatting"
          title="Back to object formatting"
          onClick={() => {
            setTextMode(false);
            closePopover();
          }}
        >
          <ArrowLeft size={17} />
        </button>
      )}
      <button
        className={`property-button sft-textstyle-btn ${activePopover === 'textStyle' ? 'active' : ''}`}
        aria-label="Text style"
        aria-expanded={activePopover === 'textStyle'}
        aria-controls={activePopover === 'textStyle' ? panelId : undefined}
        onClick={() => openPopover('textStyle')}
      >
        <Type size={14} />
        <span style={{ fontSize: 12 }}>{textStyleLabel}</span>
        <ChevronDown size={10} />
      </button>
      {fontSizeStepper}
      <span className="divider" />
      <EmphasisControls value={value} patch={patch} />
      {colorButton('textColor', 'Text')}
      <button
        className={`property-button ${activePopover === 'align' ? 'active' : ''}`}
        aria-label="Alignment"
        title="Alignment"
        aria-expanded={activePopover === 'align'}
        aria-controls={activePopover === 'align' ? panelId : undefined}
        onClick={() => openPopover('align')}
      >
        <AlignmentStateIcon align={value('align')} verticalAlign={value('verticalAlign')} />
      </button>
      {linkButton}
    </>
  );

  const objectModeRow = (
    <>
      {context.fill && colorButton('fill', 'Fill')}
      {(context.stroke || context.lineColor) && (
        colorButton('stroke', context.lineColor ? 'Line' : 'Stroke')
      )}
      {(context.stroke || context.lineColor) && (
        <>
          <span className="divider" />
          {strokePatternButton}
          {strokeWidthButton}
        </>
      )}
      {context.direction && (
        <>
          <span className="divider" />
          <button
            className="icon-button"
            aria-label="Cycle connection arrows"
            title={`Arrows: ${arrowState}. Click for ${nextArrows}.`}
            onClick={cycleArrows}
          >
            <ArrowIcon size={17} />
          </button>
          <IterationCw
            size={14}
            style={{ color: 'var(--muted)', pointerEvents: 'none', flexShrink: 0 }}
          />
        </>
      )}
      {context.text && (
        <>
          <span className="divider" />
          <button
            className="icon-button"
            aria-label="Text formatting"
            title="Open text formatting"
            onClick={() => {
              setTextMode(true);
              closePopover();
            }}
          >
            <Type size={17} />
            <ChevronRight size={10} />
          </button>
          {fontSizeStepper}
        </>
      )}
      {!isAllLine && linkButton}
    </>
  );

  const popoverWidth =
    activePopover === 'fill' || activePopover === 'stroke' || activePopover === 'textColor'
      ? 304
      : activePopover === 'align'
        ? 180
        : activePopover === 'textStyle'
          ? 190
          : activePopover === 'strokePattern'
            ? 135
            : activePopover === 'strokeWidth'
              ? 165
              : 270;

  const popoverContent = (() => {
    if (
      activePopover === 'fill' ||
      activePopover === 'stroke' ||
      activePopover === 'textColor'
    ) {
      const key = activePopover as ColorKey;
      return (
        <ColorPalette
          value={value(key)}
          kind={key}
          onChange={(v) => patchColor(key, v)}
          onChoose={closePopover}
        />
      );
    }
    if (activePopover === 'align') {
      return <AlignmentGrid value={value} patch={patch} onChoose={closePopover} />;
    }
    if (activePopover === 'textStyle') {
      if (textStyleView === 'custom') {
        return (
          <div className="sft-textstyle-menu">
            <button className="sft-style-back" onClick={() => setTextStyleView('main')}>
              <ArrowLeft size={12} />
              <span>Back</span>
            </button>
            {(Object.entries(fonts) as [keyof typeof fonts, { label: string; css: string }][]).map(
              ([id, { label, css }]) => (
                <button
                  key={id}
                  className={`sft-style-option ${value('fontFamily') === id ? 'selected' : ''}`}
                  onClick={() => {
                    patch({ fontFamily: id });
                    closePopover();
                  }}
                >
                  <span style={{ fontFamily: css }}>{label}</span>
                </button>
              ),
            )}
          </div>
        );
      }
      const isCustomSelected = !['mono', 'classic', 'compact'].includes(
        value('fontFamily') ?? 'normal',
      );
      return (
        <div className="sft-textstyle-menu">
          <button
            className={`sft-style-option ${isCustomSelected ? 'selected' : ''}`}
            onClick={() => setTextStyleView('custom')}
          >
            <span>Custom</span>
            <span className="sft-style-desc sft-style-desc-chevron">
              Font library <ChevronRight size={10} />
            </span>
          </button>
          {([
            { id: 'mono', label: 'Code', desc: 'Monospace' },
            { id: 'classic', label: 'Classic', desc: 'Serif-style' },
            { id: 'compact', label: 'Compact', desc: 'Condensed' },
          ] as const).map(({ id, label, desc }) => (
            <button
              key={id}
              className={`sft-style-option ${value('fontFamily') === id ? 'selected' : ''}`}
              onClick={() => {
                patch({ fontFamily: id });
                closePopover();
              }}
            >
              <span style={{ fontFamily: fonts[id].css }}>{label}</span>
              <span className="sft-style-desc">{desc}</span>
            </button>
          ))}
        </div>
      );
    }
    if (activePopover === 'link') {
      return (
        <div className="sft-link-popover">
          <input
            autoFocus
            type="text"
            className="sft-link-input"
            placeholder="https:// or any URL"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                patchObjects({ hyperlink: linkDraft || undefined });
                closePopover();
              }
              if (e.key === 'Escape') closePopover();
            }}
          />
          <button
            className="sft-link-apply"
            onClick={() => {
              patchObjects({ hyperlink: linkDraft || undefined });
              closePopover();
            }}
          >
            Apply
          </button>
        </div>
      );
    }
    if (activePopover === 'strokePattern') {
      return patternButtons;
    }
    if (activePopover === 'strokeWidth') {
      return widthButtons;
    }
    return null;
  })();

  const showTextMode = isTextOnly || textMode;

  const popoverW = Math.min(popoverWidth, viewport.w);
  const anchoredPopoverLeft = (() => {
    if (!placement?.popover) return 0;
    if (triggerX === null) return placement.popover.x - placement.toolbar.x;
    const left = triggerX - placement.toolbar.x - popoverW / 2;
    return Math.max(0, Math.min(left, viewport.w - popoverW));
  })();
  const anchoredConnectorLeft = (() => {
    if (!placement?.popover) return 0;
    const cx = triggerX !== null ? triggerX : placement.connectorX;
    return cx - placement.toolbar.x - 12;
  })();

  return (
    <div
      className="formatting-surface solution-semi-flat"
      data-testid="formatting-toolbar"
      data-behavior="semi-flat"
      data-placement={placement?.direction}
      data-edge-anchored={placement?.edgeAnchored || undefined}
      style={{
        left: placement?.toolbar.x ?? viewport.x,
        top: placement?.toolbar.y ?? viewport.y,
        maxWidth: viewport.w,
        visibility: placement ? undefined : 'hidden',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        const btn = (e.target as Element).closest('button');
        if (btn) {
          const r = btn.getBoundingClientRect();
          lastButtonX.current = r.left + r.width / 2;
        }
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        e.stopPropagation();
        onEscape();
      }}
    >
      <div
        ref={toolbar}
        className="formatting-bar"
        role="toolbar"
        aria-label={showTextMode ? 'Text formatting' : 'Object formatting'}
      >
        {showTextMode ? textModeRow : objectModeRow}
      </div>
      {activePopover && (
        <div
          ref={panel}
          id={panelId}
          className={`formatting-popover ${activePopover === 'fill' || activePopover === 'stroke' || activePopover === 'textColor' ? 'color-popover' : activePopover === 'link' ? 'sft-link-wrap' : ''}`}
          role="group"
          style={{
            left: placement?.popover ? anchoredPopoverLeft : 0,
            top: placement?.popover ? placement.popover.y - placement.toolbar.y : 0,
            width: popoverW,
            maxHeight:
              placement?.popoverMaxHeight ?? Math.max(0, viewport.h - 44 - PANEL_GAP),
            visibility: placement?.popover ? undefined : 'hidden',
            overflow:
              activePopover === 'strokePattern' || activePopover === 'strokeWidth'
                ? 'hidden'
                : undefined,
          }}
        >
          {popoverContent}
        </div>
      )}
      {activePopover && placement?.popover && (
        <svg
          className="popover-connector"
          aria-hidden="true"
          width="24"
          height={PANEL_GAP}
          viewBox={`0 0 24 ${PANEL_GAP}`}
          style={{
            left: anchoredConnectorLeft,
            top: placement.direction === 'up' ? -PANEL_GAP : placement.toolbar.h,
          }}
        >
          <path
            d={`M0 0 H24 L12 ${PANEL_GAP / 2} Z M12 ${PANEL_GAP / 2} L24 ${PANEL_GAP} H0 Z`}
          />
        </svg>
      )}
    </div>
  );
}
