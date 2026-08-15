const config = require('../config');

const channelInfo = {
  contextInfo: {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: config.CHANNEL_ID,
      newsletterName: config.CHANNEL_NAME,
      serverMessageId: -1
    }
  }
};

module.exports = { channelInfo };
