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
