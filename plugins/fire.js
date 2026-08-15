import mumaker from 'mumaker';

export default {
    command: 'fire',
    aliases: ['firetext'],
    category: 'ephoto',
    description: 'Create fire style text effect',
    usage: '.fire <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '🔥 *FIRE TEXT*\n\nUsage: .fire <text>\nExample: .fire Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/flame-lettering-effect-372.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `🔥 *Fire Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Fire Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};