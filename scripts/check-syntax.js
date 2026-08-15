const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const roots = ['index.js', 'config.js', 'command.js', 'shyam.js', 'amon.js', 'malvin.js', 'cleanup.js', 'reset-session.js', 'ecosystem.config.cjs', 'lib', 'commands', 'scripts', 'test'];
const files = [];
function collect(target) {
  const absolute = path.resolve(target);
  if (!fs.existsSync(absolute)) return;
  const stat = fs.statSync(absolute);
  if (stat.isFile() && /\.(js|cjs)$/.test(absolute) && !absolute.endsWith('check-syntax.js')) files.push(absolute);
  if (stat.isDirectory()) for (const entry of fs.readdirSync(absolute)) collect(path.join(absolute, entry));
}
roots.forEach(collect);
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || `Syntax error: ${file}\n`);
    process.exit(result.status || 1);
  }
}
console.log(`syntax_ok=${files.length}`);
