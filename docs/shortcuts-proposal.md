# Keyboard shortcuts

Approved for local implementation on 2026-09-13. This document records the implemented shortcut contract and regression scenarios; publication requires a separate deployment command.

## Primary rule

With exactly one label-capable object selected and the canvas focused, typing starts editing its label immediately. Text takes priority over tool shortcuts. Bare tool letters work only with an empty selection. Apply the same rules to Flat, Grouped, and Inline, revealing that solution's text tools automatically.

Typing begins replacement editing: selecting `Motor controller` and typing `Voltage regulator` produces `Voltage regulator`, including the first character. Enter or F2 instead preserves the existing label and places the caret at its end. Double-click remains an alternative way to edit existing text.

Letters, capitals, digits, punctuation, and composed text can start editing. B, T, L, and V must become label text in this context. Space outside an editor remains a pan/keyboard-activation key; inside an editor it inserts a space normally.

## Core scheme

`Mod` means Ctrl on Windows and Command on macOS. `Alt` means Option on macOS.

| Action                           | Shortcut                    | Scope / behavior                                                                                                                                           |
| -------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Replace selected label           | Start typing                | Exactly one label-capable selection; retain first character                                                                                                |
| Edit existing label              | Enter; F2 alias             | Preserve label; caret at end                                                                                                                               |
| Finish label editing             | Enter                       | Commit draft and retain object selection; labels remain single-line                                                                                        |
| Dismiss / cancel / deselect      | Escape                      | Close innermost popup first; otherwise cancel label draft, leave formatting sub-toolbar, cancel drawing operation, or clear selection, one layer per press |
| Undo                             | Mod+Z                       | Text undo inside editor; diagram undo outside                                                                                                              |
| Redo                             | Mod+Shift+Z                 | Same text/diagram scope; Ctrl+Y also supported on Windows                                                                                                  |
| Delete selection                 | Delete / Backspace          | Canvas only; inside editor delete characters                                                                                                               |
| Select all                       | Mod+A                       | All diagram objects on canvas; all text in editor                                                                                                          |
| Add/remove object from selection | Shift+click                 | Retain existing behavior                                                                                                                                   |
| Nudge selection                  | Arrow keys                  | 1 diagram unit; Shift increases to 10                                                                                                                      |
| Pan temporarily                  | Space+drag                  | Outside editor; retain right-drag alternative                                                                                                              |
| Zoom in/out; actual size         | Mod+plus / Mod+minus; Mod+0 | Canvas focus only; retain native browser zoom elsewhere                                                                                                    |
| Fit diagram / selection          | Alt+1 / Alt+2               | Canvas focus, outside editing; Alt+2 needs a selection                                                                                                     |
| Bold / italic / underline        | Mod+B / Mod+I / Mod+U       | Whole-label formatting on compatible selections, also while editing                                                                                        |

Mod+B on a selected block changes label weight without opening a caret. For mixed selections, expose only shared capabilities; a mixed emphasis value becomes enabled on all selected labels, while an all-enabled value toggles off.

Inside editing, cursor movement, text selection, clipboard operations, and text undo retain their text meaning. A committed label edit is one diagram undo step. Escape cancellation is the prototype's existing convention; some reference tools instead use Escape to finish editing. Clicking the canvas or another object commits, while formatting controls preserve the draft.

## Tool letters

These work with canvas focus and no selection, outside an active pointer gesture or connection operation. Cancel an active operation with Escape before selecting another tool by letter.

| Action          | Shortcut | Reason                                                               |
| --------------- | -------- | -------------------------------------------------------------------- |
| Selection tool  | V        | Familiar canvas convention                                           |
| Add block       | B        | Existing ESD mnemonic                                                |
| Add text object | T        | Familiar canvas convention                                           |
| Connection tool | L        | Miro uses L for connection lines; replaces the prototype's C binding |
| Add rectangle   | R        | Familiar shape mnemonic                                              |
| Add ellipse     | O        | Familiar shape mnemonic                                              |

Typing with multiple objects or a noneditable object selected does nothing. Do not choose an arbitrary label or create an object. Simple lines and symbols have no editable label. Escape until selection clears makes tool letters available again; toolbar buttons remain directly usable with a selection.

## Secondary commands and discoverability

