const functions = require('./functions');

function smsg(sock, message) {
  const chat = message?.key?.remoteJid || '';
  const sender = message?.key?.participant || chat;
  const body = functions.getJsonFile ? undefined : undefined;
  return Object.assign(message, {
    chat,
    sender,
    from: chat,
    text: message?.message?.conversation || message?.message?.extendedTextMessage?.text || '',
    reply: (text, options = {}) => sock.sendMessage(chat, { text, ...options }, { quoted: message })
  });
}

module.exports = {
  smsg,
  isUrl: functions.isUrl,
  generateMessageTag: functions.generateMessageTag,
  getBuffer: functions.getBuffer,
  getSizeMedia: functions.getSizeMedia,
  fetch: functions.fetch,
  sleep: functions.sleep,
  reSize: functions.reSize
};
