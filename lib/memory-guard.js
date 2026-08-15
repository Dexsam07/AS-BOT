const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');

const root = path.resolve(process.cwd());
const protectedDirs = new Set([
  path.resolve(process.env.SESSION_DIR || './data/session'),
  path.resolve('./data/protected'),
  path.resolve('./plugins')
]);
const cleanupRoots = ['temp', 'tmp', 'cache', 'logs'].map((item) => path.join(root, item));
const limitMb = Math.max(128, Number(process.env.MEMORY_LIMIT_MB || 512));
const cleanupPercent = Math.min(95, Math.max(50, Number(process.env.MEMORY_CLEANUP_PERCENT || 70)));
const pausePercent = Math.min(98, Math.max(cleanupPercent + 5, Number(process.env.MEMORY_PAUSE_PERCENT || 85)));
const restartPercent = Math.min(99, Math.max(pausePercent + 3, Number(process.env.MEMORY_RESTART_PERCENT || 92)));

function isProtected(target) {
  const candidate = path.resolve(target);
  return [...protectedDirs].some((item) => candidate === item || candidate.startsWith(`${item}${path.sep}`));
}

async function walk(dir, result = []) {
  if (isProtected(dir)) return result;
  let entries;
  try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch (_) { return result; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink() || isProtected(full)) continue;
    if (entry.isDirectory()) await walk(full, result);
    else if (entry.isFile()) result.push(full);
  }
  return result;
}

async function cleanupOldFiles(maxAgeMs = 15 * 60 * 1000) {
  const now = Date.now();
  let files = 0;
  let bytes = 0;
  for (const dir of cleanupRoots) {
    for (const file of await walk(dir)) {
      try {
        const stat = await fsp.stat(file);
        if (now - stat.mtimeMs < maxAgeMs) continue;
        await fsp.unlink(file);
        files += 1;
        bytes += stat.size;
      } catch (_) {}
    }
  }
  return { files, bytes, bytesMb: Number((bytes / 1024 / 1024).toFixed(2)) };
}

function snapshot() {
  const rssMb = process.memoryUsage().rss / 1024 / 1024;
  return { rssMb: Number(rssMb.toFixed(2)), limitMb, percent: Number((rssMb / limitMb * 100).toFixed(1)), cleanupPercent, pausePercent, restartPercent };
}

function startMemoryGuard({ queue, shutdown = async () => {}, logger = console, intervalMs = 30000 } = {}) {
  let pausedByMemory = false;
  let stopping = false;
  const check = async () => {
    if (stopping) return;
    const before = snapshot();
    if (before.percent >= pausePercent && !pausedByMemory) {
      queue?.pauseQueue?.('memory-pressure');
      pausedByMemory = true;
      logger.warn(`[memory] ${before.percent}% pressure; heavy jobs paused.`);
    }
    if (before.percent >= cleanupPercent) {
      const result = await cleanupOldFiles(before.percent >= pausePercent ? 5 * 60 * 1000 : 15 * 60 * 1000);
      if (result.files) logger.warn(`[memory] cleaned ${result.files} files / ${result.bytesMb} MB.`);
      if (global.gc) try { global.gc(); } catch (_) {}
    }
    const after = snapshot();
    if (pausedByMemory && after.percent <= cleanupPercent - 5) {
      queue?.resumeQueue?.();
      pausedByMemory = false;
      logger.log(`[memory] pressure recovered to ${after.percent}%; heavy jobs resumed.`);
    }
    if (after.percent >= restartPercent) {
      logger.error(`[memory] ${after.percent}% remains high after cleanup; requesting graceful restart.`);
      await shutdown('memory-pressure');
    }
  };
  const timer = setInterval(() => check().catch((error) => logger.error(`[memory] ${error.message}`)), intervalMs);
  timer.unref?.();
  check().catch((error) => logger.error(`[memory] ${error.message}`));
  return { stop() { stopping = true; clearInterval(timer); if (pausedByMemory) queue?.resumeQueue?.(); }, check, snapshot };
}

module.exports = { snapshot, cleanupOldFiles, startMemoryGuard, isProtected };
