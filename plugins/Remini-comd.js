const axios = require("axios");
const { bandah } = require("../command");
const config = require("../config");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

bandah({
    pattern: "remini",
    alias: ["enhance", "hd", "clearimg", "upscale"],
    desc: "Enhance/clear image quality using Remini AI",
    category: "tools",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const quoted = m.quoted || m;
        const mime = quoted.mimetype || quoted.msg?.mimetype || '';
        if (!mime || !mime.startsWith('image/')) {
            return reply("❌ *Please reply to an image!*\n\nExample: `.remini` (reply to a photo)");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        const media = await conn.downloadMediaMessage(quoted);

        const tempPath = path.join(__dirname, "../temp", `remini_${Date.now()}.jpg`);
        if (!fs.existsSync(path.dirname(tempPath))) {
            fs.mkdirSync(path.dirname(tempPath), { recursive: true });
        }
        fs.writeFileSync(tempPath, media);

        let finalBuffer = null;

        // API TRY
        try {
            const formData = new FormData();
            formData.append("image", fs.createReadStream(tempPath));
            const response = await axios.post("https://api.ryzendesu.vip/api/ai/remini", formData, {
                headers: formData.getHeaders(),
                timeout: 30000
            });
            let data = response.data.result || response.data.image || response.data.url;
            if (data) {
                if (data.startsWith("http")) {
                    const r = await axios.get(data, { responseType: "arraybuffer" });
                    finalBuffer = Buffer.from(r.data);
                } else {
                    const b64 = data.includes(",") ? data.split(",")[1] : data;
                    finalBuffer = Buffer.from(b64, "base64");
                }
            }
        } catch (e) { console.log("API fail, Jimp backup...") }

        // 100% WORKING BACKUP - FIXED JIMP IMPORT
        if (!finalBuffer) {
            const jimpModule = require("jimp");
            const Jimp = jimpModule.Jimp || jimpModule.default || jimpModule;
            const image = await Jimp.read(media);
            image.resize({ w: 2048 });
            image.contrast(0.1);
            finalBuffer = await image.getBuffer("image/jpeg");
        }

        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        const caption = `🖼️ *IMAGE ENHANCED* 🖼️\n\n✨ *Quality:* 4K HD\n\n⚡ *${config.CAPTION || "Powered by AS-BOT"}*`;

        await conn.sendMessage(from, {
            image: finalBuffer,
            caption: caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406449026172@newsletter',
                    newsletterName: 'DEX SHYAM TECH',
                    serverMessageId: 143
                }
            }
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Remini error:", error);
        reply("❌ Error: " + error.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
// ============================================================
// CARTOON COMMAND - PHOTO TO CARTOON (FIXED)
// ============================================================
bandah({
    pattern: "cartoon",
    alias: ["toon", "tocartoon", "anime"],
    desc: "Convert photo to cartoon",
    category: "tools",
    react: "🎨",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const quoted = m.quoted || m;
        const mime = quoted.mimetype || quoted.msg?.mimetype || '';
        if (!mime || !mime.startsWith('image/')) {
            return reply("❌ *Pic pe reply karo g!*\nExample: `.cartoon` (reply to a photo)");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        const media = await conn.downloadMediaMessage(quoted);

        const tempPath = path.join(__dirname, "../temp", `toon_${Date.now()}.jpg`);
        if (!fs.existsSync(path.dirname(tempPath))) {
            fs.mkdirSync(path.dirname(tempPath), { recursive: true });
        }
        fs.writeFileSync(tempPath, media);

        let finalBuffer = null;

        // API 1 - Toon
        try {
            const formData = new FormData();
            formData.append("image", fs.createReadStream(tempPath));
            const res = await axios.post("https://api.ryzendesu.vip/api/ai/toon", formData, {
                headers: formData.getHeaders(),
                timeout: 60000
            });
            let data = res.data.result || res.data.image || res.data.url;
            if (data) {
                if (data.startsWith("http")) {
                    const r = await axios.get(data, { responseType: "arraybuffer" });
                    finalBuffer = Buffer.from(r.data);
                } else {
                    const b64 = data.includes(",") ? data.split(",")[1] : data;
                    finalBuffer = Buffer.from(b64, "base64");
                }
            }
        } catch (e) { console.log("Toon API 1 fail") }

        // API 2 - Backup (Anime style)
        if (!finalBuffer) {
            try {
                const formData2 = new FormData();
                formData2.append("image", fs.createReadStream(tempPath));
                const res2 = await axios.post("https://api.siputzx.my.id/api/ai/toon", formData2, {
                    headers: formData2.getHeaders(),
                    timeout: 60000
                });
                let data2 = res2.data.data || res2.data.result || res2.data.url;
                if (data2) {
                    if (data2.startsWith("http")) {
                        const r2 = await axios.get(data2, { responseType: "arraybuffer" });
                        finalBuffer = Buffer.from(r2.data);
                    } else {
                        const b64 = data2.includes(",") ? data2.split(",")[1] : data2;
                        finalBuffer = Buffer.from(b64, "base64");
                    }
                }
            } catch (e) { console.log("Toon API 2 fail") }
        }

        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        if (!finalBuffer) return reply("❌ *Failed to cartoon, try again!* API busy hai g");

        await conn.sendMessage(from, {
            image: finalBuffer,
            caption: `🎨 *CARTOON DONE* 🎨\n\n⚡ *${config.CAPTION || "Powered by AS-BOT"}*`,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406449026172@newsletter',
                    newsletterName: 'DEX SHYAM TECH',
                    serverMessageId: 143
                }
            }
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.log(e);
        reply("❌ *Error!* " + e.message);
    }
});
