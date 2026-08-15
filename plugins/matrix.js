import mumaker from 'mumaker';

export default {
    command: 'matrix',
    aliases: ['matrixtext'],
    category: 'ephoto',
    description: 'Create matrix style text effect',
    usage: '.matrix <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '💻 *MATRIX TEXT*\n\nUsage: .matrix <text>\nExample: .matrix Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/matrix-text-effect-154.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `💻 *Matrix Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Matrix Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};