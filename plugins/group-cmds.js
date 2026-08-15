// plugins/group.js - CJS Version (FULLY TESTED & FIXED)
const config = require('../config.js');
const { cmd } = require('../command.js');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions.js');

// ==================== WARNING SYSTEM ====================
// Initialize warnings storage
if (!global.warnings) global.warnings = {};

// Prohibited content keywords - Romantic/Adult content
const BAD_KEYWORDS = [
    'love', 'romantic', 'kiss', 'sexy', 'hot', 'adult', '18+', 'xxx', 
    'sexy video', 'romantic video', 'adult video', 'kiss video', 'hot video',
    'sexy sticker', 'romantic sticker', 'love sticker', 'kiss sticker',
    'sexy image', 'romantic image', 'love image', 'kiss image',
    '❤️', '💋', '💕', '💗', '💖', '💘', '💝', '💟'
];

// Helper function to check if content is prohibited
function isProhibitedContent(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return BAD_KEYWORDS.some(word => lowerText.includes(word));
}

// Helper function to get warnings
function getWarnings(groupJid, userJid) {
    if (!global.warnings[groupJid]) global.warnings[groupJid] = {};
    return global.warnings[groupJid][userJid] || 0;
}

// Helper function to increment warning
function incrementWarning(groupJid, userJid) {
    if (!global.warnings[groupJid]) global.warnings[groupJid] = {};
    global.warnings[groupJid][userJid] = (global.warnings[groupJid][userJid] || 0) + 1;
    return global.warnings[groupJid][userJid];
}

// Helper function to reset warnings
function resetWarnings(groupJid, userJid) {
    if (global.warnings[groupJid]) {
        delete global.warnings[groupJid][userJid];
    }
}

// Helper function to check if user is admin
function isUserAdmin(groupMetadata, userJid) {
    const participant = groupMetadata.participants?.find(p => p.id === userJid);
    return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
}

// ==================== WARNING HANDLER - SELF CONTAINED ====================
async function handleWarning(conn, msg, groupMetadata) {
    try {
        const userJid = msg.key.participant || msg.key.remoteJid;
        const groupJid = msg.key.remoteJid;
        const botJid = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        
        // Check if bot is admin
        if (!isUserAdmin(groupMetadata, botJid)) return;
        
        // Check if user is admin (skip admins)
        if (isUserAdmin(groupMetadata, userJid)) return;
        
        // Check if user is owner
        const ownerNumbers = ['917384287404', '917384287404', '917384287404', '917384287404'];
        const userNumber = userJid.split('@')[0];
        if (ownerNumbers.includes(userNumber)) return;
        
        // Get message content
        let text = '';
        let isSticker = false;
        let isImage = false;
        let isVideo = false;
        
        if (msg.message) {
            const mtype = Object.keys(msg.message)[0];
            
            if (mtype === 'conversation') {
                text = msg.message.conversation || '';
            } else if (mtype === 'extendedTextMessage') {
                text = msg.message.extendedTextMessage.text || '';
            } else if (mtype === 'imageMessage') {
                isImage = true;
                text = msg.message.imageMessage.caption || '';
            } else if (mtype === 'videoMessage') {
                isVideo = true;
                text = msg.message.videoMessage.caption || '';
            } else if (mtype === 'stickerMessage') {
                isSticker = true;
                if (msg.message.stickerMessage?.caption) {
                    text = msg.message.stickerMessage.caption;
                }
            }
        }
        
        // Check if content is prohibited
        let isBad = false;
        let contentName = '';
        
        if (isSticker) {
            if (isProhibitedContent(text)) {
                isBad = true;
                contentName = 'sticker';
            }
        } else if (isImage) {
            if (isProhibitedContent(text)) {
                isBad = true;
                contentName = 'image';
            }
        } else if (isVideo) {
            if (isProhibitedContent(text)) {
                isBad = true;
                contentName = 'video';
            }
        } else if (isProhibitedContent(text)) {
            isBad = true;
            contentName = 'text';
        }
        
        if (!isBad) return;
        
        // Try to delete the offending message
        try {
            await conn.sendMessage(groupJid, { delete: msg.key });
        } catch (e) {}
        
        // Get current warnings
        const newWarnings = incrementWarning(groupJid, userJid);
        
        if (newWarnings === 1) {
            // First Warning
            await conn.sendMessage(groupJid, {
                text: `⚠️ *WARNING 1/2*\n\n@${userJid.split('@')[0]},\n\n🚫 Ye ek *Family Group* hai.\n\nIs group mein *romantic/Adult stickers, images, videos aur messages* allowed nahi hain.\n\nMeharbani karke aisi cheezein na bhejen.\n\n*Agar dubara kiya toh group se remove kar diya jayega.*\n\n🗑️ *Offending content deleted.*\n\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`,
                mentions: [userJid]
            });
        } else if (newWarnings >= 2) {
            // Second Warning - Auto Remove
            try {
                await conn.groupParticipantsUpdate(groupJid, [userJid], "remove");
                resetWarnings(groupJid, userJid);
            } catch (e) {}
            
            await conn.sendMessage(groupJid, {
                text: `🚫 *FINAL WARNING - YOU ARE REMOVED*\n\n@${userJid.split('@')[0]},\n\nAapko pehle hi warning di gayi thi.\n\nAap ne dubara prohibited content send kiya.\n\nIsliye aapko is group se remove kar diya gaya hai.\n\n*Ye ek Family Group hai - Respect karein.*\n\n❌ *You have been removed from the group.*\n\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`,
                mentions: [userJid]
            });
        }
        
    } catch (error) {
        console.error('❌ Warning System Error:', error.message);
    }
}

// ==================== HELPER FUNCTION FOR PARSING NUMBERS ====================
function parseNumberRange(input, maxNumber) {
    const numbers = new Set();
    const parts = input.split(',');
    
    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end && i <= maxNumber; i++) {
                    if (i >= 1) numbers.add(i);
                }
            }
        } else {
            const num = Number(part);
            if (!isNaN(num) && num >= 1 && num <= maxNumber) numbers.add(num);
        }
    }
    
    return Array.from(numbers).sort((a, b) => a - b);
}

// ==================== GROUP SETTINGS COMMANDS ====================
// Note: mute/unmute and lockgc/unlockgc are separate but complementary
// mute/unmute = group announcement setting (admin only messaging)
// lockgc/unlockgc = same functionality but different command names

