const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { beginCapture } = require('./legacy-plugin-bridge');

function isJavaScriptFile(name) { return name.endsWith('.js') && !name.startsWith('_'); }
function normalizeExport(value) { return value?.default || value; }
function getCommandName(plugin) { return plugin?.command || plugin?.name || plugin?.pattern; }
function getCommandHandler(plugin) { return plugin?.handler || plugin?.execute || plugin?.run; }
function getAliases(plugin) { return Array.isArray(plugin?.aliases) ? plugin.aliases : Array.isArray(plugin?.alias) ? plugin.alias : plugin?.alias ? [plugin.alias] : []; }
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

function standardizedRecord(plugin, filePath, source) {
  const rawName = getCommandName(plugin);
  const handler = getCommandHandler(plugin);
  if (!rawName || typeof handler !== 'function') return null;
  return {
    file: path.relative(process.cwd(), filePath),
    source,
    name: String(Array.isArray(rawName) ? rawName[0] : rawName),
    aliases: getAliases(plugin),
    category: plugin.category || 'general',
    description: plugin.description || plugin.desc || '',
    ownerOnly: Boolean(plugin.ownerOnly),
    adminOnly: Boolean(plugin.adminOnly),
    requiresBotAdmin: Boolean(plugin.requiresBotAdmin),
    groupOnly: Boolean(plugin.groupOnly),
    hidden: Boolean(plugin.hidden || plugin.dontAdd),
    handler,
    style: 'standard',
    plugin
  };
}

function legacyRecord(item, source) {
  return {
    file: item.file,
    source,
    name: item.name,
    aliases: item.aliases,
    category: item.category,
    description: item.description,
    ownerOnly: item.ownerOnly,
    adminOnly: item.adminOnly,
    requiresBotAdmin: item.requiresBotAdmin,
    groupOnly: item.groupOnly,
    hidden: item.hidden,
    handler: item.handler,
    style: 'standard',
    plugin: item.legacyMeta
  };
}

async function loadDirectory(pluginsDir, { logger = console, source = 'plugin' } = {}) {
  const registry = [];
  const skipped = [];
  for (const filePath of collectFiles(pluginsDir)) {
    const relative = path.relative(pluginsDir, filePath);
    const capture = beginCapture();
    try {
      const plugin = await importPlugin(filePath);
      const records = [];
      const standardized = standardizedRecord(plugin, filePath, source);
      if (standardized) records.push(standardized);
      for (const item of capture.finish(path.relative(process.cwd(), filePath))) records.push(legacyRecord(item, source));
      if (!records.length) {
        capture.rollback();
        skipped.push({ file: relative, reason: 'No standardized or legacy command registration.' });
        continue;
      }
      registry.push(...records);
    } catch (error) {
      capture.rollback();
      skipped.push({ file: relative, reason: error.message });
      logger.warn(`[plugin-skip] ${source}/${relative}: ${error.message}`);
    } finally {
      capture.restore();
    }
  }
  return { registry, skipped };
}

async function loadPlugins({ pluginsDir, pluginDirs = [], logger = console, includeExternal = false, primarySource = 'builtin', externalSource = 'external' } = {}) {
  const dirs = [{ dir: pluginsDir, source: primarySource }, ...(includeExternal ? pluginDirs.map((dir) => ({ dir, source: externalSource })) : [])];
  const all = { registry: [], skipped: [] };
  const seen = new Set();
  for (const item of dirs) {
    const result = await loadDirectory(item.dir, { logger, source: item.source });
    for (const command of result.registry) {
      const names = [command.name, ...(command.aliases || [])].map((name) => String(name).toLowerCase()).filter(Boolean);
      if (names.some((name) => seen.has(name))) {
        all.skipped.push({ file: command.file, reason: `Duplicate command ignored: ${command.name}` });
        continue;
      }
      names.forEach((name) => seen.add(name));
      all.registry.push(command);
    }
    all.skipped.push(...result.skipped);
  }
  return all;
}

module.exports = { loadPlugins, loadDirectory, collectFiles, standardizedRecord };
