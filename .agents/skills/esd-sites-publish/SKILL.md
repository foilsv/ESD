---
name: esd-sites-publish
description: Prepare an explicitly requested ESD Formatting Lab release for the user's manual OpenAI Sites publisher. Use for deploy, publish, release, or redeploy requests in this repository; do not run the production publisher from the agent.
---

# Prepare ESD Formatting Lab for manual publication

This repository splits release preparation from the production operation. The agent owns the local, reproducible preparation. The user owns the source upload and Sites deployment by running the checked-in publisher outside the agent.

Read the current installed `sites:sites-hosting` skill to catch packaging-contract changes. The rules here override any general instruction to publish after edits: never call Sites tools, obtain a source credential, push remotely, save a version, or deploy from the agent unless the user explicitly changes this repository's standing manual-publish policy.

## Authorization

- Begin release preparation only when the user explicitly says publish, deploy, release, redeploy, or otherwise asks to prepare a release in the current conversation.
- Treat such a request as authorization for local preparation and a local release commit, not production publication from the agent.
- Previous release requests and ordinary development requests are not reusable authorization.
- Never create another Site. The existing project is fixed in `.openai/hosting.json`.

## Fixed facts

- Project ID: `appgprj_6aa4aab0520481919cf3aefa1df1cda0`
- Production URL: `https://esd-formatting-lab.pnv82g.chatgpt.site`
- Audience: `public`
- Static output: `dist`
- Agent-prepared archive: `.local/esd-sites.tar.gz`
- Agent-prepared manifest: `.local/sites-release.json`
- User auth/config: `.local/sites-publish.auth.json`
- Manual command: `npm run release:publish`

The `.local/` directory is ignored. The auth/config file selects Codex Desktop as the credential source but contains no secret. Persistent authentication remains in Codex Desktop's credential store; the manual publisher keeps the short-lived Git token in process memory only.

## Prepare

1. Inspect the intended changes and preserve unrelated user work. Confirm the tracked hosting manifest still has the exact project ID and `static.directory: "dist"`.
2. Ensure `src/releaseNotes.ts` has one topmost unpublished entry for the next Sites version. Consolidate it into 2–5 meaningful product themes and set `publishedOn` to today's date. Do not add a release-note item for deployment mechanics.
3. Follow any current Sites execution-profile setup required for this checkout before final checks.
4. Run the relevant local checks and inspect the final diff. Commit exactly the intended repository state locally. Do not push.
5. Run `npm run release:prepare`. This requires a clean worktree, reruns `npm run build` and `npm test`, packages the unchanged commit with the current Sites helper, verifies the archive shape, and writes a manifest containing the commit and archive hashes.
6. Read `.local/sites-release.json` and verify its version, date, commit, project, URL, audience, and passed checks. If source changes after preparation, commit it and prepare again.
7. Hand the user these commands and stop:

   ```sh
   npm run release:preflight
   npm run release:publish
   ```

   The preflight is optional and read-only. The publisher repeats all local integrity checks and requires the user to type `PUBLISH <version>` before it requests a short-lived source credential or changes Sites.

## Recovery

- A wrong-account or project-not-found result means the user must switch Codex Desktop to the personal account that owns the Site, then rerun the manual command. Never create a work-account replacement.
- The publisher reconciles a version already saved for the exact prepared commit and resumes a missing or failed deployment without saving a duplicate.
- If the local commit, worktree, archive hash, Site audience, project, production URL, or expected next version differs, the publisher stops without changing production.
- The publisher uses the experimental local Codex app-server protocol so it can call the installed Sites connector without starting a model turn. A future Codex protocol change may require maintaining the script; do not bypass a failure by publishing from the agent.
- Record deployment history only from the publisher's confirmed terminal success. It writes ignored local result/history files; do not edit the historical success records in `docs/deployment.md` on an unconfirmed attempt.
