const fs = require('node:fs');
const path = require('node:path');

const targets = [path.join(process.cwd(), 'temp'), path.join(process.cwd(), 'logs')];
for (const target of targets) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(target)) {
    const filePath = path.join(target, entry);
    try { fs.rmSync(filePath, { recursive: true, force: true }); } catch (_) {}
  }
}
console.log('Temporary files and logs cleaned.');
