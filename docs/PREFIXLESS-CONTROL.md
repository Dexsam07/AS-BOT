# Prefixless WhatsApp Control

AS-BOT mein ab command ke aage dot ya koi prefix nahi chahiye. Message ka first word command name ke roop mein match hota hai.

## Basic commands

```text
ping
help
alive
owner
status
notes
todo add aaj ka kaam
remind 30 meeting
```

Agar message ka first word registered command nahi hai, AS-BOT us message ko normal chat maan kar ignore karega. Isse normal conversation unnecessarily trigger nahi hogi.

## Owner-only live settings

Bot connect hone ke baad owner WhatsApp chat mein ye commands de sakta hai:

```text
settings show
settings set bot_name AS-BOT PRO
settings set owner_name Shyam Chaudhari
settings set mode private
settings set channel_name DEX SHYAM TECH
settings set channel_id 120363406449026172@newsletter
settings set channel_link https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o
settings set reminders off
settings set memory_guard on
settings set external_plugins off
settings set rate_limit 20
settings reset
```

`settings` command owner-only hai. Owner number central config ke `OWNER_NUMBER` se verify hota hai; unauthorized user ko setting change karne nahi diya jayega. Har change audit log mein record hoga.

Kuch changes runtime mein immediately apply hote hain. Plugin loading, auth/session aur kuch connection-level settings ke liye controlled restart required ho sakta hai. Bot secret, `SESSION_ID`, API keys aur passwords WhatsApp command ke through set nahi kiye ja sakte; ye values hosting ke secret environment mein hi rahengi.

## Group permission

Prefixless command ka matlab WhatsApp permission bypass nahi hai. `kick`, `delete`, `promote`, `demote` aur group settings ke liye bot ko group admin hona zaroori hai. Owner command request authorize kar sakta hai, lekin WhatsApp server action ko bot-admin check ke bina execute nahi kiya jayega.
