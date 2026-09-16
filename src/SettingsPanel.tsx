import { useRef, useEffect, useCallback, useImperativeHandle, useState, type Ref } from 'react';
import { ArrowLeft, ArrowRight, Check, IterationCw, Link2, Minus, Plus, Search, X } from 'lucide-react';
import {
  arrowStyles,
  connectionArrows,
  commonValue,
  isLine,
  type DiagramObject,
  type Style,
} from './model';
import { toolbarContext } from './toolbarModel';
import {
  AlignmentGrid,
  EmphasisControls,
  FontChoices,
  FontSizeStepper,
  SizeChoices,
  StrokeControls,
  type ColorKey,
  type StrokeChoicePatch,
} from './FormattingControls';
import { listenForColorCommit } from './customColors';
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

const FILL_STROKE_PRESETS = [
  'transparent',
  '#ffffff',
  '#e2e8f0',
  '#64748b',
  '#0f172a',
  '#e11d48',
  '#2563eb',
];

const TEXT_PRESETS = [
  '#0f172a',
  '#334155',
  '#64748b',
  '#ffffff',
  '#e11d48',
  '#2563eb',
  '#15803d',
];

function InlinePalette({
  value,
  kind,
  onChange,
}: {
  value?: string;
  kind: ColorKey;
  onChange: (color: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const commit = useCallback((color: string) => onChange(color), [onChange]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (picker) return listenForColorCommit(picker, commit);
  }, [commit]);

  const presets = kind === 'textColor' ? TEXT_PRESETS : FILL_STROKE_PRESETS;
  const noColorLabel = kind === 'fill' ? 'No fill' : kind === 'stroke' ? 'No stroke' : '';
  const isCustom = value !== undefined && !presets.includes(value);

  return (
    <div className="sp-inline-palette">
      {presets.map((color) => {
        const isNone = color === 'transparent';
        const selected = value !== undefined && value === color;
        return (
          <button
            key={color}
            className={`color-swatch ${selected ? 'selected' : ''} ${isNone ? 'no-color' : ''}`}
            title={isNone ? noColorLabel : color.toUpperCase()}
            aria-label={isNone ? noColorLabel : color}
            aria-pressed={selected}
            style={isNone ? undefined : { backgroundColor: color }}
            onClick={() => onChange(color)}
          >
            {selected && !isNone && <Check size={11} strokeWidth={3} />}
          </button>
        );
      })}
      <label
        className={`color-swatch sp-custom-swatch ${isCustom ? 'selected' : ''}`}
        title="Custom color"
        aria-label="Custom color"
        style={isCustom && value ? { backgroundColor: value } : undefined}
      >
        {isCustom && value ? (
          <Check size={11} strokeWidth={3} />
        ) : (
          <Plus size={11} strokeWidth={2.5} />
        )}
        <input
          ref={pickerRef}
          type="color"
          className="sp-hidden-picker"
          value={value?.startsWith('#') ? value : '#4f86e0'}
          onChange={() => {}}
          aria-hidden="true"
          tabIndex={-1}
        />
      </label>
    </div>
  );
}

const PORT_PRESETS = ['I2C', 'SPI', 'UART', 'USB', 'CAN', 'GPIO', 'Ethernet', 'PWM', 'ADC', 'JTAG'];

function PortSection({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="sp-section">
      <div className="sp-label">PORT</div>
      {items.length > 0 && (
        <div className="sp-chips">
          {items.map((name, i) => (
            <div key={i} className="sp-chip sp-chip-port">
              <span className="sp-chip-name">{name}</span>
              <div className="sp-chip-actions">
                <button
                  className="sp-chip-remove"
                  aria-label={`Remove ${name}`}
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <select
        className="sp-port-select"
        value=""
        onChange={(e) => {
          const val = e.target.value;
          if (val && !items.includes(val)) onChange([...items, val]);
        }}
      >
        <option value="">Add port…</option>
        {PORT_PRESETS.filter((p) => !items.includes(p)).map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
}

function ComponentSection({
  label,
  items,
  onChange,
  colorClass,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  colorClass: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const name = draft.trim();
    if (name) {
      onChange([...items, name]);
      setDraft('');
    }
  };
  return (
    <div className="sp-section">
      <div className="sp-label">{label}</div>
      {items.length > 0 && (
        <div className="sp-chips">
          {items.map((name, i) => (
            <div key={i} className={`sp-chip ${colorClass}`}>
              <span className="sp-chip-name">{name}</span>
              <div className="sp-chip-actions">
                <button className="sp-chip-search" aria-label={`Search ${name}`} title="Search part">
                  <Search size={10} strokeWidth={2} />
                </button>
                <button
                  className="sp-chip-remove"
                  aria-label={`Remove ${name}`}
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="sp-add-row">
        <input
          type="text"
          className="sp-add-input"
          placeholder="Component name…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button className="sp-add-btn" onClick={add} disabled={!draft.trim()}>
          <Plus size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

interface Props {
  ref?: Ref<FormattingToolbarHandle>;
  objects: DiagramObject[];
  fontSizeStepper?: boolean;
  patch: (patch: Partial<Style>) => void;
  patchColor: (key: ColorKey, value: string) => void;
  patchStroke: (patch: StrokeChoicePatch) => void;
  patchObjects: (patch: Partial<DiagramObject>) => void;
  cycleArrows: () => void;
  panelRight: number;
}

export default function SettingsPanel({
  ref,
  objects,
  fontSizeStepper,
  patch,
  patchColor,
  patchStroke,
  patchObjects,
  cycleArrows,
  panelRight,
}: Props) {
  const context = toolbarContext(objects);
  const value = <K extends keyof Style>(key: K) => commonValue(objects, key);
  const root = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    dismiss: () => false,
    dismissPopovers: () => {},
  }));

  const arrowState =
    objects.length > 0 &&
    objects.every((o) => connectionArrows(o) === connectionArrows(objects[0]))
      ? connectionArrows(objects[0])
      : 'mixed';

  const nextArrows =
    arrowState === 'mixed' ? 'none' : arrowStyles[(arrowStyles.indexOf(arrowState) + 1) % 4];

  return (
    <div
      ref={root}
      className="settings-panel floating-card"
      style={{ right: panelRight }}
      role="region"
      aria-label="Object properties"
    >
      <div className="sp-header">Properties</div>

      {context.fill && (
        <div className="sp-section">
          <div className="sp-label">FILL</div>
          <InlinePalette
            value={value('fill')}
            kind="fill"
            onChange={(color) => patchColor('fill', color)}
          />
        </div>
      )}

      {(context.stroke || context.lineColor) && (
        <div className="sp-section">
          <div className="sp-label">STROKE</div>
          {context.stroke && (
            <InlinePalette
              value={value('stroke')}
              kind="stroke"
              onChange={(color) => patchColor('stroke', color)}
            />
          )}
          <StrokeControls value={value} patch={patch} patchStroke={patchStroke} />
        </div>
      )}

      {context.text && (
        <div className="sp-section">
          <div className="sp-label">TEXT</div>
          <FontChoices value={value} patch={patch} />
          {fontSizeStepper ? (
            <FontSizeStepper value={value} patch={patch} />
          ) : (
            <SizeChoices value={value} patch={patch} />
          )}
          <EmphasisControls value={value} patch={patch} />
          <div className="sp-label">TEXT COLOR</div>
          <InlinePalette
            value={value('textColor')}
            kind="textColor"
            onChange={(color) => patchColor('textColor', color)}
          />
        </div>
      )}

      {context.alignment && (
        <div className="sp-section">
          <div className="sp-label">ALIGNMENT</div>
          <AlignmentGrid value={value} patch={patch} />
        </div>
      )}

      {context.direction && (
        <div className="sp-section">
          <div className="sp-label">ARROWS</div>
          <div className="segmented arrow-choices" role="group" aria-label="Connection arrow style">
            {arrowStyles.map((arrowStyle) => {
              const Icon = {
                none: Minus,
                left: ArrowLeft,
                right: ArrowRight,
                both: BidirectionalArrow,
              }[arrowStyle];
              return (
                <button
                  key={arrowStyle}
                  title={`Arrows: ${arrowStyle}`}
                  aria-label={`Arrows: ${arrowStyle}`}
                  aria-pressed={arrowState === arrowStyle}
                  onClick={() =>
                    patchObjects({
                      arrowStyle,
                      directional: arrowStyle !== 'none',
                      reversed: arrowStyle === 'left',
                    })
                  }
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
          <button
            className="icon-button sp-cycle-arrows"
            aria-label="Cycle connection arrows"
            title={`Current: ${arrowState}. Click for ${nextArrows}.`}
            onClick={cycleArrows}
          >
            <IterationCw size={16} />
            <span>Cycle arrows</span>
          </button>
        </div>
      )}

      {objects.length === 1 && !isLine(objects[0]) && (
        <>
          <PortSection
            items={objects[0].ports ?? []}
            onChange={(items) => patchObjects({ ports: items.length ? items : undefined })}
          />
          <ComponentSection
            label="HARDWARE COMPONENTS"
            items={objects[0].hardwareComponents ?? []}
            onChange={(items) =>
              patchObjects({ hardwareComponents: items.length ? items : undefined })
            }
            colorClass="sp-chip-hw"
          />
          <ComponentSection
            label="SOFTWARE COMPONENTS"
            items={objects[0].softwareComponents ?? []}
            onChange={(items) =>
              patchObjects({ softwareComponents: items.length ? items : undefined })
            }
            colorClass="sp-chip-sw"
          />
          <div className="sp-section">
            <div className="sp-label">LINK</div>
            <div className="sp-link-row">
              <Link2 size={13} className="sp-link-icon" />
              <input
                type="text"
                className="sp-link-input"
                placeholder="https:// or any URL"
                value={objects[0].hyperlink ?? ''}
                onChange={(e) =>
                  patchObjects({ hyperlink: e.target.value || undefined })
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
