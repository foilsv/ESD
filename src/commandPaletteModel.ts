export type PaletteCommand = {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  keywords?: string[];
  disabled?: boolean;
  run: () => void;
};

export function filterPaletteCommands(commands: PaletteCommand[], query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return commands;
  return commands.filter((command) => {
    const haystack = [command.label, command.group, ...(command.keywords ?? [])]
      .join(' ')
      .toLocaleLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function nextEnabledCommandIndex(
  commands: PaletteCommand[],
  current: number,
  direction: 1 | -1,
) {
  if (!commands.some((command) => !command.disabled)) return -1;
  for (let offset = 1; offset <= commands.length; offset += 1) {
    const index = (current + direction * offset + commands.length) % commands.length;
    if (!commands[index].disabled) return index;
  }
  return -1;
}
