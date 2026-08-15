const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function isJavaScriptFile(name) { return name.endsWith('.js') && !name.startsWith('_'); }
function normalizeExport(value) { return value?.default || value; }
function getCommandName(plugin) { return plugin?.command || plugin?.name || plugin?.pattern; }
function getCommandHandler(plugin) { return plugin?.handler || plugin?.execute || plugin?.run; }
function getImporter() {
  try { const createJiti = require('jiti'); return createJiti(__filename, { interopDefault: true }); }
  catch (_) { return (filePath) => import(pathToFileURL(filePath).href); }
}
async function importPlugin(filePath) { return normalizeExport(await getImporter()(filePath)); }

function collectFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, result);
    else if (entry.isFile() && isJavaScriptFile(entry.name)) result.push(full);
  }
  return result;
}

async function loadDirectory(pluginsDir, { logger = console, source = 'plugin' } = {}) {
  const registry = [];
  const skipped = [];
  for (const filePath of collectFiles(pluginsDir)) {
    const relative = path.relative(pluginsDir, filePath);
    try {
      const plugin = await importPlugin(filePath);
      const name = getCommandName(plugin);
      const handler = getCommandHandler(plugin);
      if (!name || typeof handler !== 'function') {
        skipped.push({ file: relative, reason: 'No standardized command export.' });
        continue;
      }
      const aliases = Array.isArray(plugin.aliases) ? plugin.aliases : Array.isArray(plugin.alias) ? plugin.alias : plugin.alias ? [plugin.alias] : [];
      registry.push({
        file: path.relative(process.cwd(), filePath), source,
        name: String(Array.isArray(name) ? name[0] : name), aliases,
        category: plugin.category || 'general', description: plugin.description || plugin.desc || '',
        handler, style: typeof plugin.handler === 'function' ? 'standard' : 'legacy-execute', plugin
      });
    } catch (error) {
      skipped.push({ file: relative, reason: error.message });
      logger.warn(`[plugin-skip] ${source}/${relative}: ${error.message}`);
    }
  }
  return { registry, skipped };
}

async function loadPlugins({ pluginsDir, pluginDirs = [], logger = console, includeExternal = false } = {}) {
  const dirs = [{ dir: pluginsDir, source: 'builtin' }, ...(includeExternal ? pluginDirs.map((dir) => ({ dir, source: 'external' })) : [])];
  const all = { registry: [], skipped: [] };
  for (const item of dirs) {
    const result = await loadDirectory(item.dir, { logger, source: item.source });
    all.registry.push(...result.registry);
    all.skipped.push(...result.skipped);
  }
  return all;
}

module.exports = { loadPlugins, loadDirectory, collectFiles };
