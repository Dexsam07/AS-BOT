# Commands folder removal audit

The current project contains 10 built-in command files under `commands/` and 1,060 non-helper JavaScript files under `plugins/`. The production entry point previously loaded `commands/` as `builtinDir` and `plugins/` as an optional external directory.

The plugin collection already contains candidates for menu, help, owner, status, settings, update, alive, ping, prefix, environment, session, cleanup, and restart functionality. However, plugin names and runtime contracts overlap, and some files depend on removed legacy modules or optional packages.

Removing `commands/` without changing the loader would remove the current safety-critical menu, settings, update, session, and authorization controls. The migration must therefore make `plugins/` the only command directory while preserving the essential controls through the compatibility loader or a protected internal control registry. Duplicate names must resolve in favor of protected controls, and incompatible plugins must be skipped with startup diagnostics rather than crashing the bot.

## Migration completed

The migration is complete. The former `commands/` directory has been removed. Its protected controls now live under `plugins/core/` and load first, while the rest of `plugins/` is the primary external command source. Relative imports were updated for the new location, and duplicate command names resolve in favor of the protected core registry.

The latest dependency-backed audit registered 848 compatible commands. Files that cannot load because of invalid syntax, removed modules, missing optional packages, or unsupported contracts are skipped with diagnostics rather than stopping the runtime.
