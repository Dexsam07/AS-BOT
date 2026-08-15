const { amon, fakevCard } = require('../amon');
const axios = require('axios');

amon({
    pattern: "gpt",
    alias: ["ai", "chatgpt"],
    desc: "Get AI response from GPT-4",
    category: "ai",
    react: "🤖",
    use: ".gpt <your question>",
    filename: __filename,
}, async (malvin, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("❌ Please provide a question.\n\nExample: .gpt write a basic html code");
        }

        // ✅ KEITH GPT API
        const apiUrl = `https://apiskeith.vercel.app/ai/gpt4?q=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl, { timeout: 20000 });

        // 🔥 FLEXIBLE RESPONSE HANDLING
        let answer = null;

        if (res.data?.result) {
            answer = res.data.result;
        } else if (res.data?.response) {
            answer = res.data.response;
        } else if (typeof res.data === "string") {
            answer = res.data;
        }

        if (!answer) {
            console.log(res.data);
            return reply("❌ Failed to get a valid response.");
        }

        await malvin.sendMessage(from, {
            text: `🤖 *GPT-4 Response:*\n\n${answer}`,
            contextInfo: {
                mentionedJid: [m.sender]
            }
        }, {
            quoted: fakevCard
        });

    } catch (error) {
        console.log("GPT ERROR:", error.message);
        await reply("❌ Failed to get GPT response. Try again later.");
    }
});