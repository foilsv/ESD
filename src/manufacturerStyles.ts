import { isLine, type DiagramObject, type Style } from './model';

export type ObjectColors = Pick<Style, 'fill' | 'stroke' | 'textColor'>;
export type ManufacturerStyle = 'default' | 'stm' | 'infineon' | 'renesas' | 'nxp' | 'ti';

type Palette = {
  label: string;
  primary: string;
  control: string;
  sensor: string;
  surface: string;
  border: string;
  connection: string;
  ink: string;
};

// Diagram palettes interpreted from the user-supplied screenshots, not brand guidelines.
export const manufacturerStyles: Record<ManufacturerStyle, Palette> = {
  default: {
    label: 'Original colors',
    primary: '#dbeafe',
    control: '#e9d5ff',
    sensor: '#dcfce7',
    surface: '#ffffff',
    border: '#64748b',
    connection: '#2563eb',
    ink: '#1e293b',
  },
  stm: {
    label: 'STM',
    primary: '#32b2df',
    control: '#32b2df',
    sensor: '#32b2df',
    surface: '#ffffff',
    border: '#536b8a',
    connection: '#ff168b',
    ink: '#03234b',
  },
  infineon: {
    label: 'Infineon',
    primary: '#399b91',
    control: '#bd2d87',
    sensor: '#ff9933',
    surface: '#e0f3f2',
    border: '#92c9c4',
    connection: '#303b3b',
    ink: '#143d39',
  },
  renesas: {
    label: 'Renesas',
    primary: '#0075b9',
    control: '#0075b9',
    sensor: '#0075b9',
    surface: '#e4f2fa',
    border: '#4ca2cf',
    connection: '#202b33',
    ink: '#003b64',
  },
  nxp: {
    label: 'NXP',
    primary: '#70acd8',
    control: '#ff8000',
    sensor: '#70acd8',
    surface: '#c5dff1',
    border: '#8ca5b4',
    connection: '#4d5357',
    ink: '#142a38',
  },
  ti: {
    label: 'TI',
    primary: '#008295',
    control: '#008295',
    sensor: '#008295',
    surface: '#daf1f4',
    border: '#9fd5de',
    connection: '#202b33',
    ink: '#00343d',
  },
};

function luminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function labelColor(fill: string, ink: string) {
  const background = luminance(fill);
  const darkContrast = (background + 0.05) / (luminance(ink) + 0.05);
  const lightContrast = 1.05 / (background + 0.05);
  if (Math.max(darkContrast, lightContrast) < 4.5) return '#000000';
  return darkContrast >= lightContrast ? ink : '#ffffff';
}

export function applyManufacturerStyle(
  objects: DiagramObject[],
  manufacturer: ManufacturerStyle,
): DiagramObject[] {
  return objects.map((object) => {
    if (manufacturer === 'default') {
      if (!object.originalColors) return object;
      const { originalColors, ...rest } = object;
      return { ...rest, style: { ...object.style, ...originalColors } };
    }
    const palette = manufacturerStyles[manufacturer];
    const originalColors = object.originalColors ?? {
      fill: object.style.fill,
      stroke: object.style.stroke,
      textColor: object.style.textColor,
    };
    let colors: Partial<ObjectColors>;
    if (isLine(object)) {
      colors = { stroke: palette.connection, textColor: palette.ink };
    } else if (object.kind === 'symbol') {
      colors = { stroke: palette.ink };
    } else if (object.kind === 'text') {
      colors = { textColor: palette.ink };
    } else {
      const surface = ['rectangle', 'ellipse'].includes(object.kind);
      const fill = surface
        ? palette.surface
        : object.colorRole === 'control' || object.kind === 'software'
          ? palette.control
          : object.colorRole === 'sensor'
            ? palette.sensor
            : object.kind === 'port'
              ? palette.border
              : palette.primary;
      colors = {
        fill,
        stroke: surface ? palette.border : fill,
        textColor: labelColor(fill, palette.ink),
      };
    }
    return { ...object, originalColors, style: { ...object.style, ...colors } };
  });
}
