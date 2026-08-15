const fs = require('node:fs');
const path = require('node:path');
const config = require('./config');

const sessionDir = path.resolve(process.cwd(), config.SESSION_DIR);
if (!fs.existsSync(sessionDir)) {
  console.log('No local session directory found.');
} else {
  fs.rmSync(sessionDir, { recursive: true, force: true });
  console.log(`Local session directory removed: ${sessionDir}`);
}
