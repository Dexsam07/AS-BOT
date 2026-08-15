import mumaker from 'mumaker';

export default {
    command: 'thunder',
    aliases: ['thundertext'],
    category: 'ephoto',
    description: 'Create thunder style text effect',
    usage: '.thunder <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '⚡ *THUNDER TEXT*\n\nUsage: .thunder <text>\nExample: .thunder Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/thunder-text-effect-online-97.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `⚡ *Thunder Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Thunder Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};