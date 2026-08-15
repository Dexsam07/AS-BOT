const data = require('../../../lib/personal-data');

module.exports = {
  command: 'remind',
  aliases: ['reminder'],
  category: 'daily',
  description: 'Create a personal reminder in minutes.',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const minutes = Number(args[0]);
    const text = args.slice(1).join(' ').trim();
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 43200 || !text) return context.reply('Use: `.remind <minutes> <text>`');
    const reminder = await data.addReminder(context, text, minutes * 60 * 1000);
    await context.reply(`Reminder saved for ${new Date(reminder.dueAt).toLocaleString()}: ${reminder.text}`);
  }
};
