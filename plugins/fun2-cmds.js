const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath.path);

const USER_AGENT = 'jawad-best.js / 6.6.0';

async function fetchGif(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', headers: { 'User-Agent': USER_AGENT }, timeout: 15000 });
        return response.data;
    } catch (error) {
        throw new Error("Could not fetch GIF.");
    }
}

async function gifToVideo(gifBuffer) {
    const filename = crypto.randomBytes(8).toString('hex');
    const gifPath = path.join(tmpdir(), `${filename}.gif`);
    const mp4Path = path.join(tmpdir(), `${filename}.mp4`);
    fs.writeFileSync(gifPath, gifBuffer);
    await new Promise((resolve, reject) => {
        ffmpeg(gifPath).outputOptions(["-movflags faststart", "-pix_fmt yuv420p", "-vf scale=trunc(iw/2)*2:trunc(ih/2)*2"]).on("error", reject).on("end", resolve).save(mp4Path);
    });
    const videoBuffer = fs.readFileSync(mp4Path);
    fs.unlinkSync(gifPath); fs.unlinkSync(mp4Path);
    return videoBuffer;
}

async function getNekosGif(action) {
    const response = await axios.get(`https://nekos.best/api/v2/${action}`, { headers: { 'User-Agent': USER_AGENT } });
    return response.data.results[0].url;
}

