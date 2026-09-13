import { useLayoutEffect, useRef } from 'react';
import { fonts, isLine, type DiagramObject } from './model';
import { isCommandPaletteShortcut } from './keyboard';

export interface LabelEditorProps {
  object: DiagramObject;
  editing: boolean;
  enabled: boolean;
  onStart: (value: string) => void;
  onDraft: (value: string) => void;
  onFinish: (cancel?: boolean) => void;
  onFormat: (property: 'bold' | 'italic' | 'underline') => void;
}

/** Keep one native input alive from selection through editing for IME and text undo. */
export default function LabelEditor({
  object,
  editing,
  enabled,
  onStart,
  onDraft,
  onFinish,
  onFormat,
}: LabelEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wasEditing = useRef(false);
  const nativeStart = useRef(false);
  const composing = useRef(false);
  const inputState = useRef({ editing, enabled });
  const { style, kind } = object;

  useLayoutEffect(() => {
    inputState.current = { editing, enabled };
    const input = inputRef.current;
    if (!input) return;

    if (!editing) {
      // Assign only when the committed label changes or an edit is cancelled.
      // Unrelated style renders must not clear the browser's native undo stack.
      if (input.value !== object.label) input.value = object.label;
      nativeStart.current = false;
      if (enabled) {
        input.focus({ preventScroll: true });
        input.select();
      }
    } else if (!wasEditing.current) {
      input.focus({ preventScroll: true });
      if (!nativeStart.current && !composing.current) {
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }

    wasEditing.current = editing;
  }, [editing, enabled, object.id, object.label]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const beforeInput = (event: InputEvent) => {
      const state = inputState.current;
      if (state.editing) return;
      // The dormant input receives native text and composition, while canvas
      // deletion/history commands and clipboard gestures stay outside editing.
      if (
        !state.enabled ||
        /^(delete|history)/.test(event.inputType) ||
        /^(insertFromPaste|insertFromDrop|insertFromYank)/.test(event.inputType)
      ) {
        event.preventDefault();
      }
    };
    input.addEventListener('beforeinput', beforeInput);
    return () => input.removeEventListener('beforeinput', beforeInput);
  }, []);

  return (
    <input
      ref={inputRef}
      className="canvas-label-input"
      aria-label="Edit object label"
      data-label-object-id={object.id}
      data-label-entry={!editing ? 'true' : undefined}
      data-label-editing={editing ? 'true' : undefined}
      tabIndex={editing ? 0 : -1}
      defaultValue={object.label}
      maxLength={500}
      autoComplete="off"
      onFocus={(event) => {
        if (!editing && enabled) event.currentTarget.select();
      }}
      onInput={(event) => {
        if (!editing && !enabled) return;
        const value = event.currentTarget.value;
        if (editing || nativeStart.current) {
          onDraft(value);
        } else {
          nativeStart.current = true;
          onStart(value);
        }
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={() => {
        composing.current = false;
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (!editing || event.key === 'Escape') return;
        if (isCommandPaletteShortcut(event.nativeEvent)) return;
        if (
          (event.ctrlKey || event.metaKey) &&
          event.altKey &&
          !event.shiftKey &&
          !event.getModifierState('AltGraph') &&
          (['KeyC', 'KeyV'].includes(event.code) || ['c', 'v'].includes(event.key.toLowerCase()))
        ) {
          return;
        }
        event.stopPropagation();
        if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key === 'Enter') {
          event.preventDefault();
          onFinish();
          return;
        }
        if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
          const property = { b: 'bold', i: 'italic', u: 'underline' }[event.key.toLowerCase()] as
            | 'bold'
            | 'italic'
            | 'underline'
            | undefined;
          if (property) {
            event.preventDefault();
            onFormat(property);
          }
        }
      }}
      style={{
        position: 'absolute',
        inset: 0,
        opacity: editing ? 1 : 0,
        pointerEvents: editing ? 'auto' : 'none',
        fontFamily: fonts[style.fontFamily].css,
        fontSize: style.fontSize,
        fontWeight: style.bold ? 700 : 400,
        fontStyle: style.italic ? 'italic' : 'normal',
        textDecoration: [style.underline && 'underline', style.strikethrough && 'line-through']
          .filter(Boolean)
          .join(' '),
        color: style.textColor,
        backgroundColor: !isLine(object) && kind !== 'text' ? style.fill : '#ffffff',
        textAlign: style.align,
      }}
    />
  );
}
