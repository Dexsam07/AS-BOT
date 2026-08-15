const { cmd, bandah, commands, register } = require('../command');

function monospace(value) {
  return String(value ?? '');
}

function formatBytes(bytes = 0) {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index ? 2 : 0)} ${units[index]}`;
}

async function getGroupMetadata(sock, jid) {
  return sock.groupMetadata(jid);
}

module.exports = {
  cmd,
  bandah,
  commands,
  register,
  monospace,
  formatBytes,
  getGroupMetadata
};
