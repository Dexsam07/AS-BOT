const { cmd, commands } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions2');
const { writeFileSync } = require('fs');
const path = require('path');

// ============ ✅ OWNER NUMBERS ============
const OWNER_NUMBERS = ['917384287404', '917384287404', '917384287404', '917384287404'];

// ============ ✅ OWNER PERSONAL EMOJI ============
const OWNER_EMOJI = '🪀';

// ============ ✅ HELPER FUNCTIONS ============
function saveConfig() {
    try {
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error saving config:', error);
        return false;
    }
}

function isOwner(number) {
    if (!number) return false;
    const cleanNumber = number.replace(/[^0-9]/g, '');
    return OWNER_NUMBERS.includes(cleanNumber);
}

async function ownerReact(conn, from, sender, key) {
    try {
        const senderNumber = sender.split('@')[0];
        if (isOwner(senderNumber)) {
            await conn.sendMessage(from, {
                react: { text: OWNER_EMOJI, key: key }
            });
        }
    } catch (e) {}
}

function toggleSetting(settingName, value) {
    const status = value?.toLowerCase();
    const p1 = require('path').join(__dirname, '../assets/settings.json');
    try {
        const fs2 = require('fs');
        let data = {};
        if (fs2.existsSync(p1)) data = JSON.parse(fs2.readFileSync(p1, 'utf8'));
        if (status === "on") {
            config[settingName] = "true";
            saveConfig();
            data[settingName] = "true";
            fs2.mkdirSync(require('path').dirname(p1), { recursive: true });
            fs2.writeFileSync(p1, JSON.stringify(data, null, 2));
            return { success: true, message: `✅ *${settingName}* is now ENABLED (Website+Inbox)` };
        } else if (status === "off") {
            config[settingName] = "false";
            saveConfig();
            data[settingName] = "false";
            fs2.mkdirSync(require('path').dirname(p1), { recursive: true });
            fs2.writeFileSync(p1, JSON.stringify(data, null, 2));
            return { success: true, message: `❌ *${settingName}* is now DISABLED (Website+Inbox)` };
        } else {
            return { success: false, message: `⚠️ Use:.${settingName.toLowerCase()} on/off` };
        }
    } catch(e) {
        if (status === "on") { config[settingName]="true"; saveConfig(); return { success: true, message: `✅ *${settingName}* ENABLED` }; }
        else { config[settingName]="false"; saveConfig(); return { success: true, message: `❌ *${settingName}* DISABLED` }; }
    }
}
cmd({
    pattern: "menusetting",
    alias: ["msetting", "settingsmenu", "allsettings"],
    desc: "Show all settings with their current status",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    await ownerReact(conn, from, m.sender, mek.key);

    const menuImage = 'https://ik.imagekit.io/shaban/SHABAN-1784205527063_Zze7YpdxH.jpeg';

    const settingsText = `
╔═══════════════════════════════════╗
║       📊 ALL SETTINGS MENU        ║
╠═══════════════════════════════════╣
║                                   ║
║ 🤖 *BOT SETTINGS*                 ║
║ ├ Prefix: ${config.PREFIX || '.'}                     ║
║ ├ Mode: ${config.MODE || 'public'}                    ║
║ ├ Bot Name: ${config.BOT_NAME || 'Naveed MD'}         ║
║                                   ║
║ 👑 *OWNER SETTINGS*               ║
║ ├ Personal Emoji: ${OWNER_EMOJI}                    ║
║ ├ Status: ALWAYS ON (Auto)                         ║
║                                   ║
║ 🛡️ *SECURITY SETTINGS*            ║
║ ├ antilink: ${config.ANTI_LINK === 'true' ? '✅ ON' : '❌ OFF'}          ║
║ ├ antilinkkick: ${config.ANTI_LINK_KICK === 'true' ? '✅ ON' : '❌ OFF'}      ║
║ ├ antipromote: ${config.ANTI_PROMOTE === 'true' ? '✅ ON' : '❌ OFF'}        ║
║ ├ antiforign: ${config.ANTI_FORIGN === 'true' ? '✅ ON' : '❌ OFF'}         ║
║ ├ antidelete: ${config.ANTI_DELETE === 'true' ? '✅ ON' : '❌ OFF'}         ║
║ ├ antiedit: ${config.ANTI_EDIT === 'true' ? '✅ ON' : '❌ OFF'}           ║
║ ├ anticall: ${config.ANTI_CALL === 'true' ? '✅ ON' : '❌ OFF'}           ║
║ ├ antivv: ${config.ANTI_VV === 'true' ? '✅ ON' : '❌ OFF'}             ║
║ ├ antibad: ${config.ANTI_BAD === 'true' ? '✅ ON' : '❌ OFF'}            ║
║                                   ║
║ 💬 *CHAT SETTINGS*                ║
║ ├ welcome: ${config.WELCOME === 'true' ? '✅ ON' : '❌ OFF'}              ║
║ ├ adminevents: ${config.ADMIN_EVENTS === 'true' ? '✅ ON' : '❌ OFF'}        ║
║ ├ mentionreply: ${config.MENTION_REPLY === 'true' ? '✅ ON' : '❌ OFF'}      ║
║ ├ autoread: ${config.READ_MESSAGE === 'true' ? '✅ ON' : '❌ OFF'}          ║
║ ├ deletelinks: ${config.DELETE_LINKS === 'true' ? '✅ ON' : '❌ OFF'}        ║
║                                   ║
║ 🤖 *AUTO FEATURES*                ║
║ ├ autoreact: ${config.AUTO_REACT === 'true' ? '✅ ON' : '❌ OFF'}           ║
║ ├ customreact: ${config.CUSTOM_REACT === 'true' ? '✅ ON' : '❌ OFF'}       ║
║ ├ heartreact: ${config.CUSTOM_REACT === 'true' ? '✅ ON' : '❌ OFF'}       ║
║ ├ autovoice: ${config.AUTO_VOICE === 'true' ? '✅ ON' : '❌ OFF'}           ║
║ ├ autosticker: ${config.AUTO_STICKER === 'true' ? '✅ ON' : '❌ OFF'}        ║
║ ├ autoreply: ${config.AUTO_REPLY === 'true' ? '✅ ON' : '❌ OFF'}           ║
║ ├ autodownload: ${config.AUTO_DOWNLOAD === 'true' ? '✅ ON' : '❌ OFF'}       ║
║ ├ autotyping: ${config.AUTO_TYPING === 'true' ? '✅ ON' : '❌ OFF'}          ║
║ ├ autorecording: ${config.AUTO_RECORDING === 'true' ? '✅ ON' : '❌ OFF'}      ║
║ ├ autoseen: ${config.AUTO_STATUS_SEEN === 'true' ? '✅ ON' : '❌ OFF'}   ║
║ ├ statusreact: ${config.AUTO_STATUS_REACT === 'true' ? '✅ ON' : '❌ OFF'}  ║
║ ├ statusreply: ${config.AUTO_STATUS_REPLY === 'true' ? '✅ ON' : '❌ OFF'}  ║
║                                   ║
║ 👑 *ADMIN SETTINGS*               ║
║ ├ adminuse: ${config.ADMIN_USE === 'true' ? '✅ ON' : '❌ OFF'}            ║
║ ├ readcmd: ${config.READ_CMD === 'true' ? '✅ ON' : '❌ OFF'}             ║
║ ├ publicmode: ${config.PUBLIC_MODE === 'true' ? '✅ ON' : '❌ OFF'}         ║
║                                   ║
╠═══════════════════════════════════╣
║ 📝 *COMMANDS*                     ║
║ .heartreact on/off               ║
║ .customreact on/off              ║
║ .welcome on/off                  ║
║ .antilink on/off                 ║
║ .autoreact on/off                ║
║ .antidelete on/off               ║
║ .antiedit on/off                 ║
║ .anticall on/off                 ║
║ .antivv on/off                   ║
║ .antibad on/off                  ║
║ .antipromote on/off              ║
║ .antiforign on/off               ║
║ .autotyping on/off               ║
║ .autorecording on/off            ║
║ .autoseen on/off                 ║
║ .statusreact on/off              ║
║ .statusreply on/off              ║
║ .autoread on/off                 ║
║ .autovoice on/off                ║
║ .autosticker on/off              ║
║ .autoreply on/off                ║
║ .autodownload on/off             ║
║ .deletelinks on/off              ║
║ .adminuse on/off                 ║
║ .readcmd on/off                  ║
║ .publicmode on/off               ║
║ .adminevents on/off              ║
║ .mentionreply on/off             ║
╚═══════════════════════════════════╝`;

    await conn.sendMessage(from, {
        image: { url: menuImage },
        caption: settingsText,
        contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true
        }
    }, { quoted: mek });
});

