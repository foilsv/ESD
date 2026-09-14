# OpenAI Sites deployment

## Preferred repeat workflow

Use the checked-in `$esd-sites-publish` skill to ask the agent to prepare a release. Codex discovers it from `.agents/skills/esd-sites-publish` whenever this repository is opened. Preparation updates release metadata, checks and commits the exact local source, packages it, and writes an ignored manifest that pins both the commit and archive hashes.

The agent stops there. Switch Codex Desktop to the personal account that owns the Site, then run the publisher yourself from a terminal:

```sh
npm run release:preflight
npm run release:publish
```

The preflight is optional and read-only. The publisher repeats the local integrity checks and asks you to type `PUBLISH <version>` before it obtains a short-lived source credential or changes Sites. It then uploads only the prepared commit, saves or reuses its Site version, deploys it, and polls until success or failure. It does not start a model turn.

For this checkout, `.local/sites-publish.auth.json` has already been created and is excluded by `.gitignore`. For a fresh checkout, initialize it with:

```powershell
New-Item -ItemType Directory -Force .local
Copy-Item scripts/sites-publish.auth.example.json .local/sites-publish.auth.json
```

The file contains account-selection configuration, not a secret. Persistent authentication stays in Codex Desktop's credential store. The fresh, short-lived Git token returned during publication remains in process memory and is never written to a file, remote URL, or Git configuration.

## Development and deployment policy

User instructions, 2026-09-12 and 2026-09-13:

- All development, builds, tests, and previews happen locally by default.
- A publish/deploy request made to the agent authorizes only local release preparation and a local commit. The agent never runs the production publisher, calls Sites tools, obtains a source credential, pushes, saves a version, or deploys under this standing workflow.
- The user performs the production operation by running `npm run release:publish` manually. Its typed confirmation is the final publication boundary.
- Previous publication requests do not authorize later release preparation. Ordinary requests to fix, improve, finish, or continue are development-only.
- The existing Site belongs to the user's personal account. The manual script must reuse that Site, its public audience, and its URL; it refuses the wrong account or a mismatched Site rather than creating a replacement.
- The user-run publisher may push only the exact commit recorded by the agent-prepared manifest. It refuses a dirty worktree, moved HEAD, changed archive, wrong version, or changed Site identity/access.

## Existing Site

- Live URL: https://esd-formatting-lab.pnv82g.chatgpt.site
- Title: ESD Formatting Lab
- Slug: `esd-formatting-lab`
- Project ID: `appgprj_6aa4aab0520481919cf3aefa1df1cda0`
- Audience: `public`, explicitly requested by the user. Anyone with the link can visit. Preserve this audience for future updates.
- Authoritative configuration: `C:/projects/esd_prototype/.openai/hosting.json`.
- Site shape: static frontend, with `static.directory: "dist"`. No server, runtime secrets, or database. Visitors' experiments save in their own browser; JSON exports are available.

Reuse the exact project ID from the manifest. Never call `create_site` again for this app. The tracked manifest contains no credentials or deployment history.

## First successful publication

Confirmed by the native deployment status response on 2026-09-12 at 01:32:35 UTC:

- Status: `succeeded`
- Version number: `1`
- Saved version ID: `appgprj_6aa4aab0520481919cf3aefa1df1cda0~appgver_94662b64e2c88191b9faa9c30eea7e3f`
- Deployment ID: `appgdep_6aa4ab4fd6088191b467332cc962dd3c`
- Source commit: `0a6c92528ddbf2c1a7298780337ddae019a2cfac`

These identify the first publication. Copy new version/deployment IDs directly from tool responses for subsequent revisions.

## Preparing and publishing an update

The repository skill is the concise source for the agent side. The scripts enforce the handoff mechanically.

### Agent preparation

1. Inspect the intended changes and update the top `src/releaseNotes.ts` entry to the next Sites version with today's `publishedOn` date.
2. Follow the current Sites execution-profile requirement, run the relevant checks, inspect the diff, and commit exactly the intended state locally. Do not push.
3. Run `npm run release:prepare`. It requires a clean tree, runs the production build and complete test suite, locates the current Sites packaging helper, creates `.local/esd-sites.tar.gz`, verifies the archive, and writes `.local/sites-release.json`.
4. Verify the prepared manifest and give the manual commands to the user. If the source changes, commit and prepare again.

### User publication

1. Switch Codex Desktop to the personal Site-owner account.
2. Optionally run `npm run release:preflight`. It validates the prepared commit/archive, account, Site identity, public audience, URL, and next version without changing anything.
3. Run `npm run release:publish` and type the requested `PUBLISH <version>` confirmation.
4. The script asks the connector for a short-lived source credential, pushes the exact prepared commit when needed, verifies the remote branch SHA, saves or reuses one version for that commit, deploys it, and polls for a terminal result.
5. A confirmed success is written to ignored `.local/sites-publish-result.json` and `.local/sites-publish-history.jsonl`. A failed or uncertain operation is not recorded as successful.

The production script communicates with the Sites connector through `codex app-server` directly and never sends a model prompt or starts a model turn. The app-server JSON-RPC interface is currently experimental, so a future Codex release may require a small compatibility update to `scripts/publish-sites.mjs`.

## Windows notes

- Git Bash is installed at `C:/Program Files/Git/bin/bash.exe`, but was absent from the default PATH. The packager invokes Bash. Prepending `C:\Program Files\Git\bin;C:\Program Files\Git\usr\bin;` to that process's PATH allowed it to run; no permanent PATH change was needed.
- Installed plugin locations can change. The preparation script resolves the newest cached Sites packager and falls back to Codex's bundled marketplace copy rather than assuming a versioned path.
- Git Bash tar treated a `C:/...` archive destination as remote. Passing `/c/projects/esd_prototype/.local/esd-sites.tar.gz` to the helper succeeded. Pass `C:/projects/esd_prototype/.local/esd-sites.tar.gz` to the native Sites save tool.
- If Git reports a sandbox ownership mismatch, use per-command `-c safe.directory=C:/projects/esd_prototype`; do not broadly trust unrelated directories.
- The initial sandbox helper failed to start, so publication used reviewed elevated execution. Try normal execution first on future runs; that historical error does not imply elevation is always needed.

Historical source credentials were never stored here, in the manifest, or in Git configuration. The manual publisher keeps the fresh, short-lived credential in process memory only.

## Latest successful publication · 2026-09-13

Published after the user explicitly authorized both the source push and publication in the current conversation. The existing personal-account Site, public access, and original URL were preserved.

- Live URL: https://esd-formatting-lab.pnv82g.chatgpt.site
- Status: `succeeded`, confirmed at `2026-09-14T00:01:16.019326+00:00`.
- Version number: `6`
- Saved version ID: `appgprj_6aa4aab0520481919cf3aefa1df1cda0~appgver_422767d98ba88191a1dcd9f31ffaf714`
- Deployment ID: `appgdep_6aa739429684819180ebbc64e67fdc58`
- Source commit: `69070fad1b664fd389210e72643c4b2fddaec297`
- Archive SHA-256: `22aea3cdd95214b741e750d329b0c8444db6822d424ebc6e6b1f3ed09373ede6`

Includes direct label typing, shared keyboard commands and command palette, compact alignment and optional font-size controls, icon-based scene switching, and derived readable stroke and label colors. The source passed the build and all 92 tests before publication.

## Previous successful publication · 2026-09-12

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

## Earlier successful publication · 2026-09-12

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
