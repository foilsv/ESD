# Working on ESD Formatting Lab

Read `README.md` and `docs/context.md` before changing product behavior. This repository is a deliberately small interaction prototype for ESD formatting experiments.

## Development and deployment policy

User instruction, 2026-09-12:

- All development, builds, tests, and previews happen locally by default.
- Never deploy to production or publish to OpenAI Sites without an explicit user command for that deployment. A request to fix, improve, finish, or continue development is not a deployment command.
- Previous publication requests do not authorize future deployments. This rule overrides any Sites skill's default to publish after edits.
- The existing Site belongs to the user's personal account. On an explicit deployment request, use that personal account and reuse the existing Site; do not create a workspace replacement.
- Do not initiate Sites publishing preparation (remote pushes, write credentials, or hosted versions) during ordinary local development. Keep local changes ready for a later explicit deployment command.
- Do not automatically resume a previously blocked deployment when access is restored; wait for an explicit command.

## Scope and architecture

- Keep the app frontend-only. It is published with OpenAI Sites; retain the local development workflow.
- Keep diagram data, formatting capabilities, UI composition, and fixtures separate. Extend the existing components before adding a new framework or editor library.
- Build the toolbar from capabilities. Unsupported controls disappear. Preserve the relative order of shared controls.
- Follow the user-requested three solutions in `docs/solutions.md`. Colors retain independent, stateful Tier-1 controls with compact dropdowns. Flat Stroke, Text, and Alignment each replace the main row with a dedicated sub-toolbar and Back; Grouped uses compound popovers; Inline expands within the row. Do not replace these with the earlier Replace/Stack/Expand experiments.
- Text-edit mode reveals text tools automatically according to the active solution. Whole-label formatting is sufficient. Keep formatting a label distinct from editing its content.
- Place the toolbar independently of its popover: above the selection when the toolbar alone fits, otherwise below, with a viewport-edge fallback when neither side fits or the selection is oversized. When fallback edges are equally clear, dock at the one nearest the selection. Opening, switching, or closing a popover must never move the toolbar. Prefer opening the popover away from the selection (upward above, downward below); if that side lacks space, flip only the popover toward the selection, allowing overlap as an exception. If neither direction fits, cap the panel to the available space and scroll its contents. Keep the popover visually connected to its trigger. Placement lives in `src/panelPlacement.ts` and `src/usePanelPlacement.ts`.
- The user now requests four-state connection arrow cycling: None → Left (source end) → Right (target end) → Both → None. Keep two separate controls: an arrow-style group (Flat sub-toolbar with Back, Grouped popover, Inline individual buttons) and an iterator button that cycles the four styles. Keep geometric endpoints attached and preserve legacy snapshots through `connectionArrows`.
- Mixed selections expose shared capabilities and mixed values. Avoid arbitrary first-object values.
- Keep alternative experiments comparable: use the same fixture and underlying state.
- Use synthetic example data. Source documents and their links belong in project context, not the product UI.
- Keep reusable decision context here and in `docs/`; do not require a future agent to reread all prior chats.

## Workflow

1. Implement the smallest requested interaction change. Update fixtures or the experiment notes when that helps evaluate it.
2. Run `npm run build`. Run `npm test` for capability, geometry, persistence, or state changes.
3. Check the relevant browser interaction, including expanded panel placement, text mode, and mixed selection where applicable.
4. Describe the behavior changed and checks performed. Keep the result local. Publish only in response to an explicit deployment command, through the user's personal account and the existing Site. Do not add unrelated infrastructure.

## Version and What's new maintenance

- `src/releaseNotes.ts` is the source of truth for the version shown in the app and the What's new page. Its version numbers follow OpenAI Sites deployment versions, not package or commit versions.
- During local development after a deployment, maintain one topmost unpublished entry for the next deployment. Consolidate user-visible work into 2–5 meaningful themes. Update an existing theme when related work continues; do not add a line for every commit, code cleanup, test, or internal fix.
- Describe outcomes a person evaluating the prototype can notice. Include an internal fix only when it materially changes reliability or behavior, and name that outcome rather than the implementation.
- Preserve earlier deployed entries. Before an explicitly requested deployment, confirm the unpublished version is the next Sites version and set its `publishedOn` date before the final build and package. If a deployment does not complete, do not describe it as successfully published in deployment documentation.
- Start the next unpublished entry only when meaningful post-deployment work begins. Keep the entry concise enough that the page remains a release overview rather than a changelog archive.

Use CSS variables for shared visual decisions. Preserve accessible names, focus feedback, keyboard shortcuts, and reduced-motion behavior. Do not replace design experimentation with an oversized settings/inspector product.

## Existing deployment

- Public app: https://esd-formatting-lab.pnv82g.chatgpt.site
- Hosting: OpenAI Sites in the user's personal account. The existing audience is public; that access setting is not authorization to publish updates.
- Use the repository skill at `.agents/skills/esd-sites-publish/SKILL.md` and the current installed Sites hosting skill before publishing updates. Read `docs/deployment.md` only for recovery details or deployment history.
- Reuse the exact `project_id` in `.openai/hosting.json`; never create a duplicate Site for this app.
- Preserve public access and the current URL. Obtain fresh credentials for the same Site when needed; never store tokens in instructions or Git configuration.
- The skill is available from any Codex session that opens this checkout, but the existing personal Site remains account-bound. A work-account session must switch to the personal owner account before publishing; it must not create a workspace replacement.
