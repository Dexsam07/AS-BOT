const os = require('node:os');
const config = require('../../../config');
const metrics = require('../../../lib/metrics');
const queue = require('../../../lib/job-queue');
const memory = require('../../../lib/memory-guard');

function formatUptime(seconds) { const s = Math.floor(seconds); const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600); const m = Math.floor((s % 3600) / 60); return `${d}d ${h}h ${m}m`; }
module.exports = {
  command: 'alive',
  aliases: ['ping', 'health'],
  category: 'system',
  description: 'Show bot health and runtime status.',
  async handler(sock, message, args, context) {
    const mem = memory.snapshot();
    const q = queue.getStatus();
    const summary = metrics.getSummary();
    await context.reply([
      `*${config.BOT_NAME} ACTIVE*`,
      `Uptime: ${formatUptime(process.uptime())}`,
      `Memory: ${mem.rssMb} MB (${mem.percent}% of configured limit)`,
      `Commands: ${summary.commands.length} tracked`,
      `Jobs: ${q.running} running / ${q.queued} queued`,
      `Mode: ${config.MODE}`,
      `Version: ${config.VERSION}`
    ].join('\n'));
  }
};
