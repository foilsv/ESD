import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Minus,
  RotateCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Type,
  X,
} from 'lucide-react';
import {
  commonValue,
  connectionArrows,
  arrowStyles,
  fonts,
  type Detail,
  type DiagramObject,
  type PanelBehavior,
  type Rect,
  type Style,
} from './model';
import { toolbarContext } from './toolbarModel';
import { PANEL_GAP } from './panelPlacement';
import { usePanelPlacement } from './usePanelPlacement';
import ColorPalette from './ColorPalette';
import {
  AlignmentControls,
  AlignmentGrid,
  AlignmentStateIcon,
  ColorButton,
  EmphasisControls,
  FontControl,
  FontDropdown,
  FontChoices,
  SizeDropdown,
  SizeChoices,
  StrokeControls,
  StrokeSample,
  type ColorKey,
} from './FormattingControls';

interface Props {
  objects: DiagramObject[];
  editing: boolean;
  behavior: PanelBehavior;
  showPopoverHeaders?: boolean;
  detail: Detail;
  setDetail: (detail: Detail) => void;
  patch: (patch: Partial<Style>) => void;
  patchObjects: (patch: Partial<DiagramObject>) => void;
  cycleArrows: () => void;
  selection: Rect;
  viewport: Rect;
  finishEditing: () => void;
}
export default function FormattingToolbar(props: Props) {
  const { objects, editing, behavior, detail, setDetail, patch, selection, viewport } = props;
  const context = toolbarContext(objects);
  const value = <K extends keyof Style>(key: K) => commonValue(objects, key);
  const controls = { value, patch };
  const root = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [color, setColor] = useState<ColorKey | null>(null);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [flatText, setFlatText] = useState(false);
  const textMode = behavior === 'flat' && (editing || flatText || context.textOnly);
  const flatDetail =
    behavior === 'flat' &&
    !textMode &&
    ((detail === 'stroke' && context.stroke) ||
      (detail === 'alignment' && context.alignment) ||
      (detail === 'arrows' && context.direction))
      ? detail
      : null;
  const activeTrigger = fontOpen
    ? 'font-family'
    : sizeOpen
      ? 'font-size'
      : color
        ? `color-${color}`
        : behavior === 'grouped'
          ? detail
          : null;
  const placement = usePanelPlacement(toolbar, panel, selection, viewport, activeTrigger);
  // Browsing text formatting is distinct from editing the actual label.
  useEffect(() => {
    setSizeOpen(false);
    setFontOpen(false);
    setColor(null);
    setFlatText(false);
  }, [behavior, editing]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (root.current?.contains(event.target as Node)) return;
      setSizeOpen(false);
      setFontOpen(false);
      setColor(null);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  const toggleGroup = (next: Detail) => {
    setSizeOpen(false);
    setFontOpen(false);
    setColor(null);
    setDetail(detail === next ? null : next);
  };
  const showColor = (key: ColorKey) => {
    setSizeOpen(false);
    setFontOpen(false);
    if (behavior === 'grouped') setDetail(null);
    setColor(color === key ? null : key);
  };
  const colorControl = (key: ColorKey, label: string) => (
    <ColorButton
      key={key}
      value={value(key)}
      kind={key}
      label={label}
      active={color === key}
      controlsId={panelId}
      onClick={() => showColor(key)}
    />
  );
  const strokeMixed =
    value('pattern') === undefined || value('width') === undefined || value('stroke') === undefined;
  const alignmentMixed = value('align') === undefined || value('verticalAlign') === undefined;
  const textMixed = ['fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'strikethrough'].some(
    (key) => value(key as keyof Style) === undefined,
  );
  const closeFont = () => {
    setFontOpen(false);
    toolbar.current
      ?.querySelector<HTMLButtonElement>('[data-popover-trigger="font-family"]')
      ?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (fontOpen) {
      const options = panel.current?.querySelector('.font-dropdown-options');
      (
        options?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ??
        options?.querySelector<HTMLButtonElement>('button')
      )?.focus({ preventScroll: true });
    }
  }, [fontOpen]);
  const fontControl = (
    <FontControl
      value={value}
      active={fontOpen}
      controlsId={panelId}
      onClick={() => {
        setSizeOpen(false);
        setColor(null);
        setFontOpen(!fontOpen);
      }}
    />
  );
  const sizeControl = (
    <button
      className={`property-button size-dropdown-trigger ${sizeOpen ? 'active' : ''}`}
      aria-label="Font size"
      title="Font size"
      aria-expanded={sizeOpen}
      aria-controls={sizeOpen ? panelId : undefined}
      data-popover-trigger="font-size"
      onClick={() => {
        setColor(null);
        setFontOpen(false);
        setSizeOpen(!sizeOpen);
      }}
    >
      <span>{value('fontSize') ?? 'Mixed'}</span>
      <ChevronDown size={11} />
    </button>
  );

  const typography = (inline: boolean) => (
    <div className={inline ? 'inline-text-controls' : 'grouped-text-controls'}>
      <div className="detail-row">
        <span>Font</span>
        {inline ? fontControl : <FontChoices {...controls} />}
        {inline && sizeControl}
      </div>
      {!inline && (
        <div className="detail-row">
          <span>Size</span>
          <SizeChoices {...controls} />
        </div>
      )}
      <div className="detail-row">
        <span>Emphasis</span>
        <EmphasisControls {...controls} />
      </div>
    </div>
  );
  const alignment = (inline: boolean) => (
    <div className={inline ? 'inline-alignment-controls' : 'grouped-alignment-controls'}>
      <div className="detail-row">
        <span>Horizontal</span>
        <AlignmentControls {...controls} />
      </div>
      <div className="detail-row">
        <span>Vertical</span>
        <AlignmentControls {...controls} vertical />
      </div>
    </div>
  );
  function group(id: Exclude<Detail, null>, label: string, summary: ReactNode, content: ReactNode) {
    const expanded = detail === id;
    return (
      <div
        className={`format-group ${expanded && behavior === 'inline' ? 'expanded-inline-group' : ''}`}
        data-group={id}
      >
        <button
          className={`property-button ${expanded ? 'active' : ''}`}
          aria-label={`${label} settings`}
          title={
            id === 'alignment'
              ? `Alignment: ${alignmentMixed ? 'Mixed' : `${value('verticalAlign')} ${value('align')}`}`
              : id === 'arrows'
                ? `Arrow style: ${arrowState}`
                : `${label} settings`
          }
          aria-expanded={expanded}
          aria-controls={expanded && behavior === 'grouped' ? panelId : undefined}
          data-popover-trigger={id}
          onClick={() => toggleGroup(id)}
        >
          {summary}
          {behavior === 'flat' ? (
            <ChevronRight size={11} />
          ) : expanded && behavior === 'inline' ? (
            <ChevronLeft size={11} />
          ) : (
            <ChevronDown size={11} />
          )}
        </button>
        {expanded && behavior === 'inline' && (
          <div
            className="inline-controls"
            data-testid="inline-controls"
            aria-label={`${label} expanded controls`}
          >
            {content}
          </div>
        )}
      </div>
    );
  }
  const strokeGroup = group(
    'stroke',
    'Stroke',
    <>
      <StrokeSample color={value('stroke')} width={value('width')} pattern={value('pattern')} />
      <span className="property-value">{strokeMixed ? 'Mixed' : `${value('width')} px`}</span>
    </>,
    <>
      {!context.lineColor && colorControl('stroke', 'Stroke')}
      <StrokeControls {...controls} inline />
    </>,
  );
  const textGroup = group(
    'text',
    'Text',
    <>
      <Type size={17} />
      <span
        className="property-value"
        style={{
          fontFamily: fonts[value('fontFamily') ?? 'normal'].css,
          fontWeight: value('bold') ? 700 : 400,
          fontStyle: value('italic') ? 'italic' : 'normal',
          textDecoration: [
            value('underline') && 'underline',
            value('strikethrough') && 'line-through',
          ]
            .filter(Boolean)
            .join(' '),
        }}
      >
        {textMixed ? 'Mixed' : value('fontSize')}
      </span>
    </>,
    typography(true),
  );
  const alignGroup = group(
    'alignment',
    'Alignment',
    <AlignmentStateIcon align={value('align')} verticalAlign={value('verticalAlign')} />,
    alignment(true),
  );

  const arrowState =
    objects.length && objects.every((o) => connectionArrows(o) === connectionArrows(objects[0]))
      ? connectionArrows(objects[0])
      : 'mixed';
  const ArrowIcon =
    arrowState === 'none'
      ? Minus
      : arrowState === 'left'
        ? ArrowLeft
        : arrowState === 'right'
          ? ArrowRight
          : ArrowLeftRight;
  const nextArrows =
    arrowState === 'mixed' ? 'none' : arrowStyles[(arrowStyles.indexOf(arrowState) + 1) % 4];
  const arrowChoices = (
    <div className="segmented arrow-choices" role="group" aria-label="Connection arrow style">
      {arrowStyles.map((arrowStyle) => {
        const Icon = { none: Minus, left: ArrowLeft, right: ArrowRight, both: ArrowLeftRight }[
          arrowStyle
        ];
        return (
          <button
            key={arrowStyle}
            title={`Arrows: ${arrowStyle}`}
            aria-label={`Arrows: ${arrowStyle}`}
            aria-pressed={arrowState === arrowStyle}
            onClick={() => {
              props.patchObjects({
                arrowStyle,
                directional: arrowStyle !== 'none',
                reversed: arrowStyle === 'left',
              });
            }}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </div>
  );
  const cycleControl = context.direction && (
    <button
      className="icon-button"
      aria-label="Cycle connection arrows"
      title={`Arrows: ${arrowState}. Click for ${nextArrows}.`}
      data-arrow-style={arrowState}
      onClick={props.cycleArrows}
    >
      <RotateCw size={18} />
    </button>
  );
  const directionControls = context.direction && (
    <div className="control-cluster direction-controls">
      {group(
        'arrows',
        'Arrows',
        <>
          <ArrowIcon size={18} />
          {arrowState === 'mixed' && <span className="mixed-label">Mixed</span>}
        </>,
        arrowChoices,
      )}
      {cycleControl}
    </div>
  );
  const returnToObject = () => {
    setSizeOpen(false);
    setFontOpen(false);
    setFlatText(false);
    setColor(null);
    setDetail(null);
    if (editing) props.finishEditing();
  };
  const backToObject = (
    <button
      className="icon-button"
      aria-label="Back to object formatting"
      title="Back to object formatting"
      onClick={returnToObject}
    >
      <ArrowLeft size={17} />
    </button>
  );
  const flatTextRow = (
    <>
      {!context.textOnly && backToObject}
      {fontControl}
      {sizeControl}
      <span className="divider" />
      <EmphasisControls {...controls} />
      {colorControl('textColor', 'Text')}
      {context.alignment && (
        <>
          <span className="divider" />
          <AlignmentControls {...controls} />
          <AlignmentControls {...controls} vertical />
        </>
      )}
    </>
  );
  const flatDetailRow = (
    <>
      {backToObject}
      <span className="subtoolbar-title">
        {flatDetail === 'stroke' ? 'Stroke' : flatDetail === 'arrows' ? 'Arrows' : 'Alignment'}
      </span>
      <span className="divider" />
      <div className="flat-detail-controls" data-testid="flat-detail-controls">
        {flatDetail === 'stroke' ? (
          <>
            {colorControl('stroke', 'Stroke')}
            <StrokeControls {...controls} inline />
            {directionControls}
          </>
        ) : flatDetail === 'arrows' ? (
          <>
            {arrowChoices}
            {cycleControl}
          </>
        ) : (
          alignment(true)
        )}
      </div>
    </>
  );
  const objectRow = (
    <>
      {context.fill && colorControl('fill', 'Fill')}
      {(context.lineColor || context.symbolColor) &&
        colorControl('stroke', context.symbolColor ? 'Symbol' : 'Line')}
      {context.stroke && (
        <>
          {behavior !== 'inline' && !context.lineColor && colorControl('stroke', 'Stroke')}
          {strokeGroup}
        </>
      )}
      {directionControls}
      {context.text && (
        <>
          <span className="divider" />
          {behavior === 'flat' ? (
            <button
              className="property-button"
              aria-label="Text formatting"
              title="Open text formatting submode"
              onClick={() => {
                setFlatText(true);
                setDetail(null);
                setColor(null);
              }}
            >
              <Type size={17} />
              <span>{textMixed ? 'Mixed' : value('fontSize')}</span>
              <ChevronRight size={11} />
            </button>
          ) : (
            textGroup
          )}
          {colorControl('textColor', 'Text')}
          {context.alignment && alignGroup}
        </>
      )}
    </>
  );
  const popoverTitle = fontOpen
    ? 'Font style'
    : sizeOpen
      ? 'Font size'
      : color
        ? color === 'fill'
          ? 'Fill color'
          : color === 'stroke'
            ? 'Stroke color'
            : 'Text color'
        : detail === 'text'
          ? 'Text formatting'
          : detail === 'arrows'
            ? 'Connection arrows'
            : detail === 'alignment'
              ? 'Alignment'
              : 'Stroke';
  const popover = fontOpen || sizeOpen || color || (detail && behavior === 'grouped');
  return (
    <div
      ref={root}
      className={`formatting-surface solution-${behavior}`}
      data-testid="formatting-toolbar"
      data-behavior={behavior}
      data-placement={placement?.direction}
      data-edge-anchored={placement?.edgeAnchored || undefined}
      style={{
        left: placement?.toolbar.x ?? viewport.x,
        top: placement?.toolbar.y ?? viewport.y,
        maxWidth: viewport.w,
        visibility: placement ? undefined : 'hidden',
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        e.stopPropagation();
        if (fontOpen) closeFont();
        else if (sizeOpen) setSizeOpen(false);
        else if (color) setColor(null);
        else if (detail) setDetail(null);
        else if (textMode && !context.textOnly) returnToObject();
      }}
    >
      <div
        ref={toolbar}
        className="formatting-bar"
        data-testid="primary-toolbar"
        role="toolbar"
        aria-label={
          textMode
            ? 'Text formatting'
            : flatDetail === 'stroke'
              ? 'Stroke formatting'
              : flatDetail === 'alignment'
                ? 'Alignment formatting'
                : flatDetail === 'arrows'
                  ? 'Arrow formatting'
                  : 'Object formatting'
        }
      >
        {!Object.values(context).some(Boolean) ? (
          <span className="toolbar-empty">No shared formatting for this selection</span>
        ) : textMode ? (
          flatTextRow
        ) : flatDetail ? (
          flatDetailRow
        ) : (
          objectRow
        )}
      </div>
      {popover && (
        <div
          key={activeTrigger}
          ref={panel}
          id={panelId}
          className={`formatting-popover ${fontOpen ? 'font-popover' : sizeOpen ? 'size-popover' : color ? 'color-popover' : ''}`}
          role="group"
          aria-label={popoverTitle}
          data-testid="formatting-popover"
          style={{
            left: placement?.popover ? placement.popover.x - placement.toolbar.x : 0,
            top: placement?.popover ? placement.popover.y - placement.toolbar.y : 0,
            width: Math.min(
              fontOpen || sizeOpen
                ? 192
                : color
                  ? 304
                  : detail === 'arrows'
                    ? 204
                    : detail === 'alignment'
                      ? 180
                      : 288,
              viewport.w,
            ),
            maxHeight: placement?.popoverMaxHeight ?? Math.max(0, viewport.h - 44 - PANEL_GAP),
            visibility: placement?.popover ? undefined : 'hidden',
          }}
        >
          {props.showPopoverHeaders !== false && (
            <div className="detail-heading">
              <span>{popoverTitle}</span>
              <button
                className="icon-button small"
                aria-label="Close popover"
                onClick={() =>
                  fontOpen
                    ? closeFont()
                    : sizeOpen
                      ? setSizeOpen(false)
                      : color
                        ? setColor(null)
                        : setDetail(null)
                }
              >
                <X size={14} />
              </button>
            </div>
          )}
          {fontOpen ? (
            <FontDropdown {...controls} onChoose={closeFont} />
          ) : sizeOpen ? (
            <SizeDropdown {...controls} onChoose={() => setSizeOpen(false)} />
          ) : color ? (
            <ColorPalette
              value={value(color)}
              kind={color}
              onChange={(v) => patch({ [color]: v })}
              onChoose={() => setColor(null)}
            />
          ) : detail === 'stroke' ? (
            <StrokeControls {...controls} />
          ) : detail === 'text' ? (
            typography(false)
          ) : detail === 'arrows' ? (
            arrowChoices
          ) : (
            <AlignmentGrid {...controls} />
          )}
        </div>
      )}
      {popover && placement?.popover && (
        <svg
          className="popover-connector"
          data-testid="popover-connector"
          aria-hidden="true"
          width="24"
          height={PANEL_GAP}
          viewBox={`0 0 24 ${PANEL_GAP}`}
          style={{
            left: placement.connectorX - placement.toolbar.x - 12,
            top: placement.direction === 'up' ? -PANEL_GAP : placement.toolbar.h,
          }}
        >
          <path d={`M0 0 H24 L12 ${PANEL_GAP / 2} Z M12 ${PANEL_GAP / 2} L24 ${PANEL_GAP} H0 Z`} />
        </svg>
      )}
    </div>
  );
}
