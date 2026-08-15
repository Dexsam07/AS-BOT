const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const pluginRoot = path.join(root, 'plugins');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const declared = new Set(Object.keys({ ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) }));
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.startsWith('_')) files.push(file);
  }
}
walk(pluginRoot);
function resolveLocal(spec, file) {
  const base = path.resolve(path.dirname(file), spec);
  for (const candidate of [base, `${base}.js`, `${base}.cjs`, path.join(base, 'index.js')]) if (fs.existsSync(candidate)) return candidate;
  return null;
}
function packageName(spec) {
  if (spec.startsWith('@')) return spec.split('/').slice(0, 2).join('/');
  return spec.split('/')[0];
}
const report = { generatedAt: new Date().toISOString(), totalFiles: files.length, syntaxErrors: [], missingLocal: [], missingPackages: [], legacyRemovedImports: [], sideEffects: [], files: [] };
for (const file of files) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const text = fs.readFileSync(file, 'utf8');
  const syntax = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  const imports = [...text.matchAll(/(?:require\s*\(\s*|from\s+|import\s*\(\s*)["']([^"']+)["']/g)].map((m) => m[1]);
  const localMissing = [];
  const packageMissing = [];
  const removed = [];
  for (const spec of imports) {
    if (spec.startsWith('.') || spec.startsWith('/')) {
      if (!resolveLocal(spec, file)) localMissing.push(spec);
      if (/\.\.(?:\/|\\)(?:amon|malvin|black_hat)(?:\.js)?$/.test(spec)) removed.push(spec);
    } else {
      const pkg = packageName(spec);
      try { require.resolve(pkg, { paths: [root] }); }
      catch (_) { packageMissing.push({ spec, declared: declared.has(pkg) }); }
    }
  }
  const effects = [];
  if (/\bsetInterval\s*\(/.test(text)) effects.push('setInterval');
  if (/\bsetTimeout\s*\(/.test(text)) effects.push('setTimeout');
  if (/\bprocess\.on\s*\(/.test(text)) effects.push('process.on');
  if (/\b(?:fs|fse|fsExtra)\.(?:mkdirSync|writeFileSync|appendFileSync)\s*\(/.test(text)) effects.push('filesystem-write');
  if (localMissing.length) report.missingLocal.push({ file: relative, imports: [...new Set(localMissing)] });
  if (packageMissing.length) report.missingPackages.push({ file: relative, imports: packageMissing });
  if (removed.length) report.legacyRemovedImports.push({ file: relative, imports: [...new Set(removed)] });
  if (effects.length) report.sideEffects.push({ file: relative, effects: [...new Set(effects)] });
  if (syntax.status !== 0) report.syntaxErrors.push({ file: relative, stderr: (syntax.stderr || '').split('\n')[0] });
  report.files.push({ file: relative, syntaxOk: syntax.status === 0, missingLocal: [...new Set(localMissing)], missingPackages: packageMissing, legacyRemovedImports: [...new Set(removed)], sideEffects: [...new Set(effects)] });
}
report.summary = {
  syntaxErrors: report.syntaxErrors.length,
  filesWithMissingLocal: report.missingLocal.length,
  filesWithMissingPackages: report.missingPackages.length,
  filesWithRemovedLegacyImports: report.legacyRemovedImports.length,
  filesWithTopLevelSideEffects: report.sideEffects.length
};
fs.writeFileSync(path.join(root, 'docs/plugin-static-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ totalFiles: report.totalFiles, summary: report.summary }, null, 2));