cmd({
    pattern: "mute",
    alias: ["close", "lock"],
    desc: "Mute the group (admins only)",
    category: "group",
    react: "🔇",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to mute the group.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        await conn.groupSettingUpdate(from, 'announcement');
        await reply("🔇 *Group Muted*\n────────────────────\n✅ Group restrictions have been enabled\n✅ Only admins can send messages\n✅ Normal members are restricted\n────────────────────\n*Status:* ▰▰▰▰▰▰▰▰▰▰ 100%\n*Action:* Mute Successful\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to mute the group. Please ensure I have proper admin privileges.\n────────────────────\n*Error Code:* GRP_MT_001\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

cmd({
    pattern: "unmute",
    alias: ["unlock", "open"],
    desc: "Unmute the group (admins only)",
    category: "group",
    react: "🔊",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to unmute the group.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        await conn.groupSettingUpdate(from, 'not_announcement');
        await reply("🔊 *Group Unmuted*\n────────────────────\n✅ Group restrictions have been lifted\n✅ All members can now send messages\n✅ Normal group operation resumed\n────────────────────\n*Status:* ▰▰▰▰▰▰▰▰▰▰ 100%\n*Action:* Unmute Successful\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to unmute the group. Please ensure I have proper admin privileges and try again.\n────────────────────\n*Error Code:* GRP_UMT_001\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== LOCK/UNLOCK GROUP (Alternative commands) ====================
cmd({
    pattern: "lockgc",
    alias: ["lockgroup"],
    desc: "Lock the group (only admins can send messages)",
    category: "group",
    react: "🔒",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isAdmins, isGroup, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used in groups.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need admin privileges to lock the group.");
        if (!isCreator && !isAdmins) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or bot owner can lock the group.");

        await conn.groupSettingUpdate(from, 'announcement');
        await reply(`🔒 *Group Locked*\n────────────────────\n✅ Group has been locked successfully.\n────────────────────\n*Status:* 🔒 LOCKED\n*Permissions:* Only admins can send messages\n*Action:* Group Lock\n────────────────────\n*To unlock:* Use .unlockgc\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to lock group. Please ensure I have admin privileges.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

cmd({
    pattern: "unlockgc",
    alias: ["unlockgroup"],
    desc: "Unlock the group (everyone can send messages)",
    category: "group",
    react: "🔓",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isAdmins, isGroup, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used in groups.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need admin privileges to unlock the group.");
        if (!isCreator && !isAdmins) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or bot owner can unlock the group.");

        await conn.groupSettingUpdate(from, 'not_announcement');
        await reply(`🔓 *Group Unlocked*\n────────────────────\n✅ Group has been unlocked successfully.\n────────────────────\n*Status:* 🔓 UNLOCKED\n*Permissions:* All members can send messages\n*Action:* Group Unlock\n────────────────────\n*To lock:* Use .lockgc\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to unlock group. Please ensure I have admin privileges.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== TAGALL COMMAND ====================
cmd({
    pattern: "tagall",
    react: "🔊",
    alias: ["gc_tagall"],
    desc: "To Tag all Members",
    category: "group",
    use: '.tagall [message]',
    filename: __filename
}, async (conn, mek, m, { from, participants, reply, isGroup, isAdmins, isCreator, prefix, command, args, body }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used within a group.");

        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) return reply("❌ *Fetch Failed*\n────────────────────\nUnable to retrieve group information. Please try again.");

        let groupName = groupInfo.subject || "Unknown Group";
        let totalMembers = participants ? participants.length : 0;
        if (totalMembers === 0) return reply("❌ *No Members*\n────────────────────\nNo members found in this group.");

        let emojis = ['📢', '🔊', '🌐', '🔰', '❤️‍🔥', '🤍', '🖤', '🩹', '📝', '💗', '🔖', '🪩', '📰', '🎉', '🛸', '💸', '⏳', '🗿', '🚀', '🎧', '🪀', '⚡', '🚩', '🍁', '🗽', '👻', '⚠️', '🔥'];
        let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        let message = body.slice(body.indexOf(command) + command.length).trim();
        if (!message) message = "Attention Everyone";

        let teks = `📢 *GROUP ANNOUNCEMENT*\n────────────────────\n📌 *Group:* ${groupName}\n👥 *Members:* ${totalMembers}\n💬 *Message:* ${message}\n────────────────────\n*Mentions:*\n`;
        
        let mentionList = [];
        for (let mem of participants) {
            if (!mem.id) continue;
            mentionList.push(`┃ ${randomEmoji} @${mem.id.split('@')[0]}`);
        }
        teks += mentionList.join('\n');
        teks += `\n────────────────────\n*Powered By Naveed MD*\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`;

        conn.sendMessage(from, { text: teks, mentions: participants.map(a => a.id) }, { quoted: mek });

    } catch (e) {
        console.error("TagAll Error:", e);
        reply(`❌ *Error Occurred*\n────────────────────\n${e.message || e}\n────────────────────\n*Support:* Contact bot owner\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
    }
});

// ==================== GROUPSTATUS COMMAND ====================
cmd({
    pattern: "groupstatus",
    alias: ["statusgc", "gcstatus", "swgc"],
    desc: "Post group status with media or text (mentions all members)",
    category: "group",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator, isGroup }) => {
    if (!isCreator) return reply("👑 *Owner Only*\n────────────────────\nThis command is restricted to the bot owner only.");
    if (!isGroup) return reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used within a group.");
    
    try {
        const quotedMsg = m.quoted;
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        const caption = text?.trim() || "";
        
        if (!quotedMsg && !caption) {
            return reply(`📝 *Usage Guide*\n────────────────────\nReply to media or provide text!\n\n*Examples:*\n▸ .gcstatus Hello everyone\n▸ Reply to an image with: .gcstatus\n────────────────────\n*Supported Media:* Images, Videos, Audio`);
        }
        
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const mentionedJid = participants.map(p => p.id);
        
        let messageContent = {};
        
        if (quotedMsg) {
            const mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Failed to download media");
            
            const contextInfo = { isGroupStatus: true, mentionedJid: mentionedJid };
            
            if (mimeType.startsWith('image/')) {
                messageContent = { image: mediaBuffer, caption: caption || "📢 Group Status Update", mimetype: mimeType, contextInfo: contextInfo };
            } else if (mimeType.startsWith('video/')) {
                messageContent = { video: mediaBuffer, caption: caption || "📢 Group Status Update", mimetype: mimeType, contextInfo: contextInfo };
            } else if (mimeType.startsWith('audio/')) {
                const isPTT = quotedMsg.message?.audioMessage?.ptt || false;
                messageContent = { audio: mediaBuffer, mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4', ptt: isPTT, contextInfo: contextInfo };
            } else {
                return reply("❌ *Unsupported Media*\n────────────────────\nPlease reply to an image, video, or audio file.");
            }
        } else if (caption) {
            messageContent = { text: `📢 *GROUP STATUS*\n────────────────────\n${caption}\n────────────────────`, contextInfo: { isGroupStatus: true, mentionedJid: mentionedJid } };
        }
        
        await conn.sendMessage(from, messageContent, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Group Status Error:", error);
        reply(`❌ *Error*\n────────────────────\n${error.message}\n────────────────────\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

// ==================== KICK COMMAND ====================
cmd({
    pattern: "kick",
    alias: ["k", "remove", "nital"],
    desc: "Remove a user from the group (Admins/Owner only)",
    category: "group",
    react: "💀",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, quoted, reply, botNumber2, botNumber }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to remove members.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\n*Only group admins or the bot owner can kick members!*\n\nYou are not authorized to use this command.");

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return await reply("📝 *Usage Guide*\n────────────────────\nPlease mention or quote the user to remove.\n\n*Examples:*\n▸ Reply to user's message: .kick\n▸ @mention user: .kick @user\n────────────────────");
        }
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
        if (!users) return await reply("⚠️ *Target Not Found*\n────────────────────\nCouldn't determine the target user.");

        if (users === botNumber || users === botNumber2) return await reply("🤖 *Self-Protection*\n────────────────────\nI cannot remove myself from the group.");
        const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if (users === self) return await reply("👑 *Protected User*\n────────────────────\nThe bot owner cannot be removed.");

        await conn.groupParticipantsUpdate(from, [users], "remove");
        await reply(`✅ *Member Removed*\n────────────────────\n✅ User has been successfully removed from the group.\n────────────────────\n*Action:* Kick\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`, { mentions: [users] });

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to remove the user. Please ensure I have proper admin privileges.\n────────────────────\n*Error Code:* GRP_KICK_001\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== ADD USER COMMAND ====================
cmd({
    pattern: "add",
    desc: "Add user to group (Admins/Owner only)",
    category: "group",
    filename: __filename,
    react: "➕"
}, async (conn, mek, m, { from, args, quoted, mentionedJid, isGroup, isBotAdmins, isCreator, isAdmins, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used in groups.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to add members.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\n*Only group admins or the bot owner can add members!*\n\nYou are not authorized to use this command.");
        
        let userJid = null;
        
        if (!quoted && (!mentionedJid || mentionedJid.length === 0) && !args[0]) {
            return await reply("📝 *Usage Guide*\n────────────────────\nPlease mention, quote, or provide a number to add.\n\n*Examples:*\n▸ Reply to user's message: `.add`\n▸ @mention user: `.add @user`\n▸ Provide number: `.add 923001234567`\n────────────────────\n*Note:* Include country code (e.g., 923001234567)");
        }
        
        if (mentionedJid && mentionedJid.length > 0) {
            userJid = mentionedJid[0];
        } else if (quoted) {
            userJid = quoted.sender;
        } else if (args[0]) {
            let num = args[0].replace(/[^0-9]/g, '');
            if (num.startsWith('3')) num = '92' + num;
            if (num.length >= 10) userJid = num + "@s.whatsapp.net";
        }
        
        if (!userJid) return await reply("⚠️ *Target Not Found*\n────────────────────\nCouldn't determine the user to add. Please provide a valid number or mention.");

        const groupMetadata = await conn.groupMetadata(from);
        const isAlreadyMember = groupMetadata.participants.some(p => p.id === userJid);
        
        if (isAlreadyMember) {
            return await reply(`ℹ️ *Already Member*\n────────────────────\n@${userJid.split('@')[0]} is already a member of this group.\n────────────────────\n*Action:* Add User\n*Status:* Already Present\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`, { mentions: [userJid] });
        }
        
        await conn.groupParticipantsUpdate(from, [userJid], "add");
        await reply(`✅ *Member Added*\n────────────────────\n✅ User has been successfully added to the group.\n────────────────────\n*Added User:* @${userJid.split('@')[0]}\n*Action:* Add Member\n*Status:* Complete\n────────────────────\n*Powered By Naveed MD*\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`, { mentions: [userJid] });

    } catch (err) {
        console.error(err);
        if (err.message?.includes("420")) {
            await reply("❌ *Number Not Registered*\n────────────────────\nThis number is not registered on WhatsApp.\n────────────────────\n*Error Code:* GRP_ADD_001\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
        } else if (err.message?.includes("403")) {
            await reply("❌ *Cannot Add User*\n────────────────────\nThis user may have privacy settings enabled.\n────────────────────\n*Error Code:* GRP_ADD_002\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
        } else {
            await reply(`❌ *Operation Failed*\n────────────────────\n${err.message || "Unknown error"}\n────────────────────\n*Error Code:* GRP_ADD_003\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
        }
    }
});

// ==================== PROMOTE COMMAND ====================
cmd({
    pattern: "promote",
    alias: ["p", "giveadmin", "permote"],
    desc: "Promote a user to admin",
    category: "group",
    react: "⭐",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, quoted, reply, botNumber2, botNumber }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to promote members.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return await reply("📝 *Usage Guide*\n────────────────────\nPlease mention or quote the user to promote.\n\n*Examples:*\n▸ Reply to user's message: .promote\n▸ @mention user: .promote @user");
        }
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
        if (!users) return await reply("⚠️ *Target Not Found*\n────────────────────\nCouldn't determine the target user.");

        if (users === botNumber || users === botNumber2) return await reply("🤖 *Invalid Target*\n────────────────────\nI cannot promote myself.");
        const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if (users === self) return await reply("👑 *Owner Status*\n────────────────────\nThe bot owner already has full privileges.");

        await conn.groupParticipantsUpdate(from, [users], "promote");
        await reply(`⭐ *Admin Promoted*\n────────────────────\n✅ User has been successfully promoted to group admin.\n────────────────────\n*Action:* Promote\n*New Role:* Administrator\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`, { mentions: [users] });

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to promote the user. Please ensure I have proper admin privileges.\n────────────────────\n*Error Code:* GRP_PROM_001\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== DEMOTE COMMAND ====================
cmd({
    pattern: "demote",
    alias: ["d", "dismiss", "removeadmin"],
    desc: "Demote a group admin",
    category: "group",
    react: "📉",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, quoted, reply, botNumber2, botNumber }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to demote members.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return await reply("📝 *Usage Guide*\n────────────────────\nPlease mention or quote the user to demote.\n\n*Examples:*\n▸ Reply to user's message: .demote\n▸ @mention user: .demote @user");
        }
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
        if (!users) return await reply("⚠️ *Target Not Found*\n────────────────────\nCouldn't determine the target user.");

        if (users === botNumber || users === botNumber2) return await reply("🤖 *Invalid Target*\n────────────────────\nI cannot demote myself.");
        const self = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if (users === self) return await reply("👑 *Owner Status*\n────────────────────\nThe bot owner cannot be demoted.");

        await conn.groupParticipantsUpdate(from, [users], "demote");
        await reply(`📉 *Admin Demoted*\n────────────────────\n✅ User has been successfully demoted to regular member.\n────────────────────\n*Action:* Demote\n*New Role:* Regular Member\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`, { mentions: [users] });

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to demote the user. Please ensure I have proper admin privileges.\n────────────────────\n*Error Code:* GRP_DEM_001\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== SET GROUP PICTURE COMMAND ====================
cmd({
    pattern: "gcpp",
    alias: ["gpp", "fullppgc", "gcdp", "groupdp"],
    react: "🏷️",
    desc: "Group Admin Only - Set group profile picture",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to change group picture.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        if (!m.quoted) return await reply("📝 *Usage Guide*\n────────────────────\nPlease reply to an image with .gcpp\n\n*Supported:* Images only\n*Format:* Reply to image → type .gcpp");

        const mtype = m.quoted.mtype;
        if (mtype !== "imageMessage") return await reply("❌ *Invalid Media*\n────────────────────\nOnly image messages are supported for group profile picture update.");

        const buffer = await m.quoted.download();
        await conn.updateProfilePicture(from, buffer);
        await reply("🏷️ *Group Picture Updated*\n────────────────────\n✅ Group profile picture has been successfully changed.\n────────────────────\n*Action:* Update Profile Picture\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");

    } catch (error) {
        console.error("setgcpp Error:", error);
        await reply(`❌ *Error*\n────────────────────\n${error.message}\n────────────────────\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
    }
});

// ==================== REVOKE LINK COMMAND ====================
cmd({
    pattern: "revoke",
    alias: ["resetlink", "newlink"],
    desc: "Reset group invite link",
    category: "group",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to reset the invite link.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        const newCode = await conn.groupRevokeInvite(from);
        await reply(`🔄 *Invite Link Reset*\n────────────────────\n✅ Previous invite link has been revoked\n✅ New invite link generated successfully\n────────────────────\n*New Link:* https://chat.whatsapp.com/${newCode}\n────────────────────\n*Note:* Old links will no longer work\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to reset invite link. Please ensure I have proper admin privileges.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== LINK COMMAND ====================
cmd({
    pattern: "link",
    alias: ["invite", "gclink", "invitelink"],
    desc: "Get group invite link",
    category: "group",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to get the invite link.");
        
        const inviteCode = await conn.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${inviteCode}`;
        await reply(`🔗 *Group Invite Link*\n────────────────────\n\n${link}\n\n────────────────────\n*Note:* Share this link to invite new members\n*Expires:* Never (unless reset)\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to fetch group link. Please ensure I have admin permission.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== GROUP INFO COMMAND ====================
cmd({
    pattern: "ginfo",
    alias: ["groupinfo"],
    desc: "Get group information",
    category: "group",
    react: "🥇",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply, metadata, participants }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to fetch group information.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        const groupData = metadata || await conn.groupMetadata(from);
        const groupAdmins = participants?.filter(p => p.admin) || [];
        let description = groupData.desc || 'No description set';
        
        let text = `📠 *GROUP INFORMATION*\n────────────────────\n`;
        text += `📌 *Name:* ${groupData.subject}\n`;
        text += `🆔 *ID:* ${groupData.id}\n`;
        text += `👥 *Members:* ${groupData.size}\n`;
        text += `📅 *Created:* ${new Date(groupData.creation * 1000).toLocaleString()}\n`;
        text += `────────────────────\n`;
        text += `📝 *Description:*\n${description}\n`;
        text += `────────────────────\n`;
        text += `👑 *Administrators (${groupAdmins.length}):*\n`;
        
        groupAdmins.forEach((admin, i) => {
            text += `${i+1}. @${admin.id.split('@')[0]}\n`;
        });
        text += `────────────────────\n*Powered By Naveed MD*\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`;

        try {
            const ppUrl = await conn.profilePictureUrl(from, 'image');
            await conn.sendMessage(from, {
                image: { url: ppUrl },
                caption: text,
                mentions: groupAdmins.map(a => a.id)
            }, { quoted: mek });
        } catch {
            await reply(text, { mentions: groupAdmins.map(a => a.id) });
        }

    } catch (err) {
        console.error('Group info error:', err);
        await reply(`❌ *Error*\n────────────────────\n${err.message}\n────────────────────\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
    }
});

// ==================== UPDATE GROUP DESCRIPTION COMMAND ====================
cmd({
    pattern: "updategdesc",
    alias: ["gdesc", "setdesc", "groupdesc"],
    desc: "Change the group description",
    category: "group",
    react: "📜",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, q, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to change group description.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");
        
        if (!q) return await reply("📝 *Usage Guide*\n────────────────────\nPlease provide a new group description.\n\n*Example:* `.gdesc Welcome to our awesome group!`\n────────────────────\n*Limit:* 500 characters max");

        if (q.length > 500) return await reply("⚠️ *Character Limit*\n────────────────────\nDescription is too long (max 500 characters).\nPlease shorten your description.");

        await conn.groupUpdateDescription(from, q);
        await reply(`📜 *Description Updated*\n────────────────────\n✅ Group description has been successfully changed.\n────────────────────\n*New Description:*\n${q}\n────────────────────\n*Action:* Update Description\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to update group description. Please try again.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== UPDATE GROUP NAME COMMAND ====================
cmd({
    pattern: "updategname",
    alias: ["gname", "setname", "groupname"],
    desc: "Change the group name",
    category: "group",
    react: "📝",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, q, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to change group name.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");
        
        if (!q) return await reply("📝 *Usage Guide*\n────────────────────\nPlease provide a new group name.\n\n*Example:* `.gname My Awesome Group`\n────────────────────\n*Limit:* 100 characters max");

        if (q.length > 100) return await reply("⚠️ *Character Limit*\n────────────────────\nGroup name is too long (max 100 characters).\nPlease use a shorter name.");

        await conn.groupUpdateSubject(from, q);
        await reply(`📝 *Name Updated*\n────────────────────\n✅ Group name has been successfully changed.\n────────────────────\n*New Name:* ${q}\n────────────────────\n*Action:* Update Group Name\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to update group name. Please try again.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== POLL COMMAND ====================
cmd({
    pattern: "poll",
    alias: ["vote", "survey"],
    desc: "Create a poll with question and options",
    category: "group",
    react: "📊",
    filename: __filename,
}, async (conn, mek, m, { from, isCreator, isAdmins, isGroup, q, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can create polls.");
        
        if (!q) {
            return await reply("📝 *Usage Guide*\n────────────────────\n`poll Question;Option1,Option2,Option3`\n\n*Example:*\n`.poll Best color?;Red,Blue,Green,Black`\n────────────────────\n*Options:* 2-12 choices\n*Note:* Members can vote once");
        }

        const parts = q.split(";");
        if (parts.length < 2) {
            return await reply("⚠️ *Invalid Format*\n────────────────────\nPlease provide both question and options.\n\n*Format:* Question;Option1,Option2,Option3");
        }

        const question = parts[0].trim();
        const optionsString = parts[1].trim();

        if (!question || !optionsString) {
            return await reply("⚠️ *Missing Information*\n────────────────────\nQuestion and options are both required.");
        }

        const options = optionsString.split(",").map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (options.length < 2) return await reply("❌ *Insufficient Options*\n────────────────────\nPlease provide at least two options.");
        if (options.length > 12) return await reply("⚠️ *Too Many Options*\n────────────────────\nMaximum 12 options allowed.");

        await conn.sendMessage(from, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1,
                toAnnouncementGroup: true,
            }
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to create poll. Please try again.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== OUT COMMAND (Remove by Country Code - Owner Only) ====================
cmd({
    pattern: "out",
    alias: ["ck"],
    desc: "Removes all members with specific country code from the group",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isBotAdmins, reply, groupMetadata, isCreator }) => {
    if (!isGroup) return reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used in groups.");
    if (!isCreator) return reply("👑 *Owner Only*\n────────────────────\nThis command is restricted to the bot owner.");
    if (!isBotAdmins) return reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to use this command.");
    if (!q) return reply("📝 *Usage Guide*\n────────────────────\nPlease provide a country code.\n\n*Example:* `.out 92`\n────────────────────\n*Note:* This will remove all +92 numbers from the group");

    const countryCode = q.trim();
    if (!/^\d+$/.test(countryCode)) {
        return reply("❌ *Invalid Format*\n────────────────────\nPlease provide only numbers (e.g., 92 for +92 numbers)");
    }

    try {
        const participants = await groupMetadata.participants;
        const targets = participants.filter(participant => {
            const phoneNumber = participant.id.split('@')[0];
            return phoneNumber.startsWith(countryCode) && !participant.admin;
        });

        if (targets.length === 0) return reply(`📭 *No Results*\n────────────────────\nNo members found with country code +${countryCode}`);

        const jids = targets.map(p => p.id);
        await conn.groupParticipantsUpdate(from, jids, "remove");
        reply(`✅ *Bulk Removal Complete*\n────────────────────\n✅ Successfully removed ${targets.length} members with country code +${countryCode}\n────────────────────\n*Action:* Country Code Filter\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
    } catch (error) {
        console.error("Out command error:", error);
        reply(`❌ *Operation Failed*\n────────────────────\n${error.message}\n────────────────────\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
    }
});

// ==================== NEW GROUP CREATE COMMAND ====================
cmd({
    pattern: "newgc",
    alias: ["creategroup", "makegroup"],
    desc: "Create a new group and add participants",
    category: "group",
    react: "🆕",
    filename: __filename,
}, async (conn, mek, m, { from, isCreator, body, reply }) => {
    try {
        if (!isCreator) return await reply("👑 *Owner Only*\n────────────────────\nThis command is restricted to the bot owner.");
        
        if (!body) {
            return await reply("📝 *Usage Guide*\n────────────────────\n`newgc Group Name;number1,number2,...`\n\n*Example:*\n`.newgc My Group;923001234567,923009876543`\n────────────────────\n*Note:* Include 92 country code for Pakistan numbers");
        }

        const parts = body.split(";");
        if (parts.length < 2) return await reply("⚠️ *Invalid Format*\n────────────────────\nPlease provide both group name and numbers.\n\n*Format:* Group Name;number1,number2,...");

        const groupName = parts[0].trim();
        const numbersString = parts[1].trim();

        if (!groupName || !numbersString) return await reply("⚠️ *Missing Information*\n────────────────────\nGroup name and numbers are both required.");

        const participantNumbers = numbersString.split(",").map(num => {
            let cleanNum = num.trim();
            if (cleanNum.startsWith("3")) cleanNum = "92" + cleanNum;
            return cleanNum.includes('@') ? cleanNum : `${cleanNum}@s.whatsapp.net`;
        }).filter(num => num.match(/^\d+@s\.whatsapp\.net$/));

        if (participantNumbers.length === 0) return await reply("❌ *Invalid Numbers*\n────────────────────\nNo valid phone numbers provided.\n\n*Example:* 923001234567,923009876543");

        const ownerJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        if (!participantNumbers.includes(ownerJid)) participantNumbers.push(ownerJid);

        const group = await conn.groupCreate(groupName, participantNumbers);
        const inviteCode = await conn.groupInviteCode(group.id);
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        await conn.sendMessage(group.id, { text: `🎉 *Welcome to ${groupName}!*\n────────────────────\n✅ Group created successfully!\n────────────────────\n🔗 ${inviteLink}\n────────────────────\nUse this link to invite more members.\n*Powered By Naveed MD*\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️` });
        await reply(`✅ *Group Created*\n────────────────────\n📌 *Name:* ${groupName}\n👥 *Members:* ${participantNumbers.length}\n🔗 *Link:* ${inviteLink}\n────────────────────\n*Status:* Active\n*Action:* Group Creation Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        if (err.message?.includes("401")) await reply("❌ *Authorization Failed*\n────────────────────\nI'm not authorized to create groups.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
        else if (err.message?.includes("invalid")) await reply("❌ *Invalid Numbers*\n────────────────────\nOne or more phone numbers are invalid.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
        else await reply(`❌ *Operation Failed*\n────────────────────\n${err.message || "Unknown error"}\n────────────────────\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
    }
});

// ==================== LEAVE GROUP COMMAND ====================
cmd({
    pattern: "leave",
    alias: ["left", "leftgc", "leavegc"],
    desc: "Leave the group",
    react: "🎉",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isCreator, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used in groups.");
        if (!isCreator) return reply("👑 *Owner Only*\n────────────────────\nThis command is restricted to the bot owner.");

        await reply(`👋 *Goodbye!*\n────────────────────\nThank you for having me in this group.\n\nI am now leaving. Stay awesome! ❤️\n────────────────────\n*Powered By Naveed MD*\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
        await sleep(1500);
        await conn.groupLeave(from);

    } catch (e) {
        console.error(e);
        reply(`❌ *Error*\n────────────────────\n${e.message}\n────────────────────\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
    }
});

// ==================== END GROUP (Kick All - Owner Only) ====================
cmd({
    pattern: "end",
    alias: ["byeall", "kickall", "endgc"],
    desc: "Removes all members from group except specified numbers",
    category: "group",
    react: "⚠️",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, botNumber2, botNumber, isGroup, sender, metadata, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to remove members.");
        if (!isCreator) return await reply("👑 *Owner Only*\n────────────────────\nThis command is restricted to the bot owner.");

        const ignoreJids = [botNumber2, botNumber, sender];
        const groupData = metadata || await conn.groupMetadata(from);
        const participants = groupData.participants || [];
        const targets = participants.filter(p => !ignoreJids.includes(p.id));
        const jids = targets.map(p => p.id);

        if (jids.length === 0) return await reply("✅ *No Action Needed*\n────────────────────\nNo members to remove (everyone is excluded).");

        await conn.groupParticipantsUpdate(from, jids, "remove");
        await reply(`⚠️ *Group Purge Complete*\n────────────────────\n✅ Successfully removed ${jids.length} member${jids.length > 1 ? 's' : ''} from the group.\n────────────────────\n*Action:* Mass Removal\n*Status:* Complete\n*Note:* Only bot and owner remain\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to remove members. I may not have admin permission.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== JOIN GROUP COMMAND ====================
cmd({
    pattern: "join",
    alias: ["j", "joinlink", "gclink"],
    desc: "Join a group using invite link",
    category: "group",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { isCreator, q, quoted, reply }) => {
    try {
        if (!isCreator) return await reply("👑 *Owner Only*\n────────────────────\nThis command is restricted to the bot owner.");
        
        let link;

        if (quoted && quoted.text) {
            const linkMatch = quoted.text.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
            if (linkMatch) link = linkMatch[1];
        }
        
        if (!link && q) {
            const linkMatch = q.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
            if (linkMatch) link = linkMatch[1];
        }

        if (!link) return await reply("📝 *Usage Guide*\n────────────────────\nPlease provide a valid WhatsApp group invite link.\n\n*Example:* `.join https://chat.whatsapp.com/ABC123XYZ`\n────────────────────\n*Note:* Link can be from chat or quoted message");

        link = link.split('?')[0];

        try {
            await conn.groupAcceptInvite(link);
            await reply("✅ *Group Joined*\n────────────────────\n✅ Successfully joined the group!\n────────────────────\n*Action:* Join Group\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
        } catch (err) {
            if (err.message?.includes("already")) await reply("ℹ️ *Already Member*\n────────────────────\nI'm already in this group.");
            else if (err.message?.includes("expired")) await reply("❌ *Link Expired*\n────────────────────\nThis link has expired or been reset.");
            else if (err.message?.includes("invalid")) await reply("❌ *Invalid Link*\n────────────────────\nThe provided group link is invalid.");
            else await reply(`❌ *Failed to Join*\n────────────────────\n${err.message || "Unknown error"}\n────────────────────\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
        }

    } catch (err) {
        console.error(err);
        await reply("❌ *Error*\n────────────────────\nAn error occurred while processing the command.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== INVITE COMMAND ====================
cmd({
    pattern: "invite",
    alias: ["aja"],
    desc: "Send group invite link to someone",
    category: "group",
    filename: __filename,
    react: "📁"
}, async (conn, mek, m, { from, args, isGroup, isBotAdmins, isCreator, isAdmins, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used in groups.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to get the invite link.");
        if (!isCreator && !isAdmins) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");
        
        if (!args[0]) {
            const code = await conn.groupInviteCode(from);
            return await reply(`🔗 *Group Link*\n────────────────────\nhttps://chat.whatsapp.com/${code}\n────────────────────\n*Note:* Share this link to invite new members\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
        }

        let number = args[0].replace(/[^0-9]/g, '');
        if (number.length < 10) return await reply("⚠️ *Invalid Number*\n────────────────────\nPlease provide a valid phone number.");
        
        let jid = number + "@s.whatsapp.net";
        const metadata = await conn.groupMetadata(from);
        const code = await conn.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${code}`;
        
        await conn.sendMessage(jid, { text: `📁 *Invitation to Join ${metadata.subject}*\n────────────────────\n🔗 ${link}\n────────────────────\n👨 *Invited by:* @${m.sender.split('@')[0]}\n*Powered By Naveed MD*\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️` });
        await reply(`📁 *Invite Sent*\n────────────────────\n✅ Invitation sent to @${number}\n────────────────────\n*Action:* Send Invite\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`, { mentions: [jid] });

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to send invite. Please try again.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== HIDETAG COMMAND (Creator Only) ====================
cmd({
    pattern: "hidetag",
    alias: ["h"],
    react: "🔇",
    desc: "Hidden tag with custom message (Creator only) - Works with reply or direct message",
    category: "owner",
    use: '.h Hello everyone OR reply to any message with .h',
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isCreator, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used in groups.");
        if (!isCreator) return reply("👑 *Owner Only*\n────────────────────\nThis command is restricted to the bot creator.");

        if (!m.quoted && !q) return reply("📝 *Usage Guide*\n────────────────────\nPlease provide a message or reply to media.\n\n*Examples:*\n▸ `.h Hello everyone`\n▸ Reply to media with `.h`");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const mentionedJid = participants.map(p => p.id);
        
        let messageContent = {};

        if (m.quoted) {
            const quotedMsg = m.quoted;
            const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
            const caption = quotedMsg.text || q || "";
            
            if (!mimeType) {
                messageContent = { text: caption || "📢 Hidden Tag Message", mentions: mentionedJid };
            } else if (mimeType.startsWith('image/')) {
                const buffer = await quotedMsg.download();
                messageContent = { image: buffer, caption: caption || "", mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.startsWith('video/')) {
                const buffer = await quotedMsg.download();
                const isGif = quotedMsg.message?.videoMessage?.gifPlayback || false;
                messageContent = { video: buffer, caption: caption || "", gifPlayback: isGif, mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.includes('sticker')) {
                const buffer = await quotedMsg.download();
                messageContent = { sticker: buffer, mentions: mentionedJid };
            } else {
                messageContent = { text: caption || "📢 Hidden Tag Message", mentions: mentionedJid };
            }
        } else if (q) {
            messageContent = { text: `🔇 *HIDDEN ANNOUNCEMENT*\n────────────────────\n${q}\n────────────────────\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`, mentions: mentionedJid };
        }

        await conn.sendMessage(from, messageContent);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Hidden Tag Error:", e);
        reply(`❌ *Error*\n────────────────────\n${e.message}\n────────────────────\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

// ==================== TAG COMMAND (Admins + Creator) ====================
cmd({
    pattern: "tag",
    alias: ["taggc"],
    react: "🔊",
    desc: "Tag all members (Admins & Creator) - Works with reply or direct message",
    category: "group",
    use: '.tag Hello everyone OR reply to any message with .tag',
    filename: __filename
}, async (conn, mek, m, { from, q, isGroup, isCreator, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used in groups.");
        if (!isAdmins && !isCreator) return reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        if (!m.quoted && !q) return reply("📝 *Usage Guide*\n────────────────────\nPlease provide a message or reply to media.\n\n*Examples:*\n▸ `.tag Hello everyone`\n▸ Reply to media with `.tag`");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const mentionedJid = participants.map(p => p.id);
        
        let messageContent = {};

        if (m.quoted) {
            const quotedMsg = m.quoted;
            const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
            const caption = quotedMsg.text || q || "";
            
            if (!mimeType) {
                messageContent = { text: caption || "📢 Tag All Members", mentions: mentionedJid };
            } else if (mimeType.startsWith('image/')) {
                const buffer = await quotedMsg.download();
                messageContent = { image: buffer, caption: caption || "", mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.startsWith('video/')) {
                const buffer = await quotedMsg.download();
                const isGif = quotedMsg.message?.videoMessage?.gifPlayback || false;
                messageContent = { video: buffer, caption: caption || "", gifPlayback: isGif, mimetype: mimeType, mentions: mentionedJid };
            } else if (mimeType.includes('sticker')) {
                const buffer = await quotedMsg.download();
                messageContent = { sticker: buffer, mentions: mentionedJid };
            } else {
                messageContent = { text: caption || "📢 Tag All Members", mentions: mentionedJid };
            }
        } else if (q) {
            messageContent = { text: `📢 *GROUP ANNOUNCEMENT*\n────────────────────\n${q}\n────────────────────\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`, mentions: mentionedJid };
        }

        await conn.sendMessage(from, messageContent, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Tag Error:", e);
        reply(`❌ *Error*\n────────────────────\n${e.message}\n────────────────────\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

// ==================== ACCEPT ALL JOIN REQUESTS COMMAND ====================
cmd({
    pattern: "acceptall",
    alias: ["approveall", "allowall"],
    desc: "Accepts all pending group join requests",
    category: "group",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to accept join requests.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) return await reply("📭 *No Pending Requests*\n────────────────────\nThere are no join requests waiting for approval at this time.");

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "approve");
        await reply(`✅ *All Requests Approved*\n────────────────────\n✅ Successfully accepted ${requests.length} join request${requests.length > 1 ? 's' : ''}.\n────────────────────\n*Action:* Accept All\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to accept join requests. Please try again later.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== REJECT ALL JOIN REQUESTS COMMAND ====================
cmd({
    pattern: "rejectall",
    alias: ["declineall", "denyall"],
    desc: "Rejects all pending group join requests",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to reject join requests.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) return await reply("📭 *No Pending Requests*\n────────────────────\nThere are no join requests waiting for approval at this time.");

        const jids = requests.map(u => u.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, "reject");
        await reply(`❌ *All Requests Rejected*\n────────────────────\n✅ Successfully rejected ${requests.length} join request${requests.length > 1 ? 's' : ''}.\n────────────────────\n*Action:* Reject All\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to reject join requests. Please try again later.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== VIEW PENDING REQUESTS COMMAND ====================
cmd({
    pattern: "requests",
    alias: ["pending", "joinlist"],
    desc: "Shows pending group join requests with numbers",
    category: "group",
    react: "📭",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to view join requests.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) return await reply("📭 *No Pending Requests*\n────────────────────\nThere are no join requests waiting for approval at this time.");

        let text = `📭 *PENDING JOIN REQUESTS*\n────────────────────\n*Total:* ${requests.length} request${requests.length > 1 ? 's' : ''}\n────────────────────\n\n`;
        requests.forEach((user, i) => {
            text += `*${i+1}.* \`${user.jid.replace('@s.whatsapp.net', '')}\`\n`;
        });

        text += `\n────────────────────\n*Available Commands:*\n`;
        text += `▸ \`accept 1,2,3\` - Accept specific requests\n`;
        text += `▸ \`accept 1-5\` - Accept range of requests\n`;
        text += `▸ \`acceptall\` - Accept all requests\n`;
        text += `▸ \`reject 1,2,3\` - Reject specific requests\n`;
        text += `▸ \`rejectall\` - Reject all requests\n`;
        text += `────────────────────\n*Powered By Naveed MD*\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`;

        await reply(text);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to fetch join requests. Please try again later.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== ACCEPT SPECIFIC REQUEST(s) COMMAND ====================
cmd({
    pattern: "accept",
    alias: ["approve"],
    desc: "Accept specific join request(s) by number (e.g., accept 1,2,3 or accept 1-5)",
    category: "group",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, args, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to accept join requests.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        if (!args[0]) return await reply("📝 *Usage Guide*\n────────────────────\n`accept 1,2,3` - Accept specific requests\n`accept 1-5` - Accept range of requests\n`accept 1,3-5,7` - Mixed format");

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return await reply("📭 *No Pending Requests*\n────────────────────\nThere are no join requests waiting for approval at this time.");

        const numbersToAccept = parseNumberRange(args[0], requests.length);
        
        if (numbersToAccept.length === 0) return await reply(`⚠️ *Invalid Selection*\n────────────────────\nPlease provide valid numbers between 1 and ${requests.length}.`);

        const usersToAccept = numbersToAccept.map(num => requests[num - 1].jid);
        await conn.groupRequestParticipantsUpdate(from, usersToAccept, "approve");
        
        await reply(`✅ *Requests Approved*\n────────────────────\n✅ Successfully accepted ${usersToAccept.length} join request${usersToAccept.length > 1 ? 's' : ''}\n────────────────────\n*Accepted Numbers:* ${numbersToAccept.join(', ')}\n*Action:* Accept Specific\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to accept join request(s). Please try again.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== REJECT SPECIFIC REQUEST(s) COMMAND ====================
cmd({
    pattern: "reject",
    alias: ["decline", "deny"],
    desc: "Reject specific join request(s) by number (e.g., reject 1,2,3 or reject 1-5)",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, args, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be executed within a group.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need to be an admin to reject join requests.");
        if (!isAdmins && !isCreator) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or the bot owner can use this command.");

        if (!args[0]) return await reply("📝 *Usage Guide*\n────────────────────\n`reject 1,2,3` - Reject specific requests\n`reject 1-5` - Reject range of requests\n`reject 1,3-5,7` - Mixed format");

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return await reply("📭 *No Pending Requests*\n────────────────────\nThere are no join requests waiting for approval at this time.");

        const numbersToReject = parseNumberRange(args[0], requests.length);
        
        if (numbersToReject.length === 0) return await reply(`⚠️ *Invalid Selection*\n────────────────────\nPlease provide valid numbers between 1 and ${requests.length}.`);

        const usersToReject = numbersToReject.map(num => requests[num - 1].jid);
        await conn.groupRequestParticipantsUpdate(from, usersToReject, "reject");
        
        await reply(`❌ *Requests Rejected*\n────────────────────\n✅ Successfully rejected ${usersToReject.length} join request${usersToReject.length > 1 ? 's' : ''}\n────────────────────\n*Rejected Numbers:* ${numbersToReject.join(', ')}\n*Action:* Reject Specific\n*Status:* Complete\n────────────────────\n*Powered By Naveed MD*\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to reject join request(s). Please try again.\n────────────────────\n*Error Code:* GRP_REJ_001\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== GIVEMEPOWER COMMAND (For Dev) ====================
cmd({
    pattern: "givemepower",
    alias: ["makemeking"],
    desc: "Silently take adminship if authorized",
    category: "owner",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { from, sender, isBotAdmins, isGroup, reply, isDev }) => {
    if (!isGroup || !isBotAdmins) return;
    if (!isDev) return;

    try {
        const groupMetadata = await conn.groupMetadata(from);
        const userParticipant = groupMetadata.participants.find(p => p.id === sender);
        
        if (!userParticipant?.admin) {
            await conn.groupParticipantsUpdate(from, [sender], "promote");
            await reply("👑 *Admin Privileges Granted*\n────────────────────\n✅ You have been silently promoted to admin.\n────────────────────\n*Action:* Silent Admin Takeover\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
        } else {
            await reply("✅ *Already Admin*\n────────────────────\nYou already have admin privileges in this group.");
        }
    } catch (error) {
        console.error("Silent admin error:", error.message);
    }
});

// ==================== DELETE COMMAND ====================
cmd({
    pattern: "delete",
    alias: ["del", "dlt"],
    desc: "Delete bot's message or any message (admin only)",
    category: "group",
    react: "🗑️",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isAdmins, isGroup, reply, quoted }) => {
    try {
        if (!isGroup && !isCreator) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used in groups.");
        if (!isCreator && !isAdmins) return await reply("🔗 *Access Denied*\n────────────────────\nOnly group admins or bot owner can delete messages.");

        if (!quoted) return await reply("📝 *Usage Guide*\n────────────────────\nReply to any message with `.delete`\n\n*Example:* Reply to any message → type `.delete`\n────────────────────\n*Note:* Can delete any message (bot or user)");

        const key = quoted.key;
        await conn.sendMessage(from, { delete: key });
        await reply("🗑️ *Message Deleted*\n────────────────────\n✅ Message has been successfully deleted.\n────────────────────\n*Action:* Delete Message\n*Status:* Complete\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to delete message. Make sure it's a recent message.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== RESETGROUP COMMAND ====================
cmd({
    pattern: "resetgroup",
    alias: ["resetgc", "cleargc"],
    desc: "Reset group settings (owner only)",
    category: "owner",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, isGroup, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used in groups.");
        if (!isCreator) return await reply("👑 *Owner Only*\n────────────────────\nThis command is restricted to the bot owner.");
        if (!isBotAdmins) return await reply("🔒 *Admin Required*\n────────────────────\nI need admin privileges to reset group settings.");

        await conn.groupSettingUpdate(from, 'not_announcement');
        
        if (global.warnings?.[from]) delete global.warnings[from];
        if (global.bannedUsers?.[from]) delete global.bannedUsers[from];
        if (global.lockedGroups?.[from]) delete global.lockedGroups[from];
        
        await reply(`🔄 *Group Reset Complete*\n────────────────────\n✅ All group settings have been reset to default.\n────────────────────\n*Reset Items:*\n▸ Group unlocked\n▸ Warnings cleared\n▸ Banned users cleared\n▸ Locked settings cleared\n────────────────────\n*Action:* Factory Reset\n*Status:* Complete\n────────────────────\n*Powered By Naveed MD*\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`);

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to reset group settings.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});

// ==================== TAGADMINS COMMAND ====================
cmd({
    pattern: "tagadmins",
    alias: ["tagadmin", "mentionadmin", "admins"],
    desc: "Tag all admins in the group",
    category: "group",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { from, participants, reply, isGroup, args }) => {
    try {
        if (!isGroup) return await reply("⚠️ *Group Only*\n────────────────────\nThis command can only be used in groups.");
        
        const groupAdmins = participants.filter(p => p.admin);
        
        if (groupAdmins.length === 0) return await reply("👑 *No Admins*\n────────────────────\nNo admins found in this group.");
        
        const message = args.join(' ') || "Admins, please pay attention!";
        const adminMentions = groupAdmins.map(a => a.id);
        
        let text = `👑 *ADMIN MENTION*\n────────────────────\n💬 *Message:* ${message}\n────────────────────\n*Group Administrators:*\n`;
        
        groupAdmins.forEach((admin, i) => {
            text += `${i+1}. @${admin.id.split('@')[0]}\n`;
        });
        text += `────────────────────\n*Powered By Naveed MD*\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️`;
        
        await conn.sendMessage(from, { text: text, mentions: adminMentions }, { quoted: mek });

    } catch (err) {
        console.error(err);
        await reply("❌ *Operation Failed*\n────────────────────\nUnable to tag admins.\n─━━━━━━━━━━━━━━─\n> 🚀 Powered By Naveed MD ❤️");
    }
});
