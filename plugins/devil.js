import mumaker from 'mumaker';

export default {
    command: 'devil',
    aliases: ['deviltext'],
    category: 'ephoto',
    description: 'Create devil style text effect',
    usage: '.devil <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '👿 *DEVIL TEXT*\n\nUsage: .devil <text>\nExample: .devil Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `👿 *Devil Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Devil Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};