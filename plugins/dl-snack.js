const axios = require("axios");
const { cmd } = require("../command");

const TIMEOUT = 20000;
const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

cmd({
    pattern: "snackdl",
    alias: ["snack", "snackvideo"],
    desc: "Download SnackVideo video",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, userConfig }) => {
    try {
        const botConfig = userConfig;

        if (!args[0]) {
            return reply("❌ *SnackVideo link do bhai*\n\nExample:\n.snackvideo https://s.snackvideo.com/p/xxxx");
        }

        const snackUrl = args[0];
        const apiUrl = `https://backend1.tioo.eu.org/api/downloader/snackvideo?url=${encodeURIComponent(snackUrl)}`;

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const res = await api.get(apiUrl);
        const data = res.data;

        if (!data || data.status !== true || !data.videoUrl) {
            return reply("❌ *Media nahi mili!*");
        }

        const caption = `*SNACK•VIDEO DL*\n\n© *${botConfig.CAPTION || "Powered by AS-BOT"}*`;

        await conn.sendMessage(from, { 
            video: { url: data.videoUrl }, 
            caption: caption 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("SnackDL Error:", err);
        reply("❌ *Error aa gaya! Baad mein try karo*");
    }
});