const reactions = [
    { pattern: "lurk", action: "lurk", emoji: "👀", text: "is lurking" },
    { pattern: "shoot", action: "shoot", emoji: "🔫", text: "shot" },
    { pattern: "sleep", action: "sleep", emoji: "😴", text: "is sleeping with" },
    { pattern: "clap", action: "clap", emoji: "👏", text: "clapped for" },
    { pattern: "shrug", action: "shrug", emoji: "🤷", text: "shrugged at" },
    { pattern: "stare", action: "stare", emoji: "👀", text: "is staring at" },
    { pattern: "wave", action: "wave", emoji: "👋", text: "waved at" },
    { pattern: "poke", action: "poke", emoji: "👉", text: "poked" },
    { pattern: "confused", action: "confused", emoji: "😕", text: "is confused by" },
    { pattern: "smile", action: "smile", emoji: "😁", text: "smiled at" },
    { pattern: "peck", action: "peck", emoji: "🐦", text: "pecked" },
    { pattern: "wink", action: "wink", emoji: "😉", text: "winked at" },
    { pattern: "sip", action: "sip", emoji: "☕", text: "is sipping with" },
    { pattern: "blush", action: "blush", emoji: "😊", text: "is blushing at" },
    { pattern: "smug", action: "smug", emoji: "😏", text: "is smug at" },
    { pattern: "tickle", action: "tickle", emoji: "🤣", text: "tickled" },
    { pattern: "yeet", action: "yeet", emoji: "💨", text: "yeeted" },
    { pattern: "think", action: "think", emoji: "🤔", text: "is thinking about" },
    { pattern: "highfive", action: "highfive", emoji: "✋", text: "gave a high-five to" },
    { pattern: "feed", action: "feed", emoji: "🍕", text: "is feeding" },
    { pattern: "wag", action: "wag", emoji: "🐕", text: "wagged at" },
    { pattern: "bite", action: "bite", emoji: "🦷", text: "bit" },
    { pattern: "teehee", action: "teehee", emoji: "😜", text: "teehee'd at" },
    { pattern: "shocked", action: "shocked", emoji: "😮", text: "is shocked by" },
    { pattern: "bleh", action: "bleh", emoji: "😝", text: "bleh'd at" },
    { pattern: "bored", action: "bored", emoji: "😑", text: "is bored by" },
    { pattern: "nom", action: "nom", emoji: "🍽️", text: "is nomming" },
    { pattern: "nya", action: "nya", emoji: "🐱", text: "nya'd at" },
    { pattern: "yawn", action: "yawn", emoji: "🥱", text: "yawned at" },
    { pattern: "facepalm", action: "facepalm", emoji: "🤦", text: "facepalmed at" },
    { pattern: "cuddle", action: "cuddle", emoji: "🤗", text: "cuddled" },
    { pattern: "kick", action: "kick", emoji: "🦶", text: "kicked" },
    { pattern: "happy", action: "happy", emoji: "😄", text: "is happy with" },
    { pattern: "carry", action: "carry", emoji: "🏃", text: "carried" },
    { pattern: "hug", action: "hug", emoji: "🤗", text: "hugged" },
    { pattern: "kabedon", action: "kabedon", emoji: "🧱", text: "kabedon'd" },
    { pattern: "baka", action: "baka", emoji: "😤", text: "called baka" },
    { pattern: "bonk", action: "bonk", emoji: "🔨", text: "bonked" },
    { pattern: "pat", action: "pat", emoji: "🫂", text: "patted" },
    { pattern: "angry", action: "angry", emoji: "😡", text: "is angry at" },
    { pattern: "spin", action: "spin", emoji: "🔄", text: "spun" },
    { pattern: "shake", action: "shake", emoji: "🤝", text: "shook" },
    { pattern: "run", action: "run", emoji: "🏃", text: "ran from" },
    { pattern: "nod", action: "nod", emoji: "🙂", text: "nodded at" },
    { pattern: "nope", action: "nope", emoji: "🙅", text: "said nope to" },
    { pattern: "kiss", action: "kiss", emoji: "💋", text: "kissed" },
    { pattern: "dance", action: "dance", emoji: "💃", text: "danced with" },
    { pattern: "punch", action: "punch", emoji: "👊", text: "punched" },
    { pattern: "handshake", action: "handshake", emoji: "🤝", text: "shook hands with" },
    { pattern: "slap", action: "slap", emoji: "✊", text: "slapped" },
    { pattern: "cry", action: "cry", emoji: "😢", text: "is crying over" },
    { pattern: "lappillow", action: "lappillow", emoji: "🛏️", text: "is using as a lap pillow" },
    { pattern: "pout", action: "pout", emoji: "😤", text: "pouted at" },
    { pattern: "blowkiss", action: "blowkiss", emoji: "😘", text: "blew a kiss to" },
    { pattern: "handhold", action: "handhold", emoji: "🤝", text: "is holding hands with" },
    { pattern: "salute", action: "salute", emoji: "🫡", text: "saluted" },
    { pattern: "thumbsup", action: "thumbsup", emoji: "👍", text: "gave a thumbs up to" },
    { pattern: "laugh", action: "laugh", emoji: "😂", text: "laughed at" },
    { pattern: "tableflip", action: "tableflip", emoji: "(╯°□°)╯︵┻━┻", text: "flipped a table on" }
];

reactions.forEach(({ pattern, action, emoji, text }) => {
    cmd({ pattern, desc: `Send a ${pattern} reaction GIF.`, category: "fun", react: emoji, filename: __filename, use: "@tag (optional)" }, async (conn, mek, m, { reply }) => {
        try {
            const senderJid = mek.sender || mek.key?.participant || mek.from;
            const mentionedUser = mek.mentionedJid?.[0] || (mek.quoted && (mek.quoted.sender || mek.quoted.key?.participant));
            const sender = senderJid ? `@${senderJid.split("@")[0]}` : "@user";
            let message = mentionedUser ? `${sender} ${text} @${mentionedUser.split("@")[0]}` : `${sender} ${text} everyone!`;
            const gifUrl = await getNekosGif(action);
            const videoBuffer = await gifToVideo(await fetchGif(gifUrl));
            await conn.sendMessage(mek.chat, { video: videoBuffer, caption: message, gifPlayback: true, mentions: [senderJid, mentionedUser].filter(Boolean) }, { quoted: mek });
        } catch (e) { reply(`❌ Error: ${e.message}`); }
    });
});