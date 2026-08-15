# GitHub One-Command Self-Update

AS-BOT ko host par ek baar Git clone ke roop mein run karo. Uske baad ZIP re-upload ya session ID replace karne ki zaroorat nahi hogi. Owner WhatsApp se update command de sakta hai:

```text
update status
update now
update rollback
```

## `update status`

Bot `Dexsam07/AS-BOT` ke approved `main` branch ko fetch karke current commit aur latest commit compare karta hai. Working tree dirty ho to update block hota hai, taaki local manual changes overwrite na hon.

## `update now`

Update flow ye steps follow karta hai:

1. Owner authorization check hota hai.
2. Update lock create hota hai, jisse double update nahi chal sakta.
3. Host ka Git working tree clean verify hota hai.
4. GitHub se `main` branch fetch hoti hai.
5. Sirf fast-forward update allow hota hai; unexpected history rewrite block hoti hai.
6. Protected runtime paths—`.env`, `data/session`, audit, health aur update state—change list mein aane par update reject hota hai.
7. Temporary Git worktree mein syntax check aur offline tests run hote hain.
8. Previous commit update state mein save hota hai.
9. Code update apply hota hai; `.env`, session ID aur `data/session` untouched rehte hain.
10. Owner ko success message milta hai aur process supervisor ke liye graceful restart request schedule hoti hai.

`SESSION_ID` ko dobara set karne ki zaroorat nahi hoti, kyunki session environment variable aur `data/session` Git se separately protected hain.

## `update rollback`

Agar last update ke baad problem aaye, owner `update rollback` bhej sakta hai. Bot saved previous commit par `git reset --hard` karta hai aur restart request deta hai. Rollback bhi clean working tree aur owner authorization require karta hai.

## Host setup

Host par repository ko clone karke project directory se run karo:

```bash
git clone https://github.com/Dexsam07/AS-BOT.git
cd AS-BOT
cp .env.example .env
# .env mein SESSION_ID=DEX~<Base64-payload> set karo
npm install --legacy-peer-deps
npm start
```

PM2 ya Docker Compose ko process supervisor ke roop mein use karo. `UPDATE_PROJECT_DIR` ko actual Git clone directory par set karo. Public repository ke liye token required nahi hai. Agar future mein repository private ho, `GITHUB_TOKEN` ko hosting secret manager mein rakho; source code ya WhatsApp message mein token mat daalo.

```env
UPDATE_REPO=Dexsam07/AS-BOT
UPDATE_BRANCH=main
UPDATE_PROJECT_DIR=/app
UPDATE_STATE_FILE=/app/data/update-state.json
UPDATE_LOCK_FILE=/app/data/update.lock
```

Agar `package.json` change hota hai, host par dependencies install/update karna required ho sakta hai. Production update se pehle `update status` check karna aur backup volume maintain karna recommended hai.
