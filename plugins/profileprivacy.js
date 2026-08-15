export default {
    command: 'profileprivacy',
    aliases: ['pprofile', 'ppp'],
    category: 'privacy',
    description: 'Set profile picture privacy',
    usage: '.profileprivacy <all|contacts|blacklist|none>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const value = args[0]?.toLowerCase();
        const allowed = ['all', 'contacts', 'blacklist', 'none'];

        if (!value || !allowed.includes(value)) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid value for profile picture\n\nAllowed: ${allowed.map(v => `\`${v}\``).join(' ')}\n\n📌 *Example:* .profileprivacy contacts`,
                contextInfo: {}
            }, { quoted: message });
        }

        try {
            const resolvedValue = value === 'blacklist' ? 'contact_blacklist' : value;
            await sock.updateProfilePicturePrivacy(resolvedValue);
            return await sock.sendMessage(chatId, {
                text: `✅ *Profile Picture* set to \`${value}\``,
                contextInfo: {}
            }, { quoted: message });
        } catch (e) {
            return await sock.sendMessage(chatId, {
                text: `❌ Failed to update Profile Picture: ${e.message}`,
                contextInfo: {}
            }, { quoted: message });
        }
    }
};