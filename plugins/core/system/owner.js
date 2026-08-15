const config = require('../../../config');
module.exports = {
  command: 'owner',
  aliases: ['creator', 'about'],
  category: 'system',
  description: 'Show bot owner and channel information.',
  async handler(sock, message, args, context) {
    await context.reply([`Owner: ${config.OWNER_NAME}`, `Number: ${config.OWNER_NUMBER}`, `Bot: ${config.BOT_NAME}`, `Channel: ${config.CHANNEL_NAME}`, config.CHANNEL_LINK].join('\n'));
  }
};
