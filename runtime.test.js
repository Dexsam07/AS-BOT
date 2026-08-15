const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const config = require('./config');
const { createDemoSessionId, validateSessionId } = require('./lib/session-validator');
const { authorize } = require('./lib/policy-engine');
const { loadDirectory, loadManifest, loadPlugins, loadFile } = require('./lib/plugin-loader');
const queue = require('./lib/job-queue');
const { buildCommandMap } = require('./lib/command-router');

test('DEX~ session gate accepts valid prefix payload', () => {
  const result = validateSessionId(createDemoSessionId('DEX~'), 'DEX~');
  assert.equal(result.valid, true);
  assert.equal(result.prefix, 'DEX~');
});
test('wrong session prefix is rejected', () => assert.throws(() => validateSessionId(createDemoSessionId('ABC~'), config.SESSION_PREFIX), /Session rejected/));
test('owner authorization does not bypass WhatsApp bot-admin capability', async () => {
  const result = await authorize({ command: { ownerOnly: true, requiresBotAdmin: true }, context: { sender: `${config.OWNER_NUMBER}@s.whatsapp.net`, chatId: '123@g.us', isGroup: true, message: { key: {} } }, sock: { user: { id: '999@s.whatsapp.net' }, groupMetadata: async () => ({ participants: [] }) } });
  assert.equal(result.ownerAuthorized, true); assert.equal(result.allowed, false); assert.equal(result.reason, 'BOT_ADMIN_REQUIRED');
});
test('plugin core directory loads standardized commands', async () => {
  const result = await loadDirectory(path.join(__dirname, 'plugins', 'core'), { logger: { warn() {} }, source: 'core' });
  assert.ok(result.registry.length >= 7); assert.ok(result.registry.some((item) => item.name === 'help')); assert.ok(result.registry.some((item) => item.name === 'settings'));
});
test('lazy plugin manifest registers metadata without eager imports', async () => {
  const manifestPath = path.join(__dirname, 'plugins', 'plugin-manifest.json');
  const manifest = await loadManifest(manifestPath, { logger: { warn() {} }, source: 'plugins', rootDir: path.join(__dirname, 'plugins') });
  assert.equal(manifest.skipped.length, 0);
  assert.equal(manifest.registry.length, 873);
  assert.ok(manifest.registry.every((item) => typeof item.handler === 'function'));
  const loaded = await loadPlugins({ pluginsDir: path.join(__dirname, 'plugins', 'core'), pluginDirs: [path.join(__dirname, 'plugins')], includeExternal: true, manifestPath, lazyExternal: true, primarySource: 'core', externalSource: 'plugins', logger: { warn() {} } });
  assert.ok(loaded.registry.length >= 650);
  assert.ok(loaded.registry.length < manifest.registry.length + 10);
  assert.ok(loaded.registry.some((item) => item.name === 'menu' && item.source === 'core'));
});
test('repaired channel metadata plugin loads through the current contract', async () => {
  const result = await loadFile(path.join(__dirname, 'plugins', 'tools-cekidch.js'), { logger: { warn() {} }, source: 'plugins' });
  const command = result.registry.find((item) => item.name === 'cekidch');
  assert.ok(command);
  let output = '';
  await command.handler({}, { key: { id: 'test' } }, [], { chatId: '123@s.whatsapp.net', reply: async (text) => { output = text; } });
  assert.match(output, /cekidch/);
});
test('natural command registry does not require a dot prefix', () => { const map = buildCommandMap([{ name: 'ping', aliases: ['alive'], handler() {} }]); assert.ok(map.get('ping')); assert.ok(map.get('alive')); assert.equal(map.get('.ping'), undefined); });
test('job queue executes a simple job', async () => assert.equal(await queue.submit('test', 'local', async () => 'ok'), 'ok'));

