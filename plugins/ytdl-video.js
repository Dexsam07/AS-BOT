
const axios = require("axios");
const yts = require("yt-search"); // yt-search

// Command info
module.exports = {
  name: "video",
  alias: ["vid", "ytv", "ytmp4"], // etc.
  category: "download",
  desc: "Download video by name or link",
  filename: __filename,

  async execute(conn, mek, m, { from, q, reply, react }) {
    try {
      if (!q) {
        return reply("Please provide a video name or YouTube link");
      }

      let videoUrl = q;
      let videoInfo;

      // Agar link nahi hai to search karo
      if (!q.includes("youtu")) {
        const search = await yts(q);
        if (!search.videos || search.videos.length === 0) {
          return reply("❌ No video results found");
        }
        videoInfo = search.videos[0];
        videoUrl = videoInfo.url;
      }

      // YouTube ID extract
      // Thumbnail: https://img.youtube.com/vi/{id}/hqdefault.jpg

      await react("⬇️"); // or similar

      // Multiple download APIs (fallback system)
      const apis = [
        `https://jawad-tech.vercel.app/download/ytdl?url=${videoUrl}`,
        `https://jerrycoder.oggyapi.workers.dev/down/ytmp4?url=${videoUrl}`,
        `https://jerrycoder.oggyapi.workers.dev/down/ytmp4-v1?url=${videoUrl}`,
        `https://api.princetechn.com/api/download/mp4?apikey=prince&url=${videoUrl}`,
        `https://api.princetechn.com/api/download/ytmp4?apikey=prince&url=${videoUrl}`
      ];

      let downloadUrl = null;
      let title = "Unknown Title";
      let result = null;

      for (const api of apis) {
        try {
          const res = await axios.get(api, { timeout: 30000 });
          if (res.data && (res.data.result || res.data.url || res.data.download_url)) {
            result = res.data;
            downloadUrl = res.data.result || res.data.url || res.data.download_url;
            title = res.data.title || title;
            break;
          }
        } catch (e) {
          continue; // next API try karo
        }
      }

      if (!downloadUrl) {
        return reply("All download servers are currently unavailable. Please try again later.");
      }

      // Send video
      await conn.sendMessage(from, {
        video: { url: downloadUrl },
        mimetype: "video/mp4",
        caption: `*Title:* ${title}\n*Views:* ...\n*Duration:* ...\n*Channel:* ...`,
        // quoted: mek
      }, { quoted: mek });

    } catch (err) {
      console.log("Video Command Error:", err);
      reply("An unexpected error occurred while processing your request.");
    }
  }
};