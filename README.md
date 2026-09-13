# ESD Formatting Lab

A small, local browser prototype for experimenting with the Electronics System Design editor's contextual formatting panel. It opens directly on a sample diagram.

**Published app:** [ESD Formatting Lab](https://esd-formatting-lab.pnv82g.chatgpt.site) — accessible to anyone with the link. See [deployment instructions](docs/deployment.md) to update the same Site.

Development and previews stay local. Production updates require an explicit deployment command and use the owner's personal OpenAI account.

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

## Try

- Select a block, open Fill color, and choose a swatch. Double-click its label (or press Enter) to reveal text controls. Enter finishes label editing; Escape cancels the label draft.
- Choose **Manufacturer style** in the Interaction lab: STM, Infineon, Renesas, NXP, or TI. The screenshot-inspired palette recolors the entire diagram and new objects; individual colors remain editable. **Original colors** restores the colors from before the first manufacturer switch. Palette changes support undo/redo and save with the experiment.
- Switch **Flat / Grouped / Inline** in the Interaction lab. These implement the three [document-defined solutions](docs/solutions.md): dedicated Stroke/Text/Alignment sub-toolbars with Back, stable compound controls with grouped popovers, and actual expansion within one toolbar row.
- Open Stroke to compare patterns and Small / Medium / Large / Extra large widths (1 / 2 / 4 / 8 px).
- Select a connection and open its arrow-style group to choose None, Left, Right, or Both, or use the separate cycle button to iterate None → Left → Right → Both. The group icon shows the current state; the cycle button tooltip names the next state. Left and right refer to the source and target ends of the drawn path, even when moved around the canvas.
- Shift-click objects to apply shared formatting together. Different values appear as Mixed.
- Drag objects, resize from the bottom-right handle, right-drag to pan, use the mouse wheel or zoom controls, and try the dense and edge scenes.
- In the edge scenes, open and switch Grouped popovers: the toolbar stays fixed, while a popover can flip toward the selection when it lacks space to open away from it.
- Switch to **Object families** to test block, hardware, software, port, connection, simple line, rectangle, ellipse, text, and symbol contexts.
- B adds a block, T adds text, C connects two objects, and V selects. Delete removes the selection; Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z redoes.
- Changes save in this browser. **Save experiment** exports JSON; **Open** restores it. Reset scene is undoable. Changing a scene replaces the current sample; export to keep several experiments.
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
| `src/manufacturerStyles.ts`  | Changing screenshot-inspired manufacturer palettes and color application    |
| `src/storage.ts`             | Changing snapshot validation and local persistence                          |
| `src/releaseNotes.ts`        | Grouping user-visible changes for the next deployment and version history   |
| `docs/context.md`            | Understanding the prior discussions and open decisions                      |
| `docs/experiments.md`        | Planning and recording the next design experiments                          |

## Deliberate limits

This is a formatting test harness, not a production editor. Labels use whole-object formatting and truncate long single-line content; rich text, wrapping, routing edits, marquee selection, clipboard operations, object grouping, real parts data, image import, blankets, and collaboration are outside the initial scope. The toolbar sits above the selection when it fits, otherwise below, and never moves when a popover opens, switches, or closes. Popovers open away from the selection when space permits; near viewport edges they may flip toward and cover it. Oversized selections use a viewport-edge fallback. Desktop pointer interaction is the primary target.

Expanded Inline controls stay in one row and scroll horizontally when the viewport is too narrow. Underline, strikethrough, and vertical text alignment are available to match the reference controls; vertical alignment moves the label and its subtitle together.

Font roles are Normal (bundled Inter), Classic (system Arial), Compact (bundled Roboto Condensed), and Mono (system Courier New). Arial and Courier New use browser fallbacks if absent. Grid defaults off. Scene colors are illustrative; they do not create electronic semantics.
