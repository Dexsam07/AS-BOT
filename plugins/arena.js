import mumaker from 'mumaker';

export default {
    command: 'arena',
    aliases: ['arenatext'],
    category: 'ephoto',
    description: 'Create arena style text effect',
    usage: '.arena <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '⚔️ *ARENA TEXT*\n\nUsage: .arena <text>\nExample: .arena Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `⚔️ *Arena Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Arena Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};