import mumaker from 'mumaker';

export default {
    command: 'metallic',
    aliases: ['metal'],
    category: 'ephoto',
    description: 'Create metallic style text effect',
    usage: '.metallic <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '🔩 *METALLIC TEXT*\n\nUsage: .metallic <text>\nExample: .metallic Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/impressive-decorative-3d-metal-text-effect-798.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `🔩 *Metallic Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Metallic Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};