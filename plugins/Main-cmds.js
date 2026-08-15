const { bandah, commands } = require("../command");
const config = require("../config");
const moment = require("moment-timezone");
const os = require("os");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require('crypto');
const { exec } = require("child_process");
const { runtime } = require('../lib/functions');

// ============================================================
// PERSISTENT UPTIME TRACKING - NEVER RESETS
// ============================================================
const START_FILE = path.join(__dirname, "../data/start-time.json");
let botStartTime;

try {
    if (fs.existsSync(START_FILE)) {
        const data = JSON.parse(fs.readFileSync(START_FILE, "utf8"));
        botStartTime = data.startTime || Date.now();
    } else {
        botStartTime = Date.now();
        fs.mkdirSync(path.dirname(START_FILE), { recursive: true });
        fs.writeFileSync(
            START_FILE,
            JSON.stringify({ startTime: botStartTime }, null, 2)
        );
    }
} catch (e) {
    botStartTime = Date.now();
}

// Save uptime before any restart
function saveUptime() {
    try {
        fs.writeFileSync(
            START_FILE,
            JSON.stringify({ startTime: botStartTime }, null, 2)
        );
    } catch (e) {}
}

// ============================================================
// CONSTANTS
// ============================================================
const ALIVE_IMG = "https://ik.imagekit.io/shaban/SHABAN-1784205527063_Zze7YpdxH.jpeg";
const OWNER_PATH = path.join(__dirname, "../assets/sudo.json");
const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

// ============================================================
// COMMAND EMOJIS - UNIQUE EMOJI FOR EACH COMMAND
// ============================================================
const commandEmojis = {
    'alive': '🕋',
    'alive2': '⚡',
    'ping': '🏓',
    'up': '⏱️',
    'uptime': '⏱️',
    'menu': '📋',
    'allmenu': '📚',
    'repo': '📂',
    'tutorial': '📘',
    'gpass': '🔐',
    'owner': '👑',
    'list': '📃',
    'update': '🔄',
    'restart': '🔄',
    'toolsmenu': '🛠️',
    'mainmenu': '🏠',
    'bugmenu': '🐛',
    'downloadmenu': '📥',
    'randommenu': '🎲',
    'funmenu': '🎉',
    'ownermenu': '👑',
    'groupmenu': '👥',
    'searchmenu': '🔍',
    'convertermenu': '🔄',
    'islamicmenu': '🕌',
    'aimenu': '🤖'
};

function getCommandEmoji(pattern) {
    if (!pattern) return '⬡';
    const cmd = pattern.split(' ')[0].toLowerCase();
    return commandEmojis[cmd] || '⬡';
}

// ============================================================
// FONT SYSTEM
// ============================================================
let fontCounter = 0;
const fontStyles = ['bold', 'monospace', 'italic', 'bold-italic'];
const fontMaps = {
    'bold': {
        a: '𝗮', b: '𝗯', c: '𝗰', d: '𝗱', e: '𝗲', f: '𝗳', g: '𝗴', h: '𝗵', i: '𝗶', j: '𝗷', k: '𝗸', l: '𝗹',
        m: '𝗺', n: '𝗻', o: '𝗼', p: '𝗽', q: '𝗾', r: '𝗿', s: '𝘀', t: '𝘁', u: '𝘂', v: '𝘃', w: '𝘄', x: '𝘅',
        y: '𝘆', z: '𝘇', A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚', H: '𝗛', I: '𝗜', J: '𝗝',
        K: '𝗞', L: '𝗟', M: '𝗠', N: '𝗡', O: '𝗢', P: '𝗣', Q: '𝗤', R: '𝗥', S: '𝗦', T: '𝗧', U: '𝗨', V: '𝗩',
        W: '𝗪', X: '𝗫', Y: '𝗬', Z: '𝗭', "1": "𝟭", "2": "𝟮", "3": "𝟯", "4": "𝟰", "5": "𝟱", "6": "𝟲", "7": "𝟳", 
        "8": "𝟴", "9": "𝟵", "0": "𝟬"
    },
    'monospace': {
        a: '𝚊', b: '𝚋', c: '𝚌', d: '𝚍', e: '𝚎', f: '𝚏', g: '𝚐', h: '𝚑', i: '𝚒', j: '𝚓', k: '𝚔', l: '𝚕',
        m: '𝚖', n: '𝚗', o: '𝚘', p: '𝚙', q: '𝚚', r: '𝚛', s: '𝚜', t: '𝚝', u: '𝚞', v: '𝚟', w: '𝚠', x: '𝚡',
        y: '𝚢', z: '𝚣', A: '𝙰', B: '𝙱', C: '𝙲', D: '𝙳', E: '𝙴', F: '𝙵', G: '𝙶', H: '𝙷', I: '𝙸', J: '𝙹',
        K: '𝙺', L: '𝙻', M: '𝙼', N: '𝙽', O: '𝙾', P: '𝙿', Q: '𝚀', R: '𝚁', S: '𝚂', T: '𝚃', U: '𝚄', V: '𝚅',
        W: '𝚆', X: '𝚇', Y: '𝚈', Z: '𝚉', "1": "𝟷", "2": "𝟸", "3": "𝟹", "4": "𝟺", "5": "𝟻", "6": "𝟼", "7": "𝟽", 
        "8": "𝟾", "9": "𝟿", "0": "𝟶"
    },
    'italic': {
        a: '𝘢', b: '𝘣', c: '𝘤', d: '𝘥', e: '𝘦', f: '𝘧', g: '𝘨', h: '𝘩', i: '𝘪', j: '𝘫', k: '𝘬', l: '𝘭',
        m: '𝘮', n: '𝘯', o: '𝘰', p: '𝘱', q: '𝘲', r: '𝘳', s: '𝘴', t: '𝘵', u: '𝘶', v: '𝘷', w: '𝘸', x: '𝘹',
        y: '𝘺', z: '𝘻', A: '𝘈', B: '𝘉', C: '𝘊', D: '𝘋', E: '𝘌', F: '𝘍', G: '𝘎', H: '𝘏', I: '𝘐', J: '𝘑',
        K: '𝘒', L: '𝘓', M: '𝘔', N: '𝘕', O: '𝘖', P: '𝘗', Q: '𝘘', R: '𝘙', S: '𝘚', T: '𝘛', U: '𝘜', V: '𝘝',
        W: '𝘞', X: '𝘟', Y: '𝘠', Z: '𝘡'
    },
    'bold-italic': {
        a: '𝙖', b: '𝙗', c: '𝙘', d: '𝙙', e: '𝙚', f: '𝙛', g: '𝙜', h: '𝙝', i: '𝙞', j: '𝙟', k: '𝙠', l: '𝙡',
        m: '𝙢', n: '𝙣', o: '𝙤', p: '𝙥', q: '𝙦', r: '𝙧', s: '𝙨', t: '𝙩', u: '𝙪', v: '𝙫', w: '𝙬', x: '𝙭',
        y: '𝙮', z: '𝙯', A: '𝘼', B: '𝘽', C: '𝘾', D: '𝘿', E: '𝙀', F: '𝙁', G: '𝙂', H: '𝙃', I: '𝙄', J: '𝙅',
        K: '𝙆', L: '𝙇', M: '𝙈', N: '𝙉', O: '𝙊', P: '𝙋', Q: '𝙌', R: '𝙍', S: '𝙎', T: '𝙏', U: '𝙐', V: '𝙑',
        W: '𝙒', X: '𝙓', Y: '𝙔', Z: '𝙕'
    }
};

