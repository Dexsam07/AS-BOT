function targetFromMessage(message, args = []) {
  const contextInfo = message?.message?.extendedTextMessage?.contextInfo || message?.message?.imageMessage?.contextInfo || {};
  return contextInfo.mentionedJid?.[0] || contextInfo.participant || args[0] || '';
}

module.exports = {
  command: 'kick',
  aliases: ['remove'],
  category: 'moderation',
  description: 'Remove a member when the bot is a group admin.',
  ownerOnly: true,
  groupOnly: true,
  requiresBotAdmin: true,
  requires: ['group-member-remove'],
  dryRunWhenDenied: true,
  async handler(sock, message, args, context) {
    const target = targetFromMessage(message, args);
    if (!target || !target.includes('@')) return context.reply('Mention ya participant number do.');
    await sock.groupParticipantsUpdate(context.chatId, [target], 'remove');
    await context.reply(`Member action completed for ${target}.`);
  }
};
