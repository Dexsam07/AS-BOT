const { bandah } = require("../command");

bandah({
  pattern: "forward",
  alias: ["fwd"],
  use: ".forward <jid>",
  desc: "Forward replied message to given JID",
  category: "tools",
  react: "📤",
  filename: __filename
},
async (conn, mek, m, { from, args, reply, sender, isCreator }) => {
  try {

    // 🔒 OWNER ONLY
    if (!isCreator) {
      return reply("❌ _This command is for bot owner only_");
    }

    // ❗ Must reply
    if (!mek.quoted) {
      return reply("❌ Kisi message par reply karo.\n\nExample:\n.forward 92325xxxx@s.whatsapp.net");
    }

    // ❗ JID required
    const jid = args[0];
    if (!jid) {
      return reply("❌ JID do.\nExample:\n.forward 92325xxxx@s.whatsapp.net");
    }

    await m.react("⏳");

    // ✅ REAL WHATSAPP FORWARD
    await conn.sendMessage(jid, {
      forward: mek.quoted,
      force: true
    });

    await m.react("✅");
    reply("✅ Message forwarded successfully.");

  } catch (err) {
    console.error("FORWARD ERROR:", err);
    await m.react("❌");
    reply("❌ Forward failed.");
  }
});
