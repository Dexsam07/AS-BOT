# AS-BOT

<p align="center">
  <img src="assets/as-bot-profile.png" alt="AS-BOT professional bot artwork" width="420">
</p>

<p align="center"><strong>Production-oriented WhatsApp automation framework with a modular runtime, interactive menu, plugin compatibility, persistent storage, and GitHub self-update.</strong></p>

<p align="center">
  <a href="https://github.com/Dexsam07/AS-BOT/actions"><img src="https://img.shields.io/badge/runtime-Node.js%2020%2B-339933?logo=node.js&logoColor=white" alt="Node.js 20+"></a>
  <a href="https://github.com/Dexsam07/AS-BOT"><img src="https://img.shields.io/badge/repository-public-181717?logo=github&logoColor=white" alt="Public GitHub repository"></a>
  <img src="https://img.shields.io/badge/commands-prefixless-2563eb" alt="Prefixless commands">
  <img src="https://img.shields.io/badge/session-DEX~-0ea5e9" alt="DEX session gate">
</p>

AS-BOT is a modular WhatsApp bot built for dependable long-running operation. It combines a Baileys connection layer with guarded command authorization, persistent local data, runtime health monitoring, a queue for heavier work, compatible legacy plugin loading, an interactive command menu, and an owner-controlled GitHub update workflow.

