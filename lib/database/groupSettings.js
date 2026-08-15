const fs = require('node:fs');
const path = require('node:path');

const file = path.join(process.cwd(), 'data', 'group-settings.json');

function readAll() {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return {}; }
}

function writeAll(data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function getGroupSetting(groupId, key) {
  return readAll()?.[groupId]?.[key];
}

async function setGroupSetting(groupId, key, value) {
  const data = readAll();
  data[groupId] = { ...(data[groupId] || {}), [key]: value };
  writeAll(data);
  return value;
}

async function getAllGroupSettings(groupId) {
  return readAll()?.[groupId] || {};
}

module.exports = { getGroupSetting, setGroupSetting, getAllGroupSettings };
