import mumaker from 'mumaker';

export default {
    command: 'purple',
    aliases: ['purpletext'],
    category: 'ephoto',
    description: 'Create purple style text effect',
    usage: '.purple <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '🟣 *PURPLE TEXT*\n\nUsage: .purple <text>\nExample: .purple Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/purple-text-effect-online-100.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `🟣 *Purple Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Purple Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};