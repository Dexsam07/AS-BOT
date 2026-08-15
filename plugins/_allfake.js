import fs from 'fs'
import moment from 'moment-timezone'
let handler = m => m

handler.all = async function (m) {
  global.wm = 'ʀyᴏ yᴀᴍᴀᴅᴀ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ'

  let thumb
  try {
    thumb = fs.readFileSync('./thumbnail.jpg')
  } catch (e) {
    thumb = await (await fetch("https://files.catbox.moe/hwnuo9.jpg")).buffer()
  }

  global.adReply = {
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterName: 'DEX SHYAM TECH',
        newsletterJid: "120363406449026172@newsletter"
      },
      externalAdReply: {
        title: `ʀyᴏ yᴀᴍᴀᴅᴀ ᴍᴜʟᴛɪ ᴅᴇᴠɪᴄᴇ`,
        body: `${momentGreeting()}`,
        previewType: "PHOTO",
        thumbnail: thumb
        
      }
    }
  }
}

export default handler

function momentGreeting() {
  const hour = moment.tz('Asia/Jakarta').hour()
  if (hour >= 18) return 'Konbanwa🍃'
  if (hour >= 15) return 'Konnichiwa🌾'
  if (hour > 10) return 'Konnichiwa🍂'
  if (hour >= 4) return 'Ohayou Gozaimasu🌿'
  return 'Oyasuminasai🪷'
}