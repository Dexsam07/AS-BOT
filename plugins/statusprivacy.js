export default {
    command: 'statusprivacy',
    aliases: ['pst'],
    category: 'privacy',
    description: 'Set status privacy',
    usage: '.statusprivacy <all|contacts|blacklist|none>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const value = args[0]?.toLowerCase();
        const allowed = ['all', 'contacts', 'blacklist', 'none'];

        if (!value || !allowed.includes(value)) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid value for status\n\nAllowed: ${allowed.map(v => `\`${v}\``).join(' ')}\n\n📌 *Example:* .statusprivacy all`,
                contextInfo: {}
            }, { quoted: message });
        }

        try {
            const resolvedValue = value === 'blacklist' ? 'contact_blacklist' : value;
            await sock.updateStatusPrivacy(resolvedValue);
            return await sock.sendMessage(chatId, {
                text: `✅ *Status* set to \`${value}\``,
                contextInfo: {}
            }, { quoted: message });
        } catch (e) {
            return await sock.sendMessage(chatId, {
                text: `❌ Failed to update Status: ${e.message}`,
                contextInfo: {}
            }, { quoted: message });
        }
    }
};