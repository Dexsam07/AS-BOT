import config from '../config.js';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env');

export default {
    command: 'setpackname',
    aliases: ['packname', 'stickerpack'],
    category: 'owner',
    description: 'Change the sticker pack name',
    usage: '.setpackname My Sticker Pack',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(chatId, {
                text: `📦 *Current Pack Name:* ${config.packname}\n\n📌 *Usage:* .setpackname New Pack Name`
            }, { quoted: message });
        }
        
        const newPackname = args.join(' ').trim();
        const oldPackname = config.packname;
        
        config.packname = newPackname;
        
        let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
        if (envContent.match(/^PACKNAME=/m)) {
            envContent = envContent.replace(/^PACKNAME=.*$/m, `PACKNAME=${newPackname}`);
        } else {
            envContent += `\nPACKNAME=${newPackname}\n`;
        }
        fs.writeFileSync(ENV_PATH, envContent);
        
        await sock.sendMessage(chatId, {
            text: `✅ *Pack Name Updated*\n\nOld: ${oldPackname}\nNew: ${newPackname}`
        }, { quoted: message });
    }
};