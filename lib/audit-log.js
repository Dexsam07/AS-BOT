const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');

const file = path.resolve(process.env.AUDIT_FILE || './data/audit.jsonl');
let writeChain = Promise.resolve();

function sanitize(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') return value.replace(/(SESSION_ID|API_KEY|TOKEN|PASSWORD)=?[^\s&]*/gi, '$1=[redacted]').slice(0, 500);
  if (Array.isArray(value)) return value.slice(0, 20).map(sanitize);
  if (typeof value === 'object') {
    const result = {};
    for (const [key, item] of Object.entries(value).slice(0, 30)) {
      if (/session|secret|token|password|apikey|api_key/i.test(key)) result[key] = '[redacted]';
      else result[key] = sanitize(item);
    }
    return result;
  }
  return value;
}

function record(type, details = {}) {
  const event = { at: new Date().toISOString(), type: String(type), details: sanitize(details) };
  writeChain = writeChain.then(async () => {
    await fsp.mkdir(path.dirname(file), { recursive: true });
    await fsp.appendFile(file, `${JSON.stringify(event)}\n`, { mode: 0o600 });
  }).catch(() => {});
  return event;
}

function getFile() { return file; }
module.exports = { record, sanitize, getFile };
