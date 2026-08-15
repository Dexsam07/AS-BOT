const path = require('node:path');
const { AtomicJsonStore } = require('./atomic-store');

const store = new AtomicJsonStore(path.join(process.cwd(), 'data', 'personal.json'), {
  notes: {},
  todos: {},
  reminders: []
}, { version: 1 });
let loaded = false;

async function ready() { if (!loaded) { await store.load(); loaded = true; } return store; }
function ownerKey(context) { return String(context.sender || context.chatId || 'owner'); }
async function addNote(context, text) { const db = await ready(); const key = ownerKey(context); db.snapshot.notes[key] ||= []; db.snapshot.notes[key].push({ id: Date.now().toString(36), text: String(text).trim(), at: new Date().toISOString() }); db.dirty = true; await db.save(); return db.snapshot.notes[key].at(-1); }
async function listNotes(context) { const db = await ready(); return db.snapshot.notes[ownerKey(context)] || []; }
async function clearNotes(context) { const db = await ready(); db.snapshot.notes[ownerKey(context)] = []; db.dirty = true; await db.save(); }
async function addTodo(context, text) { const db = await ready(); const key = ownerKey(context); db.snapshot.todos[key] ||= []; db.snapshot.todos[key].push({ id: Date.now().toString(36), text: String(text).trim(), done: false, at: new Date().toISOString() }); db.dirty = true; await db.save(); return db.snapshot.todos[key].at(-1); }
async function listTodos(context) { const db = await ready(); return db.snapshot.todos[ownerKey(context)] || []; }
async function completeTodo(context, id) { const db = await ready(); const item = (db.snapshot.todos[ownerKey(context)] || []).find((todo) => todo.id === id); if (!item) return false; item.done = true; item.completedAt = new Date().toISOString(); db.dirty = true; await db.save(); return true; }
async function addReminder(context, text, dueMs) { const db = await ready(); const reminder = { id: Date.now().toString(36), owner: ownerKey(context), text: String(text).trim(), dueAt: new Date(Date.now() + dueMs).toISOString(), sent: false }; db.snapshot.reminders.push(reminder); db.dirty = true; await db.save(); return reminder; }
async function dueReminders() { const db = await ready(); const now = Date.now(); const due = db.snapshot.reminders.filter((item) => !item.sent && Date.parse(item.dueAt) <= now); for (const item of due) item.sent = true; if (due.length) { db.dirty = true; await db.save(); } return due; }
module.exports = { addNote, listNotes, clearNotes, addTodo, listTodos, completeTodo, addReminder, dueReminders };
