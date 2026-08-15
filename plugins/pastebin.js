/*
📌 Nama Fitur: Get pastebin
🏷️ Type : Plugin ESM
🔗 Sumber : https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o
🔗 Api : https://fastrestapis.fasturl.cloud
✍️ Convert By ZenzXD

gatau lagi upload apa🗿
*/

import axios from 'axios';

const handler = async (m, { text }) => {
  if (!text) {
    return m.reply('*Format salah Contoh:* .pastebin https://pastebin.com/xxxxxxxx');
  }

  try {
    const apiUrl = `https://fastrestapis.fasturl.cloud/downup/pastebindown?url=${encodeURIComponent(text)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    if (!data || !data.status || !data.result || !data.result.content) {
      return m.reply('Gagal mengambil code nya nih pastikan link bener ama link pastebin nya ga private');
    }

    const pastebinContent = data.result.content.trim();
    if (!pastebinContent) {
      return m.reply('Data Pastebin kosong.');
    }

    m.reply(`📋 *Isi Pastebin:*\n\n${pastebinContent}`);
  } catch (error) {
    console.error(error);
    m.reply('❌ Terjadi kesalahan saat mengambil data.');
  }
};

handler.help = ['pastebin <url>'];
handler.tags = ['internet'];
handler.command = ['pastebin'];

export default handler;