function getNextFont() {
    const font = fontStyles[fontCounter % fontStyles.length];
    fontCounter++;
    return font;
}

function convertText(txt, fontStyle) {
    if (!txt || typeof txt !== 'string') return '';
    const map = fontMaps[fontStyle] || fontMaps.bold;
    return txt.split('').map(c => map[c] || c).join('');
}

function fancy(txt) {
    const currentFont = fontStyles[(fontCounter - 1) % fontStyles.length];
    return convertText(txt, currentFont);
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function getLiveUptime() {
    const runtimeMs = Date.now() - botStartTime;
    const days = Math.floor(runtimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((runtimeMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((runtimeMs / (1000 * 60)) % 60);
    const seconds = Math.floor((runtimeMs / 1000) % 60);
    return { days, hours, minutes, seconds, runtimeMs };
}

function getPakistanTime() {
    return moment().tz("Asia/Karachi");
}

function formatUptime() {
    const { days, hours, minutes, seconds } = getLiveUptime();
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function formatDate() {
    return getPakistanTime().format("DD MMM YYYY");
}

function formatTime() {
    return getPakistanTime().format("hh:mm:ss A");
}

function getCommandDisplay(commandPattern) {
    if (!commandPattern) return '';
    if (config.PREFIX === 'null') {
        return commandPattern;
    }
    return `${config.PREFIX}${commandPattern}`;
}

async function getBotVersion() {
    try {
        if (!config.REPO) return 'SuperSonic';
        const repoUrl = config.REPO;
        const rawUrl = repoUrl.replace('github.com', 'raw.githubusercontent.com') + '/main/package.json';
        const { data } = await axios.get(rawUrl);
        return data.version || 'SuperSonic';
    } catch (error) {
        console.error("Version check error:", error);
        return 'SuperSonic';
    }
}

function createDJObject(m, customName = null) {
    return {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            remoteJid: 'status@broadcast'
        },
        message: {
            contactMessage: {
                displayName: customName || config.BOT_NAME,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${config.BOT_NAME};;;\nFN:${config.BOT_NAME}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:AS-BOT\nEND:VCARD`
            }
        }
    };
}

function generateCategorySection(categoryName, commandsList) {
    if (!commandsList || !commandsList.length) return '';
    const currentFont = fontStyles[(fontCounter - 1) % fontStyles.length];
    let section = `*💙 ${convertText(categoryName.toUpperCase(), currentFont)} 💚*\n\n╭─────────────···◈\n`;
    commandsList.forEach(cmd => {
        if (cmd.pattern) {
            const commandDisplay = getCommandDisplay(cmd.pattern);
            const emoji = getCommandEmoji(cmd.pattern);
            section += `*┋* *${emoji} ${convertText(commandDisplay, currentFont)}*\n`;
        }
    });
    section += `╰─────────────╶╶···◈\n\n`;
    return section;
}

// ============================================================
// ALIVE COMMAND - WITH LIVE UPTIME
// ============================================================
bandah({
    pattern: "alive",
    alias: ["live"],
    desc: "Alive status with live uptime",
    category: "main",
    react: "🕋",
    filename: __filename
}, async (conn, mek, m, { from }) => {
    try {
        const uptime = formatUptime();
        const date = formatDate();
        const time = formatTime();
        const audioUrl = "https://bandaheali-cdn.koyeb.app/bandaheali/alive.mp3";
        const thumbUrl = ALIVE_IMG;

        await conn.sendMessage(
            from,
            {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                ptt: false,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363406449026172@newsletter",
                        newsletterName: 'DEX SHYAM TECH',
                        serverMessageId: 143
                    },
                    externalAdReply: {
                        title: "🕋 AS-BOT IS ONLINE",
                        body: `⚡ ${uptime}`,
                        mediaType: 1,
                        thumbnailUrl: thumbUrl,
                        sourceUrl: "https://github.com/naveedahmed35581-arch/NAVEED-MD",
                        showAdAttribution: true,
                        renderLargerThumbnail: true
                    }
                }
            },
            { quoted: mek }
        );

    } catch (err) {
        console.error("❌ Alive cmd error:", err);
    }
});

// ============================================================
// PING COMMAND - REAL SPEED + LIVE UPTIME
// ============================================================
bandah({
    pattern: "ping",
    alias: ["speed", "pong"],
    use: '.ping',
    desc: "Check bot's real response time",
    category: "main",
    react: "🏓",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        // Real response time measurement
        const start = Date.now();
        
        // Send initial reaction
        try {
            await conn.sendMessage(from, {
                react: { text: "⏳", key: mek.key }
            });
        } catch (_) {}

        // Calculate real response time
        const end = Date.now();
        const responseTime = end - start;

        // Live uptime
        const uptime = formatUptime();
        const date = formatDate();
        const time = formatTime();

        // Memory usage
        const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(2);

        // Stylish text response
        const text = `
╔══════════════════════════╗
║    🏓 PING / SPEED      ║
║    ══════════════════   ║
║                          ║
║    📡 Response: ${responseTime}ms
║    🕐 Uptime: ${uptime}
║    📅 Date: ${date}
║    ⏰ Time: ${time}
║    💾 RAM: ${memoryUsed}MB/${totalMemory}MB
║    🟢 Status: ONLINE
║                          ║
║    📢 Join Our Channel   ║
║    https://whatsapp.com/ ║
║    channel/0029VbBgXTsK ║
║    wqSKZKy38w2o          ║
║                          ║
║    > POWERED BY AS-BOT║
╚══════════════════════════╝`;

        // Send response
        await conn.sendMessage(from, {
            text: text,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406449026172@newsletter',
                    newsletterName: 'DEX SHYAM TECH',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        // Final reaction
        try {
            const reactionEmojis = ['🔥', '⚡', '🚀', '💨'];
            const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
            await conn.sendMessage(from, {
                react: { text: reactionEmoji, key: mek.key }
            });
        } catch (_) {}

    } catch (e) {
        console.error("❌ Ping command error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================================
// UPTIME COMMAND - LIVE DETAILED UPTIME
// ============================================================
bandah({
    pattern: "up",
    alias: ["uptime"],
    use: ".up",
    desc: "Show bot live uptime",
    category: "system",
    react: "⏱️",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        try { await m.react("⏳"); } catch (_) {}
        
        const { days, hours, minutes, seconds } = getLiveUptime();
        const date = formatDate();
        const time = formatTime();

        const uptimeMsg = `🤖 *AS-BOT*
━━━━━━━━━━━━━━━
⚡ *LIVE UPTIME INFO*

📅 Days : ${days}
🕐 Hours : ${hours}
⏰ Minutes : ${minutes}
⏱️ Seconds : ${seconds}

📅 Date : ${date}
⏰ Time : ${time}

🟢 STATUS: ONLINE
━━━━━━━━━━━━━━━
> POWERED BY AS-BOT`;

        await conn.sendMessage(m.chat, {
            image: { url: ALIVE_IMG },
            caption: uptimeMsg,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406449026172@newsletter',
                    newsletterName: 'DEX SHYAM TECH',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        try { await m.react("✅"); } catch (_) {}

    } catch (e) {
        console.error("❌ UP command error:", e);
        await reply("❌ *AS-BOT*: Uptime information temporarily unavailable.");
    }
});

// ============================================================
// MAIN MENU COMMAND - FULLY STYLISH WITH AUDIO
// ============================================================
bandah({
    pattern: "menu",
    desc: "AS-BOT stylish menu with audio",
    alias: ["help", "commands"],
    category: "main",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);

        const currentFont = getNextFont();
        const version = await getBotVersion();
        const totalCommands = commands.filter(bandah => bandah.pattern).length;
        const ownername = config.OWNER_NAME;
        const uptime = formatUptime();
        const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(2);
        const audioUrl = "https://bandaheali-cdn.koyeb.app/bandaheali/alive.mp3";

        const ai = {
            key: {
                remoteJid: "status@broadcast",
                fromMe: false,
                participant: "13135550002@s.whatsapp.net"
            },
            message: {
                contactMessage: {
                    displayName: "AS-BOT",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Meta AI\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 3135550002\nEND:VCARD`
                }
            }
        };

        const validCommands = commands.filter(bandah => 
            bandah.pattern && 
            bandah.category && 
            bandah.category.toLowerCase() !== 'menu' &&
            !bandah.hideCommand
        );

        const categories = {};
        validCommands.forEach(bandah => {
            const category = bandah.category.toLowerCase();
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(bandah);
        });

        let menuSections = '';
        Object.entries(categories)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([category, cmds]) => {
                let section = `*💙 ${convertText(category.toUpperCase(), currentFont)} 💚*\n\n╭─────────────···◈\n`;
                cmds.forEach(cmd => {
                    if (cmd.pattern) {
                        const commandDisplay = getCommandDisplay(cmd.pattern);
                        const emoji = getCommandEmoji(cmd.pattern);
                        section += `*┋* *${emoji} ${convertText(commandDisplay, currentFont)}*\n`;
                    }
                });
                section += `╰─────────────╶╶···◈\n\n`;
                menuSections += section;
            });

        let dec = `
╔══════════════════════════════════╗
║    ${convertText(config.BOT_NAME, currentFont)}    ║
║    ══════════════════════════   ║
║                                  ║
║    👑 Owner: ${ownername} (🇵🇰)  ║
║    ⚙️ Mode: ${config.MODE}       ║
║    📌 Prefix: ${config.PREFIX}   ║
║    💾 RAM: ${memoryUsed}MB/${totalMemory}MB ║
║    📦 Version: ${version}        ║
║    🕐 Uptime: ${uptime}          ║
║    📊 Commands: ${totalCommands} ║
║                                  ║
║    > ${convertText('AS-BOT - THE BEST', currentFont)} ║
║                                  ║
╚══════════════════════════════════╝

${readMore}

${menuSections}

╔══════════════════════════════════╗
║    📌 Use ${config.PREFIX}menu for full menu ║
║    🎨 Font: ${currentFont.toUpperCase()}     ║
║    > POWERED BY AS-BOT       ║
╚══════════════════════════════════╝
`;

        // Send menu with image
        await conn.sendMessage(
            from,
            {
                image: { url: ALIVE_IMG },
                caption: dec,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363406449026172@newsletter',
                        newsletterName: convertText('DEX SHYAM TECH', currentFont),
                        serverMessageId: 143
                    }
                }
            },
            { quoted: ai }
        );

        // Send audio (same as alive)
        await conn.sendMessage(
            from,
            {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363406449026172@newsletter',
                        newsletterName: convertText('DEX SHYAM TECH', currentFont),
                        serverMessageId: 143
                    }
                }
            },
            { quoted: ai }
        );

        await conn.sendPresenceUpdate('paused', from);
        
    } catch (e) {
        console.error('Menu Error:', e);
        reply(`❌ Error generating menu: ${e.message}`);
    }
});

