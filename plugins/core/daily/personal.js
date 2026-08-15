const data = require('../../../lib/personal-data');

function helpText() {
  return 'Use: `note add <text>`, `notes`, `note clear`, `todo add <text>`, `todos`, `todo done <id>`';
}

module.exports = {
  command: 'note',
  aliases: ['notes', 'todo', 'todos'],
  category: 'daily',
  description: 'Manage personal notes and todos.',
  ownerOnly: true,
  async handler(sock, message, args, context) {
    const command = String(context.command || 'note').toLowerCase();
    const action = String(args[0] || (command === 'notes' || command === 'todos' ? 'list' : '')).toLowerCase();
    const text = args.slice(1).join(' ').trim();
    if (command === 'notes' || command === 'note') {
      if (action === 'add' && text) { const item = await data.addNote(context, text); return context.reply(`Note saved: ${item.id}`); }
      if (action === 'clear') { await data.clearNotes(context); return context.reply('Notes cleared.'); }
      const notes = await data.listNotes(context);
      return context.reply(notes.length ? notes.map((item) => `${item.id}: ${item.text}`).join('\n') : 'No notes saved.');
    }
    if (command === 'todos' || command === 'todo') {
      if (action === 'add' && text) { const item = await data.addTodo(context, text); return context.reply(`Todo saved: ${item.id}`); }
      if (action === 'done' && text) return context.reply(await data.completeTodo(context, text) ? 'Todo completed.' : 'Todo ID not found.');
      const todos = await data.listTodos(context);
      return context.reply(todos.length ? todos.map((item) => `${item.done ? '✅' : '⬜'} ${item.id}: ${item.text}`).join('\n') : 'No todos saved.');
    }
    return context.reply(helpText());
  }
};
