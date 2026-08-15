# AS-BOT Non-Stop Hosting Runbook

## Reality check

Code ko restart-safe aur long-running banaya gaya hai, lekin koi bhi hosting provider absolute 100% uptime guarantee nahi deta. Non-stop operation ke liye process supervisor, persistent storage, outbound network access, provider policy compliance aur valid WhatsApp auth state zaroori hain.

## Recommended deployment

Docker Compose ya PM2 wali persistent Linux hosting use karo. Free sleep-mode hosting se bot disconnect ho sakta hai. Hosting par `/app/data` persistent volume hona chahiye, kyunki ismein Baileys auth state, settings, reminders, health aur audit files save hote hain.

## Docker Compose setup

1. ZIP extract karke server par project directory open karo.
2. `.env.example` ko `.env` copy karo.
3. `.env` mein real `SESSION_ID=DEX~<Base64-payload>` set karo. Is value ko public repository mein commit mat karo.
4. Run karo:

```bash
docker compose up -d --build
```

5. Logs dekho:

```bash
docker compose logs -f as-bot
```

6. Health state dekho:

```bash
cat data/health.json
```

7. Update ke baad:

```bash
docker compose up -d --build
```

`restart: unless-stopped` unexpected process exit ke baad container ko restart karega. `tini` signals forward karta hai, aur Docker volumes session/data ko container recreate hone par preserve karte hain.

## PM2 setup

Agar Docker available nahi hai:

```bash
npm install --omit=dev --legacy-peer-deps
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

`pm2 startup` jo command output kare, use ek baar root/administrator permission ke saath run karo. Logs ke liye `pm2 logs as-bot` use karo.

## First-run checklist

```bash
npm run check
npm run check-session
npm start
```

Demo check WhatsApp login nahi karta. Real run ke liye `.env` mein real DEX~ session aur persistent `SESSION_DIR` zaroori hai. Agar provider session payload ko Baileys `creds.json` ke roop mein accept karta hai, runtime usse first start par import karega; agar payload kisi custom format mein hai, us provider ka approved adapter required hoga.

## Security checklist

Real session, API key, database password aur auth directory ko ZIP, GitHub, screenshot, logs ya chat mein share mat karo. `data/session`, `.env`, `data/audit.jsonl` aur `data/health.json` ko protected persistent storage mein rakho. Wrong-prefix session reject hoga, lekin prefix validation WhatsApp authentication ka substitute nahi hai.

## Permission checklist

Owner command authorization WhatsApp ke server-side group permissions bypass nahi karta. Kick, delete, promote, demote aur group settings actions ke liye bot ka group admin hona mandatory hai. AS-BOT denial ko clear message aur audit event ke saath report karta hai; fake success nahi dikhata.
