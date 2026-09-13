# OpenAI Sites deployment

## Preferred repeat workflow

Use the checked-in `$esd-sites-publish` skill for routine updates. Codex discovers it from `.agents/skills/esd-sites-publish` whenever this repository is opened, so the project-specific procedure travels with the checkout instead of depending on one user's personal skill directory.

The skill can be invoked from another Codex session, including one initially opened under the user's work account. Publishing the existing Site still requires the personal account that owns it: personal Sites cannot grant an external work account editor rights. If the native Sites preflight cannot access the project ID below, switch Codex to the personal account and issue the publish request there. Never create a work-workspace replacement.

No credentials belong in this repository. The standing policy does not authorize obtaining source-write credentials or performing remote Git operations during a general publish request.

## Development and deployment policy

User instruction, 2026-09-12:

- All development, builds, tests, and previews happen locally by default.
- Never deploy to production or publish to OpenAI Sites without an explicit user command for that deployment. A request to fix, improve, finish, or continue development is not a deployment command.
- Previous publication requests do not authorize future deployments. This rule overrides any Sites skill's default to publish after edits.
- The existing Site belongs to the user's personal account. On an explicit deployment request, use that personal account and reuse the existing Site; do not create a workspace replacement.
- Keep all Git operations local, including during publishing. A publish command authorizes native Sites save/deploy operations but not a remote Git push or source-write credential. If publishing requires a push and the exact revision is not already available to Sites, stop and explain the conflict unless the user separately authorizes that push in the current conversation.
- Do not automatically resume a previously blocked deployment when access is restored; wait for an explicit command.

## Existing Site

- Live URL: https://esd-formatting-lab.pnv82g.chatgpt.site
- Title: ESD Formatting Lab
- Slug: `esd-formatting-lab`
- Project ID: `appgprj_6aa4aab0520481919cf3aefa1df1cda0`
- Audience: `public`, explicitly requested by the user. Anyone with the link can visit. Preserve this audience for future updates.
- Authoritative configuration: `C:/projects/esd_prototype/.openai/hosting.json`.
- Site shape: static frontend, with `static.directory: "dist"`. No server, runtime secrets, or database. Visitors' experiments save in their own browser; JSON exports are available.

Reuse the exact project ID from the manifest. Never call `create_site` again for this app. Do not store credentials or deployment history in the manifest.

## First successful publication

Confirmed by the native deployment status response on 2026-09-12 at 01:32:35 UTC:

- Status: `succeeded`
- Version number: `1`
- Saved version ID: `appgprj_6aa4aab0520481919cf3aefa1df1cda0~appgver_94662b64e2c88191b9faa9c30eea7e3f`
- Deployment ID: `appgdep_6aa4ab4fd6088191b467332cc962dd3c`
- Source commit: `0a6c92528ddbf2c1a7298780337ddae019a2cfac`

These identify the first publication. Copy new version/deployment IDs directly from tool responses for subsequent revisions.

## Publishing an update after an explicit command

The repository skill is the concise source for the normal path. The expanded procedure below remains as recovery context.

Start this procedure only after the user explicitly commands deployment. Use the personal account that owns this Site.

1. Read the current installed `sites:sites-hosting` skill and its publishing/handoff references. Use native Sites tools and the current plugin scripts.
2. Read the manifest, reuse its project ID, and check the Site audience through `get_site` as required by the skill. Preserve public access; do not switch it to private to deploy.
3. Reuse this checkout. Run the execution-profile helper when entering a new environment; the initial deployment used `portable`. Build changed app source with `npm run build` and run appropriate tests. Reuse an unchanged successful build when allowed.
4. Commit the intended source locally and use Sites version metadata to determine whether that exact commit is already available remotely. Do not obtain a source-write credential or run remote Git commands under the publish request.
5. If Sites does not already have the exact commit and its current contract requires a push, stop and explain the blocker. A push requires separate, explicit authorization in the current conversation.
6. For an already-available exact commit, package only the built app using the Sites helper. The archive is `.local/esd-sites.tar.gz`, ignored by Git. Repackage changed source; an existing archive is not automatically current. Keep it unchanged until saving succeeds.
7. Call `save_site_version` with the exact project ID, known available SHA, and absolute archive path, then `deploy_site_version` with the returned version ID. This is the public deployment path.
8. Poll `get_deployment_status` with the returned deployment ID until terminal. Report success only for `succeeded` with a URL. Return the exact URL and use the app-opening tool for handoff.

