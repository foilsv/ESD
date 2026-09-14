#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { extractReleaseInfo } from './prepare-sites-release.mjs';

const EXPECTED_PROJECT_ID = 'appgprj_6aa4aab0520481919cf3aefa1df1cda0';
const EXPECTED_LIVE_URL = 'https://esd-formatting-lab.pnv82g.chatgpt.site';
const REQUIRED_TOOLS = [
  'sites.get_site',
  'sites.list_site_versions',
  'sites.create_source_repository_write_credential',
  'sites.save_site_version',
  'sites.deploy_site_version',
  'sites.get_deployment_status',
];
const TERMINAL_DEPLOYMENT_STATES = new Set(['succeeded', 'failed']);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const localDirectory = path.join(projectDirectory, '.local');
const authPath = path.join(localDirectory, 'sites-publish.auth.json');
const expectedArchivePath = path.join(localDirectory, 'esd-sites.tar.gz');
const releasePath = path.join(localDirectory, 'sites-release.json');
const historyPath = path.join(localDirectory, 'sites-publish-history.jsonl');
const resultPath = path.join(localDirectory, 'sites-publish-result.json');

class AppServerClient {
  constructor(executable, connectorServer) {
    this.executable = executable;
    this.connectorServer = connectorServer;
    this.nextId = 1;
    this.pending = new Map();
    this.stderr = '';
  }

  async start() {
    this.child = spawn(this.executable, ['app-server', '--stdio'], {
      cwd: projectDirectory,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    this.child.stderr.on('data', (chunk) => {
      this.stderr = `${this.stderr}${chunk}`.slice(-65_536);
    });
    this.child.on('error', (error) => {
      this.terminalError = error;
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(error);
      }
      this.pending.clear();
    });
    this.child.on('exit', (code) => {
      this.terminalError = new Error(`Codex app-server exited unexpectedly with code ${code}.`);
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(this.terminalError);
      }
      this.pending.clear();
    });
    this.lines = readline.createInterface({ input: this.child.stdout });
    this.lines.on('line', (line) => this.handleLine(line));

    await this.request('initialize', {
      clientInfo: { name: 'esd-sites-manual-publisher', version: '1.0.0' },
      capabilities: { experimentalApi: true },
    });
    this.notify('initialized');
    const started = await this.request('thread/start', {
      cwd: projectDirectory,
      ephemeral: true,
    });
    this.threadId = started.thread.id;
    await this.waitForTools();
  }

  handleLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }

    const pending = this.pending.get(message.id);
    if (pending && !message.method) {
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error)
        pending.reject(new Error(message.error.message ?? JSON.stringify(message.error)));
      else pending.resolve(message.result);
      return;
    }

    if (message.id !== undefined && message.method) {
      if (message.method === 'mcpServer/elicitation/request') {
        this.write({ id: message.id, result: { action: 'decline' } });
        this.elicitationDeclined = true;
      } else {
        this.write({
          id: message.id,
          error: { code: -32601, message: `Unsupported server request: ${message.method}` },
        });
      }
    }
  }

  write(message) {
    if (this.terminalError) throw this.terminalError;
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  notify(method, params) {
    this.write(params === undefined ? { method } : { method, params });
  }

  request(method, params, timeoutMs = 180_000) {
    if (this.terminalError) return Promise.reject(this.terminalError);
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.write({ id, method, params });
    });
  }

  async waitForTools() {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const status = await this.request('mcpServerStatus/list', {
        threadId: this.threadId,
        detail: 'toolsAndAuthOnly',
      });
      const connector = status.data.find((entry) => entry.name === this.connectorServer);
      if (connector && REQUIRED_TOOLS.every((tool) => connector.tools?.[tool])) return;
      await delay(500);
    }
    throw new Error('The installed Sites connector does not expose the required publishing tools.');
  }

  async callSite(tool, argumentsObject) {
    this.elicitationDeclined = false;
    const response = await this.request('mcpServer/tool/call', {
      server: this.connectorServer,
      threadId: this.threadId,
      tool,
      arguments: argumentsObject,
    });
    if (response.isError) {
      const content =
        response.content
          ?.map((item) => item.text)
          .filter(Boolean)
          .join(' ') || 'Unknown Sites error.';
      const suffix = this.elicitationDeclined
        ? ' The connector requested an interactive confirmation that this script cannot complete.'
        : '';
      throw new Error(`${content}${suffix}`);
    }
    return unwrapToolResult(response);
  }

  close() {
    this.lines?.close();
    this.child?.kill();
  }
}

