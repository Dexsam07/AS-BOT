/* 
auto send stiker kalo no bo di tag di grup 
*/

import fetch from 'node-fetch';

const handler = async (m, { conn }) => {
  if (!m.mentionedJid?.includes(conn.user.jid)) return;

  // Array URL stiker
  const stickers = [
    'https://files.catbox.moe/qpozqk.webp',
    'https://files.catbox.moe/f1ahqf.webp',
    'https://files.catbox.moe/heackw.webp',
    'https://files.catbox.moe/201ocu.webp',
     'https://files.catbox.moe/g0ma3r.webp',
     'https://files.catbox.moe/cpmbjl.webp',
     'https://files.catbox.moe/gt5ucv.webp',
     'https://files.catbox.moe/jidskm.webp',
     'https://files.catbox.moe/13oqlw.webp',
     'https://files.catbox.moe/7xrmh8.webp',
     'https://files.catbox.moe/o770yi.webp',
     'https://files.catbox.moe/h44t0u.webp',
     'https://files.catbox.moe/9liifg.webp',
     'https://files.catbox.moe/ouznzz.webp',
     'https://files.catbox.moe/lil6xo.webp',
     'https://files.catbox.moe/es7u43.webp',
     'https://files.catbox.moe/28pkeb.webp',
     'https://files.catbox.moe/ei3721.webp',
     'https://files.catbox.moe/x8v8f0.webp',
     'https://files.catbox.moe/fs0bxm.webp',
     'https://files.catbox.moe/1zza1m.webp',
     'https://files.catbox.moe/hsp7sc.webp',
     'https://files.catbox.moe/amqxma.webp',
     'https://files.catbox.moe/mh43z3.webp',
     'https://files.catbox.moe/cssdn6.webp'
  ];

  
  const randomSticker = stickers[Math.floor(Math.random() * stickers.length)];

  let res = await fetch(randomSticker);
  let buffer = await res.buffer();

  conn.sendFile(m.chat, buffer, 'tag.webp', '', m, { asSticker: true });
};

handler.customPrefix = /@/i;
handler.command = new RegExp;
handler.group = true;

export default handler;