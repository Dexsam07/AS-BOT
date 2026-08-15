export default {
    command: 'blocklist',
    aliases: ['blockedlist', 'blist', 'bl'],
    category: 'privacy',
    description: 'View blocked users',
    usage: '.blocklist',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;

        try {
            const list = await sock.fetchBlocklist();
            
            if (!list || list.length === 0) {
                return await sock.sendMessage(chatId, {
                    text: `📋 *Block List*\n\n_No blocked users._`,
                    contextInfo: {}
                }, { quoted: message });
            }
            
            const entries = list.map((jid, i) => `${i + 1}. +${jid.split('@')[0]}`).join('\n');
            
            return await sock.sendMessage(chatId, {
                text: `╔═════════════╗\n` +
                    `║🚫 *BLOCK LIST*   ║\n` +
                    `╚═════════════╝\n\n` +
                    `${entries}\n\n` +
                    `────────────────────\n` +
                    `*Total:* ${list.length} blocked user(s)`,
                contextInfo: {}
            }, { quoted: message });
        } catch (e) {
            return await sock.sendMessage(chatId, {
                text: `❌ Failed to fetch block list: ${e.message}`,
                contextInfo: {}
            }, { quoted: message });
        }
    }
};