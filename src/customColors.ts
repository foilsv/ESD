// Colors observed on octopart.com (2026-09-12): primary blue, text charcoal,
// hero pale blue, and the white surface.
export const defaultCustomColors = ['#0a70cf', '#303336', '#e8f3fe', '#ffffff'];
// Start the requested palette cleanly; retain the old key as a recoverable backup.
export const customColorKey = 'esd-formatting-lab.custom-colors.v2';
const validColor = /^#[0-9a-f]{6}$/i;

function uniqueColors(colors: unknown[]): string[] {
  return [
    ...new Set(
      colors
        .filter((c): c is string => typeof c === 'string' && validColor.test(c))
        .map((c) => c.toLowerCase()),
    ),
  ].slice(0, 8);
}

export function parseCustomColors(serialized: string | null): string[] {
  try {
    const saved: unknown = JSON.parse(serialized ?? 'null');
    const colors = Array.isArray(saved) ? uniqueColors(saved) : [];
    return colors.length ? colors : [...defaultCustomColors];
  } catch {
    return [...defaultCustomColors];
  }
}

export function addCustomColor(colors: string[], color: string): string[] {
  return uniqueColors([color, ...colors]);
}

// Native change fires on commitment. React onChange also handles every input
// event while dragging the color picker, which used to save near-duplicate swatches.
export function listenForColorCommit(
  picker: EventTarget & { value: string },
  commit: (color: string) => void,
): () => void {
  const onChange = () => {
    if (validColor.test(picker.value)) commit(picker.value.toLowerCase());
  };
  picker.addEventListener('change', onChange);
  return () => picker.removeEventListener('change', onChange);
}
