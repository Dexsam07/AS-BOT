export default {
    command: 'lastseen',
    aliases: ['plastseen', 'pls'],
    category: 'privacy',
    description: 'Set last seen privacy',
    usage: '.lastseen <all|contacts|blacklist|none>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const value = args[0]?.toLowerCase();
        const allowed = ['all', 'contacts', 'blacklist', 'none'];

        if (!value || !allowed.includes(value)) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid value for last seen\n\nAllowed: ${allowed.map(v => `\`${v}\``).join(' ')}\n\n📌 *Example:* .lastseen all`,
                contextInfo: {}
            }, { quoted: message });
        }

        try {
            const resolvedValue = value === 'blacklist' ? 'contact_blacklist' : value;
            await sock.updateLastSeenPrivacy(resolvedValue);
            return await sock.sendMessage(chatId, {
                text: `✅ *Last Seen* set to \`${value}\``,
                contextInfo: {}
            }, { quoted: message });
        } catch (e) {
            return await sock.sendMessage(chatId, {
                text: `❌ Failed to update Last Seen: ${e.message}`,
                contextInfo: {}
            }, { quoted: message });
        }
    }
};