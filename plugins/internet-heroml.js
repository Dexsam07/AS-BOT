/* 
Fitur : Hero ML Details 
Type : Plugins ESM 
API : https://api.sxtream.xyz
WM : https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o
*/
import fetch from 'node-fetch'

let handler = async (m, { args, usedPrefix, command }) => {
  let heroName = args.join(' ')
  if (!heroName) return m.reply(`Contoh penggunaan:\n${usedPrefix + command} Gusion`)

  try {
    let res = await fetch(`https://api.sxtream.xyz/search/hero-ml-detail?heroName=${encodeURIComponent(heroName)}`)
    if (!res.ok) throw await res.text()
    let json = await res.json()

    if (!json.result) throw '❌ Hero tidak ditemukan.'

    let hero = json.result

    let caption = `✨ *Detail Hero MLBB*\n\n`
    caption += `🏷️ *Nama:* ${hero.name}\n`
    caption += `🛡️ *Role:* ${hero.role}\n`
    caption += `⚔️ *Speciality:* ${hero.speciality}\n`
    caption += `🗺️ *Lane:* ${hero.lane}\n`
    caption += `💰 *Battle Point:* ${hero.price_bp}\n`
    caption += `💎 *Diamond:* ${hero.price_diamond}\n`
    caption += `📅 *Rilis:* ${hero.release_date}`

    await conn.sendMessage(m.chat, {
      image: { url: hero.image_url },
      caption,
      contextInfo: {
        externalAdReply: {
          title: hero.name,
          body: hero.role + ' • ' + hero.speciality,
          thumbnailUrl: hero.image_url,
          sourceUrl: 'https://mobile-legends.fandom.com/wiki/' + encodeURIComponent(hero.name),
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m })
  } catch (e) {
    console.error(e)
    m.reply('❌ Gagal mengambil data hero. Pastikan nama hero benar.')
  }
}

handler.help = ['mlhero <nama>']
handler.tags = ['internet', 'game']
handler.command = /^mlhero$/i
handler.limit = true

export default handler