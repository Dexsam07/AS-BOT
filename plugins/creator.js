import fetch from 'node-fetch'
const nomorown = '917384287404';
const OWNER_NAME = 'Shyam Chaudhari';
const OWNER_NUMBER = '917384287404';
const BOT_NAME = 'AS-BOT';
const CHANNEL_NAME = 'DEX SHYAM TECH';
const CHANNEL_ID = '120363406449026172@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o';

let handler = async (m, { conn, usedPrefix, text, args, command }) => {
let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
let pp = await conn.profilePictureUrl(who).catch(_ => hwaifu.getRandom())
let name = await conn.getName(who)

  const sentMsg = await conn.sendContactArray(m.chat, [
    [`${nomorown}`, `${OWNER_NAME}`, `👑 ${OWNER_NAME}`, `📞 +${OWNER_NUMBER}`, `📢 ${CHANNEL_NAME}`, `🆔 ${CHANNEL_ID}`, `🔗 ${CHANNEL_LINK}`, `🤖 ${BOT_NAME}`],
    [`${conn.user.jid.split('@')[0]}`, `${BOT_NAME}`, `🤖 ${BOT_NAME}`, `👑 Owner: ${OWNER_NAME}`, `📢 ${CHANNEL_NAME}`, `🆔 ${CHANNEL_ID}`, `🔗 ${CHANNEL_LINK}`, `🤖 ${BOT_NAME}`]
  ], fkontak)
  await m.reply(`Owner: ${OWNER_NAME}\nBot: ${BOT_NAME}\nChannel: ${CHANNEL_NAME}`)
  } 
handler.help = ['owner', 'creator']
handler.tags = ['info']

handler.command = /^(owner|creator)$/i

export default handler