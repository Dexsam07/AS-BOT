let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) return m.reply(`Contoh:\n${usedPrefix + command} https://vt.tiktok.com/ZSkpqLD9U/`)

  try {
    let res = await fetch(`https://zenzxz.dpdns.org/downloader/tiktok?url=${encodeURIComponent(args[0])}`)
    let json = await res.json()

    if (!json.status) return m.reply('Gagal mengambil data.')

    let result = json.result.data
    let caption = `🎥 *Tiktok Video Downloader*

📛 *Judul:* ${result.title}
👤 *Author:* ${result.author.nickname} (@${result.author.unique_id})
🎵 *Music:* ${result.music_info.title} - ${result.music_info.author}
⏳ *Durasi:* ${result.duration} detik
👍 *Likes:* ${result.digg_count}
💬 *Comments:* ${result.comment_count}
🔄 *Share:* ${result.share_count}

Link: ${args[0]}
`

    await conn.sendFile(m.chat, result.play, 'tiktok.mp4', caption, m)
  } catch (e) {
    console.log(e)
    m.reply('❌ Terjadi error, coba lagi nanti.')
  }
}

handler.help = ['tiktokdl3 <url>']
handler.tags = ['downloader']
handler.command = /^(tiktokdl3|tt3)$/i
handler.limit = true

export default handler