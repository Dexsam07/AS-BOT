# AS-BOT Session Setup — DEX~ Prefix

## Required format

AS-BOT ka session string exact **`DEX~` prefix** se start hona chahiye. Prefix Base64 payload ke bahar rahega:

```text
DEX~<base64-payload>
```

Examples ke roop mein `DEX~MAIN...` ya `DEX~PHONE1...` valid prefix start dikhate hain, jabki `ABC~...` aur `DXD~...` startup par reject honge.

## Validation kaise hoti hai

Runtime pehle raw `SESSION_ID` ko read karta hai. Sabse pehle exact starting prefix `DEX~` check hota hai. Uske baad prefix ke baad wala part standard Base64 ke roop mein decode aur canonical-check hota hai. Full secret ko logs mein print nahi kiya jata; sirf short fingerprint print hota hai.

Base64 encryption nahi hai; ye sirf encoding hai. Real session ID ko GitHub, public ZIP, screenshot, ya chat mein share nahi karna chahiye.

## WhatsApp auth ka important difference

Prefix aur Base64 check pass hona sirf **format gate** hai. Baileys ko actual WhatsApp authentication ke liye valid auth state files bhi chahiye. Is project mein ye state `SESSION_DIR` ke andar save hoti hai. Agar aapke provider ka `DEX~` session payload directly Baileys `creds.json`/auth state ke roop mein use hota hai, to us provider ke exact payload format ke hisaab se import adapter add karna padega. Random JSON ko `creds.json` bana dene se login valid nahi hota.

## Environment

```env
SESSION_PREFIX=DEX~
SESSION_ID=DEX~<your-real-base64-session>
SESSION_DIR=./data/session
LOAD_LEGACY_PLUGINS=false
```

Real session value ko local `.env` file mein rakho. `.env` ko ZIP ya GitHub mein commit mat karo.

## Safe local test

Real secret ke bina validator test karne ke liye:

```bash
npm install
npm run check
npm run check-session
```

`npm run check-session` ek local demo token banata hai. Ye sirf prefix/Base64 gate test karta hai; WhatsApp login nahi karta.

Wrong-prefix test ke liye kisi payload ko `ABC~` se start karoge to runtime `Session rejected` dega. Missing `SESSION_ID` par `index.js` startup rok dega.
