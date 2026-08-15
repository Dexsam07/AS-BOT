const crypto = require('crypto');
const https = require("https");
const axios = require("axios");
const { cmd } = require("../command");

const TIMEOUT = 20000;
const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

async function searchYouTube(query) {
    const url = "https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW4";

    const postData = JSON.stringify({
        query: query,
        context: {
            client: {
                clientName: "WEB",
                clientVersion: "2.20240701.01.00"
            }
        }
    });

    const options = { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) { 
                    reject("JSON parse failed");
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function yts(options) {
    try {
        let query = "";
        if (typeof options === "string") {
            query = options;
        } else if (options && options.videoId) {
            query = options.videoId;
        } else {
            throw new Error("Invalid search options");
        }

        const data = await searchYouTube(query);
        let videos = [];

        const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || 
                        data.contents || [];

        sections.forEach(section => {
            const items = section.itemSectionRenderer?.contents || 
                         section.richItemRenderer?.content || [];
            
            items.forEach(item => {
                const video = item.videoRenderer || item.richItemRenderer?.content?.videoRenderer;
                if (video && video.videoId) {
                    videos.push(video);
                }
            });
        });

        const formattedVideos = videos.map(video => {
            const title = video.title?.runs?.[0]?.text || video.title?.simpleText || "No Title";
            const videoId = video.videoId;
            const viewsText = video.viewCountText?.simpleText || video.shortViewCountText?.simpleText || "0 views";
            const views = parseInt(viewsText.replace(/[^0-9]/g, "")) || 0;
            const thumbnail = video.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            const timestamp = video.lengthText?.simpleText || "0:00";
            const authorName = video.ownerText?.runs?.[0]?.text || video.shortBylineText?.runs?.[0]?.text || "Unknown";

            return {
                title,
                videoId,
                url: `https://youtube.com/watch?v=${videoId}`,
                thumbnail,
                image: thumbnail,
                timestamp,
                views,
                author: { 
                    name: authorName 
                }
            };
        });

        if (typeof options === "object" && options.videoId) {
            const found = formattedVideos.find(v => v.videoId === options.videoId) || formattedVideos[0];
            if (found) {
                return found;
            }
            return {
                title: "YouTube Video",
                videoId: options.videoId,
                url: `https://youtube.com/watch?v=${options.videoId}`,
                thumbnail: `https://i.ytimg.com/vi/${options.videoId}/hqdefault.jpg`,
                image: `https://i.ytimg.com/vi/${options.videoId}/hqdefault.jpg`,
                timestamp: "0:00",
                views: 0,
                author: { name: "Unknown" }
            };
        }

        return {
            videos: formattedVideos
        };
    } catch (e) { 
        console.error("yts custom error:", e);
        if (typeof options === "object" && options.videoId) {
            return {
                title: "YouTube Video",
                videoId: options.videoId,
                url: `https://youtube.com/watch?v=${options.videoId}`,
                thumbnail: `https://i.ytimg.com/vi/${options.videoId}/hqdefault.jpg`,
                image: `https://i.ytimg.com/vi/${options.videoId}/hqdefault.jpg`,
                timestamp: "0:00",
                views: 0,
                author: { name: "Unknown" }
            };
        }
        return { videos: [] };
    }
}

const getVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|\/(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
};

function cleanName(name) {
    return name.replace(/[\\/:*?"<>|]/g, "").slice(0, 60);
}

// ========== YouTube CDN Stream Functions ==========
const CDNS = [ 
    "cdn406.savetube.vip",
    "cdn405.savetube.vip",
    "cdn404.savetube.vip",
    "cdn403.savetube.vip",
    "cdn402.savetube.vip",
    "cdn401.savetube.vip",
    "cdn400.savetube.vip"
];

const SECRET_KEY = Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex");

const ytHeaders = {
    "content-type": "application/json",
    "origin": "https://ytube.savetube.me",
    "referer": "https://ytube.savetube.me/",
    "user-agent": "Mozilla/5.0"
};

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

    let lastError;

    for (const CDN of CDNS) { 
        try {
            const infoRes = await api.post(
                `https://${CDN}/v2/info`,
                { url: `https://youtube.com/watch?v=${id}` },
                { headers: ytHeaders }
            );

            if (!infoRes.data?.status) throw new Error("Failed to fetch video info");

            const info = decryptData(infoRes.data.data);

            const dlRes = await api.post(
                `https://${CDN}/download`,
                {
                    id: info.id,
                    key: info.key,
                    downloadType: type,
                    quality: String(quality)
                },
                { headers: ytHeaders }
            );

            const link = dlRes.data?.data?.downloadUrl;
            if (!link) throw new Error("Download link not found");

            return {
                title: info.title,
                duration: info.duration,
                thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                streamUrl: link
            };
        } catch (err) { 
            lastError = err;
        }
    }

    throw lastError || new Error("All CDN servers failed");
}

// ========== SONG / MP3 Command - FIXED ==========
cmd({ 
    pattern: "song",
    alias: ["mp3", "audio"],
    desc: "Download YouTube audio (MP3)",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, userConfig }) => { 
    try {
        const botConfig = userConfig;

        if (!args[0]) return reply("❌ Song name ya YouTube link do!\n\nExample:\n.song Tu Hai Kahan\n.song https://youtu.be/xxxx");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        let query = args.join(" ");

        // Check if it's a YouTube link or search query
        if (!query.includes("youtu")) {
            // Search for the song
            const searchResults = await yts(query);
            if (!searchResults.videos.length) {
                await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
                return reply("❌ No results found for your search query.");
            }
            const video = searchResults.videos[0];
            query = video.url;
        }

        // Get video ID
        const videoId = getVideoId(query);
        if (!videoId) {
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
            return reply("❌ Invalid YouTube URL!");
        }

        // Get video info
        const videoInfo = await yts({ videoId });
        
        // Send thumbnail with info
        await conn.sendMessage(from, {
            image: { url: videoInfo.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }, 
            caption: `🎵 *YOUTUBE MP3 DOWNLOADER*\n\n🎶 *Title:* ${videoInfo.title}\n👤 *Channel:* ${videoInfo.author?.name || "Unknown"}\n⏱️ *Duration:* ${videoInfo.timestamp || "Unknown"}\n\n⏳ Downloading audio...\n\n*© ${botConfig.CAPTION || "Powered by AS-BOT"}*` 
        }, { quoted: mek });

        // Download audio using CDN
        const data = await ytdlStream(query, "audio", "192");

        if (!data || !data.streamUrl) {
            throw new Error("Failed to get audio stream.");
        }

        // Send audio
        await conn.sendMessage(from, { 
            audio: { url: data.streamUrl }, 
            mimetype: "audio/mpeg", 
            ptt: false,
            fileName: `${videoInfo.title || data.title}.mp3`,
            contextInfo: { 
                externalAdReply: { 
                    title: data.title || videoInfo.title,
                    body: "YouTube MP3",
                    thumbnailUrl: data.thumbnail || videoInfo.thumbnail,
                    mediaType: 2,
                    sourceUrl: query
                } 
            } 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) { 
        console.error("Song/MP3 Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply(`❌ Error: ${e.message || "Something went wrong!"}`);
    }
});