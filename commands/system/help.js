const config = require('../../config');

module.exports = {
  command: 'help',
  aliases: ['menu', 'commands'],
  category: 'system',
  description: 'Show safe active command list.',
  async handler(sock, message, args, context) {
    const lines = [
      `*${config.BOT_NAME}*`,
      `Owner: ${config.OWNER_NAME}`,
      `Commands: natural mode (no prefix)`,
      '',
      '*System:* `help` `alive` `owner` `status`',
      '*Daily:* `note add <text>` `notes` `todo add <text>` `todos`',
      '*Reminder:* `remind <minutes> <text>`',
      '',
      'Group admin actions tabhi chalenge jab bot WhatsApp group admin ho.'
    ];
    await context.reply(lines.join('\n'));
  }
};
