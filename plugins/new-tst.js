const { bandah } = require("../command");
const config = require("../config");
const axios = require("axios");
const yts = require("yt-search");

// Helper function to maintain compatibility if anyone imports it
function helper() {
  return true;
}

bandah({
  pattern: "song2",
  alias: ["play2", "music2", "ytmp3"],
  desc: "Download and stream MP3 from YouTube using high-speed API.",
  category: "download",
  react: "🎵",
  filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) {
      return reply("❌ Please provide a song name or YouTube link!\n\n*Example:* .song2 Tu Hai Kahan");
    }

    await m.react("📥");
    await reply(`🔍 Searching and processing your request...`);

    // 1. Search song on YouTube using yt-search
    const searchResult = await yts(q);
    const video = searchResult.videos[0];

    if (!video) {
      return reply("❌ No results found on YouTube. Please try another query.");
    }

    const videoUrl = video.url;
    const videoTitle = video.title;
    const timestamp = video.timestamp;
    const thumbnail = video.thumbnail;
    const views = video.views;

    // 2. Fetch download URL from the provided API
    const apiUrl = `https://jerrycoder.oggyapi.workers.dev/down/ytmp3?url=${encodeURIComponent(videoUrl)}`;
    const response = await axios.get(apiUrl);

    if (!response.data || response.data.status !== "success" || !response.data.url) {
      return reply("❌ Failed to fetch the audio download link. The API might be down.");
    }

    const downloadURL = response.data.url;
    const finalTitle = response.data.title || videoTitle;

    // 3. Send audio file to WhatsApp
    await conn.sendMessage(
      from,
      {
        audio: { url: downloadURL },
        mimetype: "audio/mpeg",
        ptt: false
      },
      { quoted: mek }
    );

    await m.react("✅");

  } catch (err) {
    console.error("❌ Song2 cmd error:", err);
    await reply(`❌ An error occurred while downloading the song: ${err.message}`);
  }
});

module.exports = {
  helper
};