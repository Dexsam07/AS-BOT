import mumaker from 'mumaker';

export default {
    command: 'sand',
    aliases: ['sandtext'],
    category: 'ephoto',
    description: 'Create sand style text effect',
    usage: '.sand <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '🏖️ *SAND TEXT*\n\nUsage: .sand <text>\nExample: .sand Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/write-names-and-messages-on-the-sand-online-582.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `🏖️ *Sand Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Sand Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};