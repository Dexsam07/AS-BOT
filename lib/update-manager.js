const fs = require('node:fs');
const fsp = fs.promises;
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const config = require('../config');
const audit = require('./audit-log');

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(process.env.UPDATE_PROJECT_DIR || process.cwd());
const stateFile = path.resolve(process.env.UPDATE_STATE_FILE || path.join(projectRoot, 'data', 'update-state.json'));
const lockFile = path.resolve(process.env.UPDATE_LOCK_FILE || path.join(projectRoot, 'data', 'update.lock'));
const repo = process.env.UPDATE_REPO || 'Dexsam07/AS-BOT';
const branch = process.env.UPDATE_BRANCH || 'main';

function ensureSafeRef(value) {
  if (!/^[A-Za-z0-9._/-]+$/.test(value)) throw new Error('Unsafe Git reference.');
  return value;
}
function gitArgs(args) { return ['-C', projectRoot, ...args]; }
async function git(args, options = {}) {
  const result = await execFileAsync('git', gitArgs(args), { maxBuffer: 4 * 1024 * 1024, timeout: options.timeout || 120000 });
  return result.stdout.trim();
}
async function readState() {
  try { return JSON.parse(await fsp.readFile(stateFile, 'utf8')); } catch (_) { return {}; }
}
async function writeState(value) {
  await fsp.mkdir(path.dirname(stateFile), { recursive: true });
  const temp = `${stateFile}.${process.pid}.tmp`;
  await fsp.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await fsp.rename(temp, stateFile);
}
async function isGitRepo() { try { await git(['rev-parse', '--is-inside-work-tree']); return true; } catch (_) { return false; } }
async function currentCommit() { return git(['rev-parse', 'HEAD']); }
async function remoteCommit() {
  ensureSafeRef(branch);
  await git(['fetch', '--quiet', 'origin', branch], { timeout: 120000 });
  return git(['rev-parse', `origin/${branch}`]);
}
async function changedFiles(from, to) {
  const output = await git(['diff', '--name-only', `${from}..${to}`]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}
function rejectProtectedChanges(files) {
  const protectedPattern = /(^|\/)(\.env|data\/session|data\/audit\.jsonl|data\/health\.json|data\/update-state\.json|data\/update\.lock)(\/|$)/;
  const unsafe = files.filter((file) => protectedPattern.test(file));
  if (unsafe.length) throw new Error(`Update contains protected runtime files: ${unsafe.slice(0, 5).join(', ')}`);
}
async function assertClean() {
  const status = await git(['status', '--porcelain']);
  if (status) throw new Error('Working tree dirty hai. Pehle local changes commit ya backup karo.');
}
async function validateRevision(commit) {
  const temp = await fsp.mkdtemp(path.join(os.tmpdir(), 'asbot-update-'));
  try {
    await git(['worktree', 'add', '--detach', temp, commit], { timeout: 120000 });
    await execFileAsync(process.execPath, ['scripts/check-syntax.js'], { cwd: temp, timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
    await execFileAsync(process.execPath, ['runtime.test.js'], { cwd: temp, timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  } finally {
    await git(['worktree', 'remove', '--force', temp], { timeout: 120000 }).catch(() => {});
    await fsp.rm(temp, { recursive: true, force: true }).catch(() => {});
  }
}
async function status() {
  if (!(await isGitRepo())) return { supported: false, reason: 'Host directory Git repository nahi hai.' };
  const current = await currentCommit();
  let remote;
  try { remote = await remoteCommit(); } catch (error) { return { supported: true, current, remote: null, error: error.message, repo, branch }; }
  return { supported: true, repo, branch, current, remote, updateAvailable: current !== remote, dirty: Boolean((await git(['status', '--porcelain']).catch(() => ''))), state: await readState() };
}
async function withLock(task) {
  await fsp.mkdir(path.dirname(lockFile), { recursive: true });
  let handle;
  try { handle = await fsp.open(lockFile, 'wx', 0o600); } catch (_) { throw new Error('Update already running hai.'); }
  try { return await task(); } finally { await handle.close().catch(() => {}); await fsp.unlink(lockFile).catch(() => {}); }
}
async function applyUpdate() {
  return withLock(async () => {
    if (!(await isGitRepo())) throw new Error('Self-update ke liye host directory Git repository honi chahiye.');
    await assertClean();
    const previousCommit = await currentCommit();
    const nextCommit = await remoteCommit();
    if (previousCommit === nextCommit) return { updated: false, current: previousCommit, message: 'Already latest commit par ho.' };
    const files = await changedFiles(previousCommit, nextCommit);
    rejectProtectedChanges(files);
    const ancestorCheck = await execFileAsync('git', gitArgs(['merge-base', '--is-ancestor', previousCommit, nextCommit])).then(() => true).catch(() => false);
    if (!ancestorCheck) throw new Error('Remote update fast-forward nahi hai; manual review required.');
    await validateRevision(nextCommit);
    await writeState({ previousCommit, nextCommit, repo, branch, updatedAt: new Date().toISOString(), files });
    await git(['reset', '--hard', nextCommit], { timeout: 120000 });
    audit.record('github-update-applied', { repo, branch, previousCommit, nextCommit, files: files.length });
    return { updated: true, previousCommit, nextCommit, files: files.length, packageChanged: files.includes('package.json') || files.includes('package-lock.json'), message: 'Update validate aur apply ho gaya. Restart required hai.' };
  });
}
async function rollback() {
  return withLock(async () => {
    if (!(await isGitRepo())) throw new Error('Host directory Git repository nahi hai.');
    const state = await readState();
    if (!state.previousCommit) throw new Error('Rollback commit available nahi hai.');
    await assertClean();
    const current = await currentCommit();
    await git(['reset', '--hard', state.previousCommit], { timeout: 120000 });
    await writeState({ rolledBackFrom: current, rolledBackTo: state.previousCommit, rolledBackAt: new Date().toISOString(), repo, branch });
    audit.record('github-update-rollback', { repo, branch, from: current, to: state.previousCommit });
    return { rolledBack: true, from: current, to: state.previousCommit, message: 'Rollback complete. Restart required hai.' };
  });
}
module.exports = { status, applyUpdate, rollback, projectRoot, repo, branch };
