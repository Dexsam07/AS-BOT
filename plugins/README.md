# Reference plugins are not committed

The original plugin collection is kept locally for review and migration only. It is intentionally excluded from the public/private Git repository because some legacy files contain embedded third-party cookies or API-key-like strings and mixed runtime assumptions.

Only reviewed commands under `commands/` are part of the AS-BOT repository. Migrate a plugin into `commands/` after replacing every credential with an environment variable, checking its permissions, and adding a test.

External plugins remain disabled by default with `LOAD_EXTERNAL_PLUGINS=false`.
