const { amon, commands, fakevCard } = require("../amon");
const os = require('os');
const settings = require('../settings');
const { channelInfo } = require('../lib/messageConfig');
const axios = require('axios');
const moment = require('moment-timezone');
const { getPrefix } = require('../lib/prefix');
const { loadSettings } = require('../lib/settingsManager');
const fs = require('fs');
const path = require('path');

const toTinyCaps = (text) => {
    const tinyCapsMap = {
        a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
        j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
        s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
    };
    return text.toLowerCase().split('').map(c => tinyCapsMap[c] || c).join('');
};

function getCommandsFromArray() {
    const commandsList = [];
    
    if (commands && Array.isArray(commands)) {
        commands.forEach(cmd => {
            if (cmd && cmd.pattern) {
                commandsList.push({
                    name: cmd.pattern,
                    category: cmd.category || 'general',
                    aliases: cmd.alias || [],
                    description: cmd.desc || '',
                    pattern: cmd.pattern
                });
            }
        });
    }
    
    return commandsList;
}

function getCommandsByCategory() {
    const allCommands = getCommandsFromArray();
    const categories = {};
    
    allCommands.forEach(cmd => {
        const cat = cmd.category || 'general';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(cmd);
    });
    
    const sortedCategories = {};
    Object.keys(categories).sort().forEach(key => {
        sortedCategories[key] = categories[key];
    });
    
    return sortedCategories;
}

function getTotalCommandCount() {
    return getCommandsFromArray().length;
}

const fetchGitHubForks = async () => {
    try {
        const repo = 'AmonTech1/BENZO-MD';
        const response = await axios.get(`https://api.github.com/repos/${repo}`);
        return response.data.forks_count || 'ɴ/ᴀ';
    } catch (e) {
        return 'ɴ/ᴀ';
    }
};

function getCurrentPrefix() {
    try {
        const prefix = getPrefix();
        return prefix || '.';
    } catch (error) {
        return '.';
    }
}

function getCategoryEmoji(category) {
    const emojiMap = {
        'ai': '🤖', 'audio': '🎵', 'download': '📥', 'downloader': '📥',
        'fun': '🎮', 'game': '🎮', 'general': '⚡', 'group': '👥',
        'image': '🖼️', 'info': 'ℹ️', 'main': '🏠', 'maker': '🔧',
        'media': '🎨', 'menu': '📋', 'misc': '📦', 'moderation': '🛡️',
        'other': '📁', 'owner': '👑', 'search': '🔍', 'security': '🔒',
        'settings': '⚙️', 'sports': '⚽', 'stalk': '👀', 'sticker': '🎨',
        'support': '🆘', 'system': '💻', 'text': '📝', 'tools': '🛠️',
        'utility': '🛠️', 'whatsapp': '📱', 'admin': '👑', 'anime': '🌸'
    };
    return emojiMap[category.toLowerCase()] || '📌';
}

// Function to split long message
function splitLongMessage(text, maxLength = 30000) {
    if (text.length <= maxLength) return [text];
    
    const parts = [];
    let currentPart = "";
    const lines = text.split('\n');
    
    for (const line of lines) {
        if ((currentPart + line + '\n').length > maxLength) {
            parts.push(currentPart);
            currentPart = line + '\n';
        } else {
            currentPart += line + '\n';
        }
    }
    
    if (currentPart) parts.push(currentPart);
    return parts;
}

