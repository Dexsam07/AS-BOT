const crypto = require('crypto');
const fs = require('fs');
const http = require("http");
const https = require("https");
const axios = require("axios");
const { cmd } = require("../command");
const cheerio = require('cheerio');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');

const UA = "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36";
const TIMEOUT = 20000;

const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

// ========== UTILITY FUNCTIONS ========== 
const isValidUrl = (url) => {
    return /^https?:\/\/.+/i.test(url);
};

const getFileNameFromUrl = (url) => {
    try {
        return decodeURIComponent(url.split("/").pop().split("?")[0]);
    } catch {
        return "file.zip";
    }
};

const getVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|\/(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
};

// ========== Wallpaper Command ==========
cmd({
    pattern: "wallpaper",
    alias: ["randomwall", "rwall"],
    desc: "Download random wallpapers based on keywords.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, userConfig }) => {
    try {
        const botConfig = userConfig;
        const query = args.join(" ") || "random";
        const apiUrl = `https://pikabotzapi.vercel.app/random/randomwall/?apikey=anya-md&query=${encodeURIComponent(query)}`;

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const { data } = await api.get(apiUrl);

        if (data.status && data.imgUrl) {
            const caption = `🌌 *Random Wallpaper: ${query}*\n\n> *© ${botConfig.CAPTION || "Powered by AS-BOT"}*`;
            await conn.sendMessage(from, { image: { url: data.imgUrl }, caption }, { quoted: m });
            await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
        } else {
            reply(`❌ No wallpaper found for *"${query}"*.`);
        }
    } catch (error) {
        console.error("Wallpaper Error:", error);
        reply("❌ An error occurred while fetching the wallpaper. Please try again.");
    }
});

// ========== Threads Command ==========
cmd({
    pattern: "threads",
    alias: ["th", "thdl"],
    desc: "Download Threads videos/images",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, userConfig }) => {
    try {
        const botConfig = userConfig;
        const THREADS_API = "https://backend1.tioo.eu.org/threads?url=";
        const query = args.join(" ").trim();

        if (!query) {
            return reply("🧵 *THREADS DOWNLOADER*\n\nUsage:\n• `.threads threads-link`\n\nExample:\n`.threads https://www.threads.net/@user/post/...`");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const { data } = await api.get(THREADS_API + encodeURIComponent(query));

        if (!data || !data.status) {
            return reply("❌ Media not found.");
        }

        const type = data.type;
        const mediaUrl = data.video;

        if (!mediaUrl) {
            return reply("❌ No downloadable media found.");
        }

        const caption = `🧵 *THREADS DOWNLOAD*\n\n📦 *Type:* ${type.toUpperCase()}\n\n━━━━━━━━━━━━━━\n${botConfig.CAPTION || "Powered by AS-BOT"}`;

        if (type === "video") {
            await conn.sendMessage(from, { 
                video: { url: mediaUrl },
                mimetype: "video/mp4",
                caption: caption
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { 
                image: { url: mediaUrl },
                caption: caption
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("THREADS ERROR:", err.message);
        reply("❌ *Download failed*\nPlease check the Threads link and try again.");
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});

// ========== Pinterest Downloader ==========
cmd({
    pattern: "pinterest",
    alias: ["pin", "pindl"],
    desc: "Download Pinterest media",
    category: "download",
    react: "📌",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, userConfig }) => {
    try {
        const botConfig = userConfig;
        const botCaption = botConfig.CAPTION || "POWERED BY AS-BOT";

        if (!q) {
            return await reply("📌 Please provide a Pinterest link.");
        }

        if (!q.includes("pinterest.com") && !q.includes("pin.it")) {
            return await reply("❌ Invalid Pinterest URL.\nExample:\n.pinterest https://pin.it/xxxx");
        }

        await conn.sendMessage(from, {
            react: { text: "⏳", key: m.key }
        });

        const apiUrl = `https://jawad-tech.vercel.app/download/pinterest?url=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data?.status || !data?.result?.url) {
            return await reply("❌ Failed to fetch media. Try another link.");
        }

        const result = data.result;
        const isVideo = result.type === "video";

        const caption = `\n📌 *Pinterest Downloader*\n\n` +
                        `📝 Title : ${result.title || "No title"}\n` +
                        `🎞 Type  : ${isVideo ? "Video" : "Image"}\n` +
                        `⚡ Quality : HD\n\n` +
                        `> ${botCaption}🚀\n`;

        await conn.sendMessage(
            from,
            {
                document: { url: result.url },
                mimetype: isVideo ? "video/mp4" : "image/jpeg",
                fileName: isVideo
                    ? "AS-BOT-Pinterest.mp4"
                    : "AS-BOT-Pinterest.jpg",
                caption
            },
            {
                quoted: mek
            }
        );

        await conn.sendMessage(from, {
            react: { text: "✅", key: m.key }
        });

    } catch (err) {
        console.error("Pinterest Download Error:", err);
        await reply("⚠️ Error downloading media. Please try again.");
        await conn.sendMessage(from, {
            react: { text: "❌", key: m.key }
        });
    }
});
