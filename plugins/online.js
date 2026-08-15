export default {
    command: 'online',
    aliases: ['onlineprivacy', 'pol'],
    category: 'privacy',
    description: 'Set online status privacy',
    usage: '.online <all|match_last_seen>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const value = args[0]?.toLowerCase();
        const allowed = ['all', 'match_last_seen'];

        if (!value || !allowed.includes(value)) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid value for online status\n\nAllowed: ${allowed.map(v => `\`${v}\``).join(' ')}\n\n📌 *Example:* .online all`,
                contextInfo: {}
            }, { quoted: message });
        }

        try {
            await sock.updateOnlinePrivacy(value);
            return await sock.sendMessage(chatId, {
                text: `✅ *Online Status* set to \`${value}\``,
                contextInfo: {}
            }, { quoted: message });
        } catch (e) {
            return await sock.sendMessage(chatId, {
                text: `❌ Failed to update Online Status: ${e.message}`,
                contextInfo: {}
            }, { quoted: message });
        }
    }
};