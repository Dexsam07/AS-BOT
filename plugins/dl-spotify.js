const axios = require("axios");
const { cmd } = require("../command");

const SPOTIFY_SEARCH = "https://jerrycoder.oggyapi.workers.dev/search/spotify";
const SPOTIFY_DOWNLOAD = "https://jerrycoder.oggyapi.workers.dev/down/spotify";
const TIMEOUT = 20000;

const api = {
    get: (url, config = {}) => axios.get(url, { timeout: TIMEOUT, ...config }),
    post: (url, data, config = {}) => axios.post(url, data, { timeout: TIMEOUT, ...config })
};

function cleanName(name) {
    return name.replace(/[\\/:*?"<>|]/g, "").slice(0, 60);
}

function isSpotifyLink(q) {
    return q.includes("open.spotify.com/track/");
}

async function spotifySearch(query) {
    try {
        const { data } = await api.get(
            `${SPOTIFY_SEARCH}?q=${encodeURIComponent(query)}&limit=5`
        );

        if (
            !data ||
            data.status !== "success" ||
            !Array.isArray(data.tracks) ||
            !data.tracks.length
        ) {
            return null;
        }

        const track = data.tracks[0];
        return {
            title: track.trackName,
            artist: track.artist,
            thumbnail: track.image,
            url: track.spotifyUrl
        };
    } catch (e) {
        console.log("[SPOTIFY SEARCH ERROR]", e.message);
        return null;
    }
}

async function spotifyDownload(url) {
    try {
        const { data } = await api.get(
            `${SPOTIFY_DOWNLOAD}?url=${encodeURIComponent(url)}`
        );

        if (
            !data ||
            data.status !== "success" ||
            !data.download_link
        ) {
            return null;
        }

        return {
            title: data.title,
            artist: data.artist,
            thumb: data.thumbnail,
            dl: data.download_link
        };
    } catch (e) {
        console.log("[SPOTIFY DOWNLOAD ERROR]", e.message);
        return null;
    }
}

cmd({
    pattern: "spotify",
    alias: ["spot", "spdl"],
    desc: "Download Spotify song",
    category: "download",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, userConfig }) => {
    try {
        const botConfig = userConfig;
        const q = args.join(" ");

        if (!q) {
            return reply("❌ Song name ya Spotify link do\n\nExample:\n.spotify Tu Hai Kahan");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        let trackUrl;
        let searchData = null;

        if (!isSpotifyLink(q)) {
            searchData = await spotifySearch(q);
            if (!searchData) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply("❌ Song search nahi ho saka.");
            }
            trackUrl = searchData.url;
        } else {
            trackUrl = q.split("?")[0];
        }

        const data = await spotifyDownload(trackUrl);

        if (!data) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Spotify download failed.");
        }

        const fileName = cleanName(data.title) + ".mp3";
        const thumb = data.thumb || searchData?.thumbnail || botConfig?.ALIVE_IMG;

        if (thumb) {
            await conn.sendMessage(from, {
                image: { url: thumb },
                caption: `🎵 *${data.title}*\n\n👤 Artist: ${data.artist || searchData?.artist || "Unknown"}\n🔗 Spotify Track\n\n${botConfig?.CAPTION || "POWERED BY AS-BOT"}`
            }, { quoted: mek });
        }

        await conn.sendMessage(from, {
            audio: { url: data.dl },
            mimetype: "audio/mpeg",
            fileName,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("[SPOTIFY CMD ERROR]", err);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ Spotify Download Failed\n\n${err.message}`);
    }
});
