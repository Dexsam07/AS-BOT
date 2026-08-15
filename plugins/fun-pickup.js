const { cmd } = require("../command");

cmd({
    pattern: "sy",
    alias: ["se", "ss", "flirt"],
    desc: "Hidden fun lines",
    category: "fun",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, userConfig }) => {
    try {
        const botConfig = userConfig;

        const lines = [
            "🥰 Tumhari ek muskurahat pe to mai apna pura din qurban kar dun 💖\nTum hasti ho to lagta hai jese subah ho gayi ho ✨🌸",
            
            "😍 Hayee tumhari aankhein 👀💘\nDekh ke to dil kehta hai bas tumhe dekhta hi rahun, duniya bhul jaun 🌍❤️",
            
            "🌹 Tum itni pyari ho ke chand bhi tumhe dekh ke sharma jaye 🌙🙈\nSach me tum jesi koi nahi is puri duniya me 💞",
            
            "💌 Tum paas hoti ho to waqt ruk sa jata hai ⏰💖\nDil kehta hai kaash ye lamha yahin tham jaye 🥺👩‍❤️‍👨",
            
            "😜 Oye suno naa 🫣\nTumhari hansi ka network to Jazz se bhi tez hai 📶😂💓\nSeedha dil me connect ho jati hai!",
            
            "✨ Tumhe dekh ke lagta hai jaise koi khwab haqiqat ban gaya ho 💭❤️\nTum meri zindagi ki sab se haseen khwahish ho 🥰🌸",
            
            "🔥 Uff tumhari adaayein 😏💘\nEk nazar dekha to dil ne kaha bas tum hi to ho jise mai dhoondh raha tha 🫶",
            
            "💖 Tumhare bina group suna lagta hai 🥺\nJab tum aati ho to ronak aa jati hai 🎉😍✨",
            
            "🌈 Tumhari baaton me jadu hai ✨🪄\nSun ke to pura din acha guzar jata hai, tum best ho yaar 💝😘",
            
            "🫣 Hayee itni cuteness kahan se laati ho? 🥰🍫\nTum to chocolate se bhi zyada meethi ho 😋💕",
            
            "💞 Dil ne aaj phir tumhe yaad kiya hai 💌\nPata nahi kyu tumhare khayal se hi chehre pe muskurahat aa jati hai 😊🌹",
            
            "🌸 Tum phoolon se bhi zyada haseen ho 💐💖\nTumhe dekh ke to dil garden ho jata hai 🌷😍"
        ];

        const random = lines[Math.floor(Math.random() * lines.length)];
        await conn.sendMessage(from, { react: { text: "🥰", key: m.key } });
        
        await reply(`*💘 CUTE LINE FOR YOU 💘*\n\n${random}\n\n*${botConfig.CAPTION || "Powered by AS-BOT"}*`);
    } catch (e) {
        reply("❌ Error!");
    }
});
