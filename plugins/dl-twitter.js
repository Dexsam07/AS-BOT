const axios = require("axios");
const { cmd } = require("../command");

const TIMEOUT = 20000;
const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

cmd({
    pattern: "twitter",
    alias: ["tw", "xdl"],
    desc: "Download Twitter / X video",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, userConfig }) => {
    try {
        const botConfig = userConfig;

        if (!text) {
            return reply(`❌ *Example:*\n.twitter https://x.com/...`);
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const body = new URLSearchParams({
            q: text,
            lang: 'id',
            cftoken: ''
        }).toString();

        const { data } = await api.post(
            'https://savetwitter.net/api/ajaxSearch',
            body,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': 'https://savetwitter.net',
                    'Referer': 'https://savetwitter.net/id3'
                }
            }
        );

        const html = data?.data;
        if (!html) return reply('❌ *Video data fetch failed*');

        const title = html.match(/<h3>(.*?)<\/h3>/)?.[1]?.trim() || 'Twitter Video';
        const duration = html.match(/<p>(\d+:\d+)<\/p>/)?.[1] || '-';
        const thumbnail = html.match(/<img src="([^"]+)"/)?.[1];
        const videos = [...html.matchAll(/href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)".*?MP4\s*\(([^)]+)\)/g)].map(v => ({
            url: v[1],
            quality: v[2]
        }));

        if (!videos.length) {
            return reply('❌ *No MP4 video found*');
        }

        const best = videos[0];
        let caption = `*🐦 Twitter / X Downloader*\n\n`;
        caption += `*📌 Title:* ${title}\n`;
        caption += `*⏱️ Duration:* ${duration}\n`;
        caption += `*🎞️ Quality:* ${best.quality}\n\n`;
        caption += `*© ${botConfig.CAPTION || "Powered by AS-BOT"}*`;

        let thumbBuffer = null;
        if (thumbnail) {
            try {
                const thumbRes = await api.get(thumbnail, { responseType: 'arraybuffer' });
                thumbBuffer = thumbRes.data;
            } catch {}
        }

        await conn.sendMessage(from, {
            video: { url: best.url },
            caption,
            jpegThumbnail: thumbBuffer
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error("Twitter Error:", err);
        reply(`❌ *Error while downloading*\n\n${err.message}`);
    }
});
