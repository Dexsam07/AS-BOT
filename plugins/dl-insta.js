const axios = require("axios");
const { cmd } = require("../command");

const TIMEOUT = 20000;
const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

cmd({ 
    pattern: "insta",
    alias: ["Instagram", "instadl"],
    desc: "Download Instagram video with audio",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, userConfig }) => {
    try {
        const botConfig = userConfig;

        if (!args[0]) {
            return reply("❌ *Instagram link do bhai*\n\nExample:\n.insta https://www.instagram.com/reel/xxxx");
        }

        const igUrl = args[0];
        const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(igUrl)}`;

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const res = await api.get(apiUrl);
        const json = res.data;

        if (!json.status || !json.data || json.data.length === 0) {
            return reply("❌ *Media nahi mili!*");
        }

        const caption = `📸 *INSTAGRAM DOWNLOADER*\n\n⚡ *${botConfig.CAPTION || "Powered by AS-BOT"}*`;

        for (let media of json.data) {
            if (media.type === "video") {
                await conn.sendMessage(from, { 
                    video: { url: media.url }, 
                    caption: caption 
                }, { quoted: mek });

                await conn.sendMessage(from, { 
                    audio: { url: media.url }, 
                    mimetype: "audio/mpeg", 
                    ptt: false, 
                    fileName: "Instagram-Audio.mp3" 
                }, { quoted: mek });
            } else if (media.type === "image") {
                await conn.sendMessage(from, { 
                    image: { url: media.url }, 
                    caption: caption 
                }, { quoted: mek });
            } 
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("Insta Error:", err);
        reply("❌ *Error aa gaya! Baad mein try karo*");
    }
});

cmd({ 
    pattern: "insta2",
    alias: ["ig2", "igdl2"],
    desc: "Download Instagram video",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, userConfig }) => {
    try {
        const botConfig = userConfig;

        if (!args[0]) {
            return reply("❌ *Instagram link do bhai*\n\nExample:\n.insta2 https://www.instagram.com/reel/xxxx");
        }

        const igUrl = args[0];
        const apiUrl = `https://backend1.tioo.eu.org/api/downloader/igdl?url=${encodeURIComponent(igUrl)}`;

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const res = await api.get(apiUrl);
        const data = res.data;

        if (!Array.isArray(data) || !data[0] || !data[0].status) { 
            return reply("❌ *Media nahi mili!*");
        }

        const media = data[0];
        const caption = `📸 *INSTAGRAM DOWNLOADER V2*\n\n⚡ *${botConfig.CAPTION || "Powered by AS-BOT"}*`;

        await conn.sendMessage(from, { 
            video: { url: media.url }, 
            caption: caption 
                }, { quoted: mek });

        await conn.sendMessage(from, { 
            audio: { url: media.url }, 
            mimetype: "audio/mpeg", 
            ptt: false, 
            fileName: "Instagram-Audio.mp3" 
                }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("Insta2 Error:", err);
        reply("❌ *Error aa gaya! Baad mein try karo*");
    }
});