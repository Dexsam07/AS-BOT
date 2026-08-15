const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

// ========== IMAGE DOWNLOAD COMMAND (FIXED) ==========
cmd({
    pattern: "img",
    alias: ["image", "getimg", "imgdl", "photo"],
    desc: "Download images from Google",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, userConfig }) => {
    try {
        const botConfig = userConfig;
        const query = args.join(" ");

        if (!query) {
            return reply(`❌ *Image name do bhai!*\n\n📌 *Example:*\n.img Eid Mubarak\n.img nature beauty\n.img car`);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // ✅ FIXED API - Primary API
        const apiUrl = `https://api.nexoracle.com/search/image?apikey=free_key@maher_apis&q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.result || !data.result.length) {
            // ✅ FALLBACK API
            const fallbackUrl = `https://pikabotzapi.vercel.app/search/image?apikey=anya-md&q=${encodeURIComponent(query)}`;
            const fallbackRes = await axios.get(fallbackUrl);
            
            if (!fallbackRes.data || !fallbackRes.data.result || !fallbackRes.data.result.length) {
                await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
                return reply(`❌ No image found for *"${query}"*!`);
            }
            
            const randomImage = fallbackRes.data.result[Math.floor(Math.random() * fallbackRes.data.result.length)];
            const caption = `🖼️ *IMAGE DOWNLOADER*\n\n📌 *Search:* ${query}\n📸 *Source:* Google\n📥 *Quality:* HD\n\n> *${botConfig.CAPTION || "Powered by AS-BOT"}*`;

            await conn.sendMessage(from, {
                image: { url: randomImage },
                caption: caption
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
            return;
        }

        const randomImage = data.result[Math.floor(Math.random() * data.result.length)];
        
        const caption = `🖼️ *IMAGE DOWNLOADER*\n\n📌 *Search:* ${query}\n📸 *Source:* Google\n📥 *Quality:* HD\n\n> *${botConfig.CAPTION || "Powered by AS-BOT"}*`;

        await conn.sendMessage(from, {
            image: { url: randomImage },
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Image Download Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply(`❌ *Error aa gaya!*\n\n${error.message || "Something went wrong."}`);
    }
});

// ========== WALLPAPER COMMAND (FIXED) ==========
cmd({
    pattern: "wall",
    alias: ["wallpaper", "wp"],
    desc: "Download wallpapers",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, userConfig }) => {
    try {
        const botConfig = userConfig;
        const query = args.join(" ") || "nature";

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // ✅ FIXED API
        const apiUrl = `https://api.nexoracle.com/search/wallpaper?apikey=free_key@maher_apis&q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.result || !data.result.length) {
            // ✅ FALLBACK API
            const fallbackUrl = `https://pikabotzapi.vercel.app/random/randomwall/?apikey=anya-md&query=${encodeURIComponent(query)}`;
            const fallbackRes = await axios.get(fallbackUrl);
            
            if (!fallbackRes.data || !fallbackRes.data.status || !fallbackRes.data.imgUrl) {
                await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
                return reply(`❌ No wallpaper found for *"${query}"*!`);
            }

            const caption = `🖼️ *WALLPAPER DOWNLOADER*\n\n📌 *Search:* ${query}\n📸 *Source:* Pinterest\n\n> *${botConfig.CAPTION || "Powered by AS-BOT"}*`;

            await conn.sendMessage(from, {
                image: { url: fallbackRes.data.imgUrl },
                caption: caption
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
            return;
        }

        const randomWall = data.result[Math.floor(Math.random() * data.result.length)];
        
        const caption = `🖼️ *WALLPAPER DOWNLOADER*\n\n📌 *Search:* ${query}\n📸 *Source:* Pinterest\n\n> *${botConfig.CAPTION || "Powered by AS-BOT"}*`;

        await conn.sendMessage(from, {
            image: { url: randomWall },
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Wallpaper Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply(`❌ *Error aa gaya!*\n\n${error.message || "Something went wrong."}`);
    }
});

// ========== STICKER TO IMAGE COMMAND (FIXED) ==========
cmd({
    pattern: "stoimg",
    alias: ["stickertoimg", "s2i"],
    desc: "Convert sticker to image",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const quoted = m.quoted || m;
        
        // ✅ CHECK IF REPLY IS STICKER
        if (!quoted || !quoted.message?.stickerMessage) {
            return reply("❌ *Please reply to a sticker!*\n\nExample: Reply to a sticker with `.stoimg`");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // ✅ FIXED: Use downloadMediaMessage from Baileys
        const buffer = await downloadMediaMessage(
            quoted,
            "buffer",
            {},
            { 
                logger: console,
                reuploadRequest: conn.updateMediaMessage
            }
        );

        if (!buffer) {
            throw new Error("Failed to download sticker");
        }

        // Send as image
        await conn.sendMessage(from, {
            image: buffer,
            caption: "✅ *Sticker converted to image!*"
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("StoImg Error:", error);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply(`❌ *Failed to convert sticker to image!*\n\n${error.message || "Something went wrong."}`);
    }
});
