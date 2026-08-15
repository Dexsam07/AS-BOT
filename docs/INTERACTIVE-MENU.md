# AS-BOT Interactive Menu

`menu` command ab prefixless mode mein professional WhatsApp list/buttons menu bhejta hai. Main menu mein live loaded plugin categories, active command counts, AS-BOT identity, Shyam Chaudhari owner branding, DEX SHYAM TECH channel details, mode, time aur version dikhte hain.

Category row select karne par category ke commands second interactive list mein aate hain. Command row select karne par us command ka normal command ID router ko milta hai, isliye existing owner checks, group checks, bot-admin checks aur rate limits bypass nahi hote. `OWNER` quick action owner command chalata hai; `PING` quick action `ping` available hone par use karta hai, warna `alive` fallback hota hai.

If a WhatsApp client does not render interactive list/buttons, the bot automatically sends a text menu. Text fallback mein `menu 1`, `menu 2`, etc. se category open ki ja sakti hai. `menu` ya `menu 0` main category list return karta hai.

Optional branded header image ke liye host `.env` mein public image URL set karo:

```env
MENU_IMAGE_URL=https://example.com/as-bot-menu.jpg
```

Image optional hai; URL unavailable hone par list menu phir bhi send hota hai. Supplied reference style ke liye dark professional layout, one-tap category navigation aur quick actions use kiye gaye hain, lekin old Queen Nazuma/SHYAM-MD identity ko AS-BOT branding se replace kiya gaya hai.
