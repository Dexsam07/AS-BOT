import config from '../config.js';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env');

export default {
    command: 'setowner',
    aliases: ['changeowner', 'botowner'],
    category: 'owner',
    description: 'Change the bot owner name',
    usage: '.setowner New Owner Name',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(chatId, {
                text: `👤 *Current Owner:* ${config.botOwner}\n\n📌 *Usage:* .setowner New Owner Name`
            }, { quoted: message });
        }
        
        const newOwner = args.join(' ').trim();
        const oldOwner = config.botOwner;
        
        config.botOwner = newOwner;
        
        let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
        if (envContent.match(/^BOT_OWNER=/m)) {
            envContent = envContent.replace(/^BOT_OWNER=.*$/m, `BOT_OWNER=${newOwner}`);
        } else {
            envContent += `\nBOT_OWNER=${newOwner}\n`;
        }
        fs.writeFileSync(ENV_PATH, envContent);
        
        await sock.sendMessage(chatId, {
            text: `✅ *Owner Updated*\n\nOld: ${oldOwner}\nNew: ${newOwner}`
        }, { quoted: message });
    }
};