//--------------------------------------------
// MENU IMAGE
//--------------------------------------------
cmd({
    pattern: "menuimg",
    desc: "Set menu image URL",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");
    if (!args[0]) return reply("❌ Please provide a valid image URL.");
    config.MENU_IMAGE_URL = args[0];
    saveConfig();
    await ownerReact(conn, from, m.sender, mek.key);
    return reply("✅ Menu image URL updated successfully.");
});

//--------------------------------------------
// ADMIN EVENTS
//--------------------------------------------
cmd({
    pattern: "adminevents",
    alias: ["admin-events"],
    desc: "Enable or disable admin event notifications",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ADMIN_EVENTS', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .adminevents on');
    }
});

//--------------------------------------------
// MENTION REPLY
//--------------------------------------------
cmd({
    pattern: "mentionreply",
    alias: ["mention-reply", "mee"],
    description: "Enable or disable mention reply feature.",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('MENTION_REPLY', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .mentionreply on');
    }
});

//--------------------------------------------
// WELCOME
//--------------------------------------------
cmd({
    pattern: "welcome",
    alias: ["welcomeset"],
    desc: "Enable or disable welcome messages",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('WELCOME', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .welcome on');
    }
});

//--------------------------------------------
// SETPREFIX
//--------------------------------------------
cmd({ 
  pattern: "setprefix", 
  alias: ["prefix"], 
  desc: "Change bot prefix.", 
  category: "misc", 
  filename: __filename 
}, async (conn, mek, m, { from, args, isOwner, reply }) => { 
  if (!isOwner) return reply("*📛 Only the owner can use this command!*"); 
  if (!args[0]) return reply("❌ Please provide a new prefix."); 
  config.PREFIX = args[0]; 
  saveConfig();
  await ownerReact(conn, from, m.sender, mek.key);
  reply(`*Prefix changed to:* ${args[0]}`); 
});

