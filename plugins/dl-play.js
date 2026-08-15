const crypto = require('crypto');
const https = require("https");
const axios = require("axios");
const { cmd } = require("../command");

const TIMEOUT = 20000;
const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT,...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT,...config })
};

async function searchYouTube(query) {
    const url = "https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW4";
    const postData = JSON.stringify({
        query: query,
        context: { client: { clientName: "WEB", clientVersion: "2.20240701.01.00" } }
    });
    const options = { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } };
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject("JSON parse failed"); } });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function yts(options) {
    try {
        let query = typeof options === "string"? options : options.videoId;
        const data = await searchYouTube(query);
        let videos = [];
        const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || data.contents || [];
        sections.forEach(section => {
            const items = section.itemSectionRenderer?.contents || [];
            items.forEach(item => {
                const video = item.videoRenderer;
                if (video && video.videoId) videos.push(video);
            });
        });
        const formatted = videos.map(video => ({
            title: video.title?.runs?.[0]?.text || "No Title",
            videoId: video.videoId,
            url: `https://youtube.com/watch?v=${video.videoId}`,
            thumbnail: video.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
            timestamp: video.lengthText?.simpleText || "0:00",
            author: { name: video.ownerText?.runs?.[0]?.text || "Unknown" }
        }));
        if (typeof options === "object" && options.videoId) return formatted[0] || { title: "YouTube Video", videoId: options.videoId, url: `https://youtube.com/watch?v=${options.videoId}`, thumbnail: `https://i.ytimg.com/vi/${options.videoId}/hqdefault.jpg`, timestamp: "0:00", author: { name: "Unknown" } };
        return { videos: formatted };
    } catch (e) { return { videos: [] }; }
}

const getVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|\/(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match? match[1] : null;
};

const CDNS = ["cdn406.savetube.vip","cdn405.savetube.vip","cdn404.savetube.vip"];
const SECRET_KEY = Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex");
const ytHeaders = { "content-type": "application/json", "origin": "https://ytube.savetube.me", "referer": "https://ytube.savetube.me/", "user-agent": "Mozilla/5.0" };

function decryptData(enc) {
    const buf = Buffer.from(enc.replace(/\s/g, ""), "base64");
    const iv = buf.subarray(0, 16);
    const data = buf.subarray(16);
    const decipher = crypto.createDecipheriv("aes-128-cbc", SECRET_KEY, iv);
    return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString());
}

async function ytdlStream(url, type, quality) {
    const id = getVideoId(url);
    if (!id) throw new Error("Invalid YouTube URL");
    for (const CDN of CDNS) {
        try {
            const infoRes = await api.post(`https://${CDN}/v2/info`, { url: `https://youtube.com/watch?v=${id}` }, { headers: ytHeaders });
            const info = decryptData(infoRes.data.data);
            const dlRes = await api.post(`https://${CDN}/download`, { id: info.id, key: info.key, downloadType: type, quality: String(quality) }, { headers: ytHeaders });
            const link = dlRes.data?.data?.downloadUrl;
            if (!link) throw new Error("No link");
            return { title: info.title, thumbnail: info.thumbnail, streamUrl: link };
        } catch (err) {}
    }
    throw new Error("All CDN failed");
}

// ========== PLAY COMMAND - SAME AS SONG BUT NAME IS PLAY ==========
cmd({
    pattern: "play",
    alias: ["play2", "song2", "music"],
    desc: "Download YouTube audio via play",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, userConfig }) => {
    try {
        if (!args[0]) return reply("❌ Song name do!\n\nExample:\n.play Tum Hi Ho\n.play https://youtu.be/xxxx");
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        let query = args.join(" ");
        if (!query.includes("youtu")) {
            const searchResults = await yts(query);
            if (!searchResults.videos.length) return reply("❌ No results found!");
            query = searchResults.videos[0].url;
        }
        const videoId = getVideoId(query);
        const videoInfo = await yts({ videoId });
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail },
            caption: `🎵 *PLAY SONG*\n\n🎶 *Title:* ${videoInfo.title}\n👤 *Channel:* ${videoInfo.author?.name}\n⏱️ *Duration:* ${videoInfo.timestamp}\n\n⏳ Downloading...\n\n*© ${userConfig.CAPTION || "AS-BOT"}*`
        }, { quoted: mek });

        const data = await ytdlStream(query, "audio", "192");
        await conn.sendMessage(from, {
            audio: { url: data.streamUrl },
            mimetype: "audio/mpeg",
            fileName: `${videoInfo.title}.mp3`,
            contextInfo: { externalAdReply: { title: data.title, body: "YouTube MP3", thumbnailUrl: data.thumbnail, mediaType: 2, sourceUrl: query } }
        }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply(`❌ Error: ${e.message}`);
    }
});