test('owner update command applies GitHub update and requests restart', async () => {
  const managerPath = require.resolve('./lib/update-manager');
  const commandPath = require.resolve('./plugins/core/system/update');
  const previousManager = require.cache[managerPath];
  const previousCommand = require.cache[commandPath];
  const replies = [];
  let restartReason = null;

  require.cache[managerPath] = {
    id: managerPath,
    filename: managerPath,
    loaded: true,
    exports: {
      status: async () => ({ supported: true, repo: 'Dexsam07/AS-BOT', branch: 'main', current: 'oldcommit', remote: 'newcommit', updateAvailable: true, dirty: false }),
      applyUpdate: async () => ({ updated: true, previousCommit: 'oldcommit', nextCommit: 'newcommit', files: 2, packageChanged: false, message: 'Update validate aur apply ho gaya. Restart required hai.' }),
      rollback: async () => ({ message: 'Rollback complete.', from: 'newcommit', to: 'oldcommit' })
    }
  };
  delete require.cache[commandPath];

  try {
    const command = require(commandPath);
    const context = {
      reply: async (text) => { replies.push(text); },
      requestRestart: (reason) => { restartReason = reason; }
    };
    const result = await command.handler({}, {}, ['now'], context);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    assert.equal(result.updated, true);
    assert.equal(replies.length, 2);
    assert.match(replies[1], /newcommit/);
    assert.equal(restartReason, 'github-update');
  } finally {
    if (previousManager) require.cache[managerPath] = previousManager;
    else delete require.cache[managerPath];
    if (previousCommand) require.cache[commandPath] = previousCommand;
    else delete require.cache[commandPath];
  }
});

test('professional menu renders live categories and branding', async () => {
  const menu = require('./plugins/core/system/menu');
  let output = '';
  const context = {
    registry: [
      { name: 'ping', category: 'system', description: 'Check bot latency.' },
      { name: 'note', aliases: ['notes'], category: 'daily', description: 'Save a personal note.' }
    ],
    reply: async (text) => { output = text; }
  };
  await menu.handler({}, {}, [], context);
  assert.match(output, /AS-BOT/);
  assert.match(output, /DEX SHYAM TECH/);
  assert.match(output, /SYSTEM & INFO/);
  assert.match(output, /PERSONAL & DAILY/);

  await menu.handler({}, {}, ['2'], context);
  assert.match(output, /ping/);
  assert.match(output, /prefixless/i);
});

test('setting compatibility layer keeps prefixless and secret-safe defaults', () => {
  const settings = require('./setting');
  assert.equal(settings.prefix, '');
  assert.equal(settings.giphyApiKey, '');
  assert.match(settings.updateZipUrl, /Dexsam07\/AS-BOT/);
  assert.equal(settings.channelName, config.CHANNEL_NAME);
});

test('interactive menu sends category list, quick buttons, and direct command rows', async () => {
  const menu = require('./plugins/core/system/menu');
  const sent = [];
  const context = {
    registry: [
      { name: 'owner', category: 'system', description: 'Show owner.' },
      { name: 'ping', category: 'system', description: 'Check latency.' },
      { name: 'sticker', category: 'media', description: 'Create a sticker.' }
    ],
    message: { key: { id: 'test' } },
    sendMessage: async (payload) => { sent.push(payload); },
    reply: async (text) => { sent.push({ text }); }
  };
  await menu.handler({}, {}, [], context);
  assert.equal(sent.length, 3);
  assert.ok(sent[0].image);
  assert.ok(Array.isArray(sent[1].sections));
  assert.equal(sent[1].sections[0].rows[0].rowId, 'menu 1');
  assert.equal(sent[2].buttons[0].buttonId, 'owner');
  assert.equal(sent[2].buttons[1].buttonId, 'ping');

  sent.length = 0;
  const systemIndex = menu.commandGroups(context.registry).findIndex((group) => group.category === 'system');
  await menu.handler({}, {}, [String(systemIndex + 1)], context);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].sections[0].rows[0].rowId, 'owner');
});

test('legacy cmd plugin adapter registers and executes through current context', async () => {
  const fs = require('node:fs/promises');
  const os = require('node:os');
  const { loadDirectory } = require('./lib/plugin-loader');
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asbot-plugin-test-'));
  const commandModule = path.join(__dirname, 'command.js');
  const pluginPath = path.join(tempDir, 'legacy-test.js');
  await fs.writeFile(pluginPath, `const { cmd } = require(${JSON.stringify(commandModule)});\ncmd({ pattern: 'legacytest', alias: ['lt'], desc: 'Legacy adapter test', category: 'test' }, async (conn, mek, m, { args, reply }) => reply(args.join(' ') || 'ok'));\n`);
  try {
    const result = await loadDirectory(tempDir, { logger: { warn() {} }, source: 'test' });
    assert.equal(result.registry.length, 1);
    const command = result.registry[0];
    let output = '';
    await command.handler({}, { key: { remoteJid: '123@s.whatsapp.net' }, message: {} }, ['hello'], {
      chatId: '123@s.whatsapp.net', sender: '456@s.whatsapp.net', senderNumber: '456',
      isOwner: false, isGroup: false, isBotAdmin: false, isSenderAdmin: false,
      body: 'legacytest hello', reply: async (text) => { output = text; }, react() {}
    });
    assert.equal(command.name, 'legacytest');
    assert.equal(output, 'hello');
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
