let handler = async (m, { conn, command }) => {
  await m.react('🕒')

  // Hitung total fitur (plugin yg ada help & tags)
  let totalFitur = Object.values(global.plugins).filter(v => v.help && v.tags).length

  // Hitung total command dari semua plugin
  let totalCommand = Object.values(global.plugins).map(v => v.command)
    .filter(v => v) // hanya yang punya command
    .map(v => Array.isArray(v) ? v.length : 1) // kalau array, ambil length-nya, kalau bukan berarti 1
    .reduce((a, b) => a + b, 0) // totalin semua

  await m.react('✅')

  let caption = `
📊 *INFORMASI BOT*

🔧 Total fitur aktif: *${totalFitur}*
📖 Total command aktif: *${totalCommand}*

Ketik *.menu* atau *.help* untuk lihat daftar fitur lengkap.
`.trim()

  // Kirim gambar thumbnail dengan caption
  await conn.sendFile(m.chat, './media/thumbnail.jpg', 'thumbnail.jpg', caption, m)

  // Kirim audio (voice note) dari file lokal
  await conn.sendMessage(m.chat, {
    audio: { url: './media/1.mp3' },
    mimetype: 'audio/mp4',
    ptt: true
  }, { quoted: m })
}

handler.help = ['totalfitur']
handler.tags = ['info']
handler.command = ['totalfitur']

export default handler