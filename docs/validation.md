# Toolbar solutions validation · 2026-09-11

## Four-state connection arrows

Behavior integration: the arrow selector now uses the shared group system. Browser checks verified Inline's four individual buttons, Grouped's connected popover with an unchanged toolbar position, and Flat's dedicated row with working Back. Choosing Both updated both arrowheads; cycling while the popover remained open updated the selected choice. The independent iterator remains available in each mode. All 24 tests and the production build pass; no browser warnings or errors appeared.

Follow-up correction: restored two separate controls in every behavior. The icon dropdown directly selects None, Left, Right, or Both; the adjacent circular-arrow button cycles those same states. Browser checks confirmed dropdown-to-iterator synchronization, both arrowheads, and one-step Undo after a direct choice. Visually checked the two controls together. All 23 tests and the production build pass.

The connection control cycles None → Left (source end) → Right (target end) → Both → None, with a matching icon and next-state tooltip. Browser verification on the PWM connection confirmed right → both → none → left → right and the correct SVG arrowheads at each step. No browser warnings or errors appeared. All 23 tests and the production build pass, including new checks for endpoint preservation, mixed selections, legacy snapshots, and persistence of both arrows.

## Startup recovery · 2026-09-12

Grouped alignment follow-up: visually verified the compact 3×3 picker. One click set bottom-right alignment and updated the collapsed icon/tooltip; one Undo restored middle-center. Multi-selection top-left alignment and one-step Undo also passed in the browser. Collapsed Alignment has no text summary. Build and existing tests pass.

Font-icon follow-up: checked the compact trigger visually in the running app; selecting Classic, Compact, Mono, and Normal updated the distinct icon and tooltip at a constant 49 px width. Escape preserved the text formatting row. Restored the original Normal font after verification. Build and the existing 20 tests pass.

The dev server returned an empty transformed `FormattingToolbar.tsx` even though its source file was intact, causing a missing-default-export error and a blank app. Reloading Vite through its configuration cleared the stale transform. Added `server.watch.awaitWriteFinish` to wait for file writes to settle before transformation. Verified the module contains its default export, reloaded the existing browser tab successfully, and opened the new fill palette with all 32 swatches and custom controls. No new browser errors appeared; the production build passes. Browser access is available again; earlier blocked checks below describe their original validation status.

- TypeScript and production build pass (`npm run build`).
- Color-palette update: 304 px, eight columns, four tone rows, contrast-aware selected checkmarks, checkerboard No fill, custom picker/hex editor, browser-local recent colors, and a feature-detected eyedropper. Build and the existing tests pass. Browser visual verification and eyedropper interaction have not been checked because the previous browser credit block remains unresolved.
- Flat/Inline size follow-up: size presets and the custom editor now live in a separate compact dropdown; the font selector is narrower. Rendering checks verify both text rows have the size trigger and no inline numeric editor. Browser verification remains unavailable due to the previously reported credit block.
- Latest text-popover adjustment: font options display class names only; four A-icon presets and the custom numeric size field share the Size row. Build and existing 20 tests pass. This visual adjustment has not received a browser check; the browser-credit block reported below remains unresolved.
- Twenty tests pass (`npm test`), covering capabilities and mixed values, connection geometry, stable placement, label alignment, canonical snapshot validation, migration of all three legacy behavior names, sticky group compatibility, and rendered composition for Flat, Grouped, and Inline.
- Flat sub-toolbar correction: automated rendering checks verify Stroke and Alignment replace the object row, expose the relevant controls and Back, and create no compound popover. Grouped retains its object row and popovers. Text already uses a full row; color dropdowns preserve Flat's active sub-toolbar. A fresh browser interaction check for this correction was blocked by automatic approval review because the workspace was out of credits; earlier browser checks below predate this correction.
- Placement regression checks:
  - Opening Text, switching to Alignment and Fill, and closing kept the Grouped toolbar at the same measured x/y coordinates.
  - A top-edge selection flipped the pair below the object; closing retained that anchor. Above the object, panels opened upward.
  - Popovers followed their own trigger horizontally. In a 652 px Inline row, horizontal scrolling kept the connector centered exactly on the visible Text color button; opening the dropdown retained the row and expanded controls.
  - Oversized multi-selection docked the pair at an available viewport edge.
  - Flat text color used the same placement rules. At a 652 × 300 viewport, the full pair stayed visible and the popover scrolled internally (83 px client height, 125 px content height).
  - Removed the app's fixed minimum height so viewport-edge placement uses the actual visible window even in short windows.
  - Automated placement cases cover stable open/switch/close, a single edge flip, both horizontal edges, tall selections with side space, oversized selections, and short viewports.
- Earlier toolbar interaction checks:
  - Flat label editing shows the full text row with Back. Underline, text color, and top alignment update the label; Back returns to object controls.
  - Grouped label editing automatically opens the text popover. The primary row retains the same six controls and its measured width of about 416 px.
  - Grouped alignment exposes working horizontal and vertical controls in a separate popover.
  - Inline inserts text controls inside the primary row, without a compound popover. Opening and closing a color dropdown preserves the expanded group.
  - An open Stroke group remains open when selecting another compatible block and closes when selecting a port.
  - Mixed selection shows Mixed, applies a fill to both objects, and undo restores each original fill.
  - Adding standalone text opens its text controls automatically.
  - At 652 × 642, the expanded Inline row remains inside the viewport (x = 78–635) and scrolls horizontally. The document width stays 652 px and the measured formatting surface has zero intersection with the selected block.
  - The experiment panel remains usable above the formatting surface at narrow widths, including switching behaviors during label editing.
  - No browser warnings or errors in the checked interactions.

The original prototype also received browser checks for connection reversal, object style updates, saved-state restoration, and panel avoidance in the canvas-edge fixture. The current automated suite retains the corresponding model checks.

Manual browser checks are not a committed end-to-end suite. JSON download/re-import, touch interaction, every resize/pan path, and all keyboard combinations have not been exhaustively tested. Desktop pointer use remains the target. Long toolbars scroll horizontally in narrow windows.
