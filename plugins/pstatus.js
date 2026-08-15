export default {
    command: 'pstatus',
    aliases: ['privacystatus', 'pstats'],
    category: 'privacy',
    description: 'View current privacy settings',
    usage: '.pstatus',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;

        try {
            const s = await sock.fetchPrivacySettings(true);
            const fmt = (v) => v ? `\`${v}\`` : `\`unknown\``;
            return await sock.sendMessage(chatId, {
                text: `╔═══════════════╗\n` +
                    `║🔒*CURRENT PRIVACY*║\n` +
                    `╚═══════════════╝\n\n` +
                    `👁️ *Last Seen:* ${fmt(s.last)}\n\n` +
                    `🟢 *Online:* ${fmt(s.online)}\n\n` +
                    `🖼️ *Profile Pic:* ${fmt(s.profile)}\n\n` +
                    `📊 *Status:* ${fmt(s.status)}\n\n` +
                    `✅ *Read Receipts:* ${fmt(s.readreceipts)}\n\n` +
                    `👥 *Groups Add:* ${fmt(s.groupadd)}\n\n` +
                    `_Use \`.pvcy <set> <value>\` to change_`,
                contextInfo: {}
            }, { quoted: message });
        } catch (e) {
            return await sock.sendMessage(chatId, {
                text: `❌ Failed to fetch settings: ${e.message}`,
                contextInfo: {}
            }, { quoted: message });
        }
    }
};