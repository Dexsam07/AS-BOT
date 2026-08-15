import mumaker from 'mumaker';

export default {
    command: 'leaves',
    aliases: ['leaf'],
    category: 'ephoto',
    description: 'Create leaves style text effect',
    usage: '.leaves <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '🍃 *LEAVES TEXT*\n\nUsage: .leaves <text>\nExample: .leaves Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `🍃 *Leaves Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Leaves Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};