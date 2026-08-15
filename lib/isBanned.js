const fs = require('node:fs');
const path = require('node:path');

const file = path.join(process.cwd(), 'data', 'banned.json');

function read() {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return []; }
}

function isBanned(jid) {
  return read().includes(jid);
}

function ban(jid) {
  const values = new Set(read());
  values.add(jid);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify([...values], null, 2));
}

function unban(jid) {
  const values = read().filter((value) => value !== jid);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(values, null, 2));
}

module.exports = { isBanned, ban, unban };
