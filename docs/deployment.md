# OpenAI Sites deployment

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

## Updating the same app

1. Read the current installed `sites:sites-hosting` skill and its publishing/handoff references. Use native Sites tools and the current plugin scripts.
2. Read the manifest, reuse its project ID, and check the Site audience through `get_site` as required by the skill. Preserve public access; do not switch it to private to deploy.
3. Reuse this checkout. Run the execution-profile helper when entering a new environment; the initial deployment used `portable`. Build changed app source with `npm run build` and run appropriate tests. Reuse an unchanged successful build when allowed.
4. Obtain a current source write credential for the same Site. The initial repository was `https://git.chatgpt-team.site/4289fba2-7152-450b-a9d6-260d8b95d8e7/appgprj_6aa4aab0520481919cf3aefa1df1cda0.git`, branch `main`. Use the endpoint and branch returned by the current credential response. This checkout already has Git; the initial push used the URL directly, without configuring a remote.
5. Commit the intended source and push using per-command authentication. The initial credential used `http_extra_header` with an `Authorization: Bearer` header. Never save or print the token. After push succeeds, run `git rev-parse --verify HEAD` and copy its complete SHA verbatim.
6. Package only the built app using the Sites helper. The initial archive was `.local/esd-sites.tar.gz`, ignored by Git. Repackage changed source; an existing archive is not automatically current. Keep it unchanged until saving succeeds.
7. Call `save_site_version` with the exact project ID, pushed SHA, and absolute archive path, then `deploy_site_version` with the returned version ID. This is the public deployment path.
8. Poll `get_deployment_status` with the returned deployment ID until terminal. Report success only for `succeeded` with a URL. Return the exact URL and use the app-opening tool for handoff.

Do not redeploy for documentation-only maintenance. Respect future requests for local-only changes or saving without deployment.

## Windows notes

- Git Bash is installed at `C:/Program Files/Git/bin/bash.exe`, but was absent from the default PATH. The packager invokes Bash. Prepending `C:\Program Files\Git\bin;C:\Program Files\Git\usr\bin;` to that process's PATH allowed it to run; no permanent PATH change was needed.
- The installed helper was `C:/Users/pnv82/.codex/plugins/cache/openai-curated-remote/sites/0.1.62/scripts/package-site.mjs`. Resolve the current installed plugin root on later runs rather than assuming that version.
- Git Bash tar treated a `C:/...` archive destination as remote. Passing `/c/projects/esd_prototype/.local/esd-sites.tar.gz` to the helper succeeded. Pass `C:/projects/esd_prototype/.local/esd-sites.tar.gz` to the native Sites save tool.
- If Git reports a sandbox ownership mismatch, use per-command `-c safe.directory=C:/projects/esd_prototype`; do not broadly trust unrelated directories.
- The initial sandbox helper failed to start, so publication used reviewed elevated execution. Try normal execution first on future runs; that historical error does not imply elevation is always needed.

Credentials expire. None are stored here, in the manifest, or in Git configuration. Renew them for this Site instead of registering a duplicate.

## Pending toolbar-placement update · 2026-09-12

The fixed-toolbar placement change is built, tested, and saved locally, but has not been republished. Both `get_site` and `create_source_repository_write_credential` returned `NOT_FOUND / project_not_found` for the saved project ID; `search_sites` for `esd-formatting-lab` returned no results. Preserve the existing manifest, project ID, and public URL. Restore Sites access in the account/workspace owning the existing Site, then publish this update through the procedure above. Do not create a replacement Site to work around this error.