// ============================================================
// ALLMENU COMMAND - STYLISH WITH 4 COMMANDS PER SECTION
// ============================================================
bandah({
    pattern: "allmenu",
    react: "📚",
    alias: ["allcommands", "fullmenu", "cmdlist"],
    desc: "Get complete stylish command list",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);

        const currentFont = getNextFont();
        const version = await getBotVersion();
        const ownername = config.OWNER_NAME || "AS-BOT";
        const uptime = formatUptime();
        const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(2);
        const totalCommands = commands.filter(bandah => bandah.pattern).length;

        // Get category filter if provided
        const filterCategory = args[0] ? args[0].toLowerCase() : null;

        // Filter valid commands
        const validCommands = commands.filter(bandah => 
            bandah.pattern && 
            bandah.category && 
            !bandah.hideCommand
        );

        // Group by category
        const categories = {};
        validCommands.forEach(bandah => {
            const category = bandah.category.toLowerCase();
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(bandah);
        });

        // If specific category requested
        if (filterCategory && categories[filterCategory]) {
            const cmds = categories[filterCategory];
            let menu = `
╔══════════════════════════════════════════╗
║    📚 ${convertText(filterCategory.toUpperCase(), currentFont)}    ║
║    ═══════════════════════════════════   ║
║                                          ║
║    👑 Owner: ${ownername}               ║
║    📌 Prefix: ${config.PREFIX}           ║
║    📊 Commands: ${cmds.length}           ║
║    🕐 Uptime: ${uptime}                  ║
║                                          ║
╚══════════════════════════════════════════╝

${readMore}

`;

            // Display commands in 4 per section
            const chunkSize = 4;
            for (let i = 0; i < cmds.length; i += chunkSize) {
                const chunk = cmds.slice(i, i + chunkSize);
                
                menu += `┌─────────────────────────────────┐\n`;
                menu += `│  ❖ ${convertText('COMMANDS', currentFont)} ${i + 1}-${Math.min(i + chunkSize, cmds.length)}  ❖\n`;
                menu += `├─────────────────────────────────┤\n`;
                
                chunk.forEach(cmd => {
                    const commandDisplay = getCommandDisplay(cmd.pattern);
                    const emoji = getCommandEmoji(cmd.pattern);
                    const desc = cmd.desc || '';
                    menu += `│  ${emoji} ${convertText(commandDisplay, currentFont)}\n`;
                    if (desc) {
                        const descShort = desc.length > 35 ? desc.substring(0, 32) + '...' : desc;
                        menu += `│     ${descShort}\n`;
                    }
                });
                
                menu += `└─────────────────────────────────┘\n\n`;
            }

            menu += `
╔══════════════════════════════════════════╗
║    📌 Use ${config.PREFIX}allmenu for full list ║
║    > POWERED BY AS-BOT               ║
╚══════════════════════════════════════════╝
`;

            await conn.sendMessage(from, {
                image: { url: ALIVE_IMG },
                caption: menu,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363406449026172@newsletter',
                        newsletterName: 'DEX SHYAM TECH',
                        serverMessageId: 143
                    }
                }
            }, { quoted: mek });

            await conn.sendPresenceUpdate('paused', from);
            return;
        }

        // Build full menu with categories - 4 commands per section
        let fullMenu = `
╔══════════════════════════════════════════╗
║    📚 ${convertText('AS-BOT COMMANDS', currentFont)}    ║
║    ═══════════════════════════════════   ║
║                                          ║
║    👑 Owner: ${ownername}               ║
║    ⚙️ Mode: ${config.MODE}               ║
║    📌 Prefix: ${config.PREFIX}           ║
║    💾 RAM: ${memoryUsed}MB/${totalMemory}MB ║
║    📦 Version: ${version}                ║
║    🕐 Uptime: ${uptime}                  ║
║    📊 Total: ${totalCommands}            ║
║                                          ║
╚══════════════════════════════════════════╝

${readMore}

`;

        // Add each category with commands in 4 per section
        const sortedCategories = Object.keys(categories).sort();
        for (const category of sortedCategories) {
            const cmds = categories[category];
            const catFont = getNextFont();
            
            // Category header
            fullMenu += `╔══════════════════════════════════════════╗\n`;
            fullMenu += `║    💠 ${convertText(category.toUpperCase(), catFont)} 💠    ║\n`;
            fullMenu += `║    📊 ${cmds.length} commands             ║\n`;
            fullMenu += `╚══════════════════════════════════════════╝\n\n`;
            
            // Display commands in groups of 4
            const chunkSize = 4;
            for (let i = 0; i < cmds.length; i += chunkSize) {
                const chunk = cmds.slice(i, i + chunkSize);
                
                fullMenu += `┌─────────────────────────────────┐\n`;
                fullMenu += `│  ❖ ${convertText('COMMANDS', catFont)} ${i + 1}-${Math.min(i + chunkSize, cmds.length)}  ❖\n`;
                fullMenu += `├─────────────────────────────────┤\n`;
                
                chunk.forEach(cmd => {
                    if (cmd.pattern) {
                        const commandDisplay = getCommandDisplay(cmd.pattern);
                        const emoji = getCommandEmoji(cmd.pattern);
                        const desc = cmd.desc || '';
                        fullMenu += `│  ${emoji} ${convertText(commandDisplay, catFont)}\n`;
                        if (desc) {
                            const descShort = desc.length > 35 ? desc.substring(0, 32) + '...' : desc;
                            fullMenu += `│     ${descShort}\n`;
                        }
                    }
                });
                
                fullMenu += `└─────────────────────────────────┘\n\n`;
            }
            
            // Add separator between categories
            fullMenu += `═══════════════════════════════════════════\n\n`;
        }

        // Footer
        fullMenu += `
╔══════════════════════════════════════════╗
║    📌 ${convertText('Use .allmenu [category]', currentFont)} ║
║    ${convertText('Example: .allmenu main', currentFont)}      ║
║    > POWERED BY AS-BOT               ║
╚══════════════════════════════════════════╝
`;

        // Send the menu
        await conn.sendMessage(from, {
            image: { url: ALIVE_IMG },
            caption: fullMenu,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406449026172@newsletter',
                    newsletterName: 'DEX SHYAM TECH',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendPresenceUpdate('paused', from);

    } catch (e) {
        console.error('AllMenu Error:', e);
        reply(`❌ Error generating allmenu: ${e.message}`);
    }
});

