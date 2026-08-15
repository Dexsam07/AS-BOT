import mumaker from 'mumaker';

export default {
    command: 'ice',
    aliases: ['icetext'],
    category: 'ephoto',
    description: 'Create ice style text effect',
    usage: '.ice <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '🧊 *ICE TEXT*\n\nUsage: .ice <text>\nExample: .ice Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/ice-text-effect-online-101.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `🧊 *Ice Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Ice Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};