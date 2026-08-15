try { require('dotenv').config(); } catch (_) { /* index.js already provides a minimal .env loader */ }

const config = require('./config');
const { loadSettings } = require('./lib/settingsManager');

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function updateZipUrl() {
  const repo = process.env.UPDATE_REPO || 'Dexsam07/AS-BOT';
  const branch = process.env.UPDATE_BRANCH || 'main';
  return `https://github.com/${repo}/archive/refs/heads/${branch}.zip`;
}

const persisted = loadSettings();
const settings = {
  // Primary AS-BOT identity and connection values.
  botName: config.BOT_NAME,
  BOT_NAME: config.BOT_NAME,
  botOwner: config.OWNER_NAME,
  OWNER_NAME: config.OWNER_NAME,
  ownerNumber: config.OWNER_NUMBER,
  OWNER_NUMBER: config.OWNER_NUMBER,
  SESSION_ID: config.SESSION_ID,
  SESSION_PREFIX: config.SESSION_PREFIX,
  timezone: config.TIMEZONE,
  TIMEZONE: config.TIMEZONE,
  commandMode: config.MODE,
  MODE: config.MODE,
  version: config.VERSION,
  VERSION: config.VERSION,
  prefix: '',
  PREFIX: '',
  description: config.DESCRIPTION,
  channelName: config.CHANNEL_NAME,
  channelId: config.CHANNEL_ID,
  channelLink: config.CHANNEL_LINK,

  // Legacy-compatible media and storage keys. Secrets come only from env.
  packname: process.env.STICKER_PACKNAME || config.BOT_NAME,
  author: process.env.STICKER_AUTHOR || config.OWNER_NAME,
  giphyApiKey: process.env.GIPHY_API_KEY || '',
  maxStoreMessages: numberEnv('MAX_STORE_MESSAGES', 20),
  storeWriteInterval: numberEnv('STORE_WRITE_INTERVAL', 10000),
  updateZipUrl: updateZipUrl(),
  imageUrl: process.env.MENU_IMAGE_URL || '',
  MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || '',
  MENU_AUDIO_URL: process.env.MENU_AUDIO_URL || '',
  ALIVE_AUDIO_URL: process.env.ALIVE_AUDIO_URL || ''
};

// Preserve explicitly saved legacy compatibility values where available,
// without allowing them to replace the protected session or owner number.
for (const key of ['botName', 'botOwner', 'timezone', 'commandMode', 'version', 'description', 'channelName', 'channelId', 'channelLink']) {
  if (persisted[key] !== undefined) settings[key] = persisted[key];
}

global.SESSION_ID = settings.SESSION_ID;
module.exports = settings;
