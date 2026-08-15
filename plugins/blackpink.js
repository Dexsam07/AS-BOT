import mumaker from 'mumaker';

export default {
    command: 'blackpink',
    aliases: ['bpink'],
    category: 'ephoto',
    description: 'Create blackpink style text effect',
    usage: '.blackpink <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '🎀 *BLACKPINK TEXT*\n\nUsage: .blackpink <text>\nExample: .blackpink Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `🎀 *Blackpink Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Blackpink Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};