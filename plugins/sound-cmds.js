const { cmd } = require("../command");

for (let i = 1; i <= 161; i++) {

    cmd({
        pattern: `sound${i}`,
        alias: [],
        desc: `Play sound number ${i}`,
        category: "media",
        react: "🎵",
        filename: __filename
    },

    async (conn, mek, m, { from, reply, command }) => {
        try {
            // Extract number from command (sound7 → 7)
            const num = command.replace("sound", "");

            // TikTok Music
            const url = `https://github.com/iTx-Sarkar/Sounds/raw/master/tiktokmusic/sound${num}.mp3`;

            await conn.sendMessage(
                from,
                {
                    audio: { url },
                    mimetype: "audio/mpeg",
                    ptt: false,

                    contextInfo: {
                        externalAdReply: {
                            title: "AS-BOT",
                            body: "AS-BOT Audio Collection",
                            thumbnailUrl: "https://ik.imagekit.io/shaban/SHABAN-1784205527063_Zze7YpdxH.jpeg",
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            showAdAttribution: true,
                            sourceUrl: "https://github.com/naveedahmed35581-arch/Naveed-MD"
                        }
                    }
                },
                { quoted: mek }
            );

        } catch (e) {
            console.error(e);
            reply("⚠ Error playing sound.");
        }
    });
}
