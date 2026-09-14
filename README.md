# ESD Formatting Lab

A small, local browser prototype for experimenting with the Electronics System Design editor's contextual formatting panel. It opens directly on a sample diagram.

**Published app:** [ESD Formatting Lab](https://esd-formatting-lab.pnv82g.chatgpt.site) — accessible to anyone with the link. See [deployment instructions](docs/deployment.md) to update the same Site.

Development, release preparation, and checks stay local. The agent prepares an immutable release bundle; the user publishes it manually with `npm run release:publish` while Codex is using the personal account that owns the Site. The manual publisher does not start a model turn.

## Run

Requires Node.js 22.12+ and npm.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. The dev server refreshes the app as you edit.

```sh
npm run build   # TypeScript check and production build
npm test        # Formatting, geometry, and snapshot checks
```

Release commands are intentionally separate from normal development:

```sh
npm run release:prepare    # agent-facing: verify and package a clean commit
npm run release:preflight  # user-facing: read-only account and Site check
npm run release:publish    # user-facing: upload and deploy the prepared release
```

## Try

- Select a block, open Fill color, and choose a swatch. With the canvas focused, start typing to replace its label immediately, or press Enter/F2 to edit the existing text at its end. Double-click also edits labels. Text controls appear automatically; Enter finishes editing and Escape cancels the label draft after closing any open popup.
- Choose **Manufacturer style** in the Interaction lab: STM, Infineon, Renesas, NXP, or TI. The screenshot-inspired palette recolors the entire diagram and new objects; individual colors remain editable. **Original colors** restores the colors from before the first manufacturer switch. Palette changes support undo/redo and save with the experiment.
- Switch **Flat / Grouped / Inline** in the Interaction lab. These implement the three [document-defined solutions](docs/solutions.md): dedicated Stroke/Text/Alignment sub-toolbars with Back, stable compound controls with grouped popovers, and actual expansion within one toolbar row.
- Toggle **Use one-line text toolbar** to compare Grouped label editing and selected text objects in the Flat-style text row with the original automatic Text popover. It defaults on; Back reveals a text object's whole-object row, where manually opening Text still uses the Grouped popover.
- Toggle **Use compact text alignment** to replace six horizontal/vertical buttons with Grouped's 3×3 Alignment popover in Flat, Inline, and Grouped's one-line text toolbar. It defaults on; font, size, emphasis, and text color remain directly available.
- Toggle **Use font size stepper** to replace the size dropdown with a Google-style − / numeric value / + control in Flat, Inline, and Grouped's one-line text toolbar. It defaults off, changes size by 2 px—half the gap between the 12, 16, and 20 px presets—and keeps Grouped's ordinary Text popover unchanged.
- Toggle **Show simple popover arrows** to restore down-chevron indicators on familiar single-choice controls such as color, font, size, compact alignment, and Grouped arrow style. It defaults off; compound Stroke/Text controls keep down chevrons in Grouped, while Inline expansions use left chevrons to signal their in-row transition.
- Toggle **Merge stroke color and style** to compare combined and independent controls. It defaults on for Flat and Inline; Grouped keeps color separate.
- Toggle **Match text color to fill** to compare automatic and independent label colors. It defaults on; choosing a Fill color derives readable, fill-related text color, while switching it off preserves the current text color.
- Toggle **Show more actions** to add an overflow menu at the end of every formatting row. It defaults off; when shown, the menu holds Set default style, Copy style, and Paste style.
- Toggle **Show toolbar shortcuts** to place small V/B/L/T/R/O key hints on the canvas tool buttons. It defaults off and saves with the experiment.
- Open Stroke to compare patterns and Small / Medium / Large / Extra large widths (1 / 2 / 4 / 8 px). Choosing a pattern or width after No stroke derives a visible border from each object’s fill color.
- Single-action popovers close after a choice, including color, font, size, alignment, and Grouped arrow style. Multi-action Text and Stroke popovers remain open for successive edits.
- Select a connection and open its arrow-style group to choose None, Left, Right, or Both, or use the separate cycle button to iterate None → Left → Right → Both. The group icon shows the current state; the cycle button tooltip names the next state. Left and right refer to the source and target ends of the drawn path, even when moved around the canvas.
- Shift-click objects to apply shared formatting together. Different values appear as Mixed.
- Right-click an object or empty canvas to try the compact context menu. Align and Group stay visible on object menus and become available for suitable multi-selections; Align opens the six object-alignment choices. The menu opens neutrally, without highlighting a command. Delete, Select all, Fit diagram, and Show grid use existing actions; clipboard, Duplicate, front/back ordering, Align, Group, and Lock are visual placeholders. Formatting, label editing, and Undo/Redo stay in their existing controls. Right-drag still pans; Shift+F10 opens the menu from the focused canvas selection.
- Drag objects, resize from the bottom-right handle, use arrows to nudge (Shift for larger steps), and Space+drag or right-drag to pan. Use the mouse wheel, zoom controls, or Ctrl/Cmd+plus/minus/0; Alt/Option+1 fits the diagram and Alt/Option+2 fits the selection. Try the dense and edge scenes.
- In the edge scenes, open and switch Grouped popovers: the toolbar stays fixed, while a popover can flip toward the selection when it lacks space to open away from it.
- Switch to **Object families** to test block, hardware, software, port, connection, simple line, rectangle, ellipse, text, and symbol contexts.
- With canvas focus and nothing selected, B adds a block, T adds text, L connects objects, R adds a rectangle, O adds an ellipse, and V selects. Selected-object typing takes priority over these letters. Delete/Backspace removes the selection; Ctrl/Cmd+A selects all; Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z redoes (Ctrl+Y also works on Windows).
- Ctrl/Cmd+B/I/U changes whole-label emphasis, including while editing. Ctrl/Cmd+Alt/Option+C/V copies/pastes style using the existing shared-capability rules. Press Ctrl/Cmd+/ or use the header search button to open the searchable command palette from anywhere in the lab. Open **Keyboard shortcuts** in the header for the complete [shortcut scheme](docs/shortcuts-proposal.md). Focused fields, menus, buttons, and dialogs keep their normal keys except for the app-wide palette chord.
- Changes and Lab display preferences save in this browser. **Save experiment** exports JSON; **Open** restores it. Reset scene is undoable. Changing a scene replaces the current sample; export to keep several experiments. Copied and default styles last for the current session.
- Earlier experiments migrate automatically: Replace → Flat, Stack → Grouped, Expand → Inline. Object styling is preserved. New exports use snapshot version 2.

## Why this format

React + TypeScript + Vite, SVG diagram geometry, and regular HTML formatting controls. A frontend-only app makes interaction changes quick and keeps state inspectable. React components keep alternative panels small; types keep capability and style changes consistent. SVG is enough for this small test fixture without adopting a full diagram engine. Vite supplies the local development loop and a static build ([official guide](https://vite.dev/guide/)).

There is no server, account, production ESD connection, or runtime access to Google Drive. Research informed the project brief; the running app contains a synthetic diagram. Dependencies and the two web fonts are bundled locally.

## Code map

| File                         | Change here when…                                                           |
| ---------------------------- | --------------------------------------------------------------------------- |
| `src/FormattingToolbar.tsx`  | Changing controls, Tier 1/Tier 2 allocation, or panel behaviors             |
| `src/FormattingControls.tsx` | Changing shared color, font, stroke, emphasis, and alignment controls       |
| `src/toolbarModel.ts`        | Changing solution definitions and compatible/sticky group rules             |
| `src/styles.css`             | Changing visual tokens, density, spacing, and panel styling                 |
| `src/model.ts`               | Changing capabilities, style values, or diagram geometry                    |
| `src/panelPlacement.ts`      | Changing selection avoidance, outward expansion, flips, or viewport docking |
| `src/usePanelPlacement.ts`   | Changing toolbar/popover measurement and stable anchoring                   |
| `src/fixtures.ts`            | Adding realistic scenarios or object examples                               |
| `src/DiagramCanvas.tsx`      | Changing rendering, labels, and selection affordances                       |
| `src/App.tsx`                | Changing selection, interaction state, history, and experiment controls     |
| `src/KeyboardShortcuts.tsx`  | Updating the visible keyboard shortcut reference                            |
| `src/CommandPalette.tsx`     | Updating searchable access to app, canvas, and formatting commands          |
| `src/manufacturerStyles.ts`  | Changing screenshot-inspired manufacturer palettes and color application    |
| `src/storage.ts`             | Changing snapshot validation and local persistence                          |
| `src/releaseNotes.ts`        | Grouping user-visible changes for the next deployment and version history   |
| `docs/context.md`            | Understanding the prior discussions and open decisions                      |
| `docs/experiments.md`        | Planning and recording the next design experiments                          |

## Deliberate limits

This is a formatting test harness, not a production editor. Labels use whole-object formatting and truncate long single-line content; rich text, wrapping, routing edits, marquee selection, object clipboard operations, object grouping, real parts data, image import, blankets, and collaboration are outside the initial scope. The optional formatting overflow menu supports a session-scoped style clipboard and per-kind defaults. The toolbar sits above the selection when it fits, otherwise below, and never moves when a popover opens, switches, or closes. Popovers open away from the selection when space permits; near viewport edges they may flip toward and cover it. Oversized selections use a viewport-edge fallback. Desktop pointer interaction is the primary target.

Expanded Inline controls stay in one row and scroll horizontally when the viewport is too narrow. Underline, strikethrough, and vertical text alignment are available to match the reference controls; vertical alignment moves the label and its subtitle together.

Font roles are Normal (bundled Inter), Classic (system Arial), Compact (bundled Roboto Condensed), and Mono (system Courier New). Arial and Courier New use browser fallbacks if absent. Grid defaults off. Scene colors are illustrative; they do not create electronic semantics.
