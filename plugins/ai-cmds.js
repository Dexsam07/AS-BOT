const { cmd } = require('../command.js');
const axios = require('axios');

// ======================================================
// CHATGPT / GPT-4o AI COMMAND
// ======================================================

cmd({
    pattern: "chatgpt",
    alias: ["gpt", "ai", "gpt4o", "ask"],
    react: "🤖",
    desc: "Ask questions from GPT-4o AI",
    category: "ai",
    use: ".chatgpt what is gravity?",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {

    try {

        if (!q) {
            return reply(
                "❌ *Please provide a query!*\n\nExample:\n.chatgpt write a short poem about love."
            );
        }

        // React with wait/process emoji
        try {
            await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });
        } catch (reactErr) {
            console.log("Reaction error:", reactErr.message);
        }

        const apiUrl =
            `https://api.giftedtech.co.ke/api/ai/gpt4o?apikey=gifted&q=${encodeURIComponent(q.trim())}`;

        const response = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                Accept: "application/json"
            }
        });

        const data = response?.data;

        console.log("GPT4O API RESPONSE STATUS:", data?.status);

        if (!data || data.success !== true || !data.result) {
            try {
                await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
            } catch (_) {}
            return reply("❌ Server returned an invalid response. Please try again later.");
        }

        const answer = data.result;

        await reply(answer);

        try {
            await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });
        } catch (_) {}

    } catch (err) {
        console.log(
            "CHATGPT CMD ERROR:",
            err?.response?.data || err.message
        );

        try {
            await conn.sendMessage(m.chat, { react: { text: "❌", key: mek.key } });
        } catch (_) {}

        return reply(
            "❌ AI server se connection fail ho gaya."
        );
    }
});
