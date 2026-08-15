// plugins/autodl.js - Complete CJS Version
// Brand Preference: AS-BOT

const { cmd } = require('../command.js');
const config = require('../config.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const converter = require('../data/converter.js');
const fetch = require('node-fetch');

// Platform URLs and their APIs - Using new APIs
const platforms = { 
    youtube: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-_]{11})/i,
        api: "https://jawad-tech.vercel.app/download/ytdl",
        method: "video"
    },
    facebook: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(facebook\.com|fb\.watch)\/[^\s]+/i,
        api: "https://jawad-tech.vercel.app/downloader",
        method: "video"
    },
    instagram: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(instagram\.com|instagr\.am)\/[^\s]+/i,
        api: "https://api-aswin-sparky.koyeb.app/api/downloader/igdl",
        method: "media"
    },
    tiktok: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com|vt\.tiktok\.com)\/[^\s]+/i,
        method: "video" // No api here, will use multiple APIs in handler
    },
    pinterest: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(pinterest\.com|pin\.it)\/[^\s]+/i,
        api: "https://jawad-tech.vercel.app/download/pinterest",
        method: "media"
    }
};

// Create caption for downloads (same for all platforms)
const createCaption = () => {
    return `> *_⏳️ © ${config.BOT_NAME || 'AS-BOT'} Auto Downloader✅️_*`;
};

// Handle API-based downloads
async function handleInstagram(client, from, url, caption, message) {
    try {
        const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);

        if (!response.data?.status || !response.data.data?.length) {
            throw new Error("Failed to fetch Instagram media");
        }
        
        const mediaData = response.data.data;

        for (const item of mediaData) {
            const mediaType = item.type === 'video' ? 'video' : 'image';
            
            await client.sendMessage(from, {
                [mediaType]: { url: item.url },
                caption: caption
            }, { quoted: message });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return;
    } catch (error) { 
        console.error("Instagram download error:", error);
        throw error;
    }
}

// TikTok handler using multiple APIs
async function handleTikTok(client, from, url, caption, message) {
    try {
        let videoUrl;

        // Try First API
        try {
            const api1 = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`;
            const res1 = await axios.get(api1);
            const data1 = res1.data;

            if (data1?.status && data1?.result) {
                videoUrl = data1.result;
            } else {
                throw new Error("First API failed");
            }
        } catch (api1Error) {
            // Try Second API
            try {
                const api2 = `https://jawad-tech.vercel.app/download/ttdl?url=${encodeURIComponent(url)}`;
                const res2 = await axios.get(api2);
                const data2 = res2.data;

                if (data2?.status && data2?.result) {
                    videoUrl = data2.result;
                } else {
                    throw new Error("Second API also failed");
                }
            } catch (api2Error) {
                // Try Third API as fallback
                const api3 = `https://api.deline.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`;
                const res3 = await axios.get(api3);
                const data3 = res3.data;
                
                if (!data3?.status || !data3?.result?.download) {
                    throw new Error("All TikTok APIs failed");
                }
                videoUrl = data3.result.download;
            }
        }

        if (!videoUrl) {
            throw new Error("No video URL found");
        }

        await client.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: caption
        }, { quoted: message });
        
        return;
    } catch (error) {
        console.error("TikTok download error:", error);
        throw error;
    }
}

// YouTube handler
async function handleYouTube(client, from, url, caption, message) {
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);

        if (!response.data?.status || !response.data.result?.mp4) {
            throw new Error("Failed to fetch YouTube video");
        }
        
        await client.sendMessage(from, {
            video: { url: response.data.result.mp4 },
            caption: caption
        }, { quoted: message });
        
        return;
    } catch (error) {
        console.error("YouTube download error:", error);
        throw error;
    }
}

// Facebook handler
async function handleFacebook(client, from, url, caption, message) {
    try {
        const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);

        if (!response.data?.status || !response.data.result?.length) {
            throw new Error("Failed to fetch Facebook video");
        }
        
        const video = response.data.result.find(v => v.quality === "HD") || 
                     response.data.result.find(v => v.quality === "SD");
                     
        if (!video?.url) {
            throw new Error("No video URL found");
        }
        
        await client.sendMessage(from, {
            video: { url: video.url },
            caption: caption
        }, { quoted: message });
        
        return;
    } catch (error) {
        console.error("Facebook download error:", error);
        throw error;
    }
}

