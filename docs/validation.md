# Toolbar solutions validation · 2026-09-11

## Styled font dropdowns · 2026-09-12

Replaced the Flat/Inline native font select with a real icon button and the shared formatting popover. Each choice shows its style icon and class name, with a checkmark on the selected style. Grouped retains its direct four-button row. Font popovers use the existing placement, connector, optional header, and viewport limits; selection and Escape close only the dropdown and return focus to its trigger. Opening size, color, or another group dismisses it.

The build and all 35 tests pass. Visually verified the Inline trigger icon and matching four-choice popover locally. Further selection/keyboard interaction checks were interrupted when browser tabs became unavailable. No deployment was performed.

## Default custom colors and simpler lab · 2026-09-12

Added four Octopart-derived custom defaults and replaced the old accumulated palette without deleting its backup storage key. Custom selection now listens to the native commit event instead of React's drag-preview changes; stored colors normalize case and remove exact duplicates. Removed the Current context block and Try it guidance, retaining Reset scene.

The local build and all 35 tests pass. Regression coverage checks initial/default recovery, duplicate handling, persistence, and multiple picker input events followed by a single committed color. Browser verification confirmed four custom swatches followed by the circular plus, and the shorter sidebar with both requested blocks absent. Further dialog interaction was not completed because the preview selection changed during checking. Changes remain local; no deployment was performed.

## Direct choices and lighter popovers · 2026-09-12

Grouped text formatting now exposes four font-style icon buttons directly; numeric font-size arrows remain visible. The Show popover headers modifier removes or restores the title and close button across formatting popovers and persists in local saves and exported experiments, defaulting to enabled for old files.

Stroke widths now offer 1, 2, 4, and 8 px with line samples across all behaviors. Zero is absent from the choices; legacy saved widths still load. Added snapshot coverage for the header modifier and new width.

Build and all 32 tests pass. Local browser checks confirmed one-click Compact font selection, the size stepper changing 18 to 19, header removal without moving the toolbar (x=78, y=162.0625), four visibly distinct width samples, and selecting 8 px. Test formatting changes were undone. No deployment was performed.

## Compact custom colors · 2026-09-12

Removed the separate custom color input. Saved custom colors now share a row with a circular plus button in the last position; the plus remains available when there are no saved colors and opens the native color dialog for selection and manual entry.

The production build passes. Local browser verification confirmed matching 23 px circles, the plus after the saved swatches, no inline hex field, and successful opening and dismissal of the native color dialog. No deployment was performed.

## Nearby edge docking · 2026-09-12

Fixed the fallback that chose the top of the canvas when a selected block crossed the bottom boundary. Equally clear docking positions now prefer the edge nearest the selection. Containment checks tolerate tiny floating-point errors so a valid right-clamped anchor is not rejected.

Reproduced the bug in Grouped by zooming a selected Control firmware block past the lower boundary: the previous toolbar jumped to screen y=76. After the fix, it docked at y=741 and remained there when the color popup opened upward. Switching between different popup sizes also retained the anchor. All 28 tests and the production build pass, including new bottom-boundary and fractional-coordinate regressions. This change is local only.

## Fixed toolbar anchor · 2026-09-12

The toolbar now chooses its position independently of popover size: above the selection when the toolbar alone fits, otherwise below, with viewport-edge docking when neither fits. Opening, switching, and closing panels retains that anchor. Popovers prefer the outward side, flip toward the selection only when outward space is insufficient, and scroll within the larger available side if neither fits their natural height.

All 26 tests pass, including ten placement regressions for stable anchors, top/bottom fallback, independent flips, capped heights, horizontal trigger alignment, and oversized selections. The production build passes. In the running Grouped UI, opening Fill, Text, Alignment, and Stroke, then closing/reopening kept the toolbar at x=78, y=170.90625. Three canvas-edge selections also retained identical before/after coordinates; the popover flipped downward near the top and opened upward where space allowed. No browser errors appeared in these checks. The local preview server was restarted before these checks to load the new implementation.

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
