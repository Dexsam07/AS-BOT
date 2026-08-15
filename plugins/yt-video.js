const https = require("https");
const axios = require("axios");
const { cmd } = require("../command");

async function searchYouTube(query) {
    const apiKey = process.env.YOUTUBE_API_KEY || '';
    if (!apiKey) throw new Error('YOUTUBE_API_KEY is not configured');
    const url = `https://www.youtube.com/youtubei/v1/search?key=${encodeURIComponent(apiKey)}`;

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

const API_CONFIG = {
    BANDHAHEALI_API: "https://team-bandaheali-apis.vercel.app/download/ytdl-v2?url="
};

function normalizeYouTubeUrl(url) { 
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
    return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

function getVideoId2(url) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
}

async function fetchBandhaheali(url, retries = 2) {
    try {
        const apiUrl = `${API_CONFIG.BANDHAHEALI_API}${encodeURIComponent(url)}`;
        console.log(`🔄 Fetching from Bandhaheali API: ${apiUrl}`);
        
        const response = await axios.get(apiUrl, {
            timeout: 20000,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });
        
        const data = response.data;
        console.log("📦 API Response:", JSON.stringify(data, null, 2));

        // Check if the response has the expected format
        if (data?.status === true && data?.result?.success === true && data?.result?.mp4) {
            return {
                video_url: data.result.mp4,
                title: data.result.title || "YouTube Video",
                quality: data.result.quality || "720p",
                source: "Bandhaheali API",
                mp3: data.result.mp3 || null,
                creator: data.creator || "Rashid-The-Devil"
            };
        }
        
        throw new Error("Invalid response format from Bandhaheali API");
    } catch (error) {
        console.log("❌ Bandhaheali API Error:", error.message);
        if (error.response) {
            console.log("Response status:", error.response.status);
            console.log("Response data:", error.response.data);
        }
        
        if (retries > 0) {
            console.log(`🔄 Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            return fetchBandhaheali(url, retries - 1);
        }
        throw error;
    }
}

async function fetchVideo(url) {
    try {
        console.log("🔄 Starting video download process...");
        const result = await fetchBandhaheali(url);
        console.log("✅ Video fetch successful!");
        return result;
    } catch (error) {
        console.log("❌ Video fetch failed:", error.message);
        throw new Error(`Failed to download video: ${error.message}`);
    }
}

// ========== VIDEO Command ==========
cmd({
    pattern: "video",
    alias: ["ytmp4", "vdl", "vid", "ytv"],
    react: "🎬",
    desc: "Download high-quality videos from YouTube",
    category: "media",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) {
            const usageText = `\n┏━━━━━━━━━━━━━━━━━━━━┓\n┃  🎬 *AS-BOT MEDIA*  🎬  ┃\n┣━━━━━━━━━━━━━━━━━━━━┫\n┃  ✦ Video Downloader\n┃  ✦ High Quality 720p\n┃  ✦ Single API System\n┣━━━━━━━━━━━━━━━━━━━━┫\n┃  📝 *USAGE:*\n┃  ${prefix + command} <query/link>\n┃\n┃  📌 *EXAMPLE:*\n┃  ${prefix + command} perfect ed sheeran\n┃  ${prefix + command} https://youtu.be/...\n┣━━━━━━━━━━━━━━━━━━━━┫\n┃  ⚡ Powered by AS-BOT\n┗━━━━━━━━━━━━━━━━━━━━┛`;
            return reply(usageText);
        }

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const url = normalizeYouTubeUrl(q);
        let ytdata;

        if (url) {
            const videoId = getVideoId2(q);
            const searchResults = await yts({ videoId: videoId || q.split('v=')[1]?.split('&')[0] || q.split('/').pop() });
            ytdata = searchResults;
        } else {
            const searchResults = await yts(q);
            if (!searchResults.videos.length) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply("❌ No videos found for your search query.");
            }
            ytdata = searchResults.videos[0];
        }

        const infoCard = `\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃      🎬 *AS-BOT PLAYER*    🎬  ┃\n┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n┃  ✦ *TITLE* ✦\n┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━\n┃  ${ytdata.title.length > 40 ? ytdata.title.substring(0, 37) + '...' : ytdata.title}\n┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━\n┃  ✦ *CHANNEL*  ${ytdata.author?.name || 'Unknown'}\n┃  ✦ *DURATION* ${ytdata.timestamp}\n┃  ✦ *VIEWS*    ${ytdata.views.toLocaleString()}\n┃  ✦ *STATUS*   🔄 Processing...\n┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n┃  ⚡ Powered by AS-BOT\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        await conn.sendMessage(from, { 
            image: { url: ytdata.thumbnail || ytdata.image },
            caption: infoCard
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Use the new API
        const dlData = await fetchVideo(ytdata.url);

        if (!dlData || !dlData.video_url) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Failed to download video. Please try again later.");
        }

        const successCard = `\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃      ✅ *DOWNLOAD READY*    ✅  ┃\n┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n┃  📺 *${dlData.title.length > 35 ? dlData.title.substring(0, 32) + '...' : dlData.title}*\n┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━\n┃  🎚️ Quality : ${dlData.quality}\n┃  🔌 Source  : ${dlData.source}\n┃  📦 Format  : MP4\n${dlData.mp3 ? `┃  🎵 Audio   : Available\n` : ''}┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━\n┃  ⚡ Powered by AS-BOT\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        await conn.sendMessage(
            from,
            {
                video: { url: dlData.video_url },
                mimetype: "video/mp4",
                caption: successCard
            },
            {
                quoted: mek
            }
        );

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Video DL Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ Error: ${e.message || "Something went wrong!"}`);
    }
});
