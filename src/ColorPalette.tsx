import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Plus, Pipette } from 'lucide-react';
import { type ColorKey } from './FormattingControls';
import {
  addCustomColor,
  customColorKey,
  listenForColorCommit,
  parseCustomColors,
} from './customColors';

const neutrals = [
  '#ffffff',
  '#f8fafc',
  '#e2e8f0',
  '#cbd5e1',
  '#94a3b8',
  '#64748b',
  '#334155',
  '#0f172a',
];
const hues = [
  '#fecdd3',
  '#fed7aa',
  '#fef3c7',
  '#d9f99d',
  '#dcfce7',
  '#cffafe',
  '#dbeafe',
  '#e9d5ff',
  '#fda4af',
  '#fdba74',
  '#fcd34d',
  '#a3e635',
  '#86efac',
  '#67e8f9',
  '#93c5fd',
  '#c4b5fd',
  '#e11d48',
  '#ea580c',
  '#d97706',
  '#65a30d',
  '#15803d',
  '#0891b2',
  '#2563eb',
  '#7c3aed',
];
function readCustomColors(): string[] {
  try {
    return parseCustomColors(localStorage.getItem(customColorKey));
  } catch {
    return parseCustomColors(null);
  }
}

type EyeDropperWindow = Window & {
  EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
};

export default function ColorPalette({
  value,
  kind,
  onChange,
  onChoose,
}: {
  value?: string;
  kind: ColorKey;
  onChange: (color: string) => void;
  onChoose: () => void;
}) {
  const [custom, setCustom] = useState(readCustomColors);
  const [notice, setNotice] = useState('');
  const customPicker = useRef<HTMLInputElement>(null);
  const label = kind === 'fill' ? 'Fill color' : kind === 'stroke' ? 'Stroke color' : 'Text color';
  const noColorLabel = kind === 'fill' ? 'No fill' : 'No stroke';
  const colors = [
    ...(kind === 'fill' || kind === 'stroke'
      ? ['transparent', ...neutrals.slice(0, 6), '#0f172a']
      : neutrals),
    ...hues,
  ];
  const chooseCustom = useCallback(
    (color: string) => {
      const normalized = color.toLowerCase();
      const next = addCustomColor(custom, normalized);
      setCustom(next);
      try {
        localStorage.setItem(customColorKey, JSON.stringify(next));
      } catch {
        /* Palette still works without storage. */
      }
      onChange(normalized);
    },
    [custom, onChange],
  );
  useEffect(() => {
    const picker = customPicker.current;
    if (picker) return listenForColorCommit(picker, chooseCustom);
  }, [chooseCustom]);
  const swatch = (color: string) => {
    const selected = value?.toLowerCase() === color;
    const rgb =
      color === 'transparent'
        ? [255, 255, 255]
        : [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    const dark = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 < 155;
    return (
      <button
        key={color}
        className={`color-swatch ${selected ? 'selected' : ''} ${color === 'transparent' ? 'no-color' : ''}`}
        aria-label={color === 'transparent' ? noColorLabel : `${label} ${color}`}
        title={color === 'transparent' ? noColorLabel : color.toUpperCase()}
        aria-pressed={selected}
        style={{ backgroundColor: color, color: dark ? '#fff' : '#263445' }}
        onClick={() => {
          onChange(color);
          onChoose();
        }}
      >
        {selected && <Check size={13} strokeWidth={2.5} />}
      </button>
    );
  };
  const EyeDropper =
    typeof window !== 'undefined' ? (window as EyeDropperWindow).EyeDropper : undefined;
  return (
    <div className="color-palette">
      <div className="color-swatch-grid" role="group" aria-label={label}>
        {colors.map(swatch)}
      </div>
      <div className="custom-color-heading">
        <span>Custom colors</span>
        {EyeDropper && (
          <button
            className="icon-button small"
            aria-label="Pick color from screen"
            title="Pick color from screen"
            onClick={async () => {
              try {
                const result = await new EyeDropper().open();
                chooseCustom(result.sRGBHex);
                setNotice('');
              } catch (error) {
                if (!(error instanceof DOMException && error.name === 'AbortError'))
                  setNotice('Could not sample a color. Use Add custom color.');
              }
            }}
          >
            <Pipette size={14} />
          </button>
        )}
      </div>
      <div
        className="color-swatch-grid custom-swatches"
        role="group"
        aria-label="Saved custom colors"
      >
        {custom.map(swatch)}
        <button
          className="color-swatch custom-color-add"
          type="button"
          aria-label="Add custom color"
          title="Add custom color"
          onClick={() => {
            if (customPicker.current) {
              customPicker.current.value = value?.startsWith('#') ? value : '#ffffff';
              customPicker.current.click();
            }
          }}
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>
      <input
        ref={customPicker}
        className="custom-color-picker"
        type="color"
        aria-label="Choose custom color"
        tabIndex={-1}
        defaultValue={value?.startsWith('#') ? value : '#ffffff'}
        onKeyDown={(event) => {
          if (event.key === 'Escape') event.stopPropagation();
        }}
      />
      {notice && (
        <p className="color-picker-notice" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
