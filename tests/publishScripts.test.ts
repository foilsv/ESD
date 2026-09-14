import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { extractReleaseInfo, toBashPath } from '../scripts/prepare-sites-release.mjs';
import { unwrapToolResult, validateReleaseDocument } from '../scripts/publish-sites.mjs';

const projectId = 'appgprj_6aa4aab0520481919cf3aefa1df1cda0';
const liveUrl = 'https://esd-formatting-lab.pnv82g.chatgpt.site';
const archivePath = path.resolve('.local/esd-sites.tar.gz');

test('release preparation reads the top Sites version and publication date', () => {
  const release = extractReleaseInfo(`
    export const releaseNotes: ReleaseNote[] = [
      {
        version: '7',
        title: 'Next release',
        publishedOn: '2026-09-14',
        changes: [],
      },
      { version: '6', publishedOn: '2026-09-13', changes: [] },
    ];
  `);

  assert.deepEqual(release, { version: 7, publishedOn: '2026-09-14' });
});

test('release preparation requires a publication date', () => {
  assert.throws(
    () => extractReleaseInfo(`export const releaseNotes = [{ version: '7', changes: [] }];`),
    /no publishedOn date/,
  );
  assert.throws(
    () =>
      extractReleaseInfo(
        `export const releaseNotes = [{ version: '7', publishedOn: '2026-02-31', changes: [] }];`,
      ),
    /invalid publishedOn date/,
  );
});

test(
  'Windows archive paths are converted for the Sites Bash packager',
  { skip: process.platform !== 'win32' },
  () => {
    assert.equal(toBashPath('C:\\work\\site.tar.gz'), '/c/work/site.tar.gz');
  },
);

test('prepared releases must preserve the existing Site and successful checks', () => {
  assert.doesNotThrow(() =>
    validateReleaseDocument(
      {
        schema_version: 1,
        project_id: projectId,
        live_url: liveUrl,
        expected_access_mode: 'public',
        release_version: 7,
        release_date: '2026-09-14',
        commit_sha: 'a'.repeat(40),
        archive_path: archivePath,
        archive_sha256: 'b'.repeat(64),
        checks: { build: 'passed', tests: 'passed' },
      },
      { project_id: projectId, static: { directory: 'dist' } },
    ),
  );

  assert.throws(
    () =>
      validateReleaseDocument(
        {
          schema_version: 1,
          project_id: projectId,
          live_url: 'https://replacement.example',
          expected_access_mode: 'public',
          release_version: 7,
          release_date: '2026-09-14',
          commit_sha: 'a'.repeat(40),
          archive_path: archivePath,
          archive_sha256: 'b'.repeat(64),
          checks: { build: 'passed', tests: 'passed' },
        },
        { project_id: projectId, static: { directory: 'dist' } },
      ),
    /does not preserve the existing public Site URL/,
  );
});

test('direct app-server tool responses unwrap their structured result', () => {
  assert.deepEqual(unwrapToolResult({ structuredContent: { result: { ok: true } } }), { ok: true });
  assert.deepEqual(unwrapToolResult({ structuredContent: { ok: true } }), { ok: true });
});

test('manual publication calls Sites directly without starting a model turn', async () => {
  const source = await readFile(path.resolve('scripts/publish-sites.mjs'), 'utf8');

  assert.match(source, /'mcpServer\/tool\/call'/);
  assert.match(source, /'thread\/start'[\s\S]*?ephemeral: true/);
  assert.doesNotMatch(source, /['"]turn\/start['"]/);
});