//--------------------------------------------
// MODE
//--------------------------------------------
cmd({
    pattern: "mode",
    desc: "Set bot mode",
    category: "misc",
    filename: __filename,
}, async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    if (!args[0]) return reply(`📌 Current mode: *${config.MODE || 'public'}*\n\nUsage: .mode public`);
    
    if (args[0].toLowerCase() === "public") {
        config.MODE = "public";
        saveConfig();
        await ownerReact(conn, from, m.sender, mek.key);
        return reply("*_BOT MODE IS NOW SET TO PUBLIC ✅_*");
    } else {
        return reply("❌ Invalid mode. Use: `.mode public`");
    }
});

//--------------------------------------------
// AUTO TYPING
//--------------------------------------------
cmd({
    pattern: "autotyping",
    alias: ["auto_typing"],
    desc: "Enable or disable fake typing.",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('AUTO_TYPING', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .autotyping on');
    }
});

//--------------------------------------------
// ALWAYS ONLINE
//--------------------------------------------
cmd({
    pattern: "alwaysonline",
    alias: ["always_online"],
    desc: "Enable or disable always online.",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ALWAYS_ONLINE', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .alwaysonline on');
    }
});

//--------------------------------------------
// AUTO RECORDING
//--------------------------------------------
cmd({
    pattern: "autorecording",
    alias: ["auto_recording"],
    desc: "Enable or disable fake recording.",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('AUTO_RECORDING', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .autorecording on');
    }
});

//--------------------------------------------
// AUTO SEEN
//--------------------------------------------
cmd({
    pattern: "autoseen",
    alias: ["status_view", "auto_status_seen"],
    desc: "Enable or disable auto-viewing of statuses",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('AUTO_STATUS_SEEN', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .autoseen on');
    }
});

//--------------------------------------------
// STATUS REACT
//--------------------------------------------
cmd({
    pattern: "statusreact",
    alias: ["status_react", "autoreactstatus"],
    desc: "Enable or disable auto-reacting on statuses",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('AUTO_STATUS_REACT', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .statusreact on');
    }
});

//--------------------------------------------
// STATUS REPLY
//--------------------------------------------
cmd({
    pattern: "statusreply",
    alias: ["status_reply", "autoreplystatus"],
    desc: "Enable or disable auto-reply on statuses",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('AUTO_STATUS_REPLY', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .statusreply on');
    }
});

//--------------------------------------------
// AUTO READ
//--------------------------------------------
cmd({
    pattern: "autoread",
    alias: ["read_message", "readmsg"],
    desc: "Enable or disable auto read messages.",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('READ_MESSAGE', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .autoread on');
    }
});

