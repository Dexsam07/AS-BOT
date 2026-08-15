import axios from "axios";
import yts from "yt-search";

const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav'];
const formatVideo = ['360', '480', '720', '1080', '1440', '4k'];

const ddownr = {
  download: async (url, format) => {
    if (!formatAudio.includes(format) && !formatVideo.includes(format)) {
      throw new Error('Format tidak didukung.');
    }

    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };

    const response = await axios.request(config);
    if (response.data && response.data.success) {
      const { id, title, info } = response.data;
      const downloadUrl = await ddownr.cekProgress(id);
      return { id, title, image: info.image, downloadUrl };
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
      if (response.data && response.data.success && response.data.progress === 1000) {
        return response.data.download_url;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

const handler = async (m, { conn, usedPrefix, text, command }) => {
  if (!text) {
    return conn.sendMessage(m.chat, { text: `Ketikkan nama lagu yang kamu cari, misal\n${usedPrefix + command} dj kane` }, { quoted: m });
  }

  try {
    const search = await yts(text);
    const video = search.all[0];
    if (!video) {
      return conn.sendMessage(m.chat, { text: 'Lagu tidak ditemukan.' }, { quoted: m });
    }

    const detail = `*Youtube Audio Play*\n\n❏ Title : ${video.title}\n❏ View : ${video.views}\n❏ Author : ${video.author.name}\n❏ Upload : ${video.ago}\n🔗 Url : ${video.url}\n\n_*Sedang download audio...*_`;

    await conn.sendMessage(m.chat, {
      text: detail,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
          title: video.title,
          mediaType: 1,
          previewType: 1,
          body: `yᴛ ᴩʟᴀy ʙy ʜɪʟᴍᴀɴ`,
          thumbnailUrl: video.image,
          renderLargerThumbnail: true,
          mediaUrl: video.url,
          sourceUrl: video.url
        }
      }
    }, { quoted: m });

    const result = await ddownr.download(video.url, "mp3");
    if (!result.downloadUrl) {
      return conn.sendMessage(m.chat, { text: 'Gagal mengunduh audio.' }, { quoted: m });
    }

    await conn.sendMessage(m.chat, {
      audio: { url: result.downloadUrl },
      mimetype: 'audio/mpeg',
    }, { quoted: m });

  } catch (error) {
    conn.sendMessage(m.chat, { text: `Terjadi kesalahan:\n${error.message}` }, { quoted: m });
  }
};

handler.help = ['play'].map(v => v + ' <judul>');
handler.tags = ['downloader'];
handler.command = ['play','song'];
handler.limit = true;

export default handler;