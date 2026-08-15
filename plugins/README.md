# Reference plugins

The complete reference plugin tree is included in this repository after replacing embedded API-key-like literals and cookies with environment-variable placeholders. The plugins are kept disabled by default because they use mixed runtime contracts and may require optional dependencies.

Enable a reviewed plugin only after checking its permissions and dependencies. The core AS-BOT runtime uses the approved commands under `commands/` first.

```env
LOAD_EXTERNAL_PLUGINS=false
```

Do not put real API keys, cookies, session IDs, or passwords in plugin source. Use the hosting secret environment instead.
