# Working on ESD Formatting Lab

Read `README.md` and `docs/context.md` before changing product behavior. This repository is a deliberately small interaction prototype for ESD formatting experiments.

## Scope and architecture

- Keep the app frontend-only. It is published with OpenAI Sites; retain the local development workflow.
- Keep diagram data, formatting capabilities, UI composition, and fixtures separate. Extend the existing components before adding a new framework or editor library.
- Build the toolbar from capabilities. Unsupported controls disappear. Preserve the relative order of shared controls.
- Follow the user-requested three solutions in `docs/solutions.md`. Colors retain independent, stateful Tier-1 controls with compact dropdowns. Flat Stroke, Text, and Alignment each replace the main row with a dedicated sub-toolbar and Back; Grouped uses compound popovers; Inline expands within the row. Do not replace these with the earlier Replace/Stack/Expand experiments.
- Text-edit mode reveals text tools automatically according to the active solution. Whole-label formatting is sufficient. Keep formatting a label distinct from editing its content.
- Place the toolbar independently of its popover: above the selection when the toolbar alone fits, otherwise below, with a viewport-edge fallback when neither side fits or the selection is oversized. Opening, switching, or closing a popover must never move the toolbar. Prefer opening the popover away from the selection (upward above, downward below); if that side lacks space, flip only the popover toward the selection, allowing overlap as an exception. If neither direction fits, cap the panel to the available space and scroll its contents. Keep the popover visually connected to its trigger. Placement lives in `src/panelPlacement.ts` and `src/usePanelPlacement.ts`.
- The user now requests four-state connection arrow cycling: None → Left (source end) → Right (target end) → Both → None. Keep two separate controls: an arrow-style group (Flat sub-toolbar with Back, Grouped popover, Inline individual buttons) and an iterator button that cycles the four styles. Keep geometric endpoints attached and preserve legacy snapshots through `connectionArrows`.
- Mixed selections expose shared capabilities and mixed values. Avoid arbitrary first-object values.
- Keep alternative experiments comparable: use the same fixture and underlying state.
- Use synthetic example data. Source documents and their links belong in project context, not the product UI.
- Keep reusable decision context here and in `docs/`; do not require a future agent to reread all prior chats.

## Workflow

1. Implement the smallest requested interaction change. Update fixtures or the experiment notes when that helps evaluate it.
2. Run `npm run build`. Run `npm test` for capability, geometry, persistence, or state changes.
3. Check the relevant browser interaction, including expanded panel placement, text mode, and mixed selection where applicable.
4. Describe the behavior changed and checks performed. For app updates, follow the installed Sites hosting skill and reuse the existing public Site unless the user requests local-only work. Documentation-only maintenance does not require deployment. Do not add unrelated infrastructure.

Use CSS variables for shared visual decisions. Preserve accessible names, focus feedback, keyboard shortcuts, and reduced-motion behavior. Do not replace design experimentation with an oversized settings/inspector product.

## Existing deployment

- Public app: https://esd-formatting-lab.pnv82g.chatgpt.site
- Hosting: OpenAI Sites, explicitly authorized for anyone with the link.
- Read `docs/deployment.md` and the current installed Sites hosting skill before publishing updates.
- Reuse the exact `project_id` in `.openai/hosting.json`; never create a duplicate Site for this app.
- Preserve public access and the current URL. Obtain fresh credentials for the same Site when needed; never store tokens in instructions or Git configuration.