// ============================================================
// ALIVE2 COMMAND - WITH AUDIO
// ============================================================
bandah({
    pattern: "alive2",
    alias: ["status2", "online2"],
    desc: "Check bot is alive or not",
    category: "main",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const voiceClips = [
            "https://cdn.ironman.my.id/i/7p5plg.mp4",
            "https://cdn.ironman.my.id/i/l4dyvg.mp4",
            "https://cdn.ironman.my.id/i/4z93dg.mp4",
            "https://cdn.ironman.my.id/i/m9gwk0.mp4",
            "https://cdn.ironman.my.id/i/gr1jjc.mp4",
            "https://cdn.ironman.my.id/i/lbr8of.mp4",
            "https://cdn.ironman.my.id/i/0z95mz.mp4",
            "https://cdn.ironman.my.id/i/rldpwy.mp4",
            "https://cdn.ironman.my.id/i/lz2z87.mp4",
            "https://cdn.ironman.my.id/i/gg5jct.mp4",
            "https://cdn.ironman.my.id/i/0gup65.mp4",
            "https://cdn.ironman.my.id/i/8mrocq.mp4",
            "https://cdn.ironman.my.id/i/xf29k2.mp4",
            "https://cdn.ironman.my.id/i/aof4z4.mp4",
            "https://cdn.ironman.my.id/i/1ulm61.mp4",
            "https://cdn.ironman.my.id/i/88x93o.mp4",
            "https://files.catbox.moe/bat4dt.mp3",
            "https://files.catbox.moe/nugg7o.mp3",
            "https://files.catbox.moe/fcqzmk.mp3",
            "https://files.catbox.moe/tqzlfl.mp3",
            "https://files.catbox.moe/w94n86.mp3",
            "https://files.catbox.moe/cuk967.mp3",
            "https://files.catbox.moe/7ajubx.mp3",
            "https://files.catbox.moe/2fi10f.mp3",
            "https://files.catbox.moe/78isfb.mp3",
            "https://files.catbox.moe/lcrt4a.mp3"
        ];
        const rClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];

        const thumbnailRes = await axios.get(ALIVE_IMG, {
            responseType: 'arraybuffer'
        });
        const thumbnailBuffer = Buffer.from(thumbnailRes.data, 'binary');

        await conn.sendMessage(from, {
            audio: { url: rClip },
            mimetype: 'audio/mp4',
            ptt: false,
            waveform: [99, 0, 99, 0, 99],
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: `${config.BOT_NAME} IS ONLINE`,
                    body: `${config.DESCRIPTION}`,
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    thumbnail: thumbnailBuffer,
                    mediaUrl: ALIVE_IMG,
                    sourceUrl: "https://wa.me/message/TEWHI2YV6JZKI1",
                    showAdAttribution: true
                },
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363406449026172@newsletter",
                    newsletterName: 'DEX SHYAM TECH',
                    serverMessageId: 143
                }
            }
        }, { quoted: createDJObject(m, "AS-BOT") });

    } catch (e) {
        console.error("Alive Error:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ============================================================
// REPO COMMAND
// ============================================================
bandah({
    pattern: "repo",
    alias: ["sc", "script"],
    desc: "Fetch repository information",
    react: "📂",
    category: "main",
    filename: __filename,
}, async (conn, mek, m, { from, reply }) => {
    const githubRepoURL = 'https://github.com/naveedahmed35581-arch/NAVEED-MD';

    try {
        const match = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) {
            return reply("❌ Invalid GitHub repository URL.");
        }

        const [, username, repoName] = match;

        const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}`);
        const repoData = response.data;

        const formattedInfo = `\`\`\`🛠️ REPOSITORY INFORMATION

📁 BOT NAME: ${repoData.name}
👤 OWNER NAME: ${repoData.owner.login}
⭐ STARS: ${repoData.stargazers_count}
💚 FORKS: ${repoData.forks_count}
🌐 GITHUB LINK: ${repoData.html_url}
📝 DESCRIPTION: ${repoData.description || 'No description provided'}

✨ DON'T FORGET TO STAR AND FORK THE REPOSITORY!

© POWERED BY AS-BOT\`\`\``;

        await conn.sendMessage(from, {
            image: { url: ALIVE_IMG },
            caption: formattedInfo,
            contextInfo: { 
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406449026172@newsletter',
                    newsletterName: 'DEX SHYAM TECH',
                    serverMessageId: 143
                }
            }
        }, { quoted: createDJObject(m) });

    } catch (error) {
        console.error("Error in repo command:", error);
        reply(`❌ Repo cmd error: ${error.message}`);
    }
});

