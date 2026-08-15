const axios = require("axios");
const { cmd } = require("../command");

const TIMEOUT = 20000;
const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

cmd({
    pattern: "gitclone",
    alias: ["clone", "repo"],
    desc: "Clone any GitHub repo as ZIP",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, reply, q, userConfig }) => {
    try {
        if (!q) return reply("*❌ Please provide GitHub repo link!*");
        if (!q.includes("github.com")) return reply("*❌ Only GitHub repo links allowed!*");

        let repo = q.replace(".git", "");
        let name = repo.split("/").pop();
        let zipUrl = repo + "/archive/refs/heads/main.zip";

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const res = await api.get(zipUrl, { responseType: 'arraybuffer' });

        await conn.sendMessage(from, { 
            document: Buffer.from(res.data), 
            mimetype: 'application/zip', 
            fileName: `${name}.zip` 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("GitClone Error:", err);
        reply("*❌ Failed to clone repo! Make sure repo is public & has main branch.*");
    }
});
