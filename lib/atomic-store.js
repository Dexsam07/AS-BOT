const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');

class AtomicJsonStore {
  constructor(filePath, defaults = {}, options = {}) {
    this.filePath = path.resolve(filePath);
    this.defaults = defaults;
    this.version = Number(options.version || 1);
    this.data = null;
    this.dirty = false;
    this.writeQueue = Promise.resolve();
  }

  async load() {
    try {
      const raw = await fsp.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.data = { ...this.defaults, ...parsed, schemaVersion: this.version };
    } catch (_) {
      this.data = { ...this.defaults, schemaVersion: this.version };
      this.dirty = true;
    }
    return this.data;
  }

  get snapshot() {
    if (!this.data) this.data = { ...this.defaults, schemaVersion: this.version };
    return this.data;
  }

  get(key, fallback = undefined) {
    return this.snapshot[key] ?? fallback;
  }

  set(key, value) {
    this.snapshot[key] = value;
    this.snapshot.schemaVersion = this.version;
    this.dirty = true;
    return value;
  }

  update(patch = {}) {
    Object.assign(this.snapshot, patch, { schemaVersion: this.version });
    this.dirty = true;
    return this.snapshot;
  }

  async save(force = false) {
    if (!this.dirty && !force) return false;
    const payload = `${JSON.stringify(this.snapshot, null, 2)}\n`;
    const target = this.filePath;
    const temp = `${target}.${process.pid}.tmp`;
    this.writeQueue = this.writeQueue.then(async () => {
      await fsp.mkdir(path.dirname(target), { recursive: true });
      await fsp.writeFile(temp, payload, { mode: 0o600 });
      await fsp.rename(temp, target);
      this.dirty = false;
    });
    await this.writeQueue;
    return true;
  }

  async reset() {
    this.data = { ...this.defaults, schemaVersion: this.version };
    this.dirty = true;
    return this.save(true);
  }
}

module.exports = { AtomicJsonStore };