// Pinterest handler
async function handlePinterest(client, from, url, caption, message) {
    try {
        const apiUrl = `https://jawad-tech.vercel.app/download/pinterest?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);

        if (!response.data?.status || !response.data.result?.url) {
            throw new Error("Failed to fetch Pinterest media");
        }
        
        const isVideo = response.data.result.type === 'video';
        
        await client.sendMessage(from, {
            [isVideo ? 'video' : 'image']: { url: response.data.result.url },
            caption: caption
        }, { quoted: message });
        
        return;
    } catch (error) {
        console.error("Pinterest download error:", error);
        throw error;
    }
}

// Handle API-based downloads dispatcher
async function handleApiDownload(client, from, url, platformType, caption, message) {
    try {
        switch (platformType) { 
            case "instagram":
                return await handleInstagram(client, from, url, caption, message);
            case "tiktok":
                return await handleTikTok(client, from, url, caption, message);
            case "youtube":
                return await handleYouTube(client, from, url, caption, message);
            case "facebook":
                return await handleFacebook(client, from, url, caption, message);
            case "pinterest":
                return await handlePinterest(client, from, url, caption, message);
            default:
                throw new Error("Unsupported platform");
        }
    } catch (error) {
        console.error(`API download error for ${platformType}:`, error);
        throw error;
    }
}

// ================= AUTO DOWNLOADER =================
cmd({
    'on': "body"
}, async (client, message, store, {
    from,
    body,
    isGroup,
    isCreator,
    reply
}) => {
    try {
        // Check AUTO_DOWNLOADER config
        if (config.AUTO_DOWNLOAD === "true") {
            // Works for both inbox and groups - no additional check needed
        } 
        else if (config.AUTO_DOWNLOAD === "inbox") {
            if (isGroup) return; // Only works in inbox
        } 
        else if (config.AUTO_DOWNLOAD === "group") {
            if (!isGroup) return; // Only works in groups
        }
        else if (config.AUTO_DOWNLOAD === "owner") {
            if (!isCreator) return; // Only works for owner
        } 
        else {
            // Anything else ("false", "off", "disable") - DISABLE
            return;
        }
        
        // Check if message contains any platform URL
        let matchedPlatform = null;
        let matchedUrl = null;
        for (const [platform, data] of Object.entries(platforms)) {
            const match = body.match(data.pattern);
            if (match) {
                matchedPlatform = platform;
                matchedUrl = match[0];
                break;
            }
        }
        
        // Skip if no platform matched
        if (!matchedPlatform || !matchedUrl) return;

        const caption = createCaption();
        
        // Show processing reaction
        await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

        try {
            await handleApiDownload(client, from, matchedUrl, matchedPlatform, caption, message);
            await client.sendMessage(from, { react: { text: '✅', key: message.key } });
        } catch (apiError) {
            console.error(`Auto-downloader error for ${matchedPlatform}:`, apiError);
            await client.sendMessage(from, { react: { text: '❌', key: message.key } });
        }

    } catch (error) {
        console.error("Auto-downloader error:", error);
    }
});

// ================= ANTI BAD WORDS =================
let antibad = config.ANTI_BAD || false;
cmd({
    on: "body",
    filename: __filename
}, async (conn, mek, m, {
    from,
    body,
    sender,
    isGroup,
    reply,
    isAdmins,
    isBotAdmins,
    isCreator
}) => {
    try {
        // Basic conditions
        if (!isGroup || !body) return;
        if (antibad !== "true") return;

        if (isAdmins && !isBotAdmins) return;
        
        // Bad words list
        const badWords = [
            "sexy", "sex", "xxx", "fuck",
            "kiss", "lips", "lun",
            "chutiya", "gando",
            "pakaya", "huththa", "mia"
        ];

        const text = body.toLowerCase();
        const detected = badWords.some(word => text.includes(word));

        if (!detected) return;

        // Delete message
        try {
            await conn.sendMessage(from, { delete: m.key });
        } catch (e) {
            console.error("Failed to delete message:", e);
        }

        // Warning message
        const userNumber = sender.split("@")[0];
        const warnMsg =
            `〔 🚫 BAD WORD DETECTED 〕\n\n` +
            `@${userNumber} Warning! Bad language is not allowed.`;

        try {
            await conn.sendMessage(from, {
                text: warnMsg,
                mentions: [sender]
            });
        } catch (e) {
            console.error("Failed to send warning:", e);
        }

    } catch (err) {
        console.error("ANTI_BAD ERROR:", err);
    }
});

// ================= MENTION REPLY WITH VOICE =================
// VoiceClip URLs
const voiceClips = [
    'https://files.catbox.moe/pw4yuu.mp3',
    'https://files.catbox.moe/tuueyw.mp3',
    'https://files.catbox.moe/q56rza.mp3',
    'https://files.catbox.moe/ldrebe.mp3',
    'https://files.catbox.moe/cpjqjd.mp3',
    'https://files.catbox.moe/v5c4fd.mp3',
    'https://files.catbox.moe/naub62.mp3',
    'https://files.catbox.moe/ez7wvh.mp3',
    'https://files.catbox.moe/3ruryr.mp3',
    'https://files.catbox.moe/vxfry5.mp3',
    'https://files.catbox.moe/hk2fjw.mp3',
    'https://files.catbox.moe/pvymqf.mp3',
    'https://files.catbox.moe/md2jm5.mp3',
    'https://files.catbox.moe/ypx92a.mp3',
    'https://files.catbox.moe/7tv2do.mp3',
    'https://files.catbox.moe/sr8k3y.mp3'
];

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

cmd(
    { on: "body" },
    async (conn, m, store, { isGroup }) => {
        try {
            // Extract botLid safely
            const botLid = conn?.user?.lid
                ? conn.user.lid.split(":")[0] + "@lid"
                : null;

            if (!botLid) return;

            const mek = m.mek || m;

            // Ignore self messages
            if (mek.key?.fromMe) return;

            // Config check
            if (config.MENTION_REPLY !== 'true') return;

            // Only groups
            if (!isGroup) return;

            const mentioned = m.mentionedJid || [];

            // botLid mention check
            if (!mentioned.includes(botLid)) return;

            const chatId = m.chat;

            // Presence animation
            await conn.sendPresenceUpdate('recording', chatId);

            // Select random voice clip
            const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];

            // Fetch audio
            const audioResponse = await fetch(randomClip);

            if (!audioResponse.ok) return;

            const arrayBuffer = await audioResponse.arrayBuffer();
            const audioBuffer = Buffer.from(arrayBuffer);

            // Delay before sending
            await delay(3000);

            // Convert to PTT
            const pttAudio = await converter.toPTT(audioBuffer, 'mp3');

            if (!pttAudio) return;

            // Send voice message with externalAdReply
            await conn.sendMessage(
                chatId,
                {
                    audio: pttAudio,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                    contextInfo: {
                        externalAdReply: {
                            title: config.BOT_NAME || "AS-BOT",
                            body: "Hanji Kisne Yad Kia",
                            thumbnailUrl: "https://files.catbox.moe/pw4yuu.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o",
                            mediaType: 1,
                            renderLargerThumbnail: false,
                            showAdAttribution: true
                        }
                    }
                },
                { quoted: m }
            );

        } catch (err) {
            console.error("❌ MentionReply Error:", err);
        }
    }
);

// ================= HELPER FUNCTION =================
const normalize = (text) => text?.toLowerCase().trim();

// ================= AUTO REPLY =================
cmd({ 
    on: "body"
}, async (conn, mek, m, { body, isMe, isDev }) => { 
    try {
        if (!config.AUTO_REPLY === "true") return;
        if (isMe) return;
        if (isDev) return;
        
        const filePath = path.join(__dirname, '../lib/autoreply.json');
        if (!fs.existsSync(filePath)) return;

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const msg = normalize(body);

        if (!msg) return;

        for (const key in data) {
            if (msg === normalize(key)) {
                await m.reply(data[key]);
                break;
            }
        }

    } catch (err) {
        console.error("AutoReply Error:", err);
    }
});

// ================= AUTO STICKER =================
cmd({ 
    on: "body"
}, async (conn, mek, m, { from, body, isMe, isDev }) => {
    try {
        if (!config.AUTO_STICKER === "true") return;
        if (isMe) return;
        if (isDev) return;
        
        const filePath = path.join(__dirname, '../lib/autosticker.json');
        if (!fs.existsSync(filePath)) return;

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const msg = normalize(body);

        if (!msg) return;

        for (const key in data) {
            if (msg === normalize(key)) {
                const stickerPath = path.join(
                    __dirname,
                    '../lib/autosticker',
                    data[key]
                );

                if (!fs.existsSync(stickerPath)) {
                    console.log("Sticker missing:", stickerPath);
                    return;
                }

                const buffer = fs.readFileSync(stickerPath);

                await conn.sendMessage(from, {
                    sticker: buffer
                }, { quoted: mek });

                break;
            }
        }

    } catch (err) {
        console.error("AutoSticker Error:", err);
    }
});

// ================= AUTO REACT ON CHANNEL POSTS (NEW) =================
cmd({
    on: "body",
    desc: "Auto react on channel posts",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, isChannel }) => {
    try {
        // ✅ Check if auto channel react is enabled
        if (config.AUTO_CHANNEL_REACT !== "true") return;
        
        // ✅ Sirf channel posts par react karega
        if (!isChannel) return;
        
        // ✅ 300+ emojis ka pool (random selection)
        const emojis = [
            '❤️', '🔥', '💯', '🥰', '🩷', '🧡', '💛', '💚', '💙', '💜', 
            '🤎', '🖤', '🤍', '😍', '😘', '🥳', '🎉', '👏', '💪', '🙌',
            '✨', '🌟', '⭐', '🌺', '🌸', '🌹', '💐', '🎊', '🎈', '🎁',
            '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '♥️', '♠️',
            '😊', '😃', '😄', '😁', '😆', '😂', '🤣', '😺', '😸', '😻',
            '😽', '🙀', '😹', '😼', '😾', '🐱', '🐈', '🐕', '🦮', '🐩',
            '🌻', '🌷', '🌼', '🌿', '🍀', '🌳', '🌈', '☀️', '⭐', '🌙',
            '🎶', '🎵', '🎤', '🎧', '🎼', '📱', '💻', '⌨️', '🖥️', '📷',
            '📸', '🎥', '🎬', '🎮', '🕹️', '🎯', '🏆', '🥇', '🥈', '🥉',
            '💎', '👑', '💍', '🔮', '🧿', '🗿', '⚡', '💨', '🌊', '🔥'
        ];
        
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        // ✅ React on the message (channel post)
        await conn.sendMessage(from, {
            react: { text: randomEmoji, key: m.key }
        });
        
        console.log(`✅ Auto reacted with ${randomEmoji} on channel post`);
        
    } catch (e) {
        console.error("Auto React Channel Error:", e);
    }
});
