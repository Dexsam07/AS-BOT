const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const config = require('./config');
const { createDemoSessionId, validateSessionId } = require('./lib/session-validator');
const { authorize } = require('./lib/policy-engine');
const { loadDirectory } = require('./lib/plugin-loader');
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
test('built-in command directory loads standardized commands', async () => {
  const result = await loadDirectory(path.join(__dirname, 'commands'), { logger: { warn() {} } });
  assert.ok(result.registry.length >= 7); assert.ok(result.registry.some((item) => item.name === 'help')); assert.ok(result.registry.some((item) => item.name === 'settings'));
});
test('natural command registry does not require a dot prefix', () => { const map = buildCommandMap([{ name: 'ping', aliases: ['alive'], handler() {} }]); assert.ok(map.get('ping')); assert.ok(map.get('alive')); assert.equal(map.get('.ping'), undefined); });
test('job queue executes a simple job', async () => assert.equal(await queue.submit('test', 'local', async () => 'ok'), 'ok'));

test('owner update command applies GitHub update and requests restart', async () => {
  const managerPath = require.resolve('./lib/update-manager');
  const commandPath = require.resolve('./commands/system/update');
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
