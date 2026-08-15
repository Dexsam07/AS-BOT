/*

# Fitur : TikTok Music Downloader
# Type : Plugins ESM
# Created by : https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o
# Api : https://api.vreden.my.id/api/tikmusic?url=<link>

   ⚠️ _Note_ ⚠️
jangan hapus wm ini banggg

*/

import fetch from 'node-fetch'

let handler = async (m, { conn, args, text, command }) => {
  try {
    if (!text) throw `Masukkan URL TikTok!\nContoh: .${command} https://vt.tiktok.com/ZSr6HXMxk/`

    await m.reply('⏳ Sedang menyelam ke lautan TikTok, tunggu sebentar...')

    let res = await fetch(`https://api.vreden.my.id/api/tikmusic?url=${encodeURIComponent(text)}`)
    let json = await res.json()

    if (json.status != 200) throw `Gagal mengambil data! Pastikan URL valid.`

    let { title, author, album, url } = json.result
    let info = `*Tiktok Music*\n\n`
    info += `*Judul:* ${title}\n`
    info += `*Author:* ${author}\n`
    info += `*Album:* ${album}`

    await conn.sendMessage(m.chat, {
      audio: { url },
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`,
      ptt: false
    }, { quoted: m })

    await m.reply(info)
    
  } catch (e) {
    console.log(e)
    throw `❌ Error\nLogs error : ${e.message || e}`
  }
}

handler.help = ['ttmusic'].map(v => v + ' <url>')
handler.tags = ['downloader']
handler.command =['ttmusic', 'ttmp3']
handler.limit = true;

export default handler