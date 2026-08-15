import mumaker from 'mumaker';

export default {
    command: '1917',
    aliases: ['style1917'],
    category: 'ephoto',
    description: 'Create 1917 style text effect',
    usage: '.1917 <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '📜 *1917 STYLE TEXT*\n\nUsage: .1917 <text>\nExample: .1917 Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/1917-style-text-effect-523.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `📜 *1917 Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('1917 Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};