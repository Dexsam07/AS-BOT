# AS-BOT Gradual Update Roadmap

## Principle

AS-BOT ko ek saath complete nahi badalna hai. Har step ke baad bot ko test karna, backup banana aur aapki approval lena hai. Existing `plugins/` folder reference ke liye rahega; active commands ko dheere-dheere new logic mein migrate kiya jayega.

| Step | Focus | Main files | Completion result |
|---:|---|---|---|
| 0 | Structure and identity | `config.js`, `shyam.js`, `shyam.json`, root files | Root structure clear aur details verified |
| 1 | Connection foundation | `lib/connection.js`, `lib/session.js` | Login, reconnect aur logout stable |
| 2 | Message context | `lib/context.js`, `lib/normalizer.js` | Sender, chat, group, args aur reply standard |
| 3 | Plugin loader | `lib/plugin-loader.js`, `lib/router.js` | Selected commands load aur route hon |
| 4 | Core system commands | `plugins/system/` ya selected existing plugins | `help`, `menu`, `alive`, `ping`, `owner`, `settings` working |
| 5 | Owner controls | `plugins/owner/`, `lib/permissions.js` | Owner-only settings, feature toggle, backup |
| 6 | Daily work tools | `plugins/daily/`, `lib/storage.js` | Notes, todo, reminders, saved replies |
| 7 | Reliability | `lib/logger.js`, rate limit, error handler | Crashes aur duplicate processing control |
| 8 | Group moderation | `plugins/moderation/`, group middleware | Anti-link, anti-spam, warning, mute |
| 9 | AI tools | `plugins/ai/`, `lib/ai-service.js` | Approved AI tasks with limits |
| 10 | Media tools | `plugins/media/`, `lib/media-service.js` | Approved downloader/sticker/converter features |
| 11 | Optional expansion | anime, fun, games, extra utilities | Only useful and tested commands |
| 12 | Deployment | Docker/host config | Persistent deployment after local stability |

## Step 0 — Current stage

Is ZIP mein Step 0 complete hai. Root structure, identity configuration, compatibility files, plugin reference folder, deployment placeholders aur roadmap included hain. `index.js` sirf structure status print karta hai; ye intentionally WhatsApp login start nahi karta.

## Step 1 — Recommended next start

Next hum **connection foundation** se start karenge. Is step mein sirf WhatsApp connection adapter, session location, reconnect strategy, connection status logs aur clean shutdown add hoga. Koi 1,000 command load nahi hogi. Isse agar login ya session issue ho to command logic us issue ko hide nahi karegi.

## Step 2 — Message context

Connection ke baad incoming message ko standard context mein convert karenge: `chatId`, `senderId`, `isGroup`, `isOwner`, `isAdmin`, `text`, `args`, `quotedMessage`, `reply()` aur `sendMedia()`. Har command ko ye same context milega.

## Step 3 — Selected command loader

Loader pehle sirf whitelist commands load karega. Suggested first whitelist: `help`, `menu`, `alive`, `ping`, `owner` aur `settings`. Iske baad ek-ek command migrate hoga. Unknown ya duplicate plugin automatically active nahi hoga.

## Step 4 onward — Feature batches

Core system stable hone ke baad daily tools ko first priority milegi. Notes, todo, reminders aur saved replies personal daily use ke liye useful hain. AI, media aur group moderation ko separate feature flags ke peeche rakha jayega, taaki unwanted API cost, permissions aur errors core bot ko affect na karein.

## Har step ke baad approval format

Har update ke baad report mein ye diya jayega: changed files, new commands, required environment variables, test result, known limitations aur next step. Aap `approve`, `change`, ya `stop` bolkar direction control karoge.
