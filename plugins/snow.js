import mumaker from 'mumaker';

export default {
    command: 'snow',
    aliases: ['snowtext'],
    category: 'ephoto',
    description: 'Create snow style text effect',
    usage: '.snow <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '❄️ *SNOW TEXT*\n\nUsage: .snow <text>\nExample: .snow Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/create-a-snow-3d-text-effect-free-online-621.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `❄️ *Snow Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Snow Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};