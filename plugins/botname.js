import config from '../config.js';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env');

export default {
    command: 'setbotname',
    aliases: ['botname', 'changebotname'],
    category: 'owner',
    description: 'Change the bot name (instant update)',
    usage: '.setbotname New Bot Name Here',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(chatId, {
                text: `🤖 *Current Bot Name:* ${config.botName}\n\n📌 *Usage:* .setbotname Your New Bot Name`
            }, { quoted: message });
        }
        
        const newBotName = args.join(' ').trim();
        
        if (newBotName.length < 2) {
            return sock.sendMessage(chatId, { 
                text: '❌ Bot name must be at least 2 characters long!' 
            }, { quoted: message });
        }
        
        const oldBotName = config.botName;
        
        // Update runtime config
        config.botName = newBotName;
        
        // Also update any other places where botName might be stored
        if (global.botName) global.botName = newBotName;
        if (global.config) global.config.botName = newBotName;
        
        // Update .env file
        let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
        if (envContent.match(/^BOT_NAME=/m)) {
            envContent = envContent.replace(/^BOT_NAME=.*$/m, `BOT_NAME=${newBotName}`);
        } else {
            envContent += `\nBOT_NAME=${newBotName}\n`;
        }
        fs.writeFileSync(ENV_PATH, envContent);
        
        // Send success with current time to show it's instant
        const now = new Date().toLocaleTimeString();
        await sock.sendMessage(chatId, {
            text: `✅ *Bot Name Updated Instantly!*\n\n` +
                  `📛 *Old Name:* ${oldBotName}\n` +
                  `🆕 *New Name:* ${newBotName}\n` +
                  `⏰ *Updated at:* ${now}\n\n` +
                  `⚡ New name is now active for all commands!\n`
        }, { quoted: message });
    }
};