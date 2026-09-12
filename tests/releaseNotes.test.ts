import assert from 'node:assert/strict';
import test from 'node:test';
import { currentRelease, releaseNotes } from '../src/releaseNotes';

test('release notes stay deployment-oriented and well formed', () => {
  assert.equal(currentRelease, releaseNotes[0]);
  assert.equal(new Set(releaseNotes.map((release) => release.version)).size, releaseNotes.length);
  assert.ok(releaseNotes.every((release) => release.changes.length >= 2));
  assert.ok(releaseNotes.every((release) => release.changes.length <= 5));
  assert.ok(releaseNotes.filter((release) => !release.publishedOn).length <= 1);
  assert.deepEqual(
    releaseNotes.map((release) => Number(release.version)),
    [...releaseNotes].map((release) => Number(release.version)).sort((a, b) => b - a),
  );
});
