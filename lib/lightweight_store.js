const fs = require('node:fs');
const path = require('node:path');

const storeFile = path.join(process.cwd(), 'data', 'store.json');
const store = {
  contacts: {},
  messages: {},
  readFromFile() {
    try {
      Object.assign(this, JSON.parse(fs.readFileSync(storeFile, 'utf8')));
    } catch (_) {}
    return this;
  },
  writeToFile() {
    fs.mkdirSync(path.dirname(storeFile), { recursive: true });
    fs.writeFileSync(storeFile, JSON.stringify({ contacts: this.contacts, messages: this.messages }, null, 2));
  },
  bind() {},
  loadMessage(jid, id) {
    return this.messages[`${jid}:${id}`] || null;
  },
  saveMessage(jid, id, message) {
    this.messages[`${jid}:${id}`] = message;
    return message;
  }
};

module.exports = store;
