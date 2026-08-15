const path = require('node:path');
const config = require('../config');
const { AtomicJsonStore } = require('./atomic-store');
const audit = require('./audit-log');

const editableKeys = new Set([
  'BOT_NAME', 'OWNER_NAME', 'MODE', 'LANGUAGE', 'TIMEZONE',
  'CHANNEL_NAME', 'CHANNEL_ID', 'CHANNEL_LINK', 'LOAD_EXTERNAL_PLUGINS',
  'ENABLE_REMINDERS', 'ENABLE_MEMORY_GUARD', 'COMMAND_RATE_LIMIT'
]);

const store = new AtomicJsonStore(path.join(process.cwd(), 'data', 'runtime-settings.json'), {}, { version: 1 });
let readyPromise;
function ready() { return readyPromise ||= store.load(); }

function current() {
  const values = {};
  for (const key of editableKeys) values[key] = store.get(key, config[key]);
  return values;
}

function parseValue(key, raw) {
  const value = String(raw ?? '').trim();
  if (['LOAD_EXTERNAL_PLUGINS', 'ENABLE_REMINDERS', 'ENABLE_MEMORY_GUARD'].includes(key)) {
    if (!['on', 'off', 'true', 'false'].includes(value.toLowerCase())) throw new Error(`${key} ke liye on/off use karo.`);
    return ['on', 'true'].includes(value.toLowerCase());
  }
  if (key === 'COMMAND_RATE_LIMIT') {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) throw new Error('COMMAND_RATE_LIMIT 1 se 100 ke beech hona chahiye.');
    return parsed;
  }
  if (!value || value.length > 300) throw new Error(`${key} empty ya bahut long hai.`);
  return value;
}

async function set(key, rawValue, actor = 'owner') {
  const normalized = String(key || '').toUpperCase();
  if (!editableKeys.has(normalized)) throw new Error(`Editable setting nahi hai: ${normalized}`);
  const value = parseValue(normalized, rawValue);
  store.set(normalized, value);
  await store.save();
  if (normalized !== 'PREFIX') config[normalized] = value;
  audit.record('runtime-setting-changed', { key: normalized, value: normalized.includes('LINK') ? '[channel-link-updated]' : value, actor });
  return { key: normalized, value };
}

async function reset(actor = 'owner') {
  await store.reset();
  audit.record('runtime-settings-reset', { actor });
}

async function getAll() { await ready(); return current(); }
module.exports = { editableKeys, getAll, set, reset };