Every development change stays local until an explicit deployment command. Do not infer publishing authorization from app edits or documentation maintenance.

## Windows notes

- Git Bash is installed at `C:/Program Files/Git/bin/bash.exe`, but was absent from the default PATH. The packager invokes Bash. Prepending `C:\Program Files\Git\bin;C:\Program Files\Git\usr\bin;` to that process's PATH allowed it to run; no permanent PATH change was needed.
- The installed helper was `C:/Users/pnv82/.codex/plugins/cache/openai-curated-remote/sites/0.1.62/scripts/package-site.mjs`. Resolve the current installed plugin root on later runs rather than assuming that version.
- Git Bash tar treated a `C:/...` archive destination as remote. Passing `/c/projects/esd_prototype/.local/esd-sites.tar.gz` to the helper succeeded. Pass `C:/projects/esd_prototype/.local/esd-sites.tar.gz` to the native Sites save tool.
- If Git reports a sandbox ownership mismatch, use per-command `-c safe.directory=C:/projects/esd_prototype`; do not broadly trust unrelated directories.
- The initial sandbox helper failed to start, so publication used reviewed elevated execution. Try normal execution first on future runs; that historical error does not imply elevation is always needed.

Historical source credentials were never stored here, in the manifest, or in Git configuration. Do not obtain a new one under a general publish request.

## Latest successful publication · 2026-09-12

Published after the user's explicit "let's publish" command using the personal account that owns the existing Site. Public access and the original URL were preserved.

- Live URL: https://esd-formatting-lab.pnv82g.chatgpt.site
- Status: `succeeded`, confirmed at `2026-09-13T03:12:32.266150+00:00`.
- Version number: `5`
- Saved version ID: `appgprj_6aa4aab0520481919cf3aefa1df1cda0~appgver_96aac6b9443c819182376ec3709d43da`
- Deployment ID: `appgdep_6aa61496fd908191b345f20f2f778d65`
- Source commit: `5f55e992b8ce76d1a68d40ba3b7b22a3a1f729d6`
- Archive SHA-256: `a2e6730fc21186863e82f373e4a43832f3ea3f214a8ee565b2db01184cedeb37`

Includes manufacturer-inspired styles, four-state connection arrows, canvas navigation refinements, flexible stroke controls, and the optional formatting overflow menu. The source passed the build and all 58 tests before publication.

During this publication, the source push happened before the user clarified that future Git operations must remain local. That push completed before version saving; the subsequent version save and deployment reused it. This historical fact is not authorization for another push.

## Previous successful publication · 2026-09-12

Published after the user's explicit "let's deploy" command using the personal account that owns the existing Site. Public access and the original URL were preserved.

- Live URL: https://esd-formatting-lab.pnv82g.chatgpt.site
- Status: `succeeded`, confirmed at `2026-09-12T14:46:34.074441+00:00`.
- Version number: `2`
- Saved version ID: `appgprj_6aa4aab0520481919cf3aefa1df1cda0~appgver_aabae9ac4c1881918087196ec0160d61`
- Deployment ID: `appgdep_6aa565b82f908191ac298f450d5d42d4`
- Source commit: `bfae194c809b6127e939728528f1b146773c0347`
- Archive SHA-256: `3e0fe20d3cf35c01395481ceedb9da3e6b5be2e26d6827b5cfd6185f24482d64`

Includes stable toolbar and edge placement fixes, compact custom colors, direct Grouped font choices, visible font-size arrows, the saved popover-header modifier, and 1 / 2 / 4 / 8 px stroke choices. The source passed the build and all 32 tests before publication.

The earlier project-not-found blocker is resolved in the personal account. Future development remains local, and every future deployment still requires an explicit user command.
