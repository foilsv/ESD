export const CANVAS_BACKGROUND = '#f7f8fa';
export const FALLBACK_STROKE = '#64748b';
export const FALLBACK_TEXT = '#1e293b';

type Rgb = { r: number; g: number; b: number };
type Oklab = { l: number; a: number; b: number };
type Oklch = { l: number; c: number; h: number };

const STROKE_TARGET_CONTRAST = 3;
const TEXT_TARGET_CONTRAST = 4.5;
const NEUTRAL_CHROMA = 0.012;

function parseHex(color: string): Rgb | null {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return null;
  return {
    r: parseInt(color.slice(1, 3), 16) / 255,
    g: parseInt(color.slice(3, 5), 16) / 255,
    b: parseInt(color.slice(5, 7), 16) / 255,
  };
}

function linearChannel(channel: number) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function displayChannel(channel: number) {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function rgbToOklab(rgb: Rgb): Oklab {
  const r = linearChannel(rgb.r);
  const g = linearChannel(rgb.g);
  const b = linearChannel(rgb.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToLinearRgb(color: Oklab): Rgb {
  const lRoot = color.l + 0.3963377774 * color.a + 0.2158037573 * color.b;
  const mRoot = color.l - 0.1055613458 * color.a - 0.0638541728 * color.b;
  const sRoot = color.l - 0.0894841775 * color.a - 1.291485548 * color.b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function oklabToOklch(color: Oklab): Oklch {
  return {
    l: color.l,
    c: Math.hypot(color.a, color.b),
    h: Math.atan2(color.b, color.a),
  };
}

function oklchToOklab(color: Oklch): Oklab {
  return {
    l: color.l,
    a: color.c * Math.cos(color.h),
    b: color.c * Math.sin(color.h),
  };
}

function inGamut(rgb: Rgb) {
  return [rgb.r, rgb.g, rgb.b].every((channel) => channel >= 0 && channel <= 1);
}

function hexFromLinearRgb(rgb: Rgb) {
  const byte = (channel: number) =>
    Math.round(Math.max(0, Math.min(1, displayChannel(channel))) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${byte(rgb.r)}${byte(rgb.g)}${byte(rgb.b)}`;
}

function candidateAtLightness(source: Oklch, lightness: number) {
  let chroma = source.c < NEUTRAL_CHROMA ? 0 : source.c;
  let lab = oklchToOklab({ l: lightness, c: chroma, h: source.h });
  let rgb = oklabToLinearRgb(lab);
  if (!inGamut(rgb)) {
    let low = 0;
    let high = chroma;
    for (let index = 0; index < 16; index += 1) {
      const middle = (low + high) / 2;
      const trial = oklabToLinearRgb(oklchToOklab({ l: lightness, c: middle, h: source.h }));
      if (inGamut(trial)) low = middle;
      else high = middle;
    }
    chroma = low;
    lab = oklchToOklab({ l: lightness, c: chroma, h: source.h });
    rgb = oklabToLinearRgb(lab);
  }
  return { hex: hexFromLinearRgb(rgb), lab };
}

export function relativeLuminance(color: string) {
  const rgb = parseHex(color);
  if (!rgb) return 0;
  return (
    0.2126 * linearChannel(rgb.r) + 0.7152 * linearChannel(rgb.g) + 0.0722 * linearChannel(rgb.b)
  );
}

export function contrastRatio(first: string, second: string) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

function deriveRelatedColor(
  sourceColor: string,
  comparisonColors: string[],
  targetContrast: number,
  fallback: string,
) {
  const sourceRgb = parseHex(sourceColor);
  if (!sourceRgb || comparisonColors.some((color) => !parseHex(color))) return fallback;

  const sourceLab = rgbToOklab(sourceRgb);
  const source = oklabToOklch(sourceLab);
  let bestPassing: { hex: string; distance: number; lightness: number } | null = null;
  let bestFallback: { hex: string; weakest: number; distance: number; lightness: number } | null =
    null;
  const seen = new Set<string>();

  for (let step = 0; step <= 400; step += 1) {
    const candidate = candidateAtLightness(source, step / 400);
    if (seen.has(candidate.hex)) continue;
    seen.add(candidate.hex);
    const contrasts = comparisonColors.map((color) => contrastRatio(candidate.hex, color));
    const weakest = Math.min(...contrasts);
    const distance = Math.hypot(
      candidate.lab.l - sourceLab.l,
      candidate.lab.a - sourceLab.a,
      candidate.lab.b - sourceLab.b,
    );
    const darker = candidate.lab.l < sourceLab.l;
    const passing = contrasts.every((contrast) => contrast >= targetContrast);

    if (
      passing &&
      (!bestPassing ||
        distance < bestPassing.distance - 0.0001 ||
        (Math.abs(distance - bestPassing.distance) <= 0.0001 &&
          darker &&
          bestPassing.lightness >= sourceLab.l))
    ) {
      bestPassing = { hex: candidate.hex, distance, lightness: candidate.lab.l };
    }
    if (
      !bestFallback ||
      weakest > bestFallback.weakest + 0.0001 ||
      (Math.abs(weakest - bestFallback.weakest) <= 0.0001 &&
        (distance < bestFallback.distance - 0.0001 ||
          (Math.abs(distance - bestFallback.distance) <= 0.0001 &&
            darker &&
            bestFallback.lightness >= sourceLab.l)))
    ) {
      bestFallback = { hex: candidate.hex, weakest, distance, lightness: candidate.lab.l };
    }
  }

  return bestPassing?.hex ?? bestFallback?.hex ?? fallback;
}

/**
 * Builds a fill-related border that is visible on both sides of the shape edge.
 * When 3:1 against both the fill and canvas is impossible, the candidate with
 * the strongest weaker contrast wins.
 */
export function deriveStrokeColor(fill: string, canvas = CANVAS_BACKGROUND) {
  const effectiveFill = fill === 'transparent' ? canvas : fill;
  return deriveRelatedColor(
    effectiveFill,
    [effectiveFill, canvas],
    STROKE_TARGET_CONTRAST,
    FALLBACK_STROKE,
  );
}

/** Builds fill-related label ink with WCAG AA contrast for ordinary text. */
export function deriveTextColor(fill: string, canvas = CANVAS_BACKGROUND) {
  const effectiveFill = fill === 'transparent' ? canvas : fill;
  return deriveRelatedColor(
    effectiveFill,
    [effectiveFill],
    TEXT_TARGET_CONTRAST,
    FALLBACK_TEXT,
  );
}

export function visibleStrokeColor(stroke: string, fill: string) {
  return stroke === 'transparent' ? deriveStrokeColor(fill) : stroke;
}
