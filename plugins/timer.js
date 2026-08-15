export default {
    command: 'timer',
    aliases: ['timerset', 'pt'],
    category: 'privacy',
    description: 'Set default disappearing timer',
    usage: '.timer <off|24h|7d|90d>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const value = args[0]?.toLowerCase();
        const durations = {
            'off': 0, '0': 0,
            '24h': 86400, '1d': 86400,
            '7d': 604800, '1w': 604800,
            '90d': 7776000, '3m': 7776000,
        };

        if (!value || !(value in durations)) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid timer value\n\nAllowed: \`off\` \`24h\` \`7d\` \`90d\`\n\n📌 *Example:* .timer 7d`,
                contextInfo: {}
            }, { quoted: message });
        }

        try {
            await sock.updateDefaultDisappearingMode(durations[value]);
            const label = value === 'off' || value === '0' ? 'disabled' : `set to *${value}*`;
            return await sock.sendMessage(chatId, {
                text: `⏳ Default disappearing timer ${label}`,
                contextInfo: {}
            }, { quoted: message });
        } catch (e) {
            return await sock.sendMessage(chatId, {
                text: `❌ Failed to set timer: ${e.message}`,
                contextInfo: {}
            }, { quoted: message });
        }
    }
};