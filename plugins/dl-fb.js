const axios = require("axios");
const { cmd } = require("../command");

const TIMEOUT = 20000;
const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

// ========== Facebook Download Command ==========
cmd({ 
    pattern: "fb",
    alias: ["facebook"],
    desc: "Download Facebook videos (HD only)",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, q, reply, userConfig }) => {
    try { 
        const botConfig = userConfig;

        if (!q) return reply("📌 Please provide a Facebook video link.");
        if (!q.includes("facebook.com")) return reply("❌ Invalid Facebook link.");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/fbdl?url=${encodeURIComponent(q)}`;
        const { data } = await api.get(apiUrl);

        if (!data.status || !data.data || !data.data.high) {
            return reply("❌ Failed to fetch Facebook video. Try another link.");
        }

        const { title, thumbnail, high } = data.data;

        const caption = `🎬 *Facebook Video Downloader*\n\n📖 *Title:* ${title}\n\n🔰 *${botConfig.CAPTION || "Powered by AS-BOT"}*`;

        await conn.sendMessage(from, {
            video: { url: high },
            caption: caption,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) { 
        console.error("Facebook HD Downloader Error:", e);
        reply(`❌ Error occurred: ${e.message}`);
    }
});