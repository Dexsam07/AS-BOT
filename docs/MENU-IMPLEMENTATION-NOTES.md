# Menu implementation notes

- Current bot configuration is exported from `config.js`; it uses `BOT_NAME`, `OWNER_NAME`, `OWNER_NUMBER`, empty `PREFIX`, `MODE`, `TIMEZONE`, channel metadata, `VERSION`, `DESCRIPTION`, and `SESSION_ID`.
- The current command router is prefixless and calls modern handlers as `handler(sock, message, args, context)`. The context exposes `reply`, `sendMessage`, `channelInfo`, and now the loaded `registry` for dynamic menus.
- Existing `help.js` uses `menu` as an alias, so a dedicated menu command must remove that alias to avoid command-map collision.
- Existing `lib/settingsManager.js` provides a compatibility settings schema and persists `data/settings.json`; the new root `setting.js` should expose derived values without storing secrets or duplicating the primary config.
- The legacy `plugins/a-menu.js` demonstrates a professional header, category listing, numeric category navigation, owner/channel branding, and optional media, but its old event-listener pattern should not be copied into the current router.
