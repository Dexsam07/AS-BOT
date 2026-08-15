const { cmd } = require("../command");

cmd({
    pattern: "getpp",
    alias: ["getdp", "getprofile", "pp", "dp"],
    desc: "Get profile picture of any number",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, userConfig }) => {
    try {
        const botConfig = userConfig;
        let targetJid;

        if (m.quoted) {
            targetJid = m.quoted.sender;
        } 
        else if (q) {
            let num = q.replace(/[^0-9]/g, "");
            if (num.startsWith("0")) num = "92" + num.substring(1);
            if (!num.startsWith("92") && num.length === 10) num = "92" + num;
            if (num.length < 11) return reply("❌ Sahi number do! Example: .getpp 923001234567");
            targetJid = num + "@s.whatsapp.net";
        } 
        else {
            return reply("❌ Use: .getpp <number> ya kisi ke msg pe reply karke .getpp likho\nExample: .getpp 923001234567");
        }

        await conn.sendMessage(from, { react: { text: "🔍", key: m.key } });

        try {
            const ppUrl = await conn.profilePictureUrl(targetJid, "image");
            
            // Link khatam, sirf pic + number
            const caption = `*${botConfig.CAPTION || "Powered by AS-BOT"}*`;

            await conn.sendMessage(from, { image: { url: ppUrl }, caption: caption }, { quoted: m });
            await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

        } catch (e) {
            await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
            return reply(`❌ DP nahi mili! Number private hai ya WhatsApp pe nahi.`);
        }

    } catch (error) {
        console.error("GetPP error:", error);
        reply("❌ Error while getting profile picture!");
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});