> **Project channel:** [DEX SHYAM TECH](https://whatsapp.com/channel/0029VbBgXTsKwqSKZKy38w2o)

## Highlights

| Area | Capability |
|---|---|
| Command experience | Natural prefixless commands such as `help`, `menu`, `alive`, `status`, and `update now` |
| Interactive menu | Clickable category lists, command rows, quick owner/ping actions, branded image header, and text fallback |
| Session security | Exact `DEX~<Base64-payload>` validation before startup |
| Authorization | Separate user authorization from WhatsApp bot-admin capability checks |
| Plugin system | Compatibility adapter for standardized exports and legacy `cmd`, `bandah`, `gmd`, `malvin`, `amon`, and `shyam` registrations |
| Reliability | Reconnect handling, atomic writes, audit events, rate limiting, queue limits, memory guard, health state, and graceful shutdown |
| Self-update | Owner-only `update status`, `update now`, and `update rollback` from the configured GitHub repository |
| Hosting | Docker Compose and PM2 configurations with persistent runtime data |

## Command examples

Commands do not require a dot prefix.

```text
help
menu
menu 1
alive
owner
status
note add prepare deployment checklist
notes
todo add verify backup
todos
remind 30 check the group
settings show
update status
update now
update rollback
```

The interactive `menu` command shows live loaded categories and command counts. Selecting a category opens its command list, and selecting a command sends the normal command ID back through the same authorization and rate-limit pipeline. If a WhatsApp client does not support interactive messages, AS-BOT falls back to text navigation with `menu 1`, `menu 2`, and `menu 0`.

## Session configuration

The runtime accepts only the configured session prefix. The payload must be Base64 encoded and must not be shared publicly.

```env
SESSION_PREFIX=DEX~
SESSION_ID=DEX~<Base64-payload>
SESSION_DIR=./data/session
```

The session directory, `.env`, audit data, runtime settings, and personal data are local runtime state. They are not part of the public source workflow and must remain on persistent host storage.

## Quick start

```bash
git clone https://github.com/Dexsam07/AS-BOT.git
cd AS-BOT
cp .env.example .env
# Set SESSION_ID=DEX~<Base64-payload> in .env
npm install --legacy-peer-deps
npm run check
npm test
npm start
```

The demo session check can be run without connecting to WhatsApp:

```bash
npm run check-session
```

## Configuration

The most important public configuration defaults are shown below. Keep real session values and provider keys only in the host environment.

| Variable | Purpose | Example |
|---|---|---|
| `BOT_NAME` | Runtime display name | `AS-BOT` |
| `BOT_MODE` | Runtime mode | `private` |
| `TIMEZONE` | Menu and reminder timezone | `Asia/Kolkata` |
| `CHANNEL_NAME` | Project channel label | `DEX SHYAM TECH` |
| `LOAD_EXTERNAL_PLUGINS` | Enable compatible plugins | `true` |
| `MENU_IMAGE_URL` | Optional external menu image; bundled image is used by default | `https://example.com/menu.png` |
| `UPDATE_REPO` | Self-update repository | `Dexsam07/AS-BOT` |
| `UPDATE_BRANCH` | Self-update branch | `main` |

## Plugin compatibility

The `plugins/` directory contains reference and legacy command modules. The loader accepts modern standardized exports as well as the common registration APIs used by the included plugin collection. Compatible commands are registered into the current router and automatically appear in the live menu. Duplicate command names are ignored in favor of the first registered command so that built-in safety and owner controls remain authoritative.

Plugin loading is fault-tolerant. A file that depends on a removed legacy module, an unavailable optional package, or a background-only contract is skipped and recorded in startup logs instead of crashing the bot. The compatibility audit included with the project registered 838 commands with declared dependencies available; the exact number can vary when optional packages or provider credentials differ on a host.

## GitHub self-update

The production host should be a Git clone of this repository. After the first setup, future code releases can be applied from WhatsApp without uploading a ZIP or entering the session again.

```text
update status
update now
update rollback
```

`update now` checks the clean Git working tree, fetches the configured branch, validates the candidate revision in a temporary worktree, protects `.env` and runtime data, applies the update, and requests a supervisor restart. The update command is owner-only. A dirty working tree, non-fast-forward history, protected runtime changes, or failed validation blocks the update.

Read [docs/GITHUB-SELF-UPDATE.md](docs/GITHUB-SELF-UPDATE.md) for the full workflow.

## Persistent hosting

### Docker Compose

```bash
docker compose up -d --build
docker compose logs -f as-bot
```

### PM2

```bash
npm install --omit=dev --legacy-peer-deps
npm install --global pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Persistent hosting must keep the `data/` directory mounted across restarts. The process supervisor should use an automatic restart policy, and the host must allow outbound network access for the WhatsApp connection and GitHub update checks.

## Repository layout

```text
AS-BOT/
├── assets/                     # Branded bot artwork and static assets
├── commands/                   # Built-in approved commands
│   ├── system/                 # Menu, help, status, settings, update
│   ├── daily/                  # Notes, todos, reminders
│   └── moderation/              # Guarded group actions
├── data/                       # Persistent runtime state; keep private
├── lib/                        # Connection, policy, storage, queue, metrics, plugins
├── plugins/                    # Compatible legacy and reference plugins
├── scripts/                    # Syntax, session, health, and audit utilities
├── docs/                       # Hosting, update, menu, and validation guides
├── index.js                    # Production entry point
├── config.js                   # Central runtime configuration
├── setting.js                  # Legacy-compatible settings facade
├── Dockerfile                  # Container image definition
├── docker-compose.yml          # Persistent container deployment
└── ecosystem.config.cjs        # PM2 process configuration
```

## Security notes

Never commit `.env`, session credentials, provider keys, personal data, audit logs, or local auth state. Base64 is an encoding format, not encryption. Group actions remain subject to WhatsApp permissions: owner authorization does not make the bot an administrator. Commands such as kick, delete, promote, demote, or group settings require the bot to have the relevant group capability.

## Development checks

```bash
npm run check
npm test
npm run check-session
```

Before publishing a change, run the checks locally, keep secrets outside Git, and publish the change directly to the repository `main` branch. The project is distributed under the license included in `LICENSE`.

## Documentation

- [Interactive menu](docs/INTERACTIVE-MENU.md)
- [GitHub self-update](docs/GITHUB-SELF-UPDATE.md)
- [Non-stop hosting](docs/NONSTOP-HOSTING.md)
- [Prefixless controls](docs/PREFIXLESS-CONTROL.md)
- [Plugin audit](docs/PLUGIN-AUDIT.md)
- [Session setup](docs/SESSION-SETUP.md)