// ============================================================
// TUTORIAL COMMAND
// ============================================================
bandah({
    pattern: "tutorial",
    alias: ["deploy", "naveeddeploy", "howtodeploy"],
    desc: "Complete AS-BOT deployment tutorial",
    category: "main",
    react: "📘",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const caption = `\`\`\`📘 AS-BOT DEPLOYMENT TUTORIAL

Follow these steps to deploy AS-BOT properly 👇

1️⃣ WATCH VIDEO TUTORIAL  
🎥 https://youtu.be/d50-E6D9VK4?si=9rm8r1BW3NUMBj6l

2️⃣ FORK THE REPO  
🔗 https://github.com/naveedahmed35581-arch/NAVEED-MD/fork

3️⃣ GET YOUR SESSION (PAIR CODE)  
💠 https://classique-moliere-78387-3aadd828798e.herokuapp.com/

4️⃣ DEPLOY THE BOT ON VPS  
🖥️ https://vps.bandaheali.site

⚡ After following these steps, your AS-BOT Bot will be fully ready and online.

POWERED BY AS-BOT SYSTEM ⚙️
\`\`\``;

        await conn.sendMessage(
            from,
            {
                image: { url: ALIVE_IMG },
                caption,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363406449026172@newsletter",
                        newsletterName: 'DEX SHYAM TECH',
                        serverMessageId: 144
                    }
                }
            },
            { quoted: createDJObject(m) }
        );

    } catch (err) {
        await reply(`\`\`\`❌ Tutorial cmd error: ${err.message}\`\`\``);
    }
});

