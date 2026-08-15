const { cmd } = require('../command');

cmd({
    pattern: "chreact",
    alias: ["creact", "channelreact"],
    react: "❤️",
    desc: "React to whatsapp channel post",
    category: "owner",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, text, isGroup, sender, pushname, isMe, isOwner, isCreator, reply}) => {
try{
    if(!isCreator &&!isOwner) return;
    if(!q) return reply(`*Example:*.chreact https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o 😍,😳,❤️,😮\n\n*Channel post link + emojis required*`);

    let url = args[0];
    let emojiString = args.slice(1).join(" ");

    // Default emojis if not given
    if(!emojiString) emojiString = "❤️,😍,😳,🥰";

    let emojis = emojiString.split(',').map(e => e.trim()).filter(e => e);
    if(emojis.length === 0) emojis = ["❤️"];

    // Extract channel invite code and message id
    let regex = /channel\/([^\/]+)\/(\d+)/;
    let match = url.match(regex);
    if(!match) return reply("*Invalid channel link!* Please provide valid whatsapp channel post link.");

    let inviteCode = match[1];
    let messageId = match[2];

    // Get channel metadata from invite code
    let metadata = await conn.newsletterMetadata("invite", inviteCode);
    let channelJid = metadata.id;

    reply(`*Reacting to channel post ${messageId} with ${emojis.length} emojis...*`);

    for(let emoji of emojis){
        try{
            await conn.newsletterReact(channelJid, messageId, emoji);
            await new Promise(resolve => setTimeout(resolve, 700));
        }catch(err){
            console.log(`Failed to react ${emoji}:`, err.message);
        }
    }

    return reply(`*✅ Successfully reacted to channel post!*\n\n*Channel:* ${inviteCode}\n*Message ID:* ${messageId}\n*Emojis:* ${emojis.join(" ")}`);

}catch(e){
    console.log("[CHREACT ERROR] " + e);
    return reply("*Error:* " + e.message);
}
});
