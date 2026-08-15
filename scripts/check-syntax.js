const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const roots = ['index.js', 'config.js', 'command.js', 'shyam.js', 'cleanup.js', 'reset-session.js', 'ecosystem.config.cjs', 'lib', 'plugins', 'scripts'];
const files = [];
function collect(target) {
  const absolute = path.resolve(target);
  if (!fs.existsSync(absolute)) return;
  const stat = fs.statSync(absolute);
  if (stat.isFile() && /\.(js|cjs)$/.test(absolute) && !absolute.endsWith('check-syntax.js') && !path.basename(absolute).startsWith('_')) files.push(absolute);
  if (stat.isDirectory()) for (const entry of fs.readdirSync(absolute)) collect(path.join(absolute, entry));
}
roots.forEach(collect);
let pluginSyntaxSkipped = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    if (file.includes(`${path.sep}plugins${path.sep}`)) {
      pluginSyntaxSkipped += 1;
      process.stderr.write(`[plugin-syntax-skip] ${path.relative(process.cwd(), file)}\n`);
      continue;
    }
    process.stderr.write(result.stderr || `Syntax error: ${file}\n`);
    process.exit(result.status || 1);
  }
}
console.log(`syntax_ok=${files.length - pluginSyntaxSkipped} plugin_syntax_skipped=${pluginSyntaxSkipped}`);
