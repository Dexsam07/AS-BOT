# AS-BOT plugins

The `plugins/` directory is the primary command source for AS-BOT. Protected core controls live under `plugins/core/` and are loaded first. The remaining plugin tree contains compatible standardized and legacy command modules.

The loader supports modern command exports and the common registration APIs used by the reference collection, including `cmd`, `bandah`, `gmd`, `malvin`, `amon`, and `shyam`. Compatible commands are registered in the live router and appear in the interactive `menu` command.

```env
LOAD_EXTERNAL_PLUGINS=true
EXTERNAL_PLUGIN_DIR=./plugins
```

Duplicate command names are ignored in favor of the protected core command loaded first. Files that depend on unavailable optional packages, removed legacy modules, or unsupported background-only contracts are skipped with a startup diagnostic instead of crashing the bot. This keeps the bot available while preserving the compatible command set.

Do not put real API keys, cookies, session IDs, passwords, or private provider credentials in plugin source. Use the host environment for secrets and review permissions before enabling new third-party code.
