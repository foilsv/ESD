---
name: esd-sites-publish
description: Publish an explicitly approved ESD Formatting Lab update from this checkout to its existing OpenAI Site. Use for deploy, publish, or redeploy requests for this repository; do not use for local builds, previews, or ordinary development.
---

# Publish ESD Formatting Lab

Use this repository-specific workflow together with the currently installed `sites:sites-hosting` skill. Read that skill's Publishing and Handoff references because its native tool contract can change. Use `docs/deployment.md` only for recovery details or historical confirmation; the facts needed for the normal path are below.

## Authorization and identity

- Begin only when the user explicitly commands a deployment in the current conversation. Earlier deployments and ordinary requests to fix, finish, or continue do not authorize publishing.
- Keep every Git operation local. A publish or deploy command does not authorize obtaining a source-write credential or pushing to the Site repository. If the current Sites tool contract requires a remote push and the exact local revision is not already available to Sites, stop and explain the conflict. Perform a push only after the user separately and explicitly authorizes that push in the current conversation.
- The existing Site is owned by the user's personal account. The same checked-out skill is available from another Codex session, but a session using the separate work account cannot edit this personal Site. Verify access to the existing project with the native Sites tools before any publish operation.
- If the project is unavailable, report the account mismatch and ask the user to switch Codex to the personal owner account, then run the publish request there. Do not register, create, transfer, or publish a replacement Site in the work workspace.
- Never call `create_site` for this project.

## Fixed project facts

- Manifest: `.openai/hosting.json`
- Expected project ID: `appgprj_6aa4aab0520481919cf3aefa1df1cda0`
- Production URL: `https://esd-formatting-lab.pnv82g.chatgpt.site`
- Audience: public; preserve it
- Shape: static frontend; the manifest's `static.directory` must remain `dist`
- Source branch: use the branch returned with the current source credential; it has historically been `main`
- Temporary archive: `.local/esd-sites.tar.gz`, which is ignored by Git

Treat the manifest as authoritative and stop if its project ID differs from the expected ID. Never create a new Site to resolve a mismatch.

## Publish

1. Inspect the intended changes. Confirm `src/releaseNotes.ts` has one topmost unpublished entry whose version is the next Sites version. Set its `publishedOn` to today's date before the final build. Do not add a release-note item for deployment mechanics.
2. Resolve the current installed Sites plugin root instead of assuming a cached version. Run its execution-profile helper for this checkout.
3. Run `npm run build` and `npm test`. Require `dist/index.html`. Stop on failure.
4. Recheck the source diff and commit exactly the intended repository state locally. Do not rewrite or discard unrelated user changes. Do not publish from a source state that changes after this commit.
5. Use the native Sites tools to verify the existing project and public audience. Use Sites version metadata to determine whether the exact local commit is already available remotely; do not probe or change the remote through Git.
6. If the exact local commit is not already available to Sites and the current tool contract requires it to be pushed, stop and report that publishing cannot continue under the standing no-push policy. Do not obtain a source-write credential or push unless the user explicitly authorizes that separate action.
7. When an exact already-available revision can be used, run `git rev-parse --verify HEAD` locally and use the complete output verbatim as `commit_sha`.
8. Package the unchanged checkout with the current Sites `package-site.mjs` helper into `.local/esd-sites.tar.gz`. On Windows, prepend Git Bash directories only for that process if required; the Bash-form archive argument is `/c/projects/esd_prototype/.local/esd-sites.tar.gz`, while the native save tool receives `C:/projects/esd_prototype/.local/esd-sites.tar.gz`.
9. Save one version with the exact project ID, commit SHA, and archive, then deploy that returned version through the public path. Reuse a saved version when recovering from a deployment-only failure; do not save duplicates.
10. Poll the returned deployment ID to a terminal state. Success requires `succeeded` and the literal production URL from the native response. Open that URL in the existing Sites tab when available and report it concisely.

## Credential hygiene and recovery

- The only committed hosting values are the project ID and static configuration in `.openai/hosting.json`. `.env*` and `.local/` remain ignored. Before committing, inspect staged paths and staged text for accidental credentials.
- A public audience grants visitor access, not editing rights.
- On `project_not_found` or an ownership error, stop for an account switch; never create a duplicate.
- On `stale_commit_sha`, verify the local state and Sites version metadata without remote Git. If resolving it requires a push, stop under the no-push policy and ask for direction.
- If a save result is uncertain, reconcile versions for the pushed commit before retrying. If a response supplies a saved version ID, reuse it.
- Record deployment history only after confirmed success. Never describe a failed or unknown deployment as published.