export function unwrapToolResult(response) {
  return response?.structuredContent?.result ?? response?.structuredContent;
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateReleaseDocument(release, hosting) {
  if (hosting?.project_id !== EXPECTED_PROJECT_ID || hosting?.static?.directory !== 'dist') {
    throw new Error(
      'The tracked hosting manifest does not identify the existing ESD Formatting Lab Site.',
    );
  }
  if (release?.schema_version !== 1 || release.project_id !== hosting.project_id) {
    throw new Error('The prepared release does not match the tracked Sites project.');
  }
  if (release.live_url !== EXPECTED_LIVE_URL || release.expected_access_mode !== 'public') {
    throw new Error('The prepared release does not preserve the existing public Site URL.');
  }
  if (!Number.isInteger(release.release_version) || release.release_version < 1) {
    throw new Error('The prepared release has an invalid version number.');
  }
  if (!isIsoDate(release.release_date)) {
    throw new Error('The prepared release has an invalid publication date.');
  }
  if (!/^[0-9a-f]{40}$/i.test(release.commit_sha ?? '')) {
    throw new Error('The prepared release has an invalid Git commit SHA.');
  }
  if (!/^[0-9a-f]{64}$/i.test(release.archive_sha256 ?? '')) {
    throw new Error('The prepared release has an invalid archive hash.');
  }
  if (release.checks?.build !== 'passed' || release.checks?.tests !== 'passed') {
    throw new Error('The prepared release does not record successful build and test checks.');
  }
  if (path.resolve(release.archive_path ?? '') !== expectedArchivePath) {
    throw new Error('The prepared release points to an unexpected archive path.');
  }
}

function parseArguments(argv) {
  const supported = new Set(['--help', '--preflight', '--self-test']);
  const unknown = argv.filter((argument) => !supported.has(argument));
  if (unknown.length) throw new Error(`Unknown argument: ${unknown.join(', ')}`);
  return {
    help: argv.includes('--help'),
    preflight: argv.includes('--preflight'),
    selfTest: argv.includes('--self-test'),
  };
}

async function readJson(filePath, label) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`${label} is missing: ${filePath}`);
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
}

async function run(command, args, { env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectDirectory,
      env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
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
  return (await run('git', args)).stdout.trim();
}

async function sha256(filePath) {
  const hash = createHash('sha256');
  hash.update(await fs.readFile(filePath));
  return hash.digest('hex');
}

function gitCredentialEnvironment(token) {
  return {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    GCM_INTERACTIVE: 'Never',
    GIT_CONFIG_COUNT: '3',
    GIT_CONFIG_KEY_0: 'credential.interactive',
    GIT_CONFIG_VALUE_0: 'never',
    GIT_CONFIG_KEY_1: 'http.version',
    GIT_CONFIG_VALUE_1: 'HTTP/1.1',
    GIT_CONFIG_KEY_2: 'http.extraHeader',
    GIT_CONFIG_VALUE_2: `Authorization: Bearer ${token}`,
  };
}

async function verifyLocalRelease(release) {
  const status = await git('status', '--porcelain');
  if (status)
    throw new Error('The tracked working tree is not clean; do not publish a moving source state.');
  const head = await git('rev-parse', '--verify', 'HEAD');
  if (head.toLowerCase() !== release.commit_sha.toLowerCase()) {
    throw new Error(
      `HEAD is ${head}, but the prepared release is ${release.commit_sha}. Prepare again.`,
    );
  }
  const releaseNote = extractReleaseInfo(
    await fs.readFile(path.join(projectDirectory, 'src', 'releaseNotes.ts'), 'utf8'),
  );
  if (
    releaseNote.version !== release.release_version ||
    releaseNote.publishedOn !== release.release_date
  ) {
    throw new Error(
      'The prepared version or publication date does not match the checked-out release notes.',
    );
  }
  await fs.access(release.archive_path);
  const actualHash = await sha256(release.archive_path);
  if (actualHash.toLowerCase() !== release.archive_sha256.toLowerCase()) {
    throw new Error('The prepared Site archive changed after release preparation.');
  }
  const listing = (await run('tar', ['-tzf', release.archive_path])).stdout.split(/\r?\n/);
  if (!listing.includes('dist/index.html') || !listing.includes('dist/.openai/hosting.json')) {
    throw new Error('The prepared Site archive is missing its index or hosting manifest.');
  }
  const archivedHosting = JSON.parse(
    (await run('tar', ['-xOf', release.archive_path, 'dist/.openai/hosting.json'])).stdout,
  );
  if (
    archivedHosting.project_id !== EXPECTED_PROJECT_ID ||
    archivedHosting.static?.directory !== 'dist'
  ) {
    throw new Error('The prepared Site archive contains an unexpected hosting manifest.');
  }
}

async function confirmPublication(release) {
  if (!process.stdin.isTTY)
    throw new Error('Interactive confirmation is unavailable; run the publisher manually.');
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await terminal.question(
      `Type PUBLISH ${release.release_version} to deploy this public release: `,
    );
    if (answer.trim() !== `PUBLISH ${release.release_version}`)
      throw new Error('Publication cancelled.');
  } finally {
    terminal.close();
  }
}

