import config from '../config.js';
import commandHandler from '../lib/commandHandler.js';
import path from 'path';
import fs from 'fs';

function getGreeting() {
    const now = new Date();
    const nairobiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/kolkata' }));
    const currentHour = nairobiTime.getHours();
    if (currentHour >= 5 && currentHour < 12) return '🌅 Good morning';
    if (currentHour >= 12 && currentHour < 17) return '☀️ Good afternoon';
    if (currentHour >= 17 && currentHour < 20) return '🌆 Good evening';
    return '🌙 Good night';
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/kolkata'
    });
}

function getCurrentDate() {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/kolkata'
    });
}

function getRandomQuote() {
    const quotes = [
        "Dream big, work hard.",
        "Stay humble, hustle hard.",
        "Believe in yourself.",
        "Success is earned, not given.",
        "Actions speak louder than words.",
        "The best is yet to come."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

export default {
    command: 'menu',
    aliases: ['help', 'commands'],
    category: 'general',
    description: 'Show all commands',
    usage: '.menu [command]',
    async handler(sock, message, args, context) {
        const { chatId } = context;
        const prefix = config.prefixes[0];
        const imagePath = path.join(process.cwd(), 'assets/thumb.png');
        
        // If a command name is provided, show detailed info
        if (args.length) {
            const searchTerm = args[0].toLowerCase();
            let cmd = commandHandler.commands.get(searchTerm);
            if (!cmd && commandHandler.aliases.has(searchTerm)) {
                const mainCommand = commandHandler.aliases.get(searchTerm);
                cmd = commandHandler.commands.get(mainCommand);
            }
            
            if (!cmd) {
                return sock.sendMessage(chatId, {
                    text: `❌ Command "${args[0]}" not found.\n\nUse ${prefix}menu to see all commands.`
                }, { quoted: message });
            }
            
            const text = `╭━━━━━━━━━━━━━━⬣
┃ 📌 ${cmd.command.toUpperCase()}
┃
┃ ${cmd.description || 'No description'}
┃
┃ Usage: ${cmd.usage || prefix + cmd.command}
┃
╰━━━━━━━━━━━━━━⬣`;
            
            if (fs.existsSync(imagePath)) {
                return sock.sendMessage(chatId, {
                    image: { url: imagePath },
                    caption: text
                }, { quoted: message });
            }
            return sock.sendMessage(chatId, { text }, { quoted: message });
        }
        
        // Main menu
        const greeting = getGreeting();
        const currentTime = getCurrentTime();
        const currentDate = getCurrentDate();
        const randomQuote = getRandomQuote();
        
        let menuText = `${greeting}, ${message.pushName || 'User'}!\n\n`;
        menuText += `✨ "${randomQuote}" ✨\n\n`;
        
        menuText += `╭━━━ ⟮ ${config.botName} ⟯━━━━━━┈⊷\n`;
        menuText += `┃╭──────────────\n`;
        menuText += `┃│ Commander: ${message.pushName}\n`;
        menuText += `┃│ Plugins: ${commandHandler.commands.size}\n`;
        menuText += `┃│ Time: ${currentTime}\n`;
        menuText += `┃│ Date: ${currentDate}\n`;
        menuText += `┃│ Prefix: ${prefix}\n`;
        menuText += '┃│ Library: Baileys\n';
        menuText += `┃│ Version: ${config.version || "1.0.0"}\n`;
        menuText += '┃╰──────────────\n';
        menuText += '╰━━━━━━━━━━━━━━━━━━┈⊷\n\n';
        menuText += '━━━━━━━━━━━━━━━━━━━━\n';
        
        // Commands by category
        const categories = commandHandler.categories;
        const categoryEntries = categories instanceof Map ? [...categories.entries()] : Object.entries(categories);
        for (const [cat, cmds] of categoryEntries) {
            menuText += ` ╭─────「 ${cat.toUpperCase()} 」───┈⊷ \n`;
            for (const cmd of cmds) {
                menuText += ` ││◦➛  ${cmd}\n`;
            }
            menuText += ' ╰──────────────┈⊷ \n';
        }
        
        menuText += '\n━━━━━━━━━━━━━━━━━━━━\n';
        menuText += `💡 Tip: Use ${prefix}help <command> for details.`;
        
        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: { url: imagePath },
                caption: menuText
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
        }
    }
};