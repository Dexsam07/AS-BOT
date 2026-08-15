const { proto } = require('@whiskeysockets/baileys');

module.exports = {
  command: 'cekidch',
  aliases: ['idch'],
  category: 'tools',
  description: 'Read WhatsApp channel metadata from an invite link.',
  async handler(sock, message, args, context) {
    const text = args.join(' ').trim();
    if (!text) return context.reply('Use: `cekidch https://whatsapp.com/channel/...`');
    if (!text.includes('https://whatsapp.com/channel/')) return context.reply('Link valid WhatsApp channel link nahi hai.');
    try {
      const invite = text.split('https://whatsapp.com/channel/')[1].split(/[?#\s]/)[0];
      const result = await sock.newsletterMetadata('invite', invite);
      const infoText = [
        `*CHANNEL INFO*`,
        `ID: ${result.id || 'unknown'}`,
        `Name: ${result.name || 'unknown'}`,
        `Followers: ${result.subscribers ?? 'unknown'}`,
        `Status: ${result.state || 'unknown'}`,
        `Verified: ${result.verification === 'VERIFIED' ? 'Yes' : 'No'}`
      ].join('\n');
      try {
        const interactive = proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({ text: infoText }),
          footer: proto.Message.InteractiveMessage.Footer.create({ text: 'AS-BOT • DEX SHYAM TECH' }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: [{ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Channel ID', copy_code: result.id || '' }) }]
          })
        });
        await sock.relayMessage(context.chatId, { interactiveMessage: interactive }, { messageId: message?.key?.id });
      } catch (_) {
        await context.reply(infoText);
      }
    } catch (error) {
      await context.reply(`Channel metadata nahi mil saka: ${error.message}`);
    }
  }
};
