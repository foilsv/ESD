#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const EXPECTED_PROJECT_ID = 'appgprj_6aa4aab0520481919cf3aefa1df1cda0';
const EXPECTED_LIVE_URL = 'https://esd-formatting-lab.pnv82g.chatgpt.site';
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const localDirectory = path.join(projectDirectory, '.local');
const archivePath = path.join(localDirectory, 'esd-sites.tar.gz');
const releasePath = path.join(localDirectory, 'sites-release.json');

export function extractReleaseInfo(source) {
  const entry = source.match(
    /export\s+const\s+releaseNotes[^=]*=\s*\[\s*\{([\s\S]*?)changes\s*:\s*\[/,
  );
  if (!entry) throw new Error('Could not find the top release-note entry.');

  const version = entry[1].match(/version\s*:\s*['"](\d+)['"]/);
  const publishedOn = entry[1].match(/publishedOn\s*:\s*['"](\d{4}-\d{2}-\d{2})['"]/);
  if (!version) throw new Error('The top release-note entry has no numeric version.');
  if (!publishedOn) throw new Error('The top release-note entry has no publishedOn date.');

  const parsedDate = new Date(`${publishedOn[1]}T00:00:00Z`);
  if (
    Number.isNaN(parsedDate.valueOf()) ||
    parsedDate.toISOString().slice(0, 10) !== publishedOn[1]
  ) {
    throw new Error('The top release-note entry has an invalid publishedOn date.');
  }

  return {
    version: Number.parseInt(version[1], 10),
    publishedOn: publishedOn[1],
  };
}

export function toBashPath(filePath) {
  const normalized = path.resolve(filePath).replaceAll('\\', '/');
  const drive = normalized.match(/^([A-Za-z]):\/(.*)$/);
  return drive ? `/${drive[1].toLowerCase()}/${drive[2]}` : normalized;
}

function compareVersions(left, right) {
  const a = left.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const b = right.split('.').map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) - (b[index] ?? 0);
  }
  return 0;
}

async function run(command, args, { capture = false, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectDirectory,
      env,
      shell: false,
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    if (capture) {
      child.stdout.on('data', (chunk) => (stdout += chunk));
      child.stderr.on('data', (chunk) => (stderr += chunk));
    }
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else
        reject(
          new Error(`${command} exited with code ${code}${stderr ? `: ${stderr.trim()}` : ''}`),
        );
    });
  });
}

async function git(...args) {
  return (await run('git', args, { capture: true })).stdout.trim();
}

async function sha256(filePath) {
  const hash = createHash('sha256');
  hash.update(await fs.readFile(filePath));
  return hash.digest('hex');
}

async function findPackageScript() {
  const userProfile = process.env.USERPROFILE;
  if (!userProfile) throw new Error('USERPROFILE is unavailable; cannot locate the Sites plugin.');

  const versionRoot = path.join(
    userProfile,
    '.codex',
    'plugins',
    'cache',
    'openai-curated-remote',
    'sites',
  );
  try {
    const versions = (await fs.readdir(versionRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort(compareVersions)
      .reverse();
    for (const version of versions) {
      const candidate = path.join(versionRoot, version, 'scripts', 'package-site.mjs');
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        // Try the next installed version.
      }
    }
  } catch {
    // Fall through to the bundled marketplace copy.
  }

  const bundled = path.join(
    userProfile,
    '.codex',
    '.tmp',
    'bundled-marketplaces',
    'openai-bundled',
    'plugins',
    'sites',
    'scripts',
    'package-site.mjs',
  );
  await fs.access(bundled);
  return bundled;
}

async function prepare() {
  const hosting = JSON.parse(
    await fs.readFile(path.join(projectDirectory, '.openai', 'hosting.json'), 'utf8'),
  );
  if (hosting.project_id !== EXPECTED_PROJECT_ID || hosting.static?.directory !== 'dist') {
    throw new Error('The Sites manifest does not match the existing ESD Formatting Lab project.');
  }

  if (await git('status', '--porcelain')) {
    throw new Error('Commit or remove tracked working-tree changes before preparing a release.');
  }

  const commitSha = await git('rev-parse', '--verify', 'HEAD');
  const release = extractReleaseInfo(
    await fs.readFile(path.join(projectDirectory, 'src', 'releaseNotes.ts'), 'utf8'),
  );

  await fs.mkdir(localDirectory, { recursive: true });
  await Promise.all([fs.rm(releasePath, { force: true }), fs.rm(archivePath, { force: true })]);

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await run(npm, ['run', 'build']);
  await run(npm, ['test']);

  if (
    (await git('rev-parse', '--verify', 'HEAD')) !== commitSha ||
    (await git('status', '--porcelain'))
  ) {
    throw new Error('The tracked source changed during release checks; commit and prepare again.');
  }
  await fs.access(path.join(projectDirectory, 'dist', 'index.html'));

  const packageScript = await findPackageScript();
  const pathEntries =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Git\\bin',
          'C:\\Program Files\\Git\\usr\\bin',
          process.env.Path ?? process.env.PATH ?? '',
        ]
      : [process.env.PATH ?? ''];
  await run(process.execPath, [packageScript, projectDirectory, toBashPath(archivePath)], {
    env: {
      ...process.env,
      PATH: pathEntries.join(path.delimiter),
      Path: pathEntries.join(path.delimiter),
    },
  });

  const listing = (await run('tar', ['-tzf', archivePath], { capture: true })).stdout.split(
    /\r?\n/,
  );
  if (!listing.includes('dist/index.html') || !listing.includes('dist/.openai/hosting.json')) {
    throw new Error('The packaged Site is missing its index or hosting manifest.');
  }
  if (
    (await git('rev-parse', '--verify', 'HEAD')) !== commitSha ||
    (await git('status', '--porcelain'))
  ) {
    throw new Error('The tracked source changed during packaging; commit and prepare again.');
  }

  const archiveHash = await sha256(archivePath);
  const document = {
    schema_version: 1,
    project_id: EXPECTED_PROJECT_ID,
    live_url: EXPECTED_LIVE_URL,
    expected_access_mode: 'public',
    release_version: release.version,
    release_date: release.publishedOn,
    commit_sha: commitSha,
    archive_path: archivePath.replaceAll('\\', '/'),
    archive_sha256: archiveHash,
    prepared_at: new Date().toISOString(),
    checks: { build: 'passed', tests: 'passed' },
  };
  const temporaryReleasePath = `${releasePath}.tmp`;
  await fs.writeFile(temporaryReleasePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryReleasePath, releasePath);

  console.log(`\nSites release ${release.version} is prepared from ${commitSha}.`);
  console.log('Run this manually when you are ready to publish:');
  console.log('  npm run release:publish');
}

async function selfTest() {
  const release = extractReleaseInfo(
    `export const releaseNotes = [{\nversion: '7',\npublishedOn: '2026-09-14',\nchanges: []\n}];`,
  );
  if (release.version !== 7 || release.publishedOn !== '2026-09-14')
    throw new Error('Release parser failed.');
  if (
    process.platform === 'win32' &&
    toBashPath('C:\\work\\site.tar.gz') !== '/c/work/site.tar.gz'
  ) {
    throw new Error('Windows path conversion failed.');
  }
  console.log('prepare-sites-release self-test passed');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const action = process.argv.includes('--self-test') ? selfTest : prepare;
  action().catch((error) => {
    console.error(`\nRelease preparation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
