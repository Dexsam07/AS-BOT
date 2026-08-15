const { loadSettings, updateSetting } = require('./settingsManager');
const config = require('../config');

function getPrefix() {
  return loadSettings().prefix || config.PREFIX;
}

function setPrefix(prefix) {
  const value = String(prefix || '').trim();
  if (!value || value.length > 4) throw new Error('Prefix must be 1-4 characters.');
  updateSetting('prefix', value);
  return value;
}

function resetPrefix() {
  updateSetting('prefix', config.PREFIX);
  return config.PREFIX;
}

module.exports = { getPrefix, setPrefix, resetPrefix };
