import axios from "axios";
import yts from "yt-search";

const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav'];

const ddownr = {
  download: async (url, format) => {
    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };

    const response = await axios.request(config);
    if (response.data?.success) {
      const { id, title, info } = response.data;
      const downloadUrl = await ddownr.cekProgress(id);
      return { title, downloadUrl, image: info.image, videoUrl: url };
    } else {
      throw new Error('Gagal mengambil detail video.');
    }
  },

  cekProgress: async (id) => {
    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };
    while (true) {
      const response = await axios.request(config);
      if (response.data?.success && response.data.progress === 1000) {
        return response.data.download_url;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

let handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(`Contoh:\n${command} mellow vibes`);

  try {
    await conn.sendMessage(m.chat, { react: { text: "📥", key: m.key } });

    const search = await yts(text);
    const video = search.all[0];
    if (!video) return m.reply('❌ Lagu tidak ditemukan.');

    const result = await ddownr.download(video.url, "mp3");

    const audioRes = await axios.get(result.downloadUrl, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(audioRes.data, "binary");

    const channelId = "120363406449026172@newsletter"; // Ganti ke ID channel kamu

    await conn.sendMessage(channelId, {
      audio: audioBuffer,
      mimetype: "audio/mp4",
      ptt: true,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: false,
        externalAdReply: {
          title: result.title,
          body: "Play by YTTA",
          mediaType: 2,
          thumbnailUrl: result.image,
          mediaUrl: result.videoUrl,
          sourceUrl: result.videoUrl,
          renderLargerThumbnail: true,
          showAdAttribution: false
        }
      }
    });

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
    m.reply(`✔ Sukses kirim *${result.title}* ke channel.`);

  } catch (err) {
    console.error(err);
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    m.reply("❌ Gagal kirim audio ke channel.");
  }
};

handler.command = ["playch"];
handler.owner = true;
handler.tags = ["owner"];
handler.help = ["playch <judul>"];

export default handler;