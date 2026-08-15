const axios = require("axios");
const { cmd } = require("../command");

const TIMEOUT = 20000;
const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

cmd({ 
    pattern: "mediafire",
    alias: ["mfire"],
    desc: "Download any file from MediaFire.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, userConfig }) => {
    try {
        const botConfig = userConfig;

        if (!q) return reply("❌ Please provide a valid MediaFire link.");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const apiUrl = `https://backend1.tioo.eu.org/api/downloader/mediafire?url=${encodeURIComponent(q)}`;
        const { data } = await api.get(apiUrl);

        if (!data || data.status !== true || !data.url) {
            return reply("⚠️ Failed to fetch MediaFire file. Please check the link or try again later.");
        }

        const name = data.filename;
        const size = data.filesizeH || data.filesize;
        const date = data.upload_date;
        const mime = data.mimetype || "application/octet-stream";
        const link = data.url;

        await conn.sendMessage(from, { react: { text: "⬆\ufe0f", key: m.key } });

        const caption = `*\n🛡\ufe0f MEDIAFIRE DL 🛡\ufe0f*\n─────────────────────\n📄 *Name:* ${name}\n📦 *Size:* ${size}\n🕒 *Uploaded:* ${date}\n⚙️ *MIME:* ${mime}\n─────────────────────\n📥 *${botConfig.CAPTION || "Powered by AS-BOT"}*`;

        if (mime.startsWith("image/")) {
            await conn.sendMessage(from, { 
                image: { url: link }, 
                caption 
            }, { quoted: m });
        } else if (mime.startsWith("video/")) {
            await conn.sendMessage(from, { 
                video: { url: link }, 
                caption 
            }, { quoted: m });
        } else if (mime.startsWith("audio/")) {
            await conn.sendMessage(from, { 
                audio: { url: link }, 
                mimetype: mime, 
                ptt: false 
            }, { quoted: m });
        } else {
            await conn.sendMessage(from, { 
                document: { url: link }, 
                mimetype: mime, 
                fileName: name, 
                caption 
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Error in mediafire cmd:", error);
        reply("❌ An error occurred while processing your request. Please try again later.");
    }
});