// ============================================================
// PASSWORD GENERATOR
// ============================================================
bandah({
    pattern: "gpass",
    desc: "Generate a strong password",
    category: "main",
    react: "🔐",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const length = args[0] ? parseInt(args[0]) : 12;
        if (isNaN(length) || length < 8) {
            return reply('Please provide a valid length for the password (Minimum 08 Characters).');
        }

        const generatePassword = (len) => {
            const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
            let password = '';
            for (let i = 0; i < len; i++) {
                const randomIndex = crypto.randomInt(0, charset.length);
                password += charset[randomIndex];
            }
            return password;
        };

        const password = generatePassword(length);
        const message = `🔐 *Your Strong Password* 🔐\n\nPlease find your generated password below`;

        await conn.sendMessage(from, { text: message }, { quoted: mek });
        await conn.sendMessage(from, { text: password }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`❌ Error generating password: ${e.message}`);
    }
});

// ============================================================
// OWNER COMMAND
// ============================================================
bandah({
    pattern: "owner",
    react: "👑", 
    desc: "Get owner number",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const ownerNumber = '+917384287404';
        const ownerNumber2 = '+917384287404';
        const ownerName = 'Shyam Chaudhari';

        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${ownerName}\n` +  
                      `TEL;type=CELL;type=VOICE;waid=${ownerNumber.replace(/\s+/g, '').replace('+', '')}:${ownerNumber}\n` + 
                      `TEL;type=CELL;type=VOICE;waid=${ownerNumber2.replace(/\s+/g, '').replace('+', '')}:${ownerNumber2}\n` + 
                      'END:VCARD';

        await conn.sendMessage(from, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            }
        });

        await conn.sendMessage(from, {
            image: { url: ALIVE_IMG },
            caption: `╭━━〔 *AS-BOT* 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• *Here Is The Owner Details*
┃◈┃• *Name* - ${ownerName}
┃◈┃• *Number 1* ${ownerNumber}
┃◈┃• *Number 2* ${ownerNumber2}
┃◈┃• *Version*: 5.0.0 Beta
┃◈└───────────┈⊷
╰──────────────┈⊷
> © POWERED BY AS-BOT`,
            contextInfo: {
                mentionedJid: [
                    `${ownerNumber.replace('+', '')}@s.whatsapp.net`,
                    `${ownerNumber2.replace('+', '')}@s.whatsapp.net`
                ], 
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406449026172@newsletter',
                    newsletterName: 'DEX SHYAM TECH',
                    serverMessageId: 143
                }            
            }
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply(`An error occurred: ${error.message}`);
    }
});

// ============================================================
// CATEGORY MENUS - DYNAMIC GENERATION WITH EMOJIS
// ============================================================
function createCategoryMenu(category, categoryDisplayName) {
    bandah({
        pattern: `${category}menu`,
        desc: `Show ${categoryDisplayName} commands`,
        alias: [`${category}help`, `${category}commands`],
        category: "main",
        react: "📁",
        filename: __filename
    }, async (conn, mek, m, { from, reply }) => {
        try {
            await conn.sendPresenceUpdate('composing', from);

            const version = await getBotVersion();
            const ownername = config.OWNER_NAME;
            
            const categoryCommands = commands.filter(bandah => 
                bandah.pattern && 
                bandah.category && 
                bandah.category.toLowerCase() === category.toLowerCase() &&
                !bandah.hideCommand
            );

            if (categoryCommands.length === 0) {
                return reply(`❌ No commands found in *${categoryDisplayName}* category.`);
            }

            const metaIconBuffer = await axios.get(ALIVE_IMG, {
                responseType: "arraybuffer"
            }).then(res => Buffer.from(res.data, "binary"));

            const fake = {
                key: {
                    remoteJid: "status@broadcast",
                    fromMe: false,
                    id: "ABCD1234",
                    participant: "0@s.whatsapp.net"
                },
                message: {
                    contactMessage: {
                        displayName: "AS-BOT",
                        vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:Meta AI\nTEL;type=CELL:+13135550002\nEND:VCARD",
                        jpegThumbnail: metaIconBuffer
                    }
                }
            };

            let menuContent = `
       \`\`\`${categoryDisplayName.toUpperCase()} MENU\`\`\`
    
⟣──────────────────⟢
▧ *𝙊𝙒𝙉𝙀𝙍* : *${ownername} (🇵🇰)*
▧ *𝗠𝗢𝗗𝗘* : *${config.MODE}* 
▧ *𝗣𝗥𝗘𝗙𝗜𝗫* : *${config.PREFIX}*
▧ *𝗩𝗘𝗥𝗦𝗜𝗢𝗡* : *${version}* 
▧ *𝗖𝗔𝗧𝗘𝗚𝗢𝗥𝗬* : *${categoryDisplayName}*
▧ *𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦* : ${categoryCommands.length}
⟣──────────────────⟢

> ${categoryDisplayName.toUpperCase()} - COMMANDS

⟣──────────────────⟢
${readMore}

${generateCategorySection(categoryDisplayName, categoryCommands)}

*━━━━━━━━━━━━━━━━━━━━*⁠⁠⁠⁠
> 𝙐𝙨𝙚 *${config.PREFIX}menu* 𝙛𝙤𝙧 𝙛𝙪𝙡𝙡 𝙢𝙚𝙣𝙪
*━━━━━━━━━━━━━━━━━━━━━*
`;

            await conn.sendMessage(
                from,
                {
                    image: { url: ALIVE_IMG },
                    caption: menuContent,
                    contextInfo: {
                        mentionedJid: [m.sender],
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363406449026172@newsletter',
                            newsletterName: 'DEX SHYAM TECH',
                            serverMessageId: 143
                        }
                    }
                },
                { quoted: fake }
            );

            await conn.sendPresenceUpdate('paused', from);
            
        } catch (e) {
            console.error(`${category} Menu Error:`, e);
            reply(`❌ Error generating ${categoryDisplayName} menu: ${e.message}`);
        }
    });
}

