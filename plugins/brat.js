/*
* Nama fitur : Brat & bratvid
* Type : Plugin Esm
* Sumber : https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o
* Author : ZenzzXD
 */

import axios from 'axios'
import { Sticker, createSticker, StickerTypes } from 'wa-sticker-formatter'

let handler = async (m, { conn, command, usedPrefix, text }) => {
  text = m.quoted && !text ? m.quoted.text : text
  if (!text) return m.reply(`Masukkin teks contoh : ${usedPrefix + command} hello word`)

  await m.reply('waitt')

  try {
    let url = command.toLowerCase() === 'bratvid'
      ? `https://brat.siputzx.my.id/gif?text=${encodeURIComponent(text)}`
      : `https://brat.siputzx.my.id/image?text=${encodeURIComponent(text)}`

    let buffer = (await axios.get(url, { responseType: 'arraybuffer' })).data

    let stickerBuffer = await createSticker(buffer, {
      type: StickerTypes.FULL,
      pack: 'RYO YAMADA MD',
      author: 'By Hilman',
      categories: ['😂'],
      id: '.',
      quality: 80,
      background: null
    })

    await conn.sendFile(m.chat, stickerBuffer, '', '', m)
  } catch (e) {
    m.reply('Eror kak')
  }
}

handler.help = ['brat', 'bratvid']
handler.tags = ['sticker']
handler.command = ['brat', 'bratvid']
handler.limit = true

export default handler