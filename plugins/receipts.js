export default {
    command: 'receipts',
    aliases: ['receiptsprivacy', 'pr'],
    category: 'privacy',
    description: 'Set read receipts privacy',
    usage: '.receipts <all|none>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const value = args[0]?.toLowerCase();
        const allowed = ['all', 'none'];

        if (!value || !allowed.includes(value)) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid value for read receipts\n\nAllowed: ${allowed.map(v => `\`${v}\``).join(' ')}\n\n📌 *Example:* .receipts none`,
                contextInfo: {}
            }, { quoted: message });
        }

        try {
            await sock.updateReadReceiptsPrivacy(value);
            return await sock.sendMessage(chatId, {
                text: `✅ *Read Receipts* set to \`${value}\``,
                contextInfo: {}
            }, { quoted: message });
        } catch (e) {
            return await sock.sendMessage(chatId, {
                text: `❌ Failed to update Read Receipts: ${e.message}`,
                contextInfo: {}
            }, { quoted: message });
        }
    }
};