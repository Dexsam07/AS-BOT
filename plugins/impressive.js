import mumaker from 'mumaker';

export default {
    command: 'impressive',
    aliases: ['impress'],
    category: 'ephoto',
    description: 'Create impressive style text effect',
    usage: '.impressive <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '✨ *IMPRESSIVE TEXT*\n\nUsage: .impressive <text>\nExample: .impressive Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/create-3d-colorful-paint-text-effect-online-801.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `✨ *Impressive Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Impressive Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};