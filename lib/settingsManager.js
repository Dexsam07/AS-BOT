const fs = require('node:fs');
const path = require('node:path');
const baseConfig = require('../config');

const settingsFile = path.join(process.cwd(), 'data', 'settings.json');

function defaults() {
  return {
    botName: baseConfig.BOT_NAME,
    botOwner: baseConfig.OWNER_NAME,
    ownerNumber: baseConfig.OWNER_NUMBER,
    prefix: baseConfig.PREFIX,
    commandMode: baseConfig.MODE,
    version: baseConfig.VERSION,
    author: baseConfig.OWNER_NAME,
    timezone: baseConfig.TIMEZONE,
    description: baseConfig.DESCRIPTION,
    channelName: baseConfig.CHANNEL_NAME,
    channelId: baseConfig.CHANNEL_ID,
    channelLink: baseConfig.CHANNEL_LINK
  };
}

function loadSettings() {
  try {
    return { ...defaults(), ...JSON.parse(fs.readFileSync(settingsFile, 'utf8')) };
  } catch (_) {
    return defaults();
  }
}

function saveSettings(next) {
  fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
  fs.writeFileSync(settingsFile, JSON.stringify({ ...defaults(), ...next }, null, 2));
  return true;
}

function updateSetting(key, value) {
  const settings = loadSettings();
  settings[key] = value;
  return saveSettings(settings);
}

module.exports = { loadSettings, saveSettings, updateSetting, defaults, settingsFile };
