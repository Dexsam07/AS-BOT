const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
✦ ───── ⋆⋅♡⋅⋆ ───── ✦
      ♡̷  *${settings.botName || 'DEX-MD'}*  ♡̷
   Version ✦ *${settings.version || '3.0.0'}*
   Owner ✦ ${settings.botOwner || 'Shyam Chaudhari'}
   YT ✦ ${global.ytch || 'https://youtube.com/@Dex_shyam_07'}
✦ ───── ⋆⋅♡⋅⋆ ───── ✦

           ♡ AS-BOT  MENU ♡
         ⋆⋅✦⋅⋆⋅♡⋅⋆⋅✦⋅⋆

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
          🌸 *General Commands* 🌸
├──────────────────────────────────┤
│  ♡ .help  /  .menu               │
│  ♡ .ping                         │
│  ♡ .alive                        │
│  ♡ .tts <text>                   │
│  ♡ .owner                        │
│  ♡ .joke                         │
│  ♡ .quote                        │
│  ♡ .fact                         │
│  ♡ .weather <city>               │
│  ♡ .news                         │
│  ♡ .attp <text>                  │
│  ♡ .lyrics <song>                │
│  ♡ .8ball <question>             │
│  ♡ .groupinfo                    │
│  ♡ .staff  /  .admins            │
│  ♡ .vv                           │
│  ♡ .trt <text> <lang>            │
│  ♡ .ss <link>                    │
│  ♡ .jid                          │
│  ♡ .url                          │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
          👑 *Admin Commands* 👑
├──────────────────────────────────┤
│  ♡ .ban @user                    │
│  ♡ .promote @user                │
│  ♡ .demote @user                 │
│  ♡ .mute <minutes>               │
│  ♡ .unmute                       │
│  ♡ .delete  /  .del              │
│  ♡ .kick @user                   │
│  ♡ .warnings @user               │
│  ♡ .warn @user                   │
│  ♡ .antilink                     │
│  ♡ .antibadword                  │
│  ♡ .clear                        │
│  ♡ .tag <message>                │
│  ♡ .tagall                       │
│  ♡ .tagnotadmin                  │
│  ♡ .hidetag <msg>                │
│  ♡ .chatbot                      │
│  ♡ .resetlink                    │
│  ♡ .antitag <on/off>             │
│  ♡ .welcome <on/off>             │
│  ♡ .goodbye <on/off>             │
│  ♡ .setgdesc <desc>              │
│  ♡ .setgname <name>              │
│  ♡ .setgpp (reply image)         │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
           💗 *Owner Commands* 💗
├──────────────────────────────────┤
│  ♡ .mode <public/private>        │
│  ♡ .clearsession                 │
│  ♡ .antidelete                   │
│  ♡ .cleartmp                     │
│  ♡ .update                       │
│  ♡ .settings                      │
│  ♡ .rentbot 
│  ♡ .channelid                    │
│  ♡ .setpp (reply image)          │
│  ♡ .autoreact <on/off>           │
│  ♡ .autostatus <on/off>          │
│  ♡ .autostatus react <on/off>    │
│  ♡ .autotyping <on/off>          │
│  ♡ .autoread <on/off>            │
│  ♡ .anticall <on/off>            │
│  ♡ .pmblocker <on/off/status>    │
│  ♡ .pmblocker setmsg <text>      │
│  ♡ .setmention (reply msg)       │
│  ♡ .mention <on/off>             │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
       🎀 *Image / Sticker* 🎀
├──────────────────────────────────┤
│  ♡ .blur <image>                 │
│  ♡ .simage (reply sticker)       │
│  ♡ .sticker (reply image)        │
│  ♡ .removebg                     │
│  ♡ .remini                       │
│  ♡ .crop (reply image)           │
│  ♡ .tgsticker <link>             │
│  ♡ .meme                         │
│  ♡ .take <packname>              │
│  ♡ .emojimix <emoji1>+<emoji2>   │
│  ♡ .igs <insta link>             │
│  ♡ .igsc <insta link>            │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
          🖤 *Pies Commands* 🖤