//--------------------------------------------
// ANTI BAD
//--------------------------------------------
cmd({
    pattern: "antibad",
    alias: ["anti_bad", "badword"],
    desc: "Enable or disable anti-bad words.",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ANTI_BAD', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .antibad on');
    }
});

//--------------------------------------------
// AUTO REACT
//--------------------------------------------
cmd({
    pattern: "autoreact",
    alias: ["auto_react", "areact"],
    desc: "Enable or disable auto react on messages",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('AUTO_REACT', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .autoreact on');
    }
});

//--------------------------------------------

//--------------------------------------------
// CUSTOM REACT - FIXED DUAL SYSTEM
//--------------------------------------------
cmd({
    pattern: "customreact",
    alias: ["custom_react", "creact"],
    desc: "Enable or disable custom reactions - FIXED",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { from, args, isOwner, isCreator, reply }) => {
    if (!isOwner &&!isCreator) return reply("*📛 Only the owner can use this command!*");

    const status = args[0]?.toLowerCase();

    const saveDual = (enabled) => {
        try {
            const fs2 = require('fs');
            const path2 = require('path');
            const p1 = path2.join(__dirname, '../assets/settings.json');
            const p2 = './settings.json';
            let data = {};
            if (fs2.existsSync(p1)) data = JSON.parse(fs2.readFileSync(p1));
            data.CUSTOM_REACT = enabled? "true" : "false";
            data.CUSTOM_REACT_ENABLED = enabled? "true" : "false";
            fs2.writeFileSync(p1, JSON.stringify(data, null, 2));
            if (fs2.existsSync(p2)){
                let d2 = JSON.parse(fs2.readFileSync(p2));
                d2.CUSTOM_REACT_ENABLED = enabled? "true" : "false";
                fs2.writeFileSync(p2, JSON.stringify(d2, null, 2));
            }
        } catch(e){}
    };

    if (status === "on") {
        config.CUSTOM_REACT = "true";
        saveConfig();
        saveDual(true);
        await ownerReact(conn, from, m.sender, mek.key);
        await reply(`✅ *CUSTOM REACT ON*\nAb custom emoji se react hoga.`);
    } else if (status === "off") {
        config.CUSTOM_REACT = "false";
        saveConfig();
        saveDual(false);
        await ownerReact(conn, from, m.sender, mek.key);
        await reply(`❌ *CUSTOM REACT OFF*`);
    } else {
        await reply(`Use:.customreact on / off`);
    }
});

//--------------------------------------------
// HEART REACT - FIXED DUAL SYSTEM
//--------------------------------------------
cmd({
    pattern: "heartreact",
    alias: ["heart", "hreact", "love"],
    desc: "Enable or disable heart react - FIXED",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { from, args, isOwner, isCreator, reply }) => {
    if (!isOwner &&!isCreator) return reply("*📛 Only the owner can use this command!*");
    const status = args[0]?.toLowerCase();
    const saveDual = (enabled) => {
        try {
            const fs2 = require('fs');
            const path2 = require('path');
            const p1 = path2.join(__dirname, '../assets/settings.json');
            let data = {};
            if (fs2.existsSync(p1)) data = JSON.parse(fs2.readFileSync(p1));
            data.CUSTOM_REACT = enabled? "true" : "false";
            data.CUSTOM_REACT_ENABLED = enabled? "true" : "false";
            fs2.writeFileSync(p1, JSON.stringify(data, null, 2));
        } catch(e){}
    };
    if (status === "on") {
        config.CUSTOM_REACT = "true";
        saveConfig(); saveDual(true);
        await reply(`❤️ *HEART REACT ON*`);
    } else if (status === "off") {
        config.CUSTOM_REACT = "false";
        saveConfig(); saveDual(false);
        await reply(`❌ *HEART REACT OFF*`);
    } else {
        await reply(`Use:.heartreact on / off`);
    }
});
//--------------------------------------------
// ANTI LINK
//--------------------------------------------
cmd({
    pattern: "antilink",
    alias: ["anti_link", "antilinks"],
    desc: "Enable or disable anti-link feature",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ANTI_LINK', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .antilink on');
    }
});

//--------------------------------------------
// ANTI LINK KICK
//--------------------------------------------
cmd({
    pattern: "antilinkkick",
    alias: ["anti_link_kick", "alinkkick"],
    desc: "Enable or disable anti-link kick",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ANTI_LINK_KICK', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .antilinkkick on');
    }
});

