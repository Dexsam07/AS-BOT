let handler = async (m, { conn, text, usedPrefix, command }) => {
  // List order yang tersedia
  const orders = {
    '3': { name: '3 Day Premium', price: 'Rp. 3.000' },
    '7': { name: '7 Day Premium', price: 'Rp. 10.000' },
    '30': { name: '30 Day Premium', price: 'Rp. 15.000' },
    '60': { name: '60 Day Premium', price: 'Rp. 30.000' },
    '90': { name: '90 Day Premium', price: 'Rp. 40.000' },
    '365': { name: '365 Day Premium', price: 'Rp. 115.000' },
    'G7': { name: '7 Day Join Group', price: 'Rp. 2.000' },
    'G30': { name: '30 Day Join Group', price: 'Rp. 5.000' },
    'G365': { name: '365 Day Join Group', price: 'Rp. 80.000' },
  }

  // Kalau belum isi order id
  if (!text) {
    let list = `*— DAFTAR ORDER —*\n\n`
    for (let id in orders) {
      list += `*${orders[id].name}*\n- OrderID: ${id}\n- Price: ${orders[id].price}\n\n`
    }
    list += `\nKetik:\n${usedPrefix + command} <OrderID>\nContoh: ${usedPrefix + command} 30`
    return conn.reply(m.chat, list, m)
  }

  // Kasih reaction ⏳
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key }})

  const order = orders[text]

  // Cek order id valid atau tidak
  if (!order) {
    return conn.reply(m.chat, `❌ *OrderID tidak tersedia.*\n\nKetik *${usedPrefix + command}* untuk lihat daftar OrderID.`, m)
  }

  // Kirim ke owner
  const nomor = m.sender
  const orderMsg = `*[ ORDERAN MASUK ]*\nNomor: wa.me/${nomor.split("@")[0]}\nOrder: ${order.name}\nPrice: ${order.price}`
  await conn.reply('6285523568687@s.whatsapp.net', orderMsg, m)

  // Kasih feedback ke user
  await conn.reply(m.chat, `✅ *Orderan kamu sudah dikirim ke OWNER!*\nMohon tunggu, nanti OWNER akan menghubungimu.`, m)

  // Kasih reaction ✅
  await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key }})
}

handler.help = ['order']
handler.tags = ['main']
handler.command = /^(order|sewa|premium)$/i
handler.register = false
handler.premium = false

export default handler