/*
📌 Nama Fitur: Kudeta group
🏷️ Type : Plugin ESM
🔗 Sumber : https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o
✍️ Convert By ZenzXD
*/

let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let handler = async (m, { conn, participants }) => {
  let botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';

  let adminFilter = participants
    .filter(v => v.admin && v.id !== botNumber && v.id !== m.sender)
    .map(v => v.id);

  if (adminFilter.length < 1)
    return m.reply("Gaada atmin yang mau di kick");

  await m.reply(`Kudeta Grup akan di mulai BERSIAPLAH 🔥🔥🔥`);

  for (let i of adminFilter) {
    await conn.groupParticipantsUpdate(m.chat, [i], 'remove').catch(err => {
      console.log(`Gagal mengeluarkan ${i}:`, err);
    });
    await sleep(1000);
  }

  await m.reply("Kudeta group berhasil 🔥👑");
};

handler.help = ["kudeta", "kudetagc"];
handler.tags = ["group"];
handler.command = /^kudeta(gc)?$/i;
handler.group = true;
handler.owner = true;
handler.botAdmin = true;

export default handler