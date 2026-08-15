const axios = require("axios");
const { cmd } = require("../command");

const TIMEOUT = 20000;
const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

cmd({
    pattern: "apk",
    desc: "Download APK from Aptoide",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, userConfig }) => {
    try {
        const botConfig = userConfig;

        if (!q) {
            return reply("❌ Please provide an apk name to search.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${q}/limit=1`;
        const response = await api.get(apiUrl);
        const data = response.data;

        if (!data || !data.datalist || !data.datalist.list.length) {
            return reply("⚠️ No results found for the given app name.");
        }

        const app = data.datalist.list[0];
        const appSize = (app.size / 1048576).toFixed(2);

        const caption = `*Apk Downloader*\n┃ 📦 *Name:* ${app.name}\n┃ 🏋 *Size:* ${appSize} MB\n┃ 📦 *Package:* ${app.package}\n┃ 📅 *Updated On:* ${app.updated}\n┃ 👨‍💻 *Developer:* ${app.developer.name}\n╰━━━━━━━━━━━━━━━┈⊷\n🔗 *${botConfig.CAPTION || "Powered by AS-BOT"}*`;

        await conn.sendMessage(from, { react: { text: "⬆\ufe0f", key: m.key } });

        await conn.sendMessage(from, { 
            document: { url: app.file.path_alt }, 
            fileName: `${app.name}.apk`,
            mimetype: "application/vnd.android.package-archive",
            caption: caption
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("APK Error:", error);
        reply("❌ An error occurred while fetching the APK. Please try again.");
    }
});
