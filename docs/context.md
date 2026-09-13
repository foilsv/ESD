# ESD context and initial decisions

Captured 2026-09-11 to make the project usable by future coding agents.

## Purpose

Prototype a compact, floating formatting panel for an Electronics System Design editor. The product goal is a light, fast, specialized system-sketching experience. This repository tests formatting interaction, not electrical correctness or the complete ESD product.

## Sources consulted

- **ESD formatting principles** — ChatGPT task `6aa44732-8734-83ea-8df3-b15f30d2a4d5`: principles, user correction against category-launcher toolbars, compact object matrix, and four-font discussion.
- **Branch · ESD formatting principles** — task `6aa44d7f-b7f0-83ea-b4a6-7a3cb9035479`: expanded panel occlusion, color access, four width options, and an alternative endpoint model.
- **Branch · Branch · ESD formatting principles** — task `6aa45415-25d8-83e9-9988-abe9f266f7b7`: replace, stack, and label-local approaches to automatic text context.
- [ESD cleanup for Altium/Octopart 27 (WIP, Sept 2026)](https://docs.google.com/document/d/1RRapoQvgYt93Ht-B2GCwZotjMoJUpJOKeOwTIsLu6lk/edit) — fetched from connected Google Drive, including the Formatting Toolbar Composition section and four font roles.
- **ESD – Objects and Formatting Reference** is referenced extensively in those chats. The attached workbook was located, but this initial implementation uses the compact matrix from the conversation rather than claiming a fresh cell-by-cell audit.

Previous chat images were not available in the initial text retrieval. In the subsequent implementation request, the user linked the specific **Formatting toolbar solutions** section. Its updated descriptions and embedded reference images were inspected and implemented; `docs/solutions.md` is now the current specification for the three options.

## Established guidance

1. Good default styling first; optimize the interaction needed to produce a clear diagram.
2. Floating, contextual toolbar; no irrelevant disabled controls.
3. Colors use stateful compact dropdowns. The Lab can merge stroke/line color into the Stroke control for Flat and Inline, enabled by default, or expose it independently in all three solutions. Grouped always keeps color separate.
4. Avoid unnecessary category navigation. Uncommon related settings belong in one secondary surface or inline group according to the selected solution.
5. Label editing is unambiguous intent: expose text controls without another navigation click. By default, Grouped label editing and a newly selected text object use Flat's explicit one-line text row to avoid the larger Text popover; a saved Lab modifier restores the original automatic popover for comparison. Back from a selected text object's row reveals whole-object mode. Manually opening Text from the Grouped object row always remains a popover.
6. Format by shared capabilities, consistently across object families.
7. Place the toolbar above the selection if the toolbar alone fits, otherwise below; use a viewport-edge fallback when neither side fits or the selection is oversized. Opening, switching, or closing a popover must never move the toolbar. Popovers prefer opening away from the selection (upward above, downward below), but may flip independently toward it and overlap when outward space is insufficient. If neither direction fits, cap the panel to available space and scroll its contents. Visually connect the panel to its originating button. This supersedes the earlier rule to flip or shift the toolbar and popover together.
8. Support shared-property multi-selection with explicit mixed state.
9. Grid defaults off; blankets are excluded from this exploration.
10. Use four functional font roles rather than a long font list.
11. Keep rare style operations in an optional overflow menu at the end of the formatting row. The Lab toggle defaults off; the menu contains session-scoped Set default style, Copy style, and Paste style actions.

## Object capabilities

| Family                                            | Object selected                                         | Label editing                                          |
| ------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Block / hardware / software / rectangle / ellipse | Direct fill, stroke sample → details                    | Size, bold, text colors, alignment; typography details |
| Port                                              | Direct fill                                             | Size, bold, text colors; typography details            |
| Connection                                        | Direct line colors, stroke, directional toggle, reverse | Size, bold, text colors; typography details            |
| Simple line                                       | Direct line colors, stroke                              | Not applicable                                         |
| Text                                              | Text controls immediately                               | Same controls                                          |
| Symbol                                            | Direct symbol color                                     | Not applicable                                         |

The table above captures capability families from the initial discussions; the current Tier-1/Tier-2 composition follows `docs/solutions.md`. Stroke offers solid/dashed/dotted and Zero/Small/Medium/Large. Typography includes four font roles, size, B/I/U/S and text color; alignment includes horizontal and vertical choices where applicable.

## Open decisions, not assumed approvals

- The latest user correction replaces the initial direction toggle/reverse model with four arrow states: None, Left (source), Right (target), and Both, available through a style group and a separate cycling button. The style group follows Flat sub-toolbar navigation, Grouped popovers, and Inline expansion with four individual buttons. This explicitly supersedes the earlier endpoint restriction.
- The user selected the updated document's three architectures: **Flat**, **Grouped**, and **Inline**. These replace the starter options. A separate label-local anchor remains deferred.
- The initial default is Flat; all three solutions remain switchable and no winner has been chosen.
- Property allocation varies by solution as described in `docs/solutions.md`; these are working comparison variants.
- Stickiness across compatible selections is an optional experiment, enabled initially.
- The live document lists Courier New for Mono; an earlier chat suggested IBM Plex Mono. This prototype follows Courier New.

## Technical decision

Local React + TypeScript + Vite, SVG rendering, plain CSS and HTML controls. This is a small code project meant for agent-assisted iteration, not a hosted website deliverable. Keep it independent of ESD production and private Drive data. Browser storage is versioned; JSON export captures reproducible experiments. Reconsider a diagram engine only when experiments actually require richer routing/geometry.

## Manufacturer style experiment — 2026-09-12

The Lab now offers Original colors, STM, Infineon, Renesas, NXP, and TI in a single manufacturer-style dropdown. Palettes follow the five screenshots supplied in this request, not official brand specifications. STM uses cyan blocks and magenta connections; Infineon uses teal components, magenta control, and orange sensing; Renesas uses blue; NXP uses blue with orange control; TI uses teal and pale aqua surfaces. Labels choose contrasting light or dark ink.

Applying a palette changes only object colors, across the entire scene, while preserving geometry, endpoints, arrow states, and typography. Individual color controls continue editing actual object styles. The palette preference and object changes share an undo entry; new objects, scene changes, and resets use the current palette. Original colors restores each object's saved pre-palette colors. Snapshot v2 adds optional manufacturer, originalColors, and colorRole fields, keeping older imports readable and preserving their styling. Fixture roles identify control and sensor accents independently of label text; older synthetic fixtures acquire those roles by scene, ID, and kind. Manufacturer names never become real part data or electrical semantics.

Verify all five choices on Motor controller and Object families; check mixed selections, white labels and subtitles, text editing, new blocks/connections, undo/redo, reload, JSON import/export, and Original colors restoration. Development and preview remain local.
