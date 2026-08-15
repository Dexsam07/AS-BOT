const metrics = require('../../lib/metrics');
const queue = require('../../lib/job-queue');
const memory = require('../../lib/memory-guard');
module.exports = {
  command: 'status',
  aliases: ['diagnostics', 'diag'],
  category: 'system',
  description: 'Show detailed runtime diagnostics.',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const summary = metrics.getSummary();
    const mem = memory.snapshot();
    const q = queue.getStatus();
    await context.reply(JSON.stringify({ memory: mem, queue: q, metrics: summary }, null, 2).slice(0, 3500));
  }
};
