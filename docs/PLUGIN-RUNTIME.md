# Plugin runtime and low-memory hosting

## Why the previous startup crashed

The previous loader imported every JavaScript file under `plugins/` during startup. The collection contains mixed CommonJS, ESM-style, legacy registrations, optional-provider imports, invalid files, and background modules that create timers or write files at import time. Importing all of them on a small host consumed the Node.js heap before the WhatsApp connection could stabilize.

The console symptoms are therefore expected from the old design:

| Symptom | Cause |
|---|---|
| `Cannot find module '../amon'` or `../malvin` | Legacy plugin imports removed framework modules |
| `Cannot find module 'bing-translate-api'` or similar | Optional provider dependency is not declared or installed |
| `Unexpected identifier 'Promise'` | Invalid or incompatible legacy JavaScript source |
| `JavaScript heap out of memory` | Eagerly importing the complete plugin tree and retaining module state |
| Server exit code `134` | The Node process was aborted after the heap allocation failure |

## Current production behavior

AS-BOT now loads the protected controls from `plugins/core/` and reads command metadata from the checked-in `plugins/plugin-manifest.json`. External plugin handlers are lazy: the corresponding plugin file is imported only when the selected command is actually used. This keeps startup memory low and prevents unrelated broken plugins from stopping the bot.

The current audit found 1,070 non-helper JavaScript plugin files. After repairing the two syntax-invalid files, the static audit reports zero syntax errors, 190 files with missing local imports, 81 files with missing package imports, 88 files importing removed legacy modules, and 224 files with top-level side-effect patterns. These files are not all safe to execute at startup. The manifest contains compatible command registrations only; unsupported files remain excluded with no startup import.

## Required production settings

Keep these values in `.env`:

```env
LOAD_EXTERNAL_PLUGINS=true
EXTERNAL_PLUGIN_DIR=./plugins
PLUGIN_MANIFEST=./plugins/plugin-manifest.json
PLUGIN_LAZY_LOAD=true
PLUGIN_LOAD_FALLBACK_EAGER=false
```

Do not set `PLUGIN_LOAD_FALLBACK_EAGER=true` on a host with approximately 716 MiB memory. Eager mode is intended only for a high-memory developer audit environment and is not the production path.

## Verification commands

After updating the repository, run:

```bash
npm install --legacy-peer-deps
npm run check
npm test
```

The current manifest contains 873 external command registrations. After duplicate and alias protection, the registry-only smoke test loaded 10 protected core commands and 707 unique external plugin commands at approximately 64 MiB RSS with a 256 MiB Node heap cap, without importing the whole plugin tree.

## Rebuilding the manifest

Only rebuild the manifest in a sufficiently large development environment after changing plugin files:

```bash
npm run build:plugin-manifest
```

Commit the resulting `plugins/plugin-manifest.json` together with the plugin changes. Do not run this command on the low-memory production host. Production updates use the already-built manifest and the WhatsApp `update now` workflow.
