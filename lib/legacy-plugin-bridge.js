const config = require('../config');
const commandRegistry = require('../command');
const shyamRegistry = require('../shyam');

function commandName(meta = {}) {
  const value = meta.pattern || meta.command || meta.name;
  return Array.isArray(value) ? value[0] : value;
}

function aliases(meta = {}) {
  const value = meta.aliases || meta.alias || [];
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
}

function normalizeMeta(meta = {}, filePath) {
  return {
    name: String(commandName(meta) || '').trim(),
    aliases: aliases(meta).map((value) => String(value).trim()).filter(Boolean),
    category: String(meta.category || 'general').toLowerCase(),
    description: String(meta.description || meta.desc || meta.help || '').trim(),
    ownerOnly: Boolean(meta.ownerOnly || meta.owner || meta.fromMe || meta.isCreator),
    adminOnly: Boolean(meta.adminOnly),
    requiresBotAdmin: Boolean(meta.requiresBotAdmin || meta.botAdmin),
    groupOnly: Boolean(meta.groupOnly || meta.isGroup),
    hidden: Boolean(meta.hidden || meta.dontAdd),
    file: filePath,
    legacyMeta: meta
  };
}

function wrapMessage(message, context) {
  const wrapped = Object.create(message || null);
  wrapped.key = message?.key || {};
  wrapped.message = message?.message || {};
  wrapped.chat = context.chatId;
  wrapped.sender = context.sender;
  wrapped.from = context.chatId;
  wrapped.text = context.body;
  wrapped.body = context.body;
  wrapped.fromMe = Boolean(message?.key?.fromMe);
  wrapped.isGroup = context.isGroup;
  wrapped.reply = context.reply;
  wrapped.react = context.react;
  wrapped.mentionedJid = message?.mentionedJid || [];
  return wrapped;
}

function legacyContext(context, args) {
  return {
    ...context,
    from: context.chatId,
    chat: context.chatId,
    sender: context.sender,
    senderNumber: context.senderNumber,
    q: args.join(' '),
    text: context.body,
    body: context.body,
    args,
    prefix: '',
    botPrefix: '',
    isCreator: context.isOwner,
    isOwner: context.isOwner,
    isBotAdmin: context.isBotAdmin,
    isSenderAdmin: context.isSenderAdmin,
    userConfig: {
      BOT_NAME: config.BOT_NAME,
      OWNER_NAME: config.OWNER_NAME,
      OWNER_NUMBER: config.OWNER_NUMBER,
      MODE: config.MODE,
      TIMEZONE: config.TIMEZONE,
      VERSION: config.VERSION,
      CHANNEL_NAME: config.CHANNEL_NAME,
      CHANNEL_ID: config.CHANNEL_ID,
      CHANNEL_LINK: config.CHANNEL_LINK,
      CAPTION: config.DESCRIPTION
    }
  };
}

function makeHandler(handler, kind) {
  return async (sock, message, args, context) => {
    const legacy = legacyContext(context, args);
    const wrappedMessage = wrapMessage(message, context);
    if (kind === 'gmd') return handler(context.chatId, sock, legacy);
    return handler(sock, message, wrappedMessage, legacy);
  };
}

function beginCapture() {
  const registrations = [];
  const previous = new Map();
  const names = ['gmd', 'malvin', 'amon', 'shyam'];

  for (const name of names) {
    previous.set(name, global[name]);
    global[name] = (meta, handler) => {
      if (typeof handler === 'function') registrations.push({ meta, handler, kind: name === 'gmd' ? 'gmd' : name });
      return meta;
    };
  }

  const commandCount = commandRegistry.commands.length;
  const shyamCount = shyamRegistry.commands.length;
  return {
    finish(filePath) {
      const registered = [...registrations];
      for (const item of commandRegistry.commands.slice(commandCount)) registered.push({ meta: item, handler: item.function, kind: 'cmd' });
      for (const item of shyamRegistry.commands.slice(shyamCount)) registered.push({ meta: item, handler: item.function, kind: 'shyam' });
      const output = registered
        .map(({ meta, handler, kind }) => ({ ...normalizeMeta(meta, filePath), handler: makeHandler(handler, kind) }))
        .filter((item) => item.name && typeof item.handler === 'function');
      return output;
    },
    rollback() {
      commandRegistry.commands.splice(commandCount);
      shyamRegistry.commands.splice(shyamCount);
    },
    restore() {
      for (const [name, value] of previous) {
        if (value === undefined) delete global[name];
        else global[name] = value;
      }
    }
  };
}

module.exports = { beginCapture, makeHandler, legacyContext, wrapMessage };