├──────────────────────────────────┤
│  ♡ .pies <country>               │
│  ♡ .china                        │
│  ♡ .indonesia                    │
│  ♡ .japan                        │
│  ♡ .korea                        │
│  ♡ .hijab                        │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
           🎮 *Games* 🎮
├──────────────────────────────────┤
│  ♡ .tictactoe @user              │
│  ♡ .hangman                      │
│  ♡ .guess <letter>               │
│  ♡ .trivia                       │
│  ♡ .answer <answer>              │
│  ♡ .truth                        │
│  ♡ .dare                         │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
           🤍 *AI Commands* 🤍
├──────────────────────────────────┤
│  ♡ .gpt <question>               │
│  ♡ .gemini <question>            │
│  ♡ .imagine <prompt>             │
│  ♡ .flux <prompt>                │
│  ♡ .sora <prompt>                │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
           💕 *Fun Commands* 💕
├──────────────────────────────────┤
│  ♡ .compliment @user             │
│  ♡ .insult @user                 │
│  ♡ .flirt                        │
│  ♡ .shayari                      │
│  ♡ .goodnight                    │
│  ♡ .roseday                      │
│  ♡ .character @user              │
│  ♡ .wasted @user                 │
│  ♡ .ship @user                   │
│  ♡ .simp @user                   │
│  ♡ .stupid @user [text]          │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
        💗 *Textmaker* 💗
├──────────────────────────────────┤
│  ♡ .metallic <text>              │
│  ♡ .ice <text>                   │
│  ♡ .snow <text>                  │
│  ♡ .impressive <text>            │
│  ♡ .matrix <text>                │
│  ♡ .light <text>                 │
│  ♡ .neon <text>                  │
│  ♡ .devil <text>                 │
│  ♡ .purple <text>                │
│  ♡ .thunder <text>               │
│  ♡ .leaves <text>                │
│  ♡ .1917 <text>                  │
│  ♡ .arena <text>                 │
│  ♡ .hacker <text>                │
│  ♡ .sand <text>                  │
│  ♡ .blackpink <text>             │
│  ♡ .glitch <text>                │
│  ♡ .fire <text>                  │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
       📥 *Downloader* 📥
├──────────────────────────────────┤
│  ♡ .play <song name>             │
│  ♡ .song <song name>             │
│  ♡ .spotify <query>              │
│  ♡ .instagram <link>             │
│  ♡ .facebook <link>              │
│  ♡ .tiktok <link>                │
│  ♡ .video <song name>            │
│  ♡ .ytmp4 <link>                 │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
         🖤 *MISC / Edits* 🖤
├──────────────────────────────────┤
│  ♡ .heart    ♡ .horny            │
│  ♡ .circle   ♡ .lgbt             │
│  ♡ .lolice   ♡ .its-so-stupid    │
│  ♡ .namecard ♡ .oogway           │
│  ♡ .tweet    ♡ .ytcomment        │
│  ♡ .comrade  ♡ .gay              │
│  ♡ .glass    ♡ .jail             │
│  ♡ .passed   ♡ .triggered        │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
         🫶 *Anime Actions* 🫶
├──────────────────────────────────┤
│  ♡ .nom    ♡ .poke               │
│  ♡ .cry    ♡ .kiss               │
│  ♡ .pat    ♡ .hug                │
│  ♡ .wink   ♡ .facepalm           │
╰─────── ⋆⋅♡⋅⋆ ───────╯

╭─────── ⋆⋅♡ AS-BOT  ⋅⋆ ───────╮
         💿 *Github / Script* 💿
├──────────────────────────────────┤
│  ♡ .git     ♡ .github            │
│  ♡ .sc      ♡ .script            │
│  ♡ .repo                         │
╰─────── ⋆⋅♡⋅⋆ ───────╯

✦ ───── ⋆⋅♡⋅⋆ ───── ✦
       Join our channel for updates!
           AS-BOT 
✦ ───── ⋆⋅♡⋅⋆ ───── ✦`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363406449026172@newsletter',
                        newsletterName: 'DEX SHYAM TECH',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363406449026172@newsletter',
                        newsletterName: 'DEX SHYAM TECH',
                        serverMessageId: -1
                    } 
                }
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { 
            text: helpMessage 
        }, { quoted: message });
    }
}

module.exports = helpCommand;