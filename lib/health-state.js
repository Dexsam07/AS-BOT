const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(process.env.HEALTH_FILE || './data/health.json');

function update(patch = {}) {
  const current = read();
  const next = { ...current, ...patch, updatedAt: new Date().toISOString(), pid: process.pid };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, file);
  return next;
}
function read() {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return { state: 'starting' }; }
}
module.exports = { file, update, read };
