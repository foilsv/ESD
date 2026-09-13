# Formatting experiments

## First comparison

Use the same scene and tasks for Flat, Grouped, and Inline. Keep viewport size and zoom consistent. The current behavior contract is in `solutions.md`.

1. Select the MCU and make it green.
2. Edit its label, make it 20 px and bold, then change its text color.
3. Change the border to dashed, then return to the label.
4. Select the PWM connection and cycle through Right → Both → None → Left → Right. Confirm both endpoints render arrows in Both, and undo returns to the preceding state.
5. Shift-select two different blocks and apply a shared fill.
6. Keep Stroke open while switching among blocks, then select a port.
7. Repeat in Dense diagram and Canvas edges; drag selections toward the viewport boundary.
8. In Flat, open Stroke, change its color and width, and use Back; repeat with Alignment and Text. Confirm color dropdowns preserve the current sub-toolbar. In Grouped, enter label editing with the one-line text modifier on, then turn it off and compare the automatic Text popover. Select a text object, confirm its one-line row opens immediately, use Back to reach whole-object mode, and manually open Text to confirm it remains a popover. In Inline, open a color dropdown while Text stays expanded.
9. Compare horizontal/vertical alignment, underline, and strikethrough in all three solutions.

Record clicks, unexpected mode changes, whether state was visible, whether the panel covered the target, and whether the control was easy to find. These are manual study notes; the app does not collect telemetry.

| Date / variant | Task | Observation | Next adjustment |
| -------------- | ---- | ----------- | --------------- |
|                |      |             |                 |

## Useful next requests for a coding agent

- “Make the text palette more compact while keeping common colors one click away.”
- “Add a fourth behavior with text tools anchored near the edited label.”
- “Compare choosing an arrow style directly with using the adjacent cycle button.”
- “Move the stroke panel beside the primary bar while preserving the selection exclusion area.”
- “Add a representative dense diagram fixture with long interface labels.”

## Deferred editor work

Only add these when they help a specific formatting study: marquee selection, wrapping and multiline labels, clipboard/style copying, alignment/distribution, embedded images, routing edits, and more precise port attachment. Full ESD integration, parts search, auth, collaboration, and production storage are separate projects.
