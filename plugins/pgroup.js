export default {
    command: 'addtogroup',
    aliases: ['groupsprivacy', 'pg'],
    category: 'privacy',
    description: 'Set groups add privacy',
    usage: 'addtogroup <all|contacts|blacklist>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const value = args[0]?.toLowerCase();
        const allowed = ['all', 'contacts', 'blacklist'];

        if (!value || !allowed.includes(value)) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid value for groups add\n\nAllowed: ${allowed.map(v => `\`${v}\``).join(' ')}\n\n📌 *Example:* .addtogroups contacts`,
                contextInfo: {}
            }, { quoted: message });
        }

        try {
            const resolvedValue = value === 'blacklist' ? 'contact_blacklist' : value;
            await sock.updateGroupsAddPrivacy(resolvedValue);
            return await sock.sendMessage(chatId, {
                text: `✅ *Groups Add* set to \`${value}\``,
                contextInfo: {}
            }, { quoted: message });
        } catch (e) {
            return await sock.sendMessage(chatId, {
                text: `❌ Failed to update Groups Add: ${e.message}`,
                contextInfo: {}
            }, { quoted: message });
        }
    }
};