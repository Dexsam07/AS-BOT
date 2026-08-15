/*
Fitur : Hitungan WR ML
Type : plugins esm
wm : https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o
*/
import axios from 'axios'
import cheerio from 'cheerio'

async function hitungWRML(totalMatch, winMatch, targetWR) {
  const res = await axios.get('https://hitung.id/hitung-wr-ml')
  const $ = cheerio.load(res.data)
  const nowWR = (winMatch / totalMatch) * 100
  if (targetWR <= nowWR) {
    return { nowWR, neededWin: 0, neededMatch: 0 }
  }
  const x = Math.ceil((targetWR * totalMatch - 100 * winMatch) / (100 - targetWR))
  return { nowWR, neededWin: x, neededMatch: x }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (args.length < 3) return m.reply(`Contoh: ${usedPrefix + command} <totalMatch> <winMatch> <targetWR%>\nMisal: ${usedPrefix + command} 200 120 70`)
  const [t, w, trg] = args.map(v => v.replace(/[^0-9.]/g, ''))
  const totalMatch = parseInt(t)
  const winMatch = parseInt(w)
  const targetWR = parseFloat(trg)

  if (!totalMatch || !winMatch || !targetWR) return m.reply('Argumen tidak valid!')
  if (winMatch > totalMatch) return m.reply('Win tidak boleh lebih besar dari Total Match!')
  if (targetWR <= 0 || targetWR >= 100) return m.reply('Target WR% di antara 0–100.')

  try {
    const res = await hitungWRML(totalMatch, winMatch, targetWR)
    const { nowWR, neededWin, neededMatch } = res

    let txt = `📊 *Hasil Hitung WR ML*\n\n`
    txt += `• Total Match: ${totalMatch}\n`
    txt += `• Win: ${winMatch}\n`
    txt += `• WinRate sekarang: ${nowWR.toFixed(2)}%\n`
    txt += `• Target WR: ${targetWR}%\n\n`

    if (neededWin === 0) {
      txt += `🎉 WinRate kamu *sudah mencapai* target!`
    } else {
      txt += `Untuk mencapai ${targetWR}% WR, kamu perlu menang *${neededWin}× berturut‑turut*.`
    }

    m.reply(txt)
  } catch (e) {
    m.reply(`❌ Gagal ambil data: ${e.message || e}`)
  }
}

handler.help = ['wrml <totalMatch> <winMatch> <targetWR%>']
handler.tags = ['tools','game']
handler.command = /^wrml$/i
handler.limit = true

export default handler