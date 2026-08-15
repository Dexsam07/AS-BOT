import axios from 'axios';

let handler = async (m, { conn, text }) => {
    if (!text) throw '📌 Masukkan URL TikTok!\nContoh: .tiktok https://vt.tiktok.com/xxxxxx';
m.react('⚡')
    try {
        const { data } = await axios.get(`https://zennz-api.vercel.app/api/downloader/tiktok?url=${encodeURIComponent(text)}`);

        if (!data.status || !data.data?.no_watermark) throw '❌ Gagal mengambil data video TikTok!';

        const {
            title,
            no_watermark,
            music
        } = data.data;

        const caption = `╭───『 *TIKTOK DOWNLOADER* 』
│📝 *Title:* ${title}
╰────────────⬣`;

        await conn.sendMessage(m.chat, {
            video: { url: no_watermark },
            caption,
            contextInfo: {
                externalAdReply: {
                    title: 'TikTok Downloader',
                    body: title,
                    sourceUrl: text,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: m });

        if (music) {
            await conn.sendMessage(m.chat, {
                audio: { url: music },
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: 'TikTok Downloader',
                        body: title,
                        sourceUrl: text,
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
        } else {
            m.reply('✅ Video berhasil dikirim, tapi audionya tidak tersedia.');
        }

    } catch (e) {
        console.error('[TIKTOK ERROR]', e);
        throw `❌ Gagal mendownload video TikTok!\n\nLog error: ${e.message}`;
    }
};

handler.help = ['tiktok <url>'];
handler.tags = ['downloader'];
handler.command = /^(tiktok|tt|ttdl)$/i;
handler.limit = true;
handler.register = false;

export default handler;