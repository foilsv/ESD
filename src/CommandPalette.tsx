import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, CornerDownLeft, Search, X } from 'lucide-react';
import {
  filterPaletteCommands,
  nextEnabledCommandIndex,
  type PaletteCommand,
} from './commandPaletteModel';
import './commandPalette.css';

type Props = {
  commands: PaletteCommand[];
  onClose: () => void;
};

export default function CommandPalette({ commands, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const listId = useId();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => filterPaletteCommands(commands, query), [commands, query]);
  const [active, setActive] = useState(() => filtered.findIndex((command) => !command.disabled));

  useEffect(() => {
    const firstEnabled = filtered.findIndex((command) => !command.disabled);
    if (active < 0 || active >= filtered.length || filtered[active]?.disabled) {
      setActive(firstEnabled);
    }
  }, [active, filtered]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    dialog?.showModal();
    inputRef.current?.focus({ preventScroll: true });
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    if (active < 0) return;
    dialogRef.current
      ?.querySelector<HTMLElement>(`[data-command-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function run(command?: PaletteCommand) {
    if (!command || command.disabled) return;
    command.run();
    onClose();
  }

  const groups = filtered.reduce<Map<string, { command: PaletteCommand; index: number }[]>>(
    (result, command, index) => {
      const group = result.get(command.group) ?? [];
      group.push({ command, index });
      result.set(command.group, group);
      return result;
    },
    new Map(),
  );

  return (
    <dialog
      ref={dialogRef}
      className="command-palette"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <h2 id={titleId} className="visually-hidden">
        Command palette
      </h2>
      <div className="command-search-wrap">
        <Search size={20} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          aria-label="Search commands"
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-command-${active}` : undefined}
          autoComplete="off"
          placeholder="Search commands"
          onChange={(event) => {
            const next = filterPaletteCommands(commands, event.target.value);
            setQuery(event.target.value);
            setActive(next.findIndex((command) => !command.disabled));
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((current) =>
                nextEnabledCommandIndex(filtered, current, event.key === 'ArrowDown' ? 1 : -1),
              );
            } else if (event.key === 'Enter') {
              event.preventDefault();
              run(filtered[active]);
            }
          }}
        />
        {query && (
          <button
            type="button"
            className="icon-button small command-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setActive(commands.findIndex((command) => !command.disabled));
              inputRef.current?.focus();
            }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="command-help" aria-hidden="true">
        <span>
          <kbd>
            <ArrowDownUp size={11} />
          </kbd>
          Select
        </span>
        <span>
          <kbd>
            <CornerDownLeft size={11} />
          </kbd>
          Run
        </span>
        <span>
          <kbd>Esc</kbd>
          Close
        </span>
      </div>

      <div id={listId} className="command-list" role="listbox" aria-label="Commands">
        {filtered.length ? (
          [...groups].map(([group, items]) => (
            <section className="command-group" aria-label={group} key={group}>
              <h3>{group}</h3>
              {items.map(({ command, index }) => (
                <div
                  id={`${listId}-command-${index}`}
                  className={`command-row ${active === index ? 'active' : ''}`}
                  role="option"
                  aria-selected={active === index}
                  aria-disabled={command.disabled || undefined}
                  data-command-index={index}
                  key={command.id}
                  onMouseMove={() => {
                    if (!command.disabled) setActive(index);
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => run(command)}
                >
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <span className="command-shortcut" aria-label={`Shortcut ${command.shortcut}`}>
                      {command.shortcut.split('+').map((key) => (
                        <kbd key={key}>{key}</kbd>
                      ))}
                    </span>
                  )}
                </div>
              ))}
            </section>
          ))
        ) : (
          <p className="command-empty">No matching commands</p>
        )}
      </div>
    </dialog>
  );
}
