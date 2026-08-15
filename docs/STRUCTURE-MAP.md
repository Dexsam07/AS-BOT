# Root Structure Map

| Path | Role | Current status |
|---|---|---|
| `assets/` | Images, audio, thumbnails | Empty placeholder; assets later add honge |
| `data/` | Notes, todo, reminders, settings/runtime data | Empty placeholder; secrets yahan nahi rakhne |
| `lib/` | Connection, loader, router, permissions, logger, services | Empty placeholder; Step 1 se implementation |
| `plugins/` | Existing updated plugin reference collection | Included; direct activation nahi |
| `index.js` | Foundation entry point | Safe status output only |
| `config.js` | Central identity and runtime config | AS-BOT details configured |
| `setting.js` | Singular compatibility bridge | `config.js` ko forward karta hai |
| `settings.js` | Plural compatibility bridge | `config.js` ko forward karta hai |
| `shyam.js` | JavaScript identity manifest | Config values se load hota hai |
| `shyam.json` | Human-readable identity manifest | User details saved |
| `package.json` | Runtime metadata and scripts | Structure-stage scripts only |
| `app.json` | Deployment metadata | Placeholder only |
| `Dockerfile` | Future container runtime | Placeholder only |
| `heroku.yml` | Future worker definition | Placeholder only |
| `README.md` | Quick start and roadmap summary | Included |
| `docs/STEP-BY-STEP-ROADMAP.md` | Full gradual update plan | Included |
| `docs/STRUCTURE-MAP.md` | This file | Included |

## Naming rule

Identity sirf `config.js` se read hogi. Future command files mein owner name, number, bot name, channel ID ya channel link manually repeat nahi kiya jayega. Isse future update ek central file se safely ho sakega.

## Plugin rule

Existing `plugins/` folder ko reference/archive maana jayega. Jab koi command activate karni ho, pehle uski dependency, permission, API, storage aur response ko review karke new runtime contract mein migrate kiya jayega.