async function pushPreparedCommit(credential, release) {
  if (!credential?.token || !credential?.remote_url || !credential?.branch) {
    throw new Error('Sites did not return a complete short-lived source credential.');
  }
  if (credential.auth_mode !== 'http_extra_header') {
    throw new Error(
      `Unsupported Sites Git authentication mode: ${credential.auth_mode ?? 'missing'}.`,
    );
  }
  const expiresAt = Date.parse(credential.token_expires_at ?? '');
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now() + 30_000) {
    throw new Error(
      'Sites returned a source credential that is already expired or too close to expiry.',
    );
  }

  const env = gitCredentialEnvironment(credential.token);
  try {
    const remoteRef = `refs/heads/${credential.branch}`;
    const remote = await run('git', ['ls-remote', credential.remote_url, remoteRef], { env });
    const remoteSha = remote.stdout.trim().split(/\s+/)[0] || null;
    if (remoteSha?.toLowerCase() !== release.commit_sha.toLowerCase()) {
      console.log('Uploading the prepared source revision...');
      const pushed = await run(
        'git',
        ['push', credential.remote_url, `HEAD:${credential.branch}`],
        {
          env,
        },
      );
      if (pushed.stderr.trim()) console.log(pushed.stderr.trim());
    } else {
      console.log('The prepared source revision is already uploaded.');
    }

    const verified = await run('git', ['ls-remote', credential.remote_url, remoteRef], { env });
    const verifiedSha = verified.stdout.trim().split(/\s+/)[0] || '';
    if (verifiedSha.toLowerCase() !== release.commit_sha.toLowerCase()) {
      throw new Error('The Sites source branch does not match the prepared release after upload.');
    }
    if (
      (await git('rev-parse', '--verify', 'HEAD')).toLowerCase() !==
      release.commit_sha.toLowerCase()
    ) {
      throw new Error('Local HEAD changed during the upload.');
    }
  } finally {
    credential.token = undefined;
    env.GIT_CONFIG_VALUE_2 = undefined;
  }
}

async function pollDeployment(client, projectId, deployment) {
  let current = deployment;
  const deadline = Date.now() + 5 * 60_000;
  while (!TERMINAL_DEPLOYMENT_STATES.has(current.status)) {
    if (Date.now() >= deadline)
      throw new Error('Deployment did not reach a terminal state within five minutes.');
    await delay(2_000);
    current = await client.callSite('sites.get_deployment_status', {
      project_id: projectId,
      deployment_id: current.id,
    });
    console.log(`Deployment status: ${current.status}`);
  }
  return current;
}

