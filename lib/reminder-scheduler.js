const data = require('./personal-data');

function startReminderScheduler({ sock, intervalMs = 30000, logger = console } = {}) {
  const timer = setInterval(async () => {
    try {
      const due = await data.dueReminders();
      for (const reminder of due) {
        if (!reminder.owner || !sock?.sendMessage) continue;
        await sock.sendMessage(reminder.owner, { text: `⏰ Reminder: ${reminder.text}` });
      }
    } catch (error) {
      logger.error(`[reminders] ${error.message}`);
    }
  }, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
module.exports = { startReminderScheduler };
