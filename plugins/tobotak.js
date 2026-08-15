import fetch from 'node-fetch'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type'

const handler = async (m, { conn, usedPrefix, command }) => {
  if (!m.quoted || !m.quoted.fileSha256) {
    return m.reply(`Balas gambar dengan command *${usedPrefix + command}* untuk menjadikan gambarmu botak 😹`)
  }

  const mime = m.quoted.mimetype || ''
  if (!/image\/(jpe?g|png)/.test(mime)) {
    return m.reply('Format gambar tidak didukung, hanya jpg dan png.')
  }

  const imgBuffer = await m.quoted.download()
  const form = new FormData()
  form.append('image', imgBuffer, {
    filename: 'input.png',
    contentType: mime
  })

  await m.react('😹') // Proses dimulai

  try {
    const response = await fetch('https://velyn.biz.id/api/ai/tobald', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      }
    })

    if (!response.ok) throw new Error(`Gagal menghubungi API: ${response.statusText}`)
    
    const resultBuffer = await response.buffer()
    const fileType = await fileTypeFromBuffer(resultBuffer)
    if (!fileType || !fileType.mime.startsWith('image/')) throw new Error('Respon bukan gambar!')

    await conn.sendFile(m.chat, resultBuffer, 'botak.png', 'Awowowok botak botak!', m)
    await m.react('✅') // Sukses kirim gambar
  } catch (e) {
    console.error(e)
    await m.react('❌') // Error
    m.reply('❌ Terjadi kesalahan saat memproses gambar. Pastikan API aktif dan coba lagi.')
  }
}

handler.command = /^tobotak$/i
handler.help = ['tobotak']
handler.tags = ['tools']
handler.limit = 3

export default handler