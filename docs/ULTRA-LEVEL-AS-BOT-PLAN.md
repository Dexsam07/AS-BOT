# AS-BOT Ultra-Level Architecture Plan

## Objective

AS-BOT ko reference bot ki copy nahi banana hai. Reference archive se useful engineering ideas liye jayenge, lekin AS-BOT ka runtime alag hoga: modular command contracts, central policy engine, safe plugin adapters, memory-aware jobs, provider reliability, audit logs aur owner-controlled customization.

## Reference study summary

Reference archive mein mixed command ecosystems mile: `shyam`, `cmd`, `amon`, `bandah` aur ESM-style handler plugins. Handler-runtime mein owner, sudo, group-only aur admin-only flags ka structured use hai. Reference bot ke advanced modules mein memory manager, provider gateway, media job queue, performance metrics, protected settings, public error sanitization aur graceful runtime guard bhi hain.

AS-BOT in ideas ko clean interfaces ke through use karega. Existing 1,078 plugin files ko ek saath blindly activate nahi kiya jayega, kyunki unmein different runtime contracts aur dependencies hain. Pehle stable core banega, phir selected plugins migrate honge.

## AS-BOT ka different design

| Layer | AS-BOT design | Purpose |
|---|---|---|
| Connection | DEX~ session gate + local Baileys auth state + reconnect policy | Session format aur WhatsApp connection ko alag rakhna |
| Command registry | Standard object plugins + controlled legacy adapters | Har command ko same metadata/context dena |
| Policy engine | Owner, sudo, sender-admin, bot-admin, group-only, private/public aur capability checks | Permission ko command code se alag rakhna |
| Capability layer | `read`, `reply`, `group-metadata`, `delete`, `kick`, `promote`, `settings-write`, `external-api` | Command ko exact capability dena |
| Job system | Per-chat queue, total concurrency, timeout, cancellation aur status | Media/AI/download commands ko safe rakhna |
| Provider gateway | Timeout, cache, deduplication, cooldown, fallback provider aur metrics | External APIs ko reliable banana |
| Memory guard | Temp cleanup, protected session paths, queue pause aur graceful restart request | Long-running bot ko stable rakhna |
| Data layer | Atomic JSON/database adapter, protected settings aur migration versioning | Data corruption aur accidental deletion se bachna |
| Observability | Command latency, error rate, provider health, queue state aur audit events | Professional debugging aur monitoring |

## Admin permission ka exact rule

> Owner authorization WhatsApp ke server-side group permissions ko bypass nahi kar sakti.

AS-BOT owner ko command chalane ki permission de sakta hai, lekin WhatsApp action tabhi execute hoga jab platform aur group state allow kare. Isliye policy engine do alag checks rakhega: **user authorization** aur **bot capability**.

| Action | User owner ho to kya hoga | Bot ko group admin chahiye? |
|---|---|---|
| `help`, `alive`, `menu`, notes, todo, reminders | Owner ya allowed user chala sakta hai | Nahi |
| Group metadata read, members list read | Owner allow kar sakta hai | Usually nahi, group privacy/API rules par depend |
| Bot ka message send karna | Owner authorization se request allow ho sakti hai | Nahi, jab tak group restricted mode mein na ho |
| Warning database update, local settings | Owner-only policy se allow | Nahi |
| Delete kisi aur ka message | Request authorize ho sakti hai | Haan, WhatsApp bot admin hona chahiye |
| Kick/remove member | Request authorize ho sakti hai | Haan |
| Promote/demote member | Request authorize ho sakti hai | Haan |
| Group subject/description/settings change | Request authorize ho sakti hai | Haan |
| Group-only admin moderation | Sender owner ho sakta hai, par bot-admin check pass hona chahiye | Haan |

Agar owner command chalata hai aur bot admin nahi hai, AS-BOT command ko silently fake-success nahi dikhayega. Woh clear result dega: **owner authorization pass, WhatsApp bot permission missing**. Optional `dryRun` mode proposed action aur required permission batayega, bina unauthorized operation attempt kiye.

## Proposed policy states

Each command manifest mein ye flags honge:

```js
{
  command: 'kick',
  ownerOnly: true,
  groupOnly: true,
  requires: ['group-member-remove'],
  requiresBotAdmin: true,
  audit: true,
  dryRunWhenDenied: true
}
```

Policy engine ka result structured hoga:

```js
{
  allowed: false,
  userAuthorized: true,
  botAuthorized: false,
  reason: 'BOT_ADMIN_REQUIRED',
  safeAction: 'dry-run'
}
```

## Ultra-level feature roadmap

### Phase 1 — Core control plane

DEX~ session validation, connection lifecycle, central configuration, standardized message context, command registry, policy engine, safe error response, audit event format aur graceful shutdown pehle complete honge.

### Phase 2 — Daily personal assistant

Notes, todo, reminders, recurring personal checklist, saved replies, quick calculations, translation, message summarization aur private owner dashboard-style commands add honge. Ye features group admin par depend nahi karenge.

### Phase 3 — Professional command operations

Command aliases, per-user cooldown, per-chat rate limit, feature flags, plugin enable/disable, command health status, help generation aur owner-only settings management add honge.

### Phase 4 — Safe group moderation

Anti-link, anti-spam, warning score, mute request, delete/kick/promote workflows aur admin capability checks add honge. Non-admin bot state mein command dry-run response dega; unauthorized action ko fake success nahi milega.

### Phase 5 — Media and provider reliability

Provider gateway, fallback APIs, timeout, cache, circuit breaker, job queue, download size limit, per-chat concurrency aur temporary file cleanup add honge.

### Phase 6 — Memory-safe long-running runtime

Memory thresholds, queue pause under pressure, protected session/data paths, graceful restart request, log rotation aur health metrics add honge.

### Phase 7 — Advanced customization

Custom command builder, workflow chains, event rules, scheduled personal tasks, group-specific policy profiles, per-group prefix/mode, trusted sudo users aur versioned configuration migration add honge.

## Implementation rule

Ek hi baar mein saare plugins active nahi honge. Har phase ke baad syntax check, dry-run test, permission test, error test aur rollback point banega. Isse AS-BOT reference bot se zyada predictable aur maintainable rahega.

## Recommended starting point

Sabse pehle **Phase 1: Core control plane + permission engine** implement karna sahi rahega. Iske bina ultra features add karne par commands ka behavior inconsistent hoga. Phase 1 ke baad `alive`, `help`, `owner`, `notes` aur `todo` ko pilot commands ke roop mein activate kiya ja sakta hai.
