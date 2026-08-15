import fetch from 'node-fetch'
import moment from 'moment-timezone'

function momentGreeting() {
  const hour = moment().tz('Asia/Jakarta').hour()
  if (hour >= 4 && hour < 10) return 'Selamat pagi 🌅'
  if (hour >= 10 && hour < 15) return 'Selamat siang ☀️'
  if (hour >= 15 && hour < 18) return 'Selamat sore 🌇'
  if (hour >= 18 || hour < 4) return 'Selamat malam 🌙'
  return 'Halo~'
}

let handler = async (m, { conn, text }) => {
  if (!text) throw '💬 Mau ngobrol apa dengan Elaina sang penyihir cantik?'

  // Ambil thumbnail Elaina sebagai buffer
  const thumb = await fetch('https://files.catbox.moe/oqf3vm.jpg').then(res => res.buffer())

  // Setup adReply global (opsional disimpan global agar reusable)
  global.adReply = {
    contextInfo: {
      forwardingScore: 999,
      isForwarded: false,
      forwardedNewsletterMessageInfo: {
        newsletterName: 'DEX SHYAM TECH',
        newsletterJid: '120363406449026172@newsletter'
      },
      externalAdReply: {
        title: `ᴇʟᴀɪɴᴀ`,
        body: momentGreeting(),
        previewType: 'PHOTO',
        thumbnail: thumb,
        sourceUrl: 'https://t.me/hilmanXD' // bebas
      }
    }
  }

  let prompt = `Kamu adalah Elaina dari anime Majo no Tabitabi. Kamu penyihir muda yang elegan, pintar, dan percaya diri. Jawabanmu lembut dan anggun.`

  let url = `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}&content=${encodeURIComponent(text)}`
  let res = await fetch(url)
  let json = await res.json()

  if (!json.status || !json.data) throw '🪄 Elaina sedang menjelajah. Coba tanya lagi nanti~'

  let reply = `🪄 *Elaina:*\n${json.data}`

  // Kirim pesan pakai adReply + thumbnail
  await conn.sendMessage(m.chat, {
    text: reply,
    contextInfo: global.adReply.contextInfo
  }, { quoted: m })
}

handler.help = ['elainaai <pesan>']
handler.tags = ['ai']
handler.command = /^elainaai$/i
handler.premium = false
export default handler