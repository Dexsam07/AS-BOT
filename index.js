const fs = require('node:fs');
const path = require('node:path');

function loadDotEnv(filePath = path.join(process.cwd(), '.env')) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();
const config = require('./config');
const { startConnection, validateConfiguredSession } = require('./lib/connection');
const { loadPlugins } = require('./lib/plugin-loader');
const { dispatchMessage } = require('./lib/command-router');
const { startReminderScheduler } = require('./lib/reminder-scheduler');
const { startMemoryGuard } = require('./lib/memory-guard');
const runtimeSettings = require('./lib/runtime-settings');
const audit = require('./lib/audit-log');
const health = require('./lib/health-state');

async function loadRegistry(logger = console) {
  const runtime = await runtimeSettings.getAll();
  Object.assign(config, runtime);
  config.PREFIX = '';
  const coreDir = path.join(__dirname, 'plugins', 'core');
  const pluginDir = path.resolve(config.EXTERNAL_PLUGIN_DIR);
  const modern = await loadPlugins({
    pluginsDir: coreDir,
    pluginDirs: [pluginDir],
    includeExternal: config.LOAD_EXTERNAL_PLUGINS,
    primarySource: 'core',
    externalSource: 'plugins',
    logger
  });
  return { registry: modern.registry, modern };
}

async function main() {
  const session = validateConfiguredSession();
  health.update({ state: 'validated', bot: config.BOT_NAME, fingerprint: session.fingerprint });
  const loaded = await loadRegistry(console);
  console.log(`[plugins] core=${loaded.modern.registry.filter((item) => item.source === 'core').length} plugins=${loaded.modern.registry.filter((item) => item.source === 'plugins').length} skipped=${loaded.modern.skipped.length}`);
  console.log(`[session] prefix=${session.prefix} fingerprint=${session.fingerprint}`);

  let connection;
  let memoryGuard;
  let stopReminders = null;
  let shuttingDown = false;
  const shutdown = async (reason = 'shutdown', exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    memoryGuard?.stop?.();
    stopReminders?.();
    await connection?.stop?.(reason);
    health.update({ state: 'stopping', reason });
    audit.record('runtime-shutdown', { reason, exitCode });
    if (require.main === module) setTimeout(() => process.exit(exitCode), 100).unref?.();
  };

  connection = await startConnection({
    logger: console,
    onState: (state) => { if (state.connection) { health.update({ state: state.connection, qr: state.qr }); console.log(`[connection-state] ${state.connection}`); } },
    onSocket: async (sock) => {
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const message of messages || []) {
          if (!message?.message || message.key?.remoteJid === 'status@broadcast') continue;
          try { await dispatchMessage({ sock, message, registry: loaded.registry, logger: console, requestRestart: (reason = 'runtime-restart') => shutdown(reason, 1) }); }
          catch (error) { console.error(`[message-handler] ${error.message}`); }
        }
      });
      if (config.ENABLE_REMINDERS && !stopReminders) stopReminders = startReminderScheduler({ sock, logger: console });
      if (config.ENABLE_MEMORY_GUARD && !memoryGuard) memoryGuard = startMemoryGuard({ queue: require('./lib/job-queue'), shutdown: (reason) => shutdown(reason, 1), logger: console });
      health.update({ state: 'open', connectedAt: new Date().toISOString(), bot: config.BOT_NAME });
      console.log(`[bot] ${config.BOT_NAME} connected. Natural commands enabled. Mode=${config.MODE}`);
    }
  });

  process.once('SIGINT', () => shutdown('SIGINT', 0));
  process.once('SIGTERM', () => shutdown('SIGTERM', 0));
  process.on('uncaughtException', (error) => { console.error(`[uncaught] ${error.stack || error.message}`); shutdown('uncaught-exception', 1); });
  process.on('unhandledRejection', (error) => { console.error(`[rejection] ${error?.stack || error}`); audit.record('unhandled-rejection', { error: String(error?.message || error) }); });
  return { connection, registry: loaded.registry, shutdown };
}

if (require.main === module) main().catch((error) => { console.error(`[startup-error] ${error.message}`); process.exitCode = 1; });
module.exports = { main, loadDotEnv, loadRegistry };
