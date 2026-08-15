const config = require('./config');

const commands = [];

function shyam(metadata, handler) {
  const command = {
    ...metadata,
    function: handler,
    pattern: metadata.pattern || metadata.command || metadata.name,
    alias: metadata.alias || metadata.aliases || []
  };
  commands.push(command);
  return command;
}

module.exports = {
  shyam,
  commands,
  botName: config.BOT_NAME,
  ownerName: config.OWNER_NAME,
  ownerNumber: config.OWNER_NUMBER,
  channelName: config.CHANNEL_NAME,
  channelId: config.CHANNEL_ID,
  channelLink: config.CHANNEL_LINK,
  prefix: config.PREFIX,
  mode: config.MODE,
  version: config.VERSION
};
