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

async function loadFile(filePath, { logger = console, source = 'plugin' } = {}) {
  const capture = beginCapture();
  const relative = path.relative(process.cwd(), filePath);
  try {
    const plugin = await importPlugin(filePath);
    const records = [];
    const standardized = standardizedRecord(plugin, filePath, source);
    if (standardized) records.push(standardized);
    for (const item of capture.finish(relative)) records.push(legacyRecord(item, source));
    if (!records.length) {
      capture.rollback();
      return { registry: [], skipped: [{ file: relative, reason: 'No standardized or legacy command registration.' }] };
    }
    const registry = records.filter((item) => item.name && typeof item.handler === 'function');
    // Registrations are already converted into records; do not retain them globally.
    capture.rollback();
    return { registry, skipped: [] };
  } catch (error) {
    capture.rollback();
    return { registry: [], skipped: [{ file: relative, reason: error.message }] };
  } finally {
    capture.restore();
  }
}

async function loadDirectory(pluginsDir, { logger = console, source = 'plugin' } = {}) {
  const registry = [];
  const skipped = [];
  for (const filePath of collectFiles(pluginsDir)) {
    const result = await loadFile(filePath, { logger, source });
    registry.push(...result.registry);
    skipped.push(...result.skipped);
    for (const item of result.skipped) logger.warn(`[plugin-skip] ${source}/${path.relative(pluginsDir, filePath)}: ${item.reason}`);
  }
  return { registry, skipped };
}

function isInside(rootDir, filePath) {
  const root = path.resolve(rootDir) + path.sep;
  return path.resolve(filePath).startsWith(root);
}

function lazyRecord(entry, { rootDir, source, logger }) {
  const filePath = path.resolve(process.cwd(), entry.file);
  let loadedPromise = null;
  const names = [entry.name, ...(entry.aliases || [])].map((value) => String(value).toLowerCase());
  return {
    ...entry,
    file: entry.file,
    source,
    style: 'standard',
    plugin: entry.plugin || entry,
    handler: async (...args) => {
      if (!loadedPromise) loadedPromise = loadFile(filePath, { logger, source });
      const result = await loadedPromise;
      const command = result.registry.find((item) => names.includes(String(item.name).toLowerCase()) || (item.aliases || []).some((alias) => names.includes(String(alias).toLowerCase())));
      if (!command) throw new Error(`Lazy plugin command did not register: ${entry.name}`);
      return command.handler(...args);
    }
  };
}

async function loadManifest(manifestPath, { logger = console, source = 'plugins', rootDir = process.cwd() } = {}) {
  const skipped = [];
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return { registry: [], skipped: [{ file: path.relative(process.cwd(), manifestPath), reason: `Manifest unavailable: ${error.message}` }] };
  }
  const registry = [];
  for (const entry of Array.isArray(manifest.commands) ? manifest.commands : []) {
    const filePath = path.resolve(process.cwd(), entry.file || '');
    if (!entry.name || !isInside(rootDir, filePath) || !fs.existsSync(filePath)) {
      skipped.push({ file: entry.file || '(missing)', reason: 'Manifest entry points outside plugin root or file is missing.' });
      continue;
    }
    registry.push(lazyRecord(entry, { rootDir, source, logger }));
  }
  return { registry, skipped };
}

async function loadPlugins({ pluginsDir, pluginDirs = [], logger = console, includeExternal = false, primarySource = 'builtin', externalSource = 'external', manifestPath = null, lazyExternal = true, fallbackEager = false } = {}) {
  const dirs = [{ dir: pluginsDir, source: primarySource }];
  if (includeExternal) {
    for (const dir of pluginDirs) dirs.push({ dir, source: externalSource });
  }
  const all = { registry: [], skipped: [] };
  const seen = new Set();
  for (const item of dirs) {
    const result = item.source === externalSource && lazyExternal && manifestPath
      ? await loadManifest(manifestPath, { logger, source: item.source, rootDir: item.dir })
      : item.source === externalSource && !fallbackEager
        ? { registry: [], skipped: [{ file: item.dir, reason: 'External plugin manifest is required; eager loading is disabled for memory safety.' }] }
        : await loadDirectory(item.dir, { logger, source: item.source });
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

module.exports = { loadPlugins, loadDirectory, loadManifest, loadFile, collectFiles, standardizedRecord };
