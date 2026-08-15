import mumaker from 'mumaker';

export default {
    command: 'light',
    aliases: ['lighttext'],
    category: 'ephoto',
    description: 'Create light style text effect',
    usage: '.light <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '💡 *LIGHT TEXT*\n\nUsage: .light <text>\nExample: .light Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `💡 *Light Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Light Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};