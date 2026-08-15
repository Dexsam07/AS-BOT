import mumaker from 'mumaker';

export default {
    command: 'glitch',
    aliases: ['glitchtext'],
    category: 'ephoto',
    description: 'Create glitch style text effect',
    usage: '.glitch <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '📱 *GLITCH TEXT*\n\nUsage: .glitch <text>\nExample: .glitch Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `📱 *Glitch Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Glitch Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};