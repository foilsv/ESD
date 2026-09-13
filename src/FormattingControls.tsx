import { useEffect, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Check,
  ChevronDown,
  Minus,
  PaintBucket,
  Plus,
  Type,
} from 'lucide-react';
import { fonts, patternDash, type FontFamily, type Pattern, type Style } from './model';

export const widths = [
  { value: 1, label: 'Small' },
  { value: 2, label: 'Medium' },
  { value: 4, label: 'Large' },
  { value: 8, label: 'Extra large' },
];
export type Value = <K extends keyof Style>(key: K) => Style[K] | undefined;
export interface ControlProps {
  value: Value;
  patch: (patch: Partial<Style>) => void;
}
export type ColorKey = 'fill' | 'stroke' | 'textColor';

export function StrokeSample({
  color = '#475569',
  width = 2,
  pattern = 'solid',
}: {
  color?: string;
  width?: number;
  pattern?: Pattern;
}) {
  return (
    <svg width="30" height="18" aria-hidden="true">
      <path
        d="M 2 9 H 28"
        fill="none"
        stroke={color}
        strokeWidth={width === 0 ? 1 : width}
        strokeDasharray={width === 0 ? '2 3' : patternDash(pattern)}
        strokeLinecap="round"
        opacity={width === 0 ? 0.4 : 1}
      />
    </svg>
  );
}
export function Palette({
  value,
  label,
  colors,
  onChange,
}: {
  value?: string;
  label: string;
  colors: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="palette" role="group" aria-label={label}>
      {colors.map((color) => (
        <button
          key={color}
          title={`${label}: ${color}`}
          aria-label={`${label} ${color}`}
          aria-pressed={value === color}
          className={`swatch ${value === color ? 'selected' : ''}`}
          style={{ '--swatch': color } as React.CSSProperties}
          onClick={() => onChange(color)}
        >
          {value === color && <Check size={12} />}
        </button>
      ))}
    </div>
  );
}
export function ColorButton({
  value,
  label,
  kind,
  active,
  onClick,
  controlsId,
}: {
  value?: string;
  label: string;
  kind: ColorKey;
  active: boolean;
  onClick: () => void;
  controlsId?: string;
}) {
  return (
    <button
      className={`property-button color-property ${active ? 'active' : ''}`}
      aria-label={`${label} color`}
      title={`${label} color: ${value ?? 'Mixed'}`}
      aria-expanded={active}
      aria-controls={active ? controlsId : undefined}
      data-popover-trigger={`color-${kind}`}
      onClick={onClick}
    >
      <span className="color-state">
        {kind === 'fill' ? (
          <PaintBucket size={17} />
        ) : kind === 'textColor' ? (
          <Type size={17} />
        ) : (
          <span className="outline-color-icon" />
        )}
        <i
          style={{
            background: value ?? 'repeating-linear-gradient(45deg,#94a3b8 0 3px,#fff 3px 6px)',
          }}
        />
      </span>
      {value === undefined && <span className="mixed-label">Mixed</span>}
      <ChevronDown size={10} />
    </button>
  );
}
export function ColorInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div className="hex-control">
      <input
        type="color"
        aria-label="Pick custom color"
        value={value?.startsWith('#') ? value : '#ffffff'}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        aria-label="Hex color"
        key={value}
        defaultValue={value?.startsWith('#') ? value : ''}
        placeholder={value === undefined ? 'Mixed' : '#ffffff'}
        maxLength={7}
        onBlur={(e) => {
          const color = e.target.value.trim();
          if (/^#[0-9a-f]{6}$/i.test(color)) onChange(color);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </div>
  );
}
export function FontControl({
  value,
  active,
  onClick,
  controlsId,
}: Pick<ControlProps, 'value'> & { active: boolean; onClick: () => void; controlsId: string }) {
  const family = value('fontFamily');
  return (
    <button
      type="button"
      className={`font-picker ${active ? 'active' : ''}`}
      aria-label="Font family"
      title={`Font style: ${family ? fonts[family].label : 'Mixed'}`}
      aria-expanded={active}
      aria-controls={active ? controlsId : undefined}
      data-popover-trigger="font-family"
      onClick={onClick}
    >
      <FontStyleIcon family={family} />
      <ChevronDown size={10} aria-hidden="true" />
    </button>
  );
}
export function FontDropdown({ value, patch, onChoose }: ControlProps & { onChoose: () => void }) {
  return (
    <div className="font-dropdown-options" role="group" aria-label="Font styles">
      {(Object.keys(fonts) as FontFamily[]).map((id) => (
        <button
          type="button"
          key={id}
          aria-label={fonts[id].label + ' font style'}
          aria-pressed={value('fontFamily') === id}
          onClick={() => {
            patch({ fontFamily: id });
            onChoose();
          }}
        >
          <FontStyleIcon family={id} />
          <span style={{ fontFamily: fonts[id].css }}>{fonts[id].label}</span>
          <span className="font-choice-check" aria-hidden="true">
            {value('fontFamily') === id && <Check size={14} />}
          </span>
        </button>
      ))}
    </div>
  );
}
export function FontChoices({ value, patch }: ControlProps) {
  const family = value('fontFamily');
  return (
    <div className="segmented font-style-choices" role="group" aria-label="Font family">
      {(Object.keys(fonts) as FontFamily[]).map((id) => (
        <button
          key={id}
          type="button"
          aria-label={fonts[id].label + ' font style'}
          title={fonts[id].label}
          aria-pressed={family === id}
          onClick={() => patch({ fontFamily: id })}
        >
          <span aria-hidden="true">
            <FontStyleIcon family={id} />
          </span>
        </button>
      ))}
    </div>
  );
}
function FontStyleIcon({ family }: { family?: FontFamily }) {
  return (
    <svg
      width="24"
      height="22"
      viewBox="0 0 24 22"
      aria-hidden="true"
      className="font-style-icon"
      data-font-style={family ?? 'mixed'}
    >
      {family === 'normal' ? (
        <text x="2" y="16" fontFamily={fonts.normal.css} fontSize="15" fontWeight="500">
          Aa
        </text>
      ) : family === 'classic' ? (
        <>
          <text x="6" y="16" fontFamily={fonts.classic.css} fontSize="17">
            A
          </text>
          <path d="M4 19h16" />
        </>
      ) : family === 'compact' ? (
        <>
          <text x="6" y="17" fontFamily={fonts.compact.css} fontSize="20" fontWeight="600">
            A
          </text>
          <path d="M2 5v12M22 5v12" />
        </>
      ) : family === 'mono' ? (
        <>
          <text x="6" y="16" fontFamily={fonts.mono.css} fontSize="15">
            A
          </text>
          <path d="M4 4H1v15h3M20 4h3v15h-3" />
        </>
      ) : (
        <path d="M4 7h16M4 15h16" />
      )}
    </svg>
  );
}
export function SizeControl({ value, patch, custom = false }: ControlProps & { custom?: boolean }) {
  const apply = (rawValue: string) => {
    const fontSize = Number(rawValue);
    if (rawValue && Number.isFinite(fontSize))
      patch({ fontSize: Math.max(8, Math.min(72, fontSize)) });
  };
  return (
    <input
      className="font-size-input"
      aria-label={custom ? 'Custom font size' : 'Font size'}
      title={custom ? 'Custom font size (8–72 px)' : 'Font size'}
      key={value('fontSize')}
      type="number"
      min="8"
      max="72"
      placeholder="—"
      defaultValue={value('fontSize')}
      onBlur={(event) => apply(event.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}
export function stepFontSize(fontSize: number | undefined, delta: -1 | 1) {
  return fontSize === undefined ? undefined : Math.max(8, Math.min(72, fontSize + delta * 2));
}
export function FontSizeStepper({ value, patch }: ControlProps) {
  const fontSize = value('fontSize');
  const [draft, setDraft] = useState(fontSize?.toString() ?? '');
  useEffect(() => setDraft(fontSize?.toString() ?? ''), [fontSize]);
  const numericDraft = draft === '' ? undefined : Number(draft);
  const effectiveSize = Number.isFinite(numericDraft) ? numericDraft : fontSize;
  const canDecrease = effectiveSize !== undefined && effectiveSize > 8;
  const canIncrease = effectiveSize !== undefined && effectiveSize < 72;
  const commitDraft = () => {
    if (!Number.isFinite(numericDraft)) {
      setDraft(fontSize?.toString() ?? '');
      return;
    }
    const next = Math.max(8, Math.min(72, numericDraft!));
    setDraft(next.toString());
    if (next !== fontSize) patch({ fontSize: next });
  };
  const step = (delta: -1 | 1) => {
    const next = stepFontSize(effectiveSize, delta);
    if (next === undefined) return;
    setDraft(next.toString());
    patch({ fontSize: next });
  };
  return (
    <div className="font-size-stepper" role="group" aria-label="Font size controls">
      <button
        className="icon-button font-size-step-button"
        aria-label="Decrease font size"
        title="Decrease font size by 2 px"
        disabled={!canDecrease}
        onClick={() => step(-1)}
      >
        <Minus size={16} />
      </button>
      <input
        className="font-size-input"
        aria-label="Font size"
        title="Font size (8–72 px)"
        type="number"
        min="8"
        max="72"
        placeholder="—"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
      />
      <button
        className="icon-button font-size-step-button"
        aria-label="Increase font size"
        title="Increase font size by 2 px"
        disabled={!canIncrease}
        onClick={() => step(1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
export const fontSizePresets = [
  { label: 'Small', size: 12, iconSize: 12 },
  { label: 'Medium', size: 16, iconSize: 16 },
  { label: 'Large', size: 20, iconSize: 20 },
  { label: 'Extra large', size: 28, iconSize: 24 },
];
export function SizeChoices({ value, patch }: ControlProps) {
  return (
    <div className="font-size-choices" role="group" aria-label="Font size">
      <div className="segmented font-size-presets">
        {fontSizePresets.map(({ label, size, iconSize }) => (
          <button
            key={size}
            aria-label={`${label} font size`}
            title={`${label} · ${size} px`}
            aria-pressed={value('fontSize') === size}
            onClick={() => patch({ fontSize: size })}
          >
            <span aria-hidden="true" style={{ fontSize: iconSize }}>
              A
            </span>
          </button>
        ))}
      </div>
      <SizeControl value={value} patch={patch} custom />
    </div>
  );
}
export function SizeDropdown({ value, patch, onChoose }: ControlProps & { onChoose: () => void }) {
  return (
    <div className="size-dropdown-options">
      {fontSizePresets.map(({ label, size, iconSize }) => (
        <button
          key={size}
          aria-label={`${label} font size`}
          aria-pressed={value('fontSize') === size}
          onClick={() => {
            patch({ fontSize: size });
            onChoose();
          }}
        >
          <span className="size-letter" aria-hidden="true" style={{ fontSize: iconSize }}>
            A
          </span>
          <span>{label}</span>
          <span className="size-pixels">{size}</span>
        </button>
      ))}
      <div className="size-custom-row">
        <span>Custom</span>
        <SizeControl value={value} patch={patch} custom />
      </div>
    </div>
  );
}
export function EmphasisControls({ value, patch }: ControlProps) {
  return (
    <div className="control-cluster" role="group" aria-label="Text emphasis">
      {(
        [
          { key: 'bold', label: 'Bold', shortcut: 'Ctrl/Cmd+B', Icon: Bold },
          { key: 'italic', label: 'Italic', shortcut: 'Ctrl/Cmd+I', Icon: Italic },
          { key: 'underline', label: 'Underline', shortcut: 'Ctrl/Cmd+U', Icon: Underline },
          { key: 'strikethrough', label: 'Strikethrough', shortcut: '', Icon: Strikethrough },
        ] as const
      ).map(({ key, label, shortcut, Icon }) => (
        <button
          className={`icon-button ${value(key) ? 'active' : ''}`}
          key={key}
          title={shortcut ? `${label} · ${shortcut}` : label}
          aria-label={label}
          aria-pressed={value(key) ?? 'mixed'}
          onClick={() => patch({ [key]: !value(key) })}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
export function AlignmentControls({
  value,
  patch,
  vertical = false,
}: ControlProps & { vertical?: boolean }) {
  return (
    <div
      className="segmented alignment-choices"
      role="group"
      aria-label={vertical ? 'Vertical alignment' : 'Horizontal alignment'}
    >
      {vertical
        ? (
            [
              { id: 'top', Icon: AlignVerticalJustifyStart },
              { id: 'middle', Icon: AlignVerticalJustifyCenter },
              { id: 'bottom', Icon: AlignVerticalJustifyEnd },
            ] as const
          ).map(({ id, Icon }) => (
            <button
              key={id}
              title={`Align ${id}`}
              aria-label={`Align ${id}`}
              aria-pressed={value('verticalAlign') === id}
              onClick={() => patch({ verticalAlign: id })}
            >
              <Icon size={16} />
            </button>
          ))
        : (
            [
              { id: 'left', Icon: AlignLeft },
              { id: 'center', Icon: AlignCenter },
              { id: 'right', Icon: AlignRight },
            ] as const
          ).map(({ id, Icon }) => (
            <button
              key={id}
              title={`Align ${id}`}
              aria-label={`Align ${id}`}
              aria-pressed={value('align') === id}
              onClick={() => patch({ align: id })}
            >
              <Icon size={16} />
            </button>
          ))}
    </div>
  );
}
export function AlignmentStateIcon({
  align,
  verticalAlign,
  size = 20,
}: {
  align?: Style['align'];
  verticalAlign?: Style['verticalAlign'];
  size?: number;
}) {
  const mixed = !align || !verticalAlign;
  const startY = verticalAlign === 'top' ? 5 : verticalAlign === 'bottom' ? 14 : 9;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      aria-hidden="true"
      data-alignment={mixed ? 'mixed' : `${verticalAlign}-${align}`}
    >
      {mixed ? (
        <path d="M4 7h16M7 12h10M4 17h16" strokeDasharray="2 3" />
      ) : (
        <>
          {[14, 9, 12].map((width, i) => {
            const x = align === 'left' ? 5 : align === 'right' ? 19 - width : (24 - width) / 2;
            return <path key={i} d={`M${x} ${startY + i * 2.5}h${width}`} />;
          })}
          {verticalAlign === 'top' && <path d="M5 2h14M12 21v-7m-3 3 3-3 3 3" />}
          {verticalAlign === 'bottom' && <path d="M5 22h14M12 2v7m-3-3 3 3 3-3" />}
        </>
      )}
    </svg>
  );
}
export function AlignmentGrid({
  value,
  patch,
  onChoose,
}: ControlProps & { onChoose?: () => void }) {
  return (
    <div className="alignment-grid" role="group" aria-label="Text position">
      {(['top', 'middle', 'bottom'] as const).flatMap((verticalAlign) =>
        (['left', 'center', 'right'] as const).map((align) => (
          <button
            key={`${verticalAlign}-${align}`}
            title={`Align ${verticalAlign} ${align}`}
            aria-label={`Align ${verticalAlign} ${align}`}
            aria-pressed={value('align') === align && value('verticalAlign') === verticalAlign}
            onClick={() => {
              patch({ align, verticalAlign });
              onChoose?.();
            }}
          >
            <AlignmentStateIcon align={align} verticalAlign={verticalAlign} size={24} />
          </button>
        )),
      )}
    </div>
  );
}
export function StrokeControls({
  value,
  patch,
  inline = false,
}: ControlProps & { inline?: boolean }) {
  return (
    <div className={inline ? 'inline-stroke-controls' : 'grouped-stroke-controls'}>
      <div className="detail-row">
        <span>Pattern</span>
        <div className="segmented" role="group" aria-label="Stroke pattern">
          {(['solid', 'dashed', 'dotted'] as Pattern[]).map((pattern) => (
            <button
              key={pattern}
              title={`${pattern} stroke`}
              aria-label={`${pattern} stroke`}
              aria-pressed={value('pattern') === pattern}
              onClick={() => patch({ pattern })}
            >
              <StrokeSample pattern={pattern} />
            </button>
          ))}
        </div>
      </div>
      <div className="detail-row">
        <span>Width</span>
        <div className="segmented width-choices" role="group" aria-label="Stroke width">
          {widths.map(({ value: width, label }) => (
            <button
              key={width}
              title={`${label} · ${width} px`}
              aria-label={`${label} stroke width`}
              aria-pressed={value('width') === width}
              onClick={() => patch({ width })}
            >
              <StrokeSample width={width} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
