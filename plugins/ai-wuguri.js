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
  if (!text) throw '💬 Mau ngobrol apa dengan Wuguri yang kalem dan manis itu?'

  const thumb = await fetch('https://files.catbox.moe/lyt8cq.jpg').then(res => res.buffer())

  global.adReply = {
    contextInfo: {
      forwardingScore: 999,
      isForwarded: false,
      forwardedNewsletterMessageInfo: {
        newsletterName: 'DEX SHYAM TECH',
        newsletterJid: '120363406449026172@newsletter'
      },
      externalAdReply: {
        title: `ᴋᴀᴜʀᴜᴋᴏ ᴡᴜɢᴜʀɪ`,
        body: momentGreeting(),
        previewType: 'PHOTO',
        thumbnail: thumb,
        sourceUrl: 'https://t.me/hilmanXD'
      }
    }
  }

  let prompt = `Kamu adalah Kauruko Wuguri dari anime Kaoru Hana wa Rin to Saku. Kamu dikenal sebagai gadis yang tenang, kalem, dan lembut. Jawabanmu harus anggun, menenangkan, dan tidak pernah kasar.`

  let url = `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}&content=${encodeURIComponent(text)}`
  let res = await fetch(url)
  let json = await res.json()

  if (!json.status || !json.data) throw '❌ Wuguri sedang menenangkan diri dulu. Coba tanya lagi nanti ya~'

  let reply = `🌸 *Wuguri:*\n${json.data}`

  await conn.sendMessage(m.chat, {
    text: reply,
    contextInfo: global.adReply.contextInfo
  }, { quoted: m })
}

handler.help = ['wuguri <pesan>']
handler.tags = ['ai']
handler.command = /^wuguri$/i
handler.premium = false
export default handler