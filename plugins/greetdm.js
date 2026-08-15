const fs = require('fs');
const path = require('path');
const { amon, fakevCard } = require('../amon');

const CONFIG_DIR = path.join(__dirname, '../data');
const CONFIG_PATH = path.join(CONFIG_DIR, 'greetdm.json');
const GREETED_PATH = path.join(CONFIG_DIR, 'greetedUsers.json');

// Ensure data directory exists
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Load config
function loadGreetDMConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            const def = { enabled: false, message: "Hello @user! Thanks for messaging me." };
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(def, null, 2));
            return def;
        }
        return JSON.parse(fs.readFileSync(CONFIG_PATH));
    } catch {
        return { enabled: false, message: "Hello @user! Thanks for messaging me." };
    }
}

// Save config
function saveGreetDMConfig(config) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Load greeted users
function loadGreetedUsers() {
    try {
        if (!fs.existsSync(GREETED_PATH)) {
            fs.writeFileSync(GREETED_PATH, JSON.stringify([], null, 2));
            return new Set();
        }
        return new Set(JSON.parse(fs.readFileSync(GREETED_PATH)));
    } catch {
        return new Set();
    }
}

// Save greeted users
function saveGreetedUsers(set) {
    fs.writeFileSync(GREETED_PATH, JSON.stringify([...set], null, 2));
}

// Format message
function formatGreetMessage(message, userName, userJid) {
    return {
        text: message.replace(/@user/g, `@${userName}`),
        mentions: [userJid]
    };
}

// ---------------------------
// COMMAND
// ---------------------------
amon({
    pattern: "greet",
    alias: ["greetprivate", "dmwelcome"],
    desc: "Manage DM greeting",
    category: "owner",
    react: "💬",
    use: ".greet [on/off/set/list/reset]",
    filename: __filename,
}, async (amon, mek, m, { from, q, reply, sender }) => {
    try {
        // ✅ USE YOUR EXISTING OWNER SYSTEM
        const isOwner = mek.key.fromMe || (await require('../lib/isOwner')(sender, amon));

        if (!isOwner) {
            return reply("❌ Only bot owner can use this command.", { quoted: fakevCard });
        }

        const config = loadGreetDMConfig();

        if (!q) {
            return reply(
                `💬 *PRIVATE DM GREET*\n\n` +
                `Status: ${config.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                `Message: ${config.message}\n\n` +
                `Commands:\n` +
                `• .greet on\n` +
                `• .greet off\n` +
                `• .greet set <message>\n` +
                `• .greet list\n` +
                `• .greet reset`,
                { quoted: fakevCard }
            );
        }

        const args = q.split(' ');
        const action = args[0].toLowerCase();

        if (action === 'on') {
            config.enabled = true;
            saveGreetDMConfig(config);
            return reply("✅ DM greet enabled.");
        }

        if (action === 'off') {
            config.enabled = false;
            saveGreetDMConfig(config);
            return reply("❌ DM greet disabled.");
        }

        if (action === 'set') {
            const msg = args.slice(1).join(' ');
            if (!msg) return reply("❌ Provide a message.");
            config.message = msg;
            saveGreetDMConfig(config);
            return reply(`✅ Message updated:\n\n${msg}`);
        }

        if (action === 'list') {
            const greeted = loadGreetedUsers();
            return reply(`📊 Greeted users: ${greeted.size}`);
        }

        if (action === 'reset') {
            saveGreetedUsers(new Set());
            return reply("✅ Greeted users reset.");
        }

        return reply("❌ Invalid option.");

    } catch (err) {
        console.error("Greet command error:", err);
        reply("❌ Error occurred.");
    }
});

// ---------------------------
// PRIVATE MESSAGE HANDLER
// ---------------------------
async function handlePrivateGreet(amon, message) {
    try {
        const config = loadGreetDMConfig();
        if (!config.enabled) return;

        const chatId = message.key?.remoteJid;
        if (!chatId || chatId.endsWith('@g.us') || chatId.includes('broadcast')) return;
        if (message.key?.fromMe) return;

        const sender = message.key.participant || chatId;

        const greeted = loadGreetedUsers();
        if (greeted.has(sender)) return;

        greeted.add(sender);
        saveGreetedUsers(greeted);

        const userName = sender.split('@')[0];
        const { text, mentions } = formatGreetMessage(config.message, userName, sender);

        await amon.sendMessage(chatId, { text, mentions });

        console.log("✅ Greet sent to:", sender);

    } catch (err) {
        console.error("Greet handler error:", err);
    }
}

module.exports = {
    handlePrivateGreet
};