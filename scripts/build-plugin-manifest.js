const fs = require('node:fs');
const path = require('node:path');
const { loadDirectory } = require('../lib/plugin-loader');

const root = path.resolve(__dirname, '..');
const pluginRoot = path.join(root, 'plugins');
const output = path.join(pluginRoot, 'plugin-manifest.json');

loadDirectory(pluginRoot, { logger: { warn() {} }, source: 'plugins' })
  .then((result) => {
    const commands = result.registry
      .filter((item) => !item.file.split(path.sep).join('/').includes('plugins/core/'))
      .map(({ file, source, name, aliases, category, description, ownerOnly, adminOnly, requiresBotAdmin, groupOnly, hidden }) => ({
        file, source, name, aliases, category, description, ownerOnly, adminOnly, requiresBotAdmin, groupOnly, hidden
      }));
    const payload = {
      version: 1,
      generatedAt: new Date().toISOString(),
      root: 'plugins',
      commands
    };
    fs.writeFileSync(output, JSON.stringify(payload, null, 2) + '\n');
    console.log(`plugin_manifest_commands=${commands.length}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
