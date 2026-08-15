export default {
    command: 'unblock',
    aliases: ['unblockuser', 'ubk'],
    category: 'privacy',
    description: 'Unblock a user',
    usage: '.unblock <number> or reply to message',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const value = args[0];

        let targetJid = null;
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        
        if (quotedParticipant) {
            const num = quotedParticipant.split('@')[0].split(':')[0];
            targetJid = `${num}@s.whatsapp.net`;
        }
        
        if (!targetJid && value) {
            const num = value.replace(/[^0-9]/g, '');
            if (num.length >= 7) targetJid = `${num}@s.whatsapp.net`;
        }
        
        if (!targetJid && !chatId.endsWith('@g.us')) {
            targetJid = chatId;
        }
        
        if (!targetJid) {
            return await sock.sendMessage(chatId, {
                text: `❌ Provide a number or reply to a message.\n\n📌 *Example:* .unblock 91XXXXXXXX`,
                contextInfo: {}
            }, { quoted: message });
        }

        try {
            await sock.updateBlockStatus(targetJid, 'unblock');
            return await sock.sendMessage(chatId, {
                text: `✅ *Unblocked* +${targetJid.split('@')[0]}`,
                contextInfo: {}
            }, { quoted: message });
        } catch (e) {
            return await sock.sendMessage(chatId, {
                text: `❌ Failed to unblock: ${e.message}`,
                contextInfo: {}
            }, { quoted: message });
        }
    }
};