- Shift+F10 or the Menu key opens the diagram context menu at the focused object or selection, initially with no row highlighted; active label inputs retain their native menu. Arrow keys, Home/End, and first-letter navigation move through available rows. Right or Enter opens Align; Left or Escape closes the submenu and returns to Align. Enter/Space chooses an action, and Escape dismisses the main menu. The layout preview displays conventional object clipboard, duplicate, and grouping hints without implementing those bindings.
- Mod+Alt+C / Mod+Alt+V invoke existing Copy style / Paste style, matching Miro. Menu access and current mixed-value restrictions remain. Set default style, stroke/arrow choices, alignment, and Lab modifiers stay in menus/toolbars.
- Reserve Mod+C / Mod+X / Mod+V for object clipboard operations and Mod+D for duplication when those features are added. These are outside the current prototype's scope; do not advertise them as implemented. Normal text clipboard commands remain available inside editing.
- Mod+/ opens a searchable, grouped command palette from anywhere in the lab. Arrow keys select available results, Enter runs one, and Escape closes the palette. Selection-dependent commands remain visible but disabled when unavailable.
- A visible Keyboard shortcuts entry and keys in tooltips explain the scheme. A saved Lab modifier, disabled by default, adds small tool-letter hints to the creation toolbar. The canvas shows “Type to replace label · Enter to edit” for an editable selection and tool-letter hints for an empty selection. There is no bare `?` help shortcut because it remains available as label text.
- Preserve Tab / Shift+Tab focus navigation and Enter / Space control activation. Focused fields, buttons, menus, and dialogs own their keys except for the app-wide palette chord. Return focus predictably after dismissing a popup; a focused canvas object counts as canvas focus.

## Input handling and regression scenarios

Use composition-aware text input, not ASCII-only key matching. Preserve dead keys, accented input, IME composition, and AltGr. Enter during composition confirms composition rather than finishing the label. Listed Alt/Option navigation chords are explicit commands outside editing; other Option-generated text remains usable. Validate target keyboard layouts.

Track canvas focus separately from selection, respect handled events, and prevent global deletion/history shortcuts from running in unrelated controls. Restrict type-to-edit to selection mode. Ignore shortcut auto-repeat for creation. Deliberately clearing a label is permitted.

Use these scenarios for regression checks; this list is not a record of completed verification:

1. Type `B12: 5V! @24MHz` on selected blocks, connections, and text objects in all three solutions. Verify exact replacement and no tool changes.
2. Enter/F2 preserves text; Enter commits; Escape cancels; diagram undo restores the original label. Text undo, clipboard, and cursor keys do not modify diagram selection or geometry.
3. Format without editing content, including mixed selections. Interact with formatting controls during editing and preserve the draft/caret.
4. Check empty, multiple, and noneditable selections, plus focus in fields, menus, buttons, and Help. Escape from a popup closes only that popup first.
5. Test IME, dead keys, AltGr, and Option input; pan/zoom scope; native browser zoom outside the canvas.
6. Nudge blocks and mixed selections while preserving attachments. Connections follow their attached objects; nudging a selected connection must not detach its endpoints.

## Reference basis

- [Miro shapes](https://help.miro.com/hc/en-us/articles/360017730713-Shapes) and [Visio shape basics](https://support.microsoft.com/en-US/Visio/shape-basics-resize-format-move-and-add-text-to-shapes) document selecting a shape and typing to add text.
- [Miro shortcuts](https://help.miro.com/hc/en-us/articles/360017731033-Shortcuts-and-hotkeys) supports the V/T/L/R/O conventions, Enter, standard editing/formatting, Space+drag, and modifier-based zoom/fit commands. [Miro text](https://help.miro.com/hc/en-us/articles/360017572094-Text) documents style-copy shortcuts.
- [Figma text editing](https://help.figma.com/hc/en-us/articles/360039956434-Guide-to-text-in-Figma-Design) uses Enter on selected text. [Visio shortcuts](https://support.microsoft.com/en-us/accessibility/visio/keyboard-shortcuts-for-visio) uses F2 to switch text editing and shape selection.
- [Figma zoom](https://help.figma.com/hc/en-us/articles/360041065034-Adjust-your-zoom-and-view-options) uses Shift+1/2 for fit. Choose Miro's Alt/Option+1/2 here so shifted number keys can start labels with punctuation.

Replacement versus caret entry, the empty-selection restriction on tool letters, and retaining Escape-to-cancel are ESD design decisions, not claims of universal industry behavior.
