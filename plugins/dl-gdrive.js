const axios = require("axios");
const { cmd } = require("../command");

const TIMEOUT = 20000;
const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

cmd({ 
    pattern: "gdrive",
    alias: ["gdrivedownload", "gdownloader"],
    desc: "Download files from Google Drive.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, userConfig }) => {
    try {
        const botConfig = userConfig;
        const gdriveUrl = args[0];

        if (!gdriveUrl || !gdriveUrl.includes("drive.google.com")) {
            return reply("❌ Please provide a valid Google Drive URL.\nExample: `.gdrive https://drive.google.com/file/...`");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const gdriveApiUrl = `https://api.nexoracle.com/downloader/gdrive?apikey=free_key@maher_apis&url=${encodeURIComponent(gdriveUrl)}`;
        const { data } = await axios.get(gdriveApiUrl);

        if (!data || data.status !== 200 || !data.result || !data.result.downloadUrl) {
            return reply("⚠️ Failed to fetch Google Drive file. Please check the link or try again later.");
        }

        const { downloadUrl, fileName, fileSize, mimetype } = data.result;
        const caption = `📥 *GOOGLE DRIVE DOWNLOAD*\n──────────────────\n📄 *Name:* ${fileName}\n📦 *Size:* ${fileSize}\n⚙️ *MIME:* ${mimetype}\n──────────────────\n> © ${botConfig.CAPTION || "AS-BOT"}* ⚡\n> 👑 DEVELOPER AS-BOT`;

        if (mimetype.startsWith("image/")) {
            await conn.sendMessage(from, { 
                image: { url: downloadUrl }, 
                caption, 
                contextInfo: { 
                    mentionedJid: [m.sender], 
                    forwardingScore: 999, 
                    isForwarded: true, 
                    forwardedNewsletterMessageInfo: { 
                        newsletterJid: "120363406449026172@newsletter", 
                        newsletterName: 'DEX SHYAM TECH',
                        serverMessageId: 143 
                    } 
                } 
            }, { quoted: mek });
        } else if (mimetype.startsWith("video/")) {
            await conn.sendMessage(from, { 
                video: { url: downloadUrl }, 
                caption, 
                contextInfo: { 
                    mentionedJid: [m.sender], 
                    forwardingScore: 999, 
                    isForwarded: true, 
                    forwardedNewsletterMessageInfo: { 
                        newsletterJid: "120363406449026172@newsletter", 
                        newsletterName: 'DEX SHYAM TECH',
                        serverMessageId: 143 
                    } 
                } 
            }, { quoted: mek });
        } else if (mimetype.startsWith("audio/")) {
            await conn.sendMessage(from, { 
                audio: { url: downloadUrl }, 
                mimetype: mimetype, 
                ptt: false, 
                contextInfo: { 
                    mentionedJid: [m.sender], 
                    forwardingScore: 999, 
                    isForwarded: true, 
                    forwardedNewsletterMessageInfo: { 
                        newsletterJid: "120363406449026172@newsletter", 
                        newsletterName: 'DEX SHYAM TECH',
                        serverMessageId: 143 
                    } 
                } 
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { 
                document: { url: downloadUrl }, 
                mimetype: mimetype || "application/octet-stream", 
                fileName: fileName || "file", 
                caption, 
                contextInfo: { 
                    mentionedJid: [m.sender], 
                    forwardingScore: 999, 
                    isForwarded: true, 
                    forwardedNewsletterMessageInfo: { 
                        newsletterJid: "120363406449026172@newsletter", 
                        newsletterName: 'DEX SHYAM TECH',
                        serverMessageId: 143 
                    } 
                } 
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Error in gdrive cmd:", error);
        reply("❌ An error occurred while processing your request. Please try again later.");
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});