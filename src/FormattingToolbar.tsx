import {
  useEffect,
  useId,
  useRef,
  useState,
  useImperativeHandle,
  type Ref,
  type ReactNode,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ClipboardPaste,
  Copy,
  EllipsisVertical,
  Minus,
  IterationCw,
  Paintbrush,
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
  FontSizeStepper,
  SizeDropdown,
  SizeChoices,
  StrokeControls,
  StrokeSample,
  type ColorKey,
  type StrokeChoicePatch,
} from './FormattingControls';

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
      data-icon="arrow-both"
    >
      <path d="M4 12h16" />
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
    </svg>
  );
}

export interface FormattingToolbarHandle {
  dismiss: () => boolean;
  dismissPopovers: () => void;
}
interface Props {
  ref?: Ref<FormattingToolbarHandle>;
  onEscape: () => void;
  objects: DiagramObject[];
  editing: boolean;
  behavior: PanelBehavior;
  showPopoverHeaders?: boolean;
  mergeStrokeControls?: boolean;
  groupedTextToolbar?: boolean;
  compactTextAlignment?: boolean;
  fontSizeStepper?: boolean;
  showDropdownArrows?: boolean;
  showMoreActions?: boolean;
  detail: Detail;
  setDetail: (detail: Detail) => void;
  patch: (patch: Partial<Style>) => void;
  patchColor: (key: ColorKey, value: string) => void;
  patchStroke: (patch: StrokeChoicePatch) => void;
  patchObjects: (patch: Partial<DiagramObject>) => void;
  cycleArrows: () => void;
  selection: Rect;
  viewport: Rect;
  finishEditing: () => void;
  setDefaultStyle: () => void;
  copyStyle: () => void;
  pasteStyle: () => void;
  canPasteStyle: boolean;
}
export default function FormattingToolbar(props: Props) {
  const { objects, editing, behavior, detail, setDetail, patch, selection, viewport } = props;
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const styleCopyShortcut = `${isMac ? 'Cmd' : 'Ctrl'}+${isMac ? 'Option' : 'Alt'}+C`;
  const stylePasteShortcut = `${isMac ? 'Cmd' : 'Ctrl'}+${isMac ? 'Option' : 'Alt'}+V`;
  const context = toolbarContext(objects);
  const strokeColorIsMerged =
    (props.mergeStrokeControls ?? true) &&
    context.stroke &&
    (behavior === 'flat' || behavior === 'inline');
  const compactTextAlignmentPreference = props.compactTextAlignment ?? true;
  const value = <K extends keyof Style>(key: K) => commonValue(objects, key);
  const controls = { value, patch };
  const root = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [color, setColor] = useState<ColorKey | null>(null);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [flatText, setFlatText] = useState(false);
  const [groupedTextObjectFlat, setGroupedTextObjectFlat] = useState(true);
  const groupedEditingTextMode =
    behavior === 'grouped' && editing && (props.groupedTextToolbar ?? true);
  const groupedTextObjectMode =
    behavior === 'grouped' &&
    !editing &&
    context.textOnly &&
    (props.groupedTextToolbar ?? true) &&
    groupedTextObjectFlat;
  const groupedFlatTextMode = groupedEditingTextMode || groupedTextObjectMode;
  const compactTextAlignment =
    compactTextAlignmentPreference &&
    (behavior === 'flat' || behavior === 'inline' || groupedFlatTextMode);
  const textMode =
    (behavior === 'flat' && (editing || flatText || context.textOnly)) || groupedFlatTextMode;
  const visibleDetail = groupedFlatTextMode && detail === 'text' ? null : detail;
  const alignmentPopoverOpen = compactTextAlignment && visibleDetail === 'alignment';
  const flatDetail =
    behavior === 'flat' &&
    !textMode &&
    ((detail === 'stroke' && context.stroke) ||
      (detail === 'alignment' && context.alignment && !compactTextAlignment) ||
      (detail === 'arrows' && context.direction))
      ? detail
      : null;
  const activeTrigger = moreOpen
    ? 'more-actions'
    : fontOpen
      ? 'font-family'
      : sizeOpen
        ? 'font-size'
        : color
          ? `color-${color}`
          : behavior === 'grouped' || alignmentPopoverOpen
            ? visibleDetail
            : null;
  const placement = usePanelPlacement(toolbar, panel, selection, viewport, activeTrigger);
  // Browsing text formatting is distinct from editing the actual label.
  useEffect(() => {
    setSizeOpen(false);
    setFontOpen(false);
    setColor(null);
    setMoreOpen(false);
    setFlatText(false);
  }, [behavior, editing]);
  useEffect(() => {
    setGroupedTextObjectFlat(true);
  }, [behavior, props.groupedTextToolbar]);
  useEffect(() => {
    if (!props.showMoreActions) setMoreOpen(false);
  }, [props.showMoreActions]);
  useEffect(() => {
    if (props.fontSizeStepper && (behavior === 'inline' || textMode)) setSizeOpen(false);
  }, [props.fontSizeStepper, behavior, textMode]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (root.current?.contains(event.target as Node)) return;
      setSizeOpen(false);
      setFontOpen(false);
      setColor(null);
      setMoreOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  const toggleGroup = (next: Detail) => {
    setSizeOpen(false);
    setFontOpen(false);
    setColor(null);
    setMoreOpen(false);
    setDetail(detail === next ? null : next);
  };
  const showColor = (key: ColorKey) => {
    setSizeOpen(false);
    setFontOpen(false);
    setMoreOpen(false);
    if (behavior === 'grouped' || alignmentPopoverOpen) setDetail(null);
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
      showDropdownArrow={props.showDropdownArrows}
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
  const closeMore = () => {
    setMoreOpen(false);
    toolbar.current
      ?.querySelector<HTMLButtonElement>('[data-popover-trigger="more-actions"]')
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
  useEffect(() => {
    if (moreOpen)
      panel.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus({
        preventScroll: true,
      });
  }, [moreOpen]);
  const fontControl = (
    <FontControl
      value={value}
      active={fontOpen}
      controlsId={panelId}
      showDropdownArrow={props.showDropdownArrows}
      onClick={() => {
        setSizeOpen(false);
        setColor(null);
        setMoreOpen(false);
        if (alignmentPopoverOpen) setDetail(null);
        setFontOpen(!fontOpen);
      }}
    />
  );
  const sizeControl = (
    <button
      className={`property-button size-dropdown-trigger ${props.showDropdownArrows ? '' : 'without-dropdown-arrow'} ${sizeOpen ? 'active' : ''}`}
      aria-label="Font size"
      title="Font size"
      aria-expanded={sizeOpen}
      aria-controls={sizeOpen ? panelId : undefined}
      data-popover-trigger="font-size"
      onClick={() => {
        setColor(null);
        setFontOpen(false);
        setMoreOpen(false);
        if (alignmentPopoverOpen) setDetail(null);
        setSizeOpen(!sizeOpen);
      }}
    >
      <span>{value('fontSize') ?? 'Mixed'}</span>
      {props.showDropdownArrows && <ChevronDown size={11} aria-hidden="true" />}
    </button>
  );
  const fontSizeStepperControl = <FontSizeStepper {...controls} />;

  const typography = (inline: boolean) => (
    <div className={inline ? 'inline-text-controls' : 'grouped-text-controls'}>
      <div className="detail-row">
        <span>Font</span>
        {inline ? fontControl : <FontChoices {...controls} />}
        {inline &&
          (props.fontSizeStepper && behavior === 'inline' ? fontSizeStepperControl : sizeControl)}
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
  function group(
    id: Exclude<Detail, null>,
    label: string,
    summary: ReactNode,
    content: ReactNode,
    presentation: PanelBehavior = behavior,
  ) {
    const expanded = detail === id;
    return (
      <div
        className={`format-group ${expanded && presentation === 'inline' ? 'expanded-inline-group' : ''}`}
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
                : id === 'stroke'
                  ? `Stroke: ${strokeMixed ? 'Mixed' : value('stroke') === 'transparent' ? 'No border' : value('pattern')}`
                  : `${label} settings`
          }
          aria-expanded={expanded}
          aria-controls={expanded && presentation === 'grouped' ? panelId : undefined}
          data-popover-trigger={id}
          onClick={() => toggleGroup(id)}
        >
          {summary}
          {presentation === 'flat' ? (
            <ChevronRight size={11} />
          ) : presentation === 'inline' ? (
            <ChevronLeft size={11} />
          ) : id === 'stroke' || id === 'text' || props.showDropdownArrows ? (
            <ChevronDown size={11} />
          ) : null}
        </button>
        {expanded && presentation === 'inline' && (
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
    strokeMixed ? (
      <span className="stroke-summary mixed">
        <span className="property-value">Mixed</span>
      </span>
    ) : value('stroke') === 'transparent' ? (
      <span className="stroke-summary no-border" data-testid="stroke-summary-none">
        <svg
          className="no-border-sample"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="12" height="12" rx="1" />
          <path d="M3.5 14.5 14.5 3.5" />
        </svg>
      </span>
    ) : (
      <span className="stroke-summary" data-testid="stroke-summary-line">
        <StrokeSample color={value('stroke')} width={value('width')} pattern={value('pattern')} />
      </span>
    ),
    <>
      {strokeColorIsMerged && colorControl('stroke', context.lineColor ? 'Line' : 'Stroke')}
      <StrokeControls {...controls} patchStroke={props.patchStroke} inline />
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
    compactTextAlignment ? 'grouped' : behavior,
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
          : BidirectionalArrow;
  const nextArrows =
    arrowState === 'mixed' ? 'none' : arrowStyles[(arrowStyles.indexOf(arrowState) + 1) % 4];
  const arrowChoices = (
    <div className="segmented arrow-choices" role="group" aria-label="Connection arrow style">
      {arrowStyles.map((arrowStyle) => {
        const Icon = { none: Minus, left: ArrowLeft, right: ArrowRight, both: BidirectionalArrow }[
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
              if (behavior === 'grouped') setDetail(null);
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
      <IterationCw size={18} data-icon="iterate-arrow-states" />
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
    setGroupedTextObjectFlat(false);
    setColor(null);
    setMoreOpen(false);
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
      {(!context.textOnly || behavior === 'grouped') && backToObject}
      {fontControl}
      {props.fontSizeStepper ? fontSizeStepperControl : sizeControl}
      <span className="divider" />
      <EmphasisControls {...controls} />
      {colorControl('textColor', 'Text')}
      {context.alignment &&
        (compactTextAlignment ? (
          alignGroup
        ) : (
          <>
            <span className="divider" />
            <AlignmentControls {...controls} />
            <AlignmentControls {...controls} vertical />
          </>
        ))}
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
            {strokeColorIsMerged && colorControl('stroke', context.lineColor ? 'Line' : 'Stroke')}
            <StrokeControls {...controls} patchStroke={props.patchStroke} inline />
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
      {(context.symbolColor || (context.lineColor && !strokeColorIsMerged)) &&
        colorControl('stroke', context.symbolColor ? 'Symbol' : 'Line')}
      {context.stroke && (
        <>
          {!context.lineColor && !strokeColorIsMerged && colorControl('stroke', 'Stroke')}
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
                setMoreOpen(false);
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
  const styleKeys = Object.keys(objects[0]?.style ?? {}) as (keyof Style)[];
  const uniformStyle = styleKeys.length > 0 && styleKeys.every((key) => value(key) !== undefined);
  const uniformKind =
    objects.length > 0 && objects.every((object) => object.kind === objects[0].kind);
  const moreActionsControl = props.showMoreActions && (
    <>
      <span className="divider toolbar-end-divider" />
      <button
        className={`icon-button more-actions-trigger ${moreOpen ? 'active' : ''}`}
        aria-label="More formatting actions"
        title="More formatting actions"
        aria-haspopup="menu"
        aria-expanded={moreOpen}
        aria-controls={moreOpen ? panelId : undefined}
        data-popover-trigger="more-actions"
        onClick={() => {
          const opening = !moreOpen;
          setSizeOpen(false);
          setFontOpen(false);
          setColor(null);
          if (opening && (behavior === 'grouped' || alignmentPopoverOpen)) setDetail(null);
          setMoreOpen(opening);
        }}
      >
        <EllipsisVertical size={18} />
      </button>
    </>
  );
  const moreActionsMenu = (
    <div className="more-actions-menu">
      <button
        role="menuitem"
        disabled={!uniformStyle || !uniformKind}
        title={
          uniformStyle && uniformKind
            ? 'Use this style for new objects of the same kind'
            : 'Select objects of one kind with the same style'
        }
        onClick={() => {
          props.setDefaultStyle();
          closeMore();
        }}
      >
        <Paintbrush size={16} />
        Set default style
      </button>
      <button
        role="menuitem"
        disabled={!uniformStyle}
        title={
          uniformStyle
            ? `Copy the selected formatting · ${styleCopyShortcut}`
            : 'Select objects with the same style'
        }
        onClick={() => {
          props.copyStyle();
          closeMore();
        }}
      >
        <Copy size={16} />
        Copy style
        <span className="menu-shortcut" aria-hidden="true">
          {styleCopyShortcut}
        </span>
      </button>
      <button
        role="menuitem"
        disabled={!props.canPasteStyle}
        title={
          props.canPasteStyle
            ? `Apply the copied formatting · ${stylePasteShortcut}`
            : 'Copy a style first'
        }
        onClick={() => {
          props.pasteStyle();
          closeMore();
        }}
      >
        <ClipboardPaste size={16} />
        Paste style
        <span className="menu-shortcut" aria-hidden="true">
          {stylePasteShortcut}
        </span>
      </button>
    </div>
  );
  const popoverTitle = fontOpen
    ? 'Font style'
    : moreOpen
      ? 'More actions'
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
  const popover =
    moreOpen ||
    fontOpen ||
    sizeOpen ||
    color ||
    alignmentPopoverOpen ||
    (visibleDetail && behavior === 'grouped');
  const dismiss = () => {
    if (fontOpen) closeFont();
    else if (moreOpen) closeMore();
    else if (
      sizeOpen ||
      color ||
      alignmentPopoverOpen ||
      (visibleDetail && behavior === 'grouped')
    ) {
      setSizeOpen(false);
      setColor(null);
      if (alignmentPopoverOpen || (visibleDetail && behavior === 'grouped')) setDetail(null);
      toolbar.current
        ?.querySelector<HTMLButtonElement>(`[data-popover-trigger="${activeTrigger}"]`)
        ?.focus({ preventScroll: true });
    } else if (!editing && (visibleDetail || flatText || groupedTextObjectMode)) {
      returnToObject();
    } else return false;
    return true;
  };
  useImperativeHandle(props.ref, () => ({
    dismiss,
    dismissPopovers: () => {
      setFontOpen(false);
      setSizeOpen(false);
      setColor(null);
      setMoreOpen(false);
      if (alignmentPopoverOpen || behavior === 'grouped') setDetail(null);
    },
  }));
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
      onPointerDown={(e) => {
        e.stopPropagation();
        // Pointer formatting keeps the native label selection and caret intact.
        if (
          editing &&
          (e.target as Element).closest('button') &&
          document.activeElement?.matches('[data-label-editing="true"]')
        )
          e.preventDefault();
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        e.stopPropagation();
        props.onEscape();
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
        {moreActionsControl}
      </div>
      {popover && (
        <div
          key={activeTrigger}
          ref={panel}
          id={panelId}
          className={`formatting-popover ${moreOpen ? 'more-actions-popover' : fontOpen ? 'font-popover' : sizeOpen ? 'size-popover' : color ? 'color-popover' : ''}`}
          role={moreOpen ? 'menu' : 'group'}
          aria-label={popoverTitle}
          data-testid="formatting-popover"
          style={{
            left: placement?.popover ? placement.popover.x - placement.toolbar.x : 0,
            top: placement?.popover ? placement.popover.y - placement.toolbar.y : 0,
            width: Math.min(
              moreOpen
                ? 204
                : fontOpen || sizeOpen
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
          {!moreOpen && props.showPopoverHeaders !== false && (
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
          {moreOpen ? (
            moreActionsMenu
          ) : fontOpen ? (
            <FontDropdown {...controls} onChoose={closeFont} />
          ) : sizeOpen ? (
            <SizeDropdown {...controls} onChoose={() => setSizeOpen(false)} />
          ) : color ? (
            <ColorPalette
              value={value(color)}
              kind={color}
              onChange={(v) => props.patchColor(color, v)}
              onChoose={() => setColor(null)}
            />
          ) : detail === 'stroke' ? (
            <StrokeControls {...controls} patchStroke={props.patchStroke} />
          ) : detail === 'text' ? (
            typography(false)
          ) : detail === 'arrows' ? (
            arrowChoices
          ) : (
            <AlignmentGrid {...controls} onChoose={() => setDetail(null)} />
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