amon({
    pattern: "menu2",
    alias: ["allmenu", "fullmenu", "commands"],
    desc: "Show all commands in one message (categorized)",
    category: "general",
    react: "📚",
    use: ".menu2",
    filename: __filename,
}, async (amon, mek, m, { from, reply, prefix, sender }) => {
    try {
        const currentSettings = loadSettings();
        const totalCommands = getTotalCommandCount();
        const categories = getCommandsByCategory();
        
        const timezone = currentSettings.timezone || settings.timezone || 'Africa/Nairobi';
        const time = moment().tz(timezone).format('HH:mm:ss');
        const date = moment().tz(timezone).format('DD/MM/YYYY');
        const forks = await fetchGitHubForks();
        const currentPrefix = getCurrentPrefix();
        
        // Get current mode
        let currentMode = 'PUBLIC';
        try {
            const modePath = path.join(__dirname, '../data', 'mode.json');
            if (fs.existsSync(modePath)) {
                const modeData = JSON.parse(fs.readFileSync(modePath, 'utf8'));
                currentMode = modeData.mode?.toUpperCase() || 'PUBLIC';
            }
        } catch(e) {}
        
        // Build complete menu with all categories (same style as menu1)
        let menuText = `╭─❍ *${toTinyCaps(currentSettings.botName || 'BENZO-MD')}*\n`;
        menuText += `│\n`;
        menuText += `├─👤 *Owner:* ${toTinyCaps(currentSettings.botOwner || 'MR amon')}\n`;
        menuText += `├─⏰ *Time:* ${time}\n`;
        menuText += `├─📅 *Date:* ${date}\n`;
        menuText += `├─🌍 *Mode:* ${currentMode}\n`;
        menuText += `├─✒️ *Prefix:* ${currentPrefix}\n`;
        menuText += `├─🧩 *Commands:* ${totalCommands}+\n`;
        menuText += `├─🚀 *Version:* 2.1.1\n`;
        menuText += `├─👥 *Forks:* ${forks}\n`;
        menuText += `├─✍️ *Author:* ${toTinyCaps(currentSettings.author || 'MR amon')}\n`;
        menuText += `│\n`;
        
        // Add each category with its commands (ALL of them, no number replies)
        for (const [category, cmds] of Object.entries(categories)) {
            const emoji = getCategoryEmoji(category);
            menuText += `├─❍ *${emoji} ${category.toUpperCase()}*\n`;
            menuText += `│\n`;
            
            for (const cmd of cmds) {
                menuText += `│  ✦ ${currentPrefix}${cmd.name}\n`;
            }
            menuText += `│\n`;
        }
        
        menuText += `╰───────────────────◂\n\n`;
        menuText += `💡 *Usage:* ${currentPrefix}command\n`;
        menuText += `> Powered by BENZO MD MD`;
        
        // Split if too long
        const menuParts = splitLongMessage(menuText);
        
        // Get menu image
        const imageUrl = currentSettings.imageUrl || currentSettings.MENU_IMAGE_URL;
        
        // Send exactly like menu1 - with image and quoting mek
        if (imageUrl) {
            try {
                if (menuParts.length > 0) {
                    await amon.sendMessage(from, {
                        image: { url: imageUrl },
                        caption: menuParts[0],
                    }, { quoted: mek });
                    
                    // Send remaining parts as text
                    for (let i = 1; i < menuParts.length; i++) {
                        const partHeader = i === 1 ? `📄 *Continued...*\n\n` : `📄 *Part ${i + 1}/${menuParts.length}*\n\n`;
                        await amon.sendMessage(from, { 
                            text: partHeader + menuParts[i],
                        }, { quoted: mek });
                    }
                }
            } catch (imageError) {
                // Fallback to text
                for (let i = 0; i < menuParts.length; i++) {
                    if (menuParts.length > 1) {
                        const partHeader = `📄 *Part ${i + 1}/${menuParts.length}*\n\n`;
                        await reply(partHeader + menuParts[i]);
                    } else {
                        await reply(menuParts[i]);
                    }
                }
            }
        } else {
            // No image
            for (let i = 0; i < menuParts.length; i++) {
                if (menuParts.length > 1) {
                    const partHeader = `📄 *Part ${i + 1}/${menuParts.length}*\n\n`;
                    await reply(partHeader + menuParts[i]);
                } else {
                    await reply(menuParts[i]);
                }
            }
        }
        
        // Add reaction
        await amon.sendMessage(from, { react: { text: "✅", key: mek.key } });
        
        console.log(`📊 Menu2 sent to ${sender.split('@')[0]} - ${totalCommands} commands in ${Object.keys(categories).length} categories`);
        
    } catch (error) {
        console.error('Menu2 error:', error);
        await reply(`❌ Failed to load full menu: ${error.message}`);
    }
});