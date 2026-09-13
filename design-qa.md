# Design QA · Optional font-size stepper

- Source visual truth: `C:\Users\pnv82\AppData\Local\Temp\codex-clipboard-2b6a596b-3b2d-4009-8448-4ae6c2f8d4be.png`
- Browser-rendered implementation: `C:\projects\esd_prototype\artifacts\font-size-stepper-full.png`
- Focused comparison: `C:\projects\esd_prototype\artifacts\font-size-stepper-comparison.png`
- Viewport: 1280 × 720 CSS px at device pixel ratio 1
- Pixels and normalization: source 268 × 65 px; implementation 1280 × 720 px. The focused comparison crops the size controls from each at their native density; no density resampling was needed.
- State: Motor controller selected in Flat label editing, **Use font size stepper** enabled, shared size 18 px.

## Full-view comparison evidence

The application screenshot confirms that the 586 × 44 px formatting row remains fully visible without horizontal overflow (`clientWidth = scrollWidth = 584`). Its bottom edge is at y = 355.9 and the selected block begins at y = 371.9, preserving a 16 px clear gap. The added control is 99 × 30 px and stays aligned with adjacent font and emphasis controls. The Lab toggle is visible and enabled. No browser warnings or errors were recorded.

Because the supplied visual is a cropped toolbar reference rather than a complete application screen, the full-view pass checks integration, hierarchy, spacing, and selection avoidance rather than whole-screen visual equivalence.

## Focused comparison evidence

The focused side-by-side comparison shows the same three-part construction as the reference: a prominent minus button, bordered numeric value, and prominent plus button. The ESD version uses the existing 30 px toolbar height, Inter typography, blue-gray icon color, border token, radius, and hover treatment so the new control belongs to the product while retaining the reference's interaction pattern.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the value uses the existing ESD 12 px Inter control typography with centered numerals; this is an intentional product-system adaptation of the Google reference.
- Spacing and layout rhythm: the three controls form one compact 99 px cluster with 2 px internal gaps and align to the surrounding 30 px controls. The full toolbar remains clear of the selection.
- Colors and visual tokens: borders, muted icons, hover fill, focus outline, and disabled opacity use existing ESD tokens and states.
- Image quality and asset fidelity: the minus and plus are crisp library icons at native browser resolution; no raster placeholder or improvised glyph is used.
- Copy and content: accessible names and tooltips explicitly identify Increase font size, Decrease font size, and Font size (8–72 px).

## Interaction verification

- Direct entry committed 18 px; Increase changed it to 20 px; Decrease returned it to 18 px.
- The 8 px decrease and 72 px increase limits disable correctly.
- Mixed-size selection leaves the numeric field empty and disables both step buttons until a shared value is entered.
- Flat, Inline, and Grouped's one-line text row expose the stepper when enabled.
- Grouped's ordinary Text popover retains its existing preset and custom-size choices.
- The toggle and value persist through the browser snapshot path.

## Comparison history

The first browser pass found that committing on every numeric-input change could interrupt natural multi-digit entry after the first digit. The input was changed to hold a local draft and commit on Enter or blur; step buttons can still act on that draft immediately. The post-fix browser pass verified direct entry followed by 2 px stepping, with the final value restored to 18 px.

## Follow-up polish

No P3 follow-up is required for this experiment.

final result: passed
