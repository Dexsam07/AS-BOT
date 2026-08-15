import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    command: 'ptv',
    aliases: ['vnote', 'videonote'],
    category: 'general',
    description: 'Convert video to video note',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted?.videoMessage) {
            return await sock.sendMessage(chatId, {
                text: '_Reply to a video to convert to video note_',
                ...channelInfo
            }, { quoted: message });
        }

        try {
            // Send initial reaction
            await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

            // Download the video
            const stream = await downloadContentFromMessage(quoted.videoMessage, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Send as video note using ptv parameter
            await sock.sendMessage(chatId, {
                video: buffer,
                ptv: true, // This tells WhatsApp it's a video note
            });

        } catch (error) {
            console.error('PTV Error:', error);
            await sock.sendMessage(chatId, {
                text: `_Failed to convert to video note: ${error.message}_`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};