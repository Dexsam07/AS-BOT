const runtimeSettings = require('../../../lib/runtime-settings');

function usage() {
  return [
    'Settings commands:',
    'settings show',
    'settings set bot_name AS-BOT PRO',
    'settings set mode private|public|groups|inbox',
    'settings set channel_name DEX SHYAM TECH',
    'settings set channel_link https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o',
    'settings set reminders on|off',
    'settings set memory_guard on|off',
    'settings set external_plugins on|off',
    'settings reset'
  ].join('\n');
}

const aliases = {
  bot_name: 'BOT_NAME', botname: 'BOT_NAME', name: 'BOT_NAME',
  owner_name: 'OWNER_NAME', owner: 'OWNER_NAME',
  mode: 'MODE', language: 'LANGUAGE', timezone: 'TIMEZONE',
  channel_name: 'CHANNEL_NAME', channel: 'CHANNEL_NAME',
  channel_id: 'CHANNEL_ID', channel_link: 'CHANNEL_LINK',
  external_plugins: 'LOAD_EXTERNAL_PLUGINS', reminders: 'ENABLE_REMINDERS',
  memory_guard: 'ENABLE_MEMORY_GUARD', rate_limit: 'COMMAND_RATE_LIMIT'
};

module.exports = {
  command: 'settings',
  aliases: ['setting', 'config'],
  category: 'system',
  description: 'Change bot settings directly from WhatsApp.',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const action = String(args[0] || 'show').toLowerCase();
    if (action === 'show') {
      const values = await runtimeSettings.getAll();
      return context.reply(['Current settings:', ...Object.entries(values).map(([key, value]) => `${key}: ${value}`)].join('\n'));
    }
    if (action === 'reset') {
      await runtimeSettings.reset(context.sender);
      return context.reply('Runtime settings reset ho gayi. Connection-related changes ke liye bot restart required ho sakta hai.');
    }
    if (action !== 'set' || args.length < 3) return context.reply(usage());
    const key = aliases[String(args[1]).toLowerCase()] || String(args[1]).toUpperCase();
    const rawValue = args.slice(2).join(' ');
    try {
      const result = await runtimeSettings.set(key, rawValue, context.sender);
      const restartNote = ['LOAD_EXTERNAL_PLUGINS', 'CHANNEL_ID'].includes(result.key) ? ' Restart recommended.' : '';
      return context.reply(`${result.key} update ho gaya: ${result.value}.${restartNote}`);
    } catch (error) {
      return context.reply(`❌ ${error.message}`);
    }
  }
};
