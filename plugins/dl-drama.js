const axios = require("axios");
const { bandah } = require("../command");
const config = require("../config");

// ============================================================
// DRAMA SEARCH COMMAND - WITH WORKING API
// ============================================================
bandah({
    pattern: "drama",
    alias: ["kdrama", "dramacool", "dramadl"],
    desc: "Search Asian/Korean dramas and get episode info.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Please provide a drama name to search!\nExample: `.drama True Beauty`");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // ✅ WORKING API - CONSUMET
        const searchUrl = `https://api.consumet.org/movies/dramacool/${encodeURIComponent(q)}`;
        const response = await axios.get(searchUrl, { 
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = response.data;
        if (!data || !data.results || data.results.length === 0) {
            return reply(`⚠️ No drama found for *"${q}"*.`);
        }

        const topDrama = data.results[0];
        const caption = `🎬 *DRAMA SEARCH RESULT* 🎬\n\n` +
                        `📌 *Title:* ${topDrama.title}\n` +
                        `🆔 *ID:* \`${topDrama.id}\`\n` +
                        `🔗 *URL:* ${topDrama.url}\n\n` +
                        `ℹ️ *How to watch episodes?*\n` +
                        `Use: \`.dramaep ${topDrama.id}\` to view available episode list!\n\n` +
                        `⚡ *${config.CAPTION || "Powered by AS-BOT"}*`;

        if (topDrama.image) {
            await conn.sendMessage(from, { image: { url: topDrama.image }, caption }, { quoted: m });
        } else {
            await reply(caption);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Drama search error:", error);
        reply("❌ Error occurred while searching for drama. Please try again later.\n\n" + error.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});

// ============================================================
// DRAMA EPISODES COMMAND
// ============================================================
bandah({
    pattern: "dramaep",
    alias: ["dramaepisode"],
    desc: "Get drama episodes list & watch/download links",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Please provide a Drama ID!\nExample: `.dramaep true-beauty`");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // ✅ WORKING API - CONSUMET
        const infoUrl = `https://api.consumet.org/movies/dramacool/info?id=${encodeURIComponent(q)}`;
        const response = await axios.get(infoUrl, { 
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = response.data;
        if (!data || !data.episodes || data.episodes.length === 0) {
            return reply("⚠️ Failed to load episodes or invalid Drama ID.");
        }

        let epText = `🎬 *${data.title} - Episodes* 🎬\n\n`;
        epText += `📝 *Description:* ${data.description ? data.description.substring(0, 300) + "..." : "No description available"}\n\n`;
        epText += `🔢 *Total Episodes:* ${data.episodes.length}\n\n`;
        
        const showCount = Math.min(data.episodes.length, 15);
        for (let i = 0; i < showCount; i++) {
            const ep = data.episodes[i];
            epText += `• Episode ${ep.episode}: \`${ep.id}\`\n`;
        }

        if (data.episodes.length > 15) {
            epText += `\n...and ${data.episodes.length - 15} more episodes.\n`;
        }

        epText += `\n📥 *How to download an episode?*\n`;
        epText += `Use: \`.dramadown <episode-id>\`\nExample:\n\`.dramadown ${data.episodes[0].id}\`\n\n`;
        epText += `⚡ *${config.CAPTION || "Powered by AS-BOT"}*`;

        await reply(epText);
        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Drama episodes error:", error);
        reply("❌ Error occurred while retrieving episode list.\n\n" + error.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});

// ============================================================
// DRAMA DOWNLOAD COMMAND
// ============================================================
bandah({
    pattern: "dramadown",
    alias: ["ddl"],
    desc: "Download/watch link for a drama episode.",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Please provide an Episode ID!\nExample: `.dramadown true-beauty-episode-1`");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // ✅ WORKING API - CONSUMET
        const watchUrl = `https://api.consumet.org/movies/dramacool/watch?episodeId=${encodeURIComponent(q)}`;
        const response = await axios.get(watchUrl, { 
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = response.data;
        if (!data || !data.sources || data.sources.length === 0) {
            return reply("⚠️ Failed to fetch stream/download links for this episode.");
        }

        const source = data.sources.find(s => s.quality === "default") || data.sources[0];
        
        let dlText = `📥 *DRAMA EPISODE DOWNLOAD* 📥\n\n`;
        dlText += `📺 *Episode:* ${q}\n`;
        dlText += `🔗 *Stream/M3U8 link:* ${source.url}\n`;
        if (data.download) {
            dlText += `📥 *Download Webpage:* ${data.download}\n`;
        }
        dlText += `\n*Note:* You can paste the Stream link into VLC or any video player, or use the Download link to download.\n\n`;
        dlText += `⚡ *${config.CAPTION || "Powered by AS-BOT"}*`;

        await reply(dlText);
        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Drama download link error:", error);
        reply("❌ Error occurred while generating download links.\n\n" + error.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});

// ============================================================
// YOUTUBE DOWNLOAD COMMAND - UPDATED WITH NEW API
// ============================================================
bandah({
    pattern: "ytv",
    alias: ["ytmp4", "ytvideo"],
    desc: "Download YouTube videos (MP4 format)",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Please provide a YouTube URL!\nExample: `.ytv https://youtu.be/uvBhlXryOOY`");
        }

        // Extract video ID from URL
        let videoId = q;
        if (q.includes('youtu.be/')) {
            videoId = q.split('youtu.be/')[1].split('?')[0];
        } else if (q.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(q.split('?')[1]);
            videoId = urlParams.get('v');
        } else if (q.includes('youtube.com/shorts/')) {
            videoId = q.split('youtube.com/shorts/')[1].split('?')[0];
        }

        if (!videoId || videoId.length !== 11) {
            return reply("❌ Invalid YouTube URL. Please provide a valid YouTube link.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // ✅ NEW API - Team Bandaheali
        const apiUrl = `https://team-bandaheali-apis.vercel.app/download/ytdl-v2?url=https://youtu.be/${videoId}`;
        const response = await axios.get(apiUrl, { 
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = response.data;
        if (!data.status || !data.result.success) {
            return reply("❌ Failed to fetch video details. Please try again later.");
        }

        const result = data.result;
        const caption = `🎬 *YOUTUBE VIDEO DOWNLOAD* 🎬\n\n` +
                        `📌 *Title:* ${result.title}\n` +
                        `📹 *Quality:* ${result.quality}\n` +
                        `👤 *Creator:* ${data.creator || "Unknown"}\n` +
                        `🔗 *Source:* ${result.source}\n\n` +
                        `📥 *Download Link:*\n${result.mp4}\n\n` +
                        `⚡ *${config.CAPTION || "Powered by AS-BOT"}*`;

        await reply(caption);
        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("YouTube video download error:", error);
        reply("❌ Error occurred while downloading video.\n\n" + error.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});

// ============================================================
// YOUTUBE AUDIO DOWNLOAD COMMAND - UPDATED WITH NEW API
// ============================================================
bandah({
    pattern: "yta",
    alias: ["ytmp3", "ytaudio"],
    desc: "Download YouTube audio (MP3 format)",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Please provide a YouTube URL!\nExample: `.yta https://youtu.be/uvBhlXryOOY`");
        }

        // Extract video ID from URL
        let videoId = q;
        if (q.includes('youtu.be/')) {
            videoId = q.split('youtu.be/')[1].split('?')[0];
        } else if (q.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(q.split('?')[1]);
            videoId = urlParams.get('v');
        } else if (q.includes('youtube.com/shorts/')) {
            videoId = q.split('youtube.com/shorts/')[1].split('?')[0];
        }

        if (!videoId || videoId.length !== 11) {
            return reply("❌ Invalid YouTube URL. Please provide a valid YouTube link.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // ✅ NEW API - Team Bandaheali
        const apiUrl = `https://team-bandaheali-apis.vercel.app/download/ytdl-v2?url=https://youtu.be/${videoId}`;
        const response = await axios.get(apiUrl, { 
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = response.data;
        if (!data.status || !data.result.success) {
            return reply("❌ Failed to fetch audio details. Please try again later.");
        }

        const result = data.result;
        const caption = `🎵 *YOUTUBE AUDIO DOWNLOAD* 🎵\n\n` +
                        `📌 *Title:* ${result.title}\n` +
                        `🎵 *Format:* MP3\n` +
                        `👤 *Creator:* ${data.creator || "Unknown"}\n` +
                        `🔗 *Source:* ${result.source}\n\n` +
                        `📥 *Download Link:*\n${result.mp3}\n\n` +
                        `⚡ *${config.CAPTION || "Powered by AS-BOT"}*`;

        await reply(caption);
        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("YouTube audio download error:", error);
        reply("❌ Error occurred while downloading audio.\n\n" + error.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});

// ============================================================
// YOUTUBE INFO COMMAND - UPDATED WITH NEW API
// ============================================================
bandah({
    pattern: "ytinfo",
    alias: ["ytdetails"],
    desc: "Get detailed information about a YouTube video",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Please provide a YouTube URL!\nExample: `.ytinfo https://youtu.be/uvBhlXryOOY`");
        }

        // Extract video ID from URL
        let videoId = q;
        if (q.includes('youtu.be/')) {
            videoId = q.split('youtu.be/')[1].split('?')[0];
        } else if (q.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(q.split('?')[1]);
            videoId = urlParams.get('v');
        } else if (q.includes('youtube.com/shorts/')) {
            videoId = q.split('youtube.com/shorts/')[1].split('?')[0];
        }

        if (!videoId || videoId.length !== 11) {
            return reply("❌ Invalid YouTube URL. Please provide a valid YouTube link.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // ✅ NEW API - Team Bandaheali
        const apiUrl = `https://team-bandaheali-apis.vercel.app/download/ytdl-v2?url=https://youtu.be/${videoId}`;
        const response = await axios.get(apiUrl, { 
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const data = response.data;
        if (!data.status || !data.result.success) {
            return reply("❌ Failed to fetch video information. Please try again later.");
        }

        const result = data.result;
        const caption = `📹 *YOUTUBE VIDEO INFO* 📹\n\n` +
                        `📌 *Title:* ${result.title}\n` +
                        `📹 *Quality:* ${result.quality}\n` +
                        `👤 *Creator:* ${data.creator || "Unknown"}\n` +
                        `🔗 *Source:* ${result.source}\n` +
                        `🔑 *API Used:* ${result.usedApi}\n\n` +
                        `📥 *Video Download:* ${result.mp4 ? "Available" : "Not Available"}\n` +
                        `🎵 *Audio Download:* ${result.mp3 ? "Available" : "Not Available"}\n\n` +
                        `*To download:*\n` +
                        `• \`.ytv ${q}\` - Download video\n` +
                        `• \`.yta ${q}\` - Download audio\n\n` +
                        `⚡ *${config.CAPTION || "Powered by AS-BOT"}*`;

        await reply(caption);
        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("YouTube info error:", error);
        reply("❌ Error occurred while fetching video information.\n\n" + error.message);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});

// ============================================================
// YOUTUBE SEARCH COMMAND - REMOVED (Not supported by new API)
// ============================================================
// Note: YouTube search functionality has been removed as the new API
// doesn't support search. Users should use the download commands directly.
