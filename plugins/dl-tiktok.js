const axios = require("axios");
const cheerio = require('cheerio');
const { cmd } = require("../command");

const TIMEOUT = 20000;
const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

// ========== TikTok Scraper Function ==========
async function tiktok(url) { 
    try {
        const r = await api.post(
            "https://savetik.co/api/ajaxSearch",
            new URLSearchParams({ q: url, lang: "id" }).toString(),
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Requested-With": "XMLHttpRequest",
                    origin: "https://savetik.co",
                    referer: "https://savetik.co/id",
                }
            }
        );

        if (!r.data?.data) {
            return { status: false, msg: "No data from Savetik" };
        }

        const $ = cheerio.load(r.data.data);

        const mp4 = $('.dl-action a')
            .filter((i, el) => $(el).text().includes("MP4") && !$(el).text().includes("HD"))
            .attr("href");

        const mp4_hd = $('.dl-action a')
            .filter((i, el) => $(el).text().includes("HD"))
            .attr("href");

        const mp3 = $('.dl-action a')
            .filter((i, el) => $(el).text().toLowerCase().includes("mp3"))
            .attr("href");

        return {
            status: true,
            title: $("h3").first().text().trim() || "TikTok Media",
            mp4,
            mp4_hd,
            mp3,
        };
    } catch (e) { 
        return { status: false, msg: e.message };
    }
}

// ========== TikTok Command ==========
cmd({ 
    pattern: "tiktok", 
    alias: ["tt", "tiktokdl"], 
    desc: "Download TikTok video & audio", 
    category: "download", 
    filename: __filename 
}, async (conn, mek, m, { from, args, reply, userConfig }) => { 
    try { 
        const botConfig = userConfig;

        if (!args[0]) { 
            return reply("❌ *TikTok link do bhai*\n\nExample:\n.tiktok https://vm.tiktok.com/xxxx"); 
        } 

        const url = args[0]; 
        const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/tiktok?url=${encodeURIComponent(url)}`; 

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } }); 

        const res = await api.get(apiUrl); 
        const data = res.data;

        if (!data.status || !data.data) { 
            return reply("❌ *Download failed!*"); 
        }

        const video = data.data.video;
        const audio = data.data.audio;
        const title = data.data.title || "TikTok Video";
        const author = data.data.author?.nickname || "Unknown";

        const caption = `🎵 *TIKTOK DOWNLOADER*\n\n👤 Author: ${author}\n📝 Title: ${title}\n\n⚡ *${botConfig.CAPTION || "Powered by AS-BOT"}*`; 

        await conn.sendMessage(from, { 
            video: { url: video }, 
            caption: caption 
        }, { quoted: mek }); 

        await conn.sendMessage(from, { 
            audio: { url: audio }, 
            mimetype: "audio/mpeg", 
            ptt: false, 
            fileName: `${author}.mp3` 
        }, { quoted: mek }); 

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } }); 

    } catch (e) { 
        console.error("TikTok Error:", e); 
        reply("❌ *Error aa gaya! Thori dair baad try karo*"); 
    } 
});

// ========== TikTok 2 Command ==========
cmd({
    pattern: "tiktok2",
    alias: ["tt2", "ttdl2"],
    desc: "Download TikTok video",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, userConfig }) => { 
    try {
        const botConfig = userConfig;

        if (!text) return reply("❌ Usage:\n.tiktok2 <tiktok url>");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const res = await tiktok(text);
        if (!res.status) return reply("❌ " + res.msg);

        if (!res.mp4 && !res.mp4_hd) {
            return reply("❌ Video not found");
        }

        await conn.sendMessage(from, { 
            video: { url: res.mp4_hd || res.mp4 }, 
            caption: `🎬 TikTok MEGA\n© ${botConfig.CAPTION || "Powered by AS-BOT"}`,
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("TikTok2 Error:", err);
        reply("❌ Video download failed");
    }
});

// ========== TikTok MP3 Command ==========
cmd({
    pattern: "ttmp3",
    alias: ["tiktokmp3"],
    desc: "Download TikTok mp3 audio",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("❌ Usage:\n.ttmp3 <tiktok url>");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const res = await tiktok(text);
        if (!res.status) return reply("❌ " + res.msg);

        if (!res.mp3) {
            return reply("❌ MP3 not available for this video");
        }

        await conn.sendMessage(from, { 
            audio: { url: res.mp3 }, 
            mimetype: "audio/mpeg",
            fileName: `${res.title}.mp3`,
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("TTMP3 Error:", err);
        reply("❌ MP3 download failed");
    }
});