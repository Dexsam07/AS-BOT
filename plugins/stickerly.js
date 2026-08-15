/*
📌 Nama Fitur: Stickerly
🏷️ Type : Plugin Esm
🔗 Sumber : https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o
✍️ Convert By ZenzXD
*/


import fetch from 'node-fetch'
import { Sticker } from 'wa-sticker-formatter'

let handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(`contoh: .${command} anomali`)

  try {
    const searchRes = await fetch(`https://zenzxz.dpdns.org/search/stickerlysearch?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !Array.isArray(searchJson.data) || searchJson.data.length === 0) {
      return m.reply('gaada nih stiker nya')
    }

    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]

    const detailUrl = `https://zenzxz.dpdns.org/tools/stickerlydetail?url=${encodeURIComponent(pick.url)}`
    const detailRes = await fetch(detailUrl)
    const detailJson = await detailRes.json()

    if (!detailJson.status || !detailJson.data || !Array.isArray(detailJson.data.stickers) || detailJson.data.stickers.length === 0) {
      return m.reply('error, saat mengambil stiker detal')
    }

    const packName = detailJson.data.name
    const authorName = detailJson.data.author?.name || 'unknown'

    m.reply(`mengirim ${detailJson.data.stickers.length} stiker`)

    let maxSend = 10
    for (let i = 0; i < Math.min(detailJson.data.stickers.length, maxSend); i++) {
      const img = detailJson.data.stickers[i]
      let sticker = new Sticker(img.imageUrl, {
        pack: 'Ryo Yamada - MD',
        author: 'BY Hilman',
        type: 'full',
        categories: ['😏'],
        id: 'zenzxd'
      })
      let buffer = await sticker.toBuffer()
      await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
    }

  } catch (e) {
    console.error(e)
    m.reply('erorrrrr, saat memproses stiker')
  }
}

handler.help = ['stikerly <query>']
handler.tags = ['sticker']
handler.command = /(stikerly|stickerly)$/i
handler.limit = 2

export default handler