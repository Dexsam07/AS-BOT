/*
📌 Nama Fitur: Edit foto
🏷️ Type : Plugin Esm
🔗 Sumber : https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o
🔗 Sumber skrep : 
https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o
Req : dri ngl
✍️ Author : ZenzzXD
*/

import axios from 'axios'
import FormData from 'form-data'

async function editImage(imageBuffer, prompt) {
  const form = new FormData()
  form.append('image', imageBuffer, {
    filename: 'image.png',
    contentType: 'image/png'
  })
  form.append('prompt', prompt)
  form.append('model', 'gpt-image-1')
  form.append('n', '1')
  form.append('size', '1024x1024')
  form.append('quality', 'medium')

  const response = await axios.post(
    'https://api.openai.com/v1/images/edits',
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer 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`
      }
    }
  )

  const base64 = response.data?.data?.[0]?.b64_json
  if (!base64) throw new Error('ga ada respon dari api open e ay')
  return Buffer.from(base64, 'base64')
}

const handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(`contoh ni : .editfoto ubah jadi anime`)

  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  if (!mime.startsWith('image/')) return m.reply(`contoh ni : .editfoto ubah jadi anime`)

  try {
    m.reply('waitt bg')
    let img = await q.download()
    let resultBuffer = await editImage(img, text)
    await conn.sendFile(m.chat, resultBuffer, 'edit.png', 'donee', m)
  } catch (err) {
    m.reply(`Eror kak : ${err.message}`)
  }
}

handler.help = ['editfoto <prompt>']
handler.tags = ['ai']
handler.command = ['editfoto']
handler.limit = true 
handler.register = true 

export default handler