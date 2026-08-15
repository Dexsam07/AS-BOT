import mumaker from 'mumaker';

export default {
    command: 'neon',
    aliases: ['neontext'],
    category: 'ephoto',
    description: 'Create neon style text effect',
    usage: '.neon <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '💡 *NEON TEXT*\n\nUsage: .neon <text>\nExample: .neon Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `💡 *Neon Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Neon Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};