# AS-BOT — Production Personal WhatsApp Bot

AS-BOT **Shyam Chaudhari** ka personal, modular aur production-oriented WhatsApp bot hai. Is version mein connection lifecycle, DEX~ session gate, built-in personal commands, owner policy, group-admin capability checks, audit logs, rate limits, job queue, memory guard, health state aur persistent-hosting files included hain.

> **Important:** WhatsApp group permissions bypass nahi ki ja sakti. Owner command ko authorize kiya ja sakta hai, lekin kick, delete, promote, demote aur group settings jaise server-side actions ke liye bot ka group admin hona mandatory hai.

## Identity

| Field | Value |
|---|---|
| Bot name | **AS-BOT** |
| Owner | **Shyam Chaudhari** |
| Owner number | **917384287404** |
| Channel name | **DEX SHYAM TECH** |
| Channel ID | **120363406449026172@newsletter** |
| Channel link | **https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o** |
| Session format | **DEX~<Base64>** |
| Command mode | **Natural commands, no prefix** |

## Main folders

```text
AS-BOT/
├── assets/                     # Static media and bot assets
├── commands/                   # Built-in approved commands
│   ├── system/                 # help, alive, owner, status
│   ├── daily/                  # notes, todo, reminders
│   └── moderation/              # guarded group actions
├── data/                       # Persistent runtime data and auth state
├── lib/                        # Connection, policy, storage, queue, metrics, memory
├── plugins/                    # Existing 1,078 reference plugins; disabled by default
├── scripts/                    # Validation and health scripts
├── test/                       # Offline runtime tests
├── docs/                       # Architecture and hosting runbooks
├── index.js                    # Main production entry point
├── config.js                   # Central configuration
├── package.json                # Dependencies and production scripts
├── Dockerfile                 # Persistent container deployment
├── docker-compose.yml          # Restart policy and persistent volumes
└── ecosystem.config.cjs        # PM2 process supervisor config
```

## Session format

Session variable ka exact format hai:

```env
SESSION_PREFIX=DEX~
SESSION_ID=DEX~<Base64-payload>
SESSION_DIR=./data/session
```

Runtime sabse pehle exact `DEX~` prefix verify karta hai, phir remaining part ko canonical Base64 ke roop mein validate karta hai. Wrong prefix ya invalid Base64 startup par reject hota hai. Agar decoded payload Baileys `creds.json` jaisa valid object ho aur local auth state missing ho, runtime usse local auth state mein import karne ki koshish karta hai. Real session ID ZIP, GitHub, screenshot ya chat mein share nahi karna chahiye.

## Local setup

```bash
cp .env.example .env
# .env mein real SESSION_ID=DEX~<Base64-payload> set karo
npm install --legacy-peer-deps
npm run check
npm run check-session
npm start
```

`npm run check-session` demo token validate karta hai aur WhatsApp login nahi karta. `npm start` valid session aur installed dependencies ke bina production connection start nahi karega.

## Built-in commands

| Command | Purpose |
|---|---|
| `help` / `menu` | Active command list |
| `alive` / `ping` | Uptime, memory, queue aur runtime health |
| `owner` | Bot owner aur channel information |
| `status` | Owner-only detailed diagnostics |
| `note add <text>` | Personal note save |
| `notes` | Personal notes list |
| `todo add <text>` | Personal todo save |
| `todos` | Todo list |
| `todo done <id>` | Todo complete |
| `remind <minutes> <text>` | Personal reminder |
| `kick @user` | Owner-requested guarded action; bot admin required |

## Plugin strategy

Existing `plugins/` ke 1,078 files ko default se activate nahi kiya gaya hai, kyunki unmein multiple runtime contracts aur optional dependencies hain. Built-in approved commands `commands/` se always load hote hain. External plugins ko review ke baad enable karo:

```env
LOAD_EXTERNAL_PLUGINS=true
```

Ye flags tabhi enable karo jab selected plugins ke dependencies aur permissions test ho chuke hon.

## Permission model

AS-BOT **user authorization** aur **bot capability** ko alag check karta hai. Owner hone par aap owner-only command authorize kar sakte ho, lekin WhatsApp server action ke liye bot-admin status alag se verify hota hai. Missing bot-admin permission par fake success nahi diya jata; clear denial aur audit event generate hota hai.

## Reliability features

Runtime mein exponential reconnect, local auth persistence, graceful shutdown, atomic JSON writes, audit JSONL, per-chat rate limiting, job queue, memory-pressure cleanup, heavy-job pause, health heartbeat aur Docker/PM2 restart support included hai. Ye features long-running operation ko improve karte hain, lekin kisi hosting provider ke downtime ya WhatsApp policy changes ko eliminate nahi kar sakte.

## Non-stop hosting

Recommended setup Docker Compose ya PM2 wali persistent Linux hosting hai. Docker deployment:

```bash
docker compose up -d --build
docker compose logs -f as-bot
```

PM2 deployment:

```bash
npm install --omit=dev --legacy-peer-deps
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

`docs/NONSTOP-HOSTING.md` mein persistent volumes, secrets, health state, restart behavior aur update procedure diya gaya hai. `docs/PREFIXLESS-CONTROL.md` mein natural commands aur WhatsApp se live settings change karne ka guide hai. 24/7 operation ke liye hosting ko sleep mode mein nahi hona chahiye, outbound network allowed hona chahiye aur `/app/data` persistent volume par mount hona chahiye.

## Security

`.env`, session directory, API keys, auth state, audit logs aur personal data ko public repository ya ZIP mein commit mat karo. `SESSION_ID` Base64 encoded hone ke bawajood encryption nahi hai.

## Development roadmap

Pehle built-in commands aur connection verify karo. Uske baad selected plugins ko one-by-one migrate karo. AI, media, downloader, advanced moderation aur provider fallback modules ko queue, timeout, cache aur audit policy ke through add karna chahiye; saare plugins ek saath activate karna production-safe nahi hai.
