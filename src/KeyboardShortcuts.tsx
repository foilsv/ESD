import { useEffect, useId, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';
import './shortcutHelp.css';

type Props = {
  onClose: () => void;
};

type Shortcut = {
  action: string;
  keys: string[];
};

function ShortcutSection({ title, rows }: { title: string; rows: Shortcut[] }) {
  return (
    <section className="shortcut-section">
      <h3>{title}</h3>
      <dl>
        {rows.map(({ action, keys }) => (
          <div className="shortcut-row" key={action}>
            <dt>{action}</dt>
            <dd>
              {keys.map((key, index) => (
                <span key={key}>
                  {index > 0 && <span className="shortcut-or">or</span>}
                  <kbd>{key}</kbd>
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function KeyboardShortcuts({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? 'Cmd' : 'Ctrl';
  const alt = isMac ? 'Option' : 'Alt';

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="shortcut-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <header className="shortcut-header">
        <Keyboard size={19} aria-hidden="true" />
        <h2 id={titleId}>Keyboard shortcuts</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close keyboard shortcuts"
          onClick={onClose}
          autoFocus
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="shortcut-scroll" tabIndex={0} aria-label="Shortcut reference">
        <p className="shortcut-rule" id={descriptionId}>
          <strong>Selected object? Type to replace its label.</strong>
          <span>
            Enter or F2 edits the existing text. With nothing selected, letters choose tools.
          </span>
        </p>

        <div className="shortcut-grid">
          <ShortcutSection
            title="Labels and selection"
            rows={[
              { action: 'Edit existing label', keys: ['Enter', 'F2'] },
              { action: 'Finish label editing', keys: ['Enter'] },
              { action: 'Close / cancel / deselect', keys: ['Esc'] },
              { action: 'Delete selection', keys: ['Delete', 'Backspace'] },
              { action: 'Select all', keys: [`${mod}+A`] },
              { action: 'Add or remove selection', keys: ['Shift+click'] },
              { action: 'Open context menu', keys: ['Shift+F10', 'Menu key'] },
            ]}
          />
          <ShortcutSection
            title="Tools · nothing selected"
            rows={[
              { action: 'Select', keys: ['V'] },
              { action: 'Add block', keys: ['B'] },
              { action: 'Add text', keys: ['T'] },
              { action: 'Connect objects', keys: ['L'] },
              { action: 'Add rectangle', keys: ['R'] },
              { action: 'Add ellipse', keys: ['O'] },
            ]}
          />
          <ShortcutSection
            title="Canvas navigation"
            rows={[
              { action: 'Move selection by 1', keys: ['Arrow keys'] },
              { action: 'Move selection by 10', keys: ['Shift+arrows'] },
              { action: 'Pan', keys: ['Space+drag', 'Right-drag'] },
              { action: 'Zoom in / out', keys: [`${mod} + / −`] },
              { action: 'Actual size', keys: [`${mod}+0`] },
              { action: 'Fit diagram', keys: [`${alt}+1`] },
              { action: 'Fit selection', keys: [`${alt}+2`] },
            ]}
          />
          <ShortcutSection
            title="History and formatting"
            rows={[
              { action: 'Command palette', keys: [`${mod}+/`] },
              { action: 'Undo', keys: [`${mod}+Z`] },
              { action: 'Redo', keys: isMac ? ['Cmd+Shift+Z'] : ['Ctrl+Shift+Z', 'Ctrl+Y'] },
              { action: 'Bold', keys: [`${mod}+B`] },
              { action: 'Italic', keys: [`${mod}+I`] },
              { action: 'Underline', keys: [`${mod}+U`] },
              { action: 'Copy style', keys: [`${mod}+${alt}+C`] },
              { action: 'Paste style', keys: [`${mod}+${alt}+V`] },
            ]}
          />
        </div>

        <div className="shortcut-notes">
          <p>
            Canvas shortcuts work while the canvas has focus. Typing needs one object with an
            editable label; multiple selections, simple lines, and symbols ignore typing.
          </p>
          <p>
            Esc closes the innermost popup first, then cancels a label draft or leaves the current
            action, one step at a time. Within a label, selection, arrows, clipboard, and undo edit
            text. Formatting applies to the whole label, including while editing.
          </p>
          <p>
            Tab and Shift+Tab move between controls. Fields, buttons, menus, and dialogs keep their
            normal keys. Space inserts a space while editing text.
          </p>
        </div>
      </div>
    </dialog>
  );
}