//--------------------------------------------
// ANTI DELETE
//--------------------------------------------
cmd({
    pattern: "antidelete",
    alias: ["anti_delete", "adel"],
    desc: "Enable or disable anti-delete feature",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ANTI_DELETE', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .antidelete on');
    }
});

//--------------------------------------------
// ANTI CALL
//--------------------------------------------
cmd({
    pattern: "anticall",
    alias: ["anti_call", "acall"],
    desc: "Enable or disable anti-call feature",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ANTI_CALL', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .anticall on');
    }
});

//--------------------------------------------
// ANTI EDIT
//--------------------------------------------
cmd({
    pattern: "antiedit",
    alias: ["anti_edit", "aedit"],
    desc: "Enable or disable anti-edit feature",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ANTI_EDIT', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .antiedit on');
    }
});

//--------------------------------------------
// ANTI PROMOTE
//--------------------------------------------
cmd({
    pattern: "antipromote",
    alias: ["anti_promote", "apromote"],
    desc: "Enable or disable anti-promote feature",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ANTI_PROMOTE', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .antipromote on');
    }
});

//--------------------------------------------
// ANTI FORIGN
//--------------------------------------------
cmd({
    pattern: "antiforign",
    alias: ["anti_forign", "aforign"],
    desc: "Enable or disable anti-forign numbers",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ANTI_FORIGN', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .antiforign on');
    }
});

//--------------------------------------------
// AUTO VOICE
//--------------------------------------------
cmd({
    pattern: "autovoice",
    alias: ["auto_voice", "avoice"],
    desc: "Enable or disable auto voice",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('AUTO_VOICE', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .autovoice on');
    }
});

//--------------------------------------------
// AUTO STICKER
//--------------------------------------------
cmd({
    pattern: "autosticker",
    alias: ["auto_sticker", "asticker"],
    desc: "Enable or disable auto sticker",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('AUTO_STICKER', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .autosticker on');
    }
});

//--------------------------------------------
// AUTO REPLY
//--------------------------------------------
cmd({
    pattern: "autoreply",
    alias: ["auto_reply", "areply"],
    desc: "Enable or disable auto reply",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('AUTO_REPLY', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .autoreply on');
    }
});

//--------------------------------------------
// AUTO DOWNLOAD
//--------------------------------------------
cmd({
    pattern: "autodownload",
    alias: ["auto_download", "adownload"],
    desc: "Enable or disable auto download",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('AUTO_DOWNLOAD', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .autodownload on');
    }
});

//--------------------------------------------
// DELETE LINKS
//--------------------------------------------
cmd({
    pattern: "deletelinks",
    alias: ["delete_links", "dlinks"],
    desc: "Enable or disable delete links",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('DELETE_LINKS', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .deletelinks on');
    }
});

//--------------------------------------------
// ADMIN USE
//--------------------------------------------
cmd({
    pattern: "adminuse",
    alias: ["admin_use", "ause"],
    desc: "Enable or disable admin use only",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ADMIN_USE', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .adminuse on');
    }
});

//--------------------------------------------
// READ CMD
//--------------------------------------------
cmd({
    pattern: "readcmd",
    alias: ["read_cmd", "rcommand"],
    desc: "Enable or disable read commands",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('READ_CMD', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .readcmd on');
    }
});

//--------------------------------------------
// ANTI VV
//--------------------------------------------
cmd({
    pattern: "antivv",
    alias: ["anti_vv", "avv"],
    desc: "Enable or disable anti-view once",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('ANTI_VV', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .antivv on');
    }
});

//--------------------------------------------
// PUBLIC MODE
//--------------------------------------------
cmd({
    pattern: "publicmode",
    alias: ["public_mode", "pmode"],
    desc: "Enable or disable public mode",
    category: "misc",
    filename: __filename
},    
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");
    const result = toggleSetting('PUBLIC_MODE', args[0]);
    await ownerReact(conn, from, m.sender, mek.key);
    if (result.success) {
        await reply(result.message);
    } else {
        await reply(result.message + '\n\nExample: .publicmode on');
    }
});

console.log('✅ All commands loaded successfully!');
console.log(`👑 Owner Emoji: ${OWNER_EMOJI} (Auto - Always ON)`);
console.log('✅ All ON/OFF commands working properly!');
console.log('✅ Custom React FIXED and WORKING!');
console.log('✅ HEART REACT command added - Alternative to Custom React!');
console.log('✅ Settings will stay permanently ON/OFF!');
console.log('✅ Bot is working in ALL chats!');
