const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const config = require('../config');
const { validateSessionId } = require('./session-validator');
const audit = require('./audit-log');

function loadPino() {
  try { return require('pino'); } catch (error) { error.message = `Install pino before connecting: ${error.message}`; throw error; }
}
function loadBaileys() {
  try { return require('@whiskeysockets/baileys'); } catch (error) { error.message = `Install @whiskeysockets/baileys before connecting: ${error.message}`; throw error; }
}
function resolveSessionDir() { return path.resolve(process.cwd(), config.SESSION_DIR); }
function authExists(dir) { return fs.existsSync(path.join(dir, 'creds.json')); }

async function importDecodedSession(session, sessionDir, logger = console) {
  if (authExists(sessionDir) || !session?.decoded?.length) return false;
  const decodedText = session.decoded.toString('utf8').trim();
  if (!decodedText.startsWith('{')) return false;
  let payload;
  try { payload = JSON.parse(decodedText); } catch (_) { return false; }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  if (!payload.noiseKey && !payload.signedIdentityKey && !payload.registrationId) return false;
  await fsp.mkdir(sessionDir, { recursive: true });
  await fsp.writeFile(path.join(sessionDir, 'creds.json'), `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  logger.log('[session] decoded DEX~ payload imported into local auth state.');
  audit.record('session-imported', { prefix: session.prefix, fingerprint: session.fingerprint });
  return true;
}

function validateConfiguredSession() {
  if (!config.SESSION_ID) throw new Error('SESSION_ID is missing. Put DEX~<Base64> in the environment, never in source code.');
  return validateSessionId(config.SESSION_ID, config.SESSION_PREFIX);
}

async function startConnection({ onSocket, onState, logger = console } = {}) {
  const session = validateConfiguredSession();
  const baileys = loadBaileys();
  const pino = loadPino();
  const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = baileys;
  const sessionDir = resolveSessionDir();
  await fsp.mkdir(sessionDir, { recursive: true });
  await importDecodedSession(session, sessionDir, logger);
  let stopped = false;
  let reconnectTimer = null;
  let attempt = 0;
  let socket = null;

  const stop = async (reason = 'shutdown') => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    audit.record('connection-stop', { reason });
    try { socket?.ws?.close?.(); } catch (_) {}
  };

  const connect = async () => {
    if (stopped) return;
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const versionInfo = await fetchLatestBaileysVersion().catch(() => null);
    const loggerInstance = pino({ level: process.env.LOG_LEVEL || 'warn' });
    socket = makeWASocket({
      auth: makeCacheableSignalKeyStore ? { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, loggerInstance) } : state,
      version: versionInfo?.version,
      logger: loggerInstance,
      browser: [config.BOT_NAME, 'Chrome', '1.0.0'],
      printQRInTerminal: false,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false
    });
    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr) logger.warn('[connection] QR received; use the approved session flow instead of printing secrets.');
      onState?.({ connection, qr: Boolean(qr), attempt });
      if (connection === 'open') {
        attempt = 0;
        logger.log(`[connection] connected; session fingerprint=${session.fingerprint}`);
        audit.record('connection-open', { prefix: session.prefix, fingerprint: session.fingerprint });
        await onSocket?.(socket, session, { stop });
      }
      if (connection === 'close' && !stopped) {
        const code = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut || code === 401;
        if (loggedOut) {
          audit.record('connection-logged-out', { code });
          logger.error('[connection] logged out; local auth state was kept. Run npm run reset-session before re-authentication.');
          return;
        }
        attempt += 1;
        const delay = Math.min(60000, 3000 * (2 ** Math.min(attempt - 1, 4)));
        logger.warn(`[connection] closed (${code || 'unknown'}); reconnecting in ${delay}ms.`);
        reconnectTimer = setTimeout(() => connect().catch((error) => logger.error(`[connection] ${error.message}`)), delay);
      }
    });
    return socket;
  };

  await connect();
  return { getSocket: () => socket, session, sessionDir, stop };
}

module.exports = { startConnection, resolveSessionDir, validateConfiguredSession, importDecodedSession };
