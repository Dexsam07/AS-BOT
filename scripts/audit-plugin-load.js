const path = require('node:path');
const { loadDirectory } = require('../lib/plugin-loader');

loadDirectory(path.join(__dirname, '..', 'plugins'), { logger: { warn() {} }, source: 'external-audit' })
  .then((result) => {
    const categories = new Map();
    for (const command of result.registry) categories.set(command.category, (categories.get(command.category) || 0) + 1);
    console.log(JSON.stringify({
      loaded: result.registry.length,
      skipped: result.skipped.length,
      files: result.skipped.length + new Set(result.registry.map((item) => item.file)).size,
      categories: Object.fromEntries([...categories.entries()].sort()),
      sampleLoaded: result.registry.slice(0, 20).map(({ name, file, category }) => ({ name, file, category })),
      sampleSkipped: result.skipped.slice(0, 20)
    }, null, 2));
  })
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
