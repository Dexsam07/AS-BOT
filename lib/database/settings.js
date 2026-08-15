const { loadSettings, saveSettings, updateSetting } = require('../settingsManager');

async function getSetting(key, fallback = null) {
  return loadSettings()[key] ?? fallback;
}

async function setSetting(key, value) {
  updateSetting(key, value);
  return value;
}

module.exports = {
  getSetting,
  setSetting,
  loadSettings,
  saveSettings,
  updateSetting
};
