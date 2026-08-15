import mumaker from 'mumaker';

export default {
    command: 'hacker',
    aliases: ['hackertext'],
    category: 'ephoto',
    description: 'Create hacker style text effect',
    usage: '.hacker <text>',
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        const text = args.join(' ');

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '💻 *HACKER TEXT*\n\nUsage: .hacker <text>\nExample: .hacker Hello'
            }, { quoted: message });
        }

        try {
            const url = "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html";
            const result = await mumaker.ephoto(url, text);
            
            if (!result?.image) {
                throw new Error('No image URL received');
            }

            await sock.sendMessage(chatId, {
                image: { url: result.image },
                caption: `💻 *Hacker Text Effect*\n📝 Text: ${text}`
            }, { quoted: message });
        } catch (error) {
            console.error('Hacker Error:', error);
            await sock.sendMessage(chatId, {
                text: `❌ Failed: ${error.message}`
            }, { quoted: message });
        }
    }
};