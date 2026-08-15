const { bandah } = require("../command");

bandah({
    pattern: "jid",
    alias: ["channeljid", "cjid"],
    desc: "Get WhatsApp Channel Information",
    category: "tools",
    react: "🆔",
    filename: __filename
},
async (conn, mek, m, { reply }) => {
    try {

        const text = m.text.split(" ").slice(1).join(" ");

        if (!text) {
            return reply(`📢 *Usage Example*

.jid https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o`);
        }

        const invite = text.split("/").pop().trim();

        const data = await conn.newsletterMetadata("invite", invite);

        if (!data) return reply("❌ Invalid Channel Link.");

        const name =
            data.name ||
            data.thread_metadata?.name ||
            data.thread_metadata?.title ||
            "Unknown Channel";

        const jid =
            data.id ||
            data.jid ||
            "Unknown";

        const description =
            data.description ||
            data.thread_metadata?.description ||
            "No Description";

        const followers =
            data.subscribers ||
            data.thread_metadata?.subscribers_count ||
            "Unknown";

        const verified =
            data.verification === "VERIFIED" ||
            data.thread_metadata?.verification === "VERIFIED"
                ? "✅ Verified"
                : "❌ Not Verified";

        const dp =
            data.picture?.direct_path ||
            data.picture ||
            data.preview ||
            null;

        const caption = `
╭━━━〔 📢 AS-BOT CHANNEL INFO 〕━━━⬣

🏷️ *Channel Name*
${name}

🆔 *Channel JID*
${jid}

👥 *Followers*
${followers}

✅ *Verification*
${verified}

📝 *Description*
${description}

🔗 *Invite Link*
https://whatsapp.com/channel/${invite}

━━━━━━━━━━━━━━━━━━━━

🤖 *Powered By AS-BOT*
`;

        if (dp) {
            await conn.sendMessage(
                m.chat,
                {
                    image: { url: dp },
                    caption
                },
                { quoted: mek }
            );
        } else {
            await reply(caption);
        }

    } catch (err) {
        console.log(err);
        reply(`❌ Error: ${err.message}`);
    }
});