async function recordSuccess(release, savedVersion, deployment) {
  const record = {
    published_at: deployment.updated_at ?? new Date().toISOString(),
    live_url: deployment.url,
    release_version: release.release_version,
    commit_sha: release.commit_sha,
    archive_sha256: release.archive_sha256,
    saved_version_id: savedVersion.id,
    deployment_id: deployment.id,
    status: deployment.status,
  };
  await fs.mkdir(localDirectory, { recursive: true });
  let history = '';
  try {
    history = await fs.readFile(historyPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (!history.split(/\r?\n/).some((line) => line.includes(deployment.id))) {
    await fs.appendFile(historyPath, `${JSON.stringify(record)}\n`, 'utf8');
  }
  await fs.writeFile(resultPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
}

function validateSite(site, release) {
  if (site?.id !== release.project_id || site.current_user_role !== 'owner') {
    throw new Error(
      'The selected Codex account is not the owner of the existing Site. Switch Codex to the personal owner account and rerun.',
    );
  }
  if (site.access_mode !== release.expected_access_mode) {
    throw new Error(
      `The Site audience is ${site.access_mode}, not ${release.expected_access_mode}; refusing to change it.`,
    );
  }
  if (site.current_live_url !== release.live_url) {
    throw new Error('The selected Site does not have the expected production URL.');
  }
  if (!Number.isInteger(site.latest_version_number) || site.latest_version_number < 1) {
    throw new Error('The selected Site returned an invalid latest version number.');
  }
}

function validateDeploymentUrl(deployment, release) {
  if (deployment.url !== release.live_url) {
    throw new Error(
      `Deployment returned an unexpected production URL: ${deployment.url ?? 'missing'}.`,
    );
  }
}

async function publish(options) {
  const [auth, release, hosting] = await Promise.all([
    readJson(authPath, 'The ignored Sites auth configuration'),
    readJson(releasePath, 'The agent-prepared release manifest'),
    readJson(
      path.join(projectDirectory, '.openai', 'hosting.json'),
      'The tracked hosting manifest',
    ),
  ]);
  if (
    auth.schema_version !== 1 ||
    auth.credentials_mode !== 'codex_desktop' ||
    auth.connector_server !== 'codex_apps' ||
    typeof auth.codex_executable !== 'string' ||
    !auth.codex_executable.trim() ||
    typeof auth.expected_account !== 'string'
  ) {
    throw new Error('The ignored Sites auth configuration is invalid.');
  }
  validateReleaseDocument(release, hosting);
  await verifyLocalRelease(release);

  const client = new AppServerClient(auth.codex_executable, auth.connector_server);
  try {
    await client.start();
    let site;
    try {
      site = await client.callSite('sites.get_site', { project_id: release.project_id });
    } catch (error) {
      if (/not found/i.test(error.message)) {
        throw new Error(
          `The Site is unavailable to the selected Codex account. Switch Codex to the personal owner account and rerun. (${error.message})`,
        );
      }
      throw error;
    }
    validateSite(site, release);

    const versions = await client.callSite('sites.list_site_versions', {
      project_id: release.project_id,
      limit: 50,
    });
    if (!Array.isArray(versions?.items)) {
      throw new Error('Sites returned an invalid version list.');
    }
    let savedVersion = versions.items?.find(
      (version) => version.source?.commit_sha?.toLowerCase() === release.commit_sha.toLowerCase(),
    );
    if (savedVersion && savedVersion.version_number !== release.release_version) {
      throw new Error(
        `The prepared commit already belongs to Sites version ${savedVersion.version_number}, not ${release.release_version}.`,
      );
    }
    if (savedVersion && savedVersion.version_number !== site.latest_version_number) {
      throw new Error(
        `The prepared commit belongs to old Sites version ${savedVersion.version_number}; the latest is ${site.latest_version_number}.`,
      );
    }
    if (!savedVersion && site.latest_version_number + 1 !== release.release_version) {
      throw new Error(
        `The next Sites version is ${site.latest_version_number + 1}, but the prepared release is ${release.release_version}.`,
      );
    }

    let deployment = null;
    if (savedVersion?.deployment_id) {
      deployment = await client.callSite('sites.get_deployment_status', {
        project_id: release.project_id,
        deployment_id: savedVersion.deployment_id,
      });
    }

    console.log(`Prepared release: ${release.release_version}`);
    console.log(`Commit: ${release.commit_sha}`);
    console.log(`Site: ${release.live_url}`);
    console.log(`Audience: ${site.access_mode}`);
    console.log(`Account expectation: ${auth.expected_account}`);
    if (savedVersion) console.log(`Sites version: ${savedVersion.version_number} already saved`);
    if (deployment) console.log(`Existing deployment: ${deployment.status}`);

    if (options.preflight) {
      console.log('\nPreflight passed. No source, version, or deployment was changed.');
      return;
    }

    await confirmPublication(release);

    if (deployment?.status === 'succeeded') {
      validateDeploymentUrl(deployment, release);
      await recordSuccess(release, savedVersion, deployment);
      console.log(`\nRelease ${release.release_version} is already live: ${deployment.url}`);
      return;
    }
    if (deployment && !TERMINAL_DEPLOYMENT_STATES.has(deployment.status)) {
      deployment = await pollDeployment(client, release.project_id, deployment);
    }

    if (!savedVersion) {
      const credential = await client.callSite('sites.create_source_repository_write_credential', {
        project_id: release.project_id,
      });
      await pushPreparedCommit(credential, release);
      console.log('Saving the prepared Site version...');
      savedVersion = await client.callSite('sites.save_site_version', {
        project_id: release.project_id,
        commit_sha: release.commit_sha,
        archive: release.archive_path,
      });
      if (savedVersion.version_number !== release.release_version) {
        throw new Error(
          `Sites saved version ${savedVersion.version_number}; expected ${release.release_version}.`,
        );
      }
    }

    if (deployment?.status !== 'succeeded') {
      console.log('Deploying the saved version...');
      deployment = await client.callSite('sites.deploy_site_version', {
        project_id: release.project_id,
        version_id: savedVersion.id,
      });
      console.log(`Deployment status: ${deployment.status}`);
      deployment = await pollDeployment(client, release.project_id, deployment);
    }

    if (deployment.status !== 'succeeded') {
      throw new Error(
        `Deployment failed: ${deployment.failure_message ?? 'No failure detail was returned.'}`,
      );
    }
    if (!deployment.url) {
      deployment = await client.callSite('sites.get_deployment_status', {
        project_id: release.project_id,
        deployment_id: deployment.id,
      });
    }
    validateDeploymentUrl(deployment, release);

    await recordSuccess(release, savedVersion, deployment);
    console.log(`\nPublished release ${release.release_version}: ${deployment.url}`);
  } finally {
    client.close();
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function printHelp() {
  console.log(
    `Manual ESD Formatting Lab publisher\n\nUsage:\n  node scripts/publish-sites.mjs [--preflight]\n\nThe agent must first prepare .local/sites-release.json and its matching archive.\nThis command does not run a model turn. It uses the account currently selected in Codex.\n\nOptions:\n  --preflight  Validate the release, account, Site, and version without changing anything\n  --self-test  Run local parser/validation checks only\n  --help       Show this help`,
  );
}

async function selfTest() {
  validateReleaseDocument(
    {
      schema_version: 1,
      project_id: EXPECTED_PROJECT_ID,
      live_url: EXPECTED_LIVE_URL,
      expected_access_mode: 'public',
      release_version: 7,
      release_date: '2026-09-14',
      commit_sha: 'a'.repeat(40),
      archive_path: expectedArchivePath,
      archive_sha256: 'b'.repeat(64),
      checks: { build: 'passed', tests: 'passed' },
    },
    { project_id: EXPECTED_PROJECT_ID, static: { directory: 'dist' } },
  );
  if (unwrapToolResult({ structuredContent: { result: { ok: true } } }).ok !== true) {
    throw new Error('Sites result unwrapping failed.');
  }
  console.log('publish-sites self-test passed');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  Promise.resolve()
    .then(() => parseArguments(process.argv.slice(2)))
    .then(async (options) => {
      if (options.help) printHelp();
      else if (options.selfTest) await selfTest();
      else await publish(options);
    })
    .catch((error) => {
      console.error(`\nPublish failed: ${error.message}`);
      process.exitCode = 1;
    });
}