// Create category menus
createCategoryMenu("tools", "Tools");
createCategoryMenu("main", "Main");
createCategoryMenu("bug", "Bug");
createCategoryMenu("download", "Download");
createCategoryMenu("random", "Random");
createCategoryMenu("fun", "Fun");
createCategoryMenu("owner", "Owner");
createCategoryMenu("group", "Group");
createCategoryMenu("search", "Search");
createCategoryMenu("converter", "Converter");
createCategoryMenu("islamic", "Islamic");
createCategoryMenu("ai", "AI");

// ============================================================
// LIST COMMAND
// ============================================================
bandah({
    pattern: "list",
    alias: ["listmenu", "alllist"],
    use: '.menu',
    desc: "Show all bot commands",
    category: "main",
    react: "📃",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const totalCommands = commands.length;
        const date = formatDate();
        const uptime = formatUptime();

        let menuText = `
*╭┄┄✪ ${config.BOT_NAME} ✪┄┄⊷*
*┃❂┬┄✯✯✯✯✯✯✯✯*
*┃❂┊ Owner:* ${config.OWNER_NAME}
*┃❂┊ Baileys:* Mᴜʟᴛɪ Dᴇᴠɪᴄᴇ
*┃❂┊ Date:* ${date}
*┃❂┊ Uptime:* ${uptime}
*┃❂┊ Prefix:* ${config.PREFIX}
*┃❂┊ Mode:* ${config.MODE}
*┃❂┊ Ram:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${(os.totalmem() / 1024 / 1024).toFixed(2)}MB
*┃❂┊ Total Commands:* ${totalCommands}
*┃❂┊ Status:* *Oɴʟɪɴᴇ*
*┃❂┊ Version:* 1.0.0
*┃❂┴┄✯✯✯✯✯✯✯✯*
*╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⊷*
`;

        let category = {};
        for (let bandah of commands) {
            if (!bandah.category) continue;
            if (!category[bandah.category]) category[bandah.category] = [];
            category[bandah.category].push(bandah);
        }

        const keys = Object.keys(category).sort();
        for (let k of keys) {
            menuText += `\n\n*╭┈┈┄❂ ${k.toUpperCase()} ❂┄┄┄◈*`;
            const cmds = category[k].filter(c => c.pattern).sort((a, b) => a.pattern.localeCompare(b.pattern));
            cmds.forEach((bandah) => {
                const commandDisplay = getCommandDisplay(bandah.pattern);
                const emoji = getCommandEmoji(bandah.pattern);
                menuText += `\n*┋${emoji} ${commandDisplay}*    `;
            });
            menuText += `\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*`;
        }

        await conn.sendMessage(from, {
            image: { url: ALIVE_IMG },
            caption: menuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406449026172@newsletter',
                    newsletterName: 'DEX SHYAM TECH',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================================================
// UPDATE COMMAND
// ============================================================
bandah({
    pattern: "update",
    alias: ["updbot", "botupdate"],
    desc: "Real bot update from GitHub",
    category: "owner",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { reply, isOwner, from }) => {
    if (!isOwner) return reply("❌ Owner only!");
    
    const date = formatDate();
    const time = formatTime();
    
    await conn.sendMessage(from, { 
        image: { url: ALIVE_IMG }, 
        caption: `🔍 Updating...\n📅 ${date}\n⏰ ${time}` 
    }, { quoted: mek });
    
    try {
        const repoUrl = config.REPO || "https://github.com/naveedahmed35581-arch/NAVEED-MD";
        const zipUrl = `${repoUrl}/archive/refs/heads/main.zip`;
        const tmpZip = path.join(os.tmpdir(), "naveed_update.zip");
        const tmpExtract = path.join(os.tmpdir(), "naveed_update");
        
        if (fs.existsSync(tmpZip)) fs.unlinkSync(tmpZip);
        if (fs.existsSync(tmpExtract)) fs.rmSync(tmpExtract, { recursive: true, force: true });
        
        const response = await axios({ method: 'GET', url: zipUrl, responseType: 'stream' });
        const writer = fs.createWriteStream(tmpZip);
        response.data.pipe(writer);
        await new Promise((r,j)=>{writer.on('finish',r);writer.on('error',j);});
        await new Promise((r,j)=>{exec(`mkdir -p ${tmpExtract} && unzip -o ${tmpZip} -d ${tmpExtract}`, e=> e?j(e):r());});
        
        const sourceFolder = path.join(tmpExtract, fs.readdirSync(tmpExtract)[0]);
        const skipFiles = ['node_modules','.git','config.env','.env','session'];
        const copy = (s,d)=>{fs.readdirSync(s).forEach(i=>{if(skipFiles.includes(i))return;const a=path.join(s,i),b=path.join(d,i);fs.statSync(a).isDirectory()? (fs.existsSync(b)||fs.mkdirSync(b,{recursive:true}),copy(a,b)) : fs.copyFileSync(a,b);});};
        copy(sourceFolder, process.cwd());
        
        fs.unlinkSync(tmpZip); 
        fs.rmSync(tmpExtract, { recursive: true, force: true });
        
        saveUptime(); // Save uptime before restart
        
        await conn.sendMessage(from, { 
            image: { url: ALIVE_IMG }, 
            caption: `✅ UPDATE SUCCESS!\n📅 ${date}\n⏰ ${time}\n⚡ Restarting...` 
        }, { quoted: mek });
        
        setTimeout(()=>process.exit(0),5000);
    } catch(e){
        exec("git pull", async(err,out)=>{
            await conn.sendMessage(from, { 
                image: { url: ALIVE_IMG }, 
                caption: err?`❌ ${e.message}`:`✅ Updated via Git!\n${out.slice(0,300)}` 
            }, { quoted: mek }); 
            if(!err) {
                saveUptime();
                setTimeout(()=>process.exit(0),5000);
            }
        });
    }
});

// ============================================================
// RESTART COMMAND
// ============================================================
bandah({
    pattern: "restart",
    desc: "Restart the bot",
    category: "owner",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { reply, isOwner }) => {
    if (!isOwner) return reply("❌ Only owner can restart the bot.");
    
    await reply("🔄 Restarting...");
    saveUptime(); // Save uptime before restart
    process.exit(0);
});

// ============================================================
// EXPORT
// ============================================================
module.exports = {
    saveUptime,
    getLiveUptime,
    formatUptime,
    formatDate,
    formatTime
};
