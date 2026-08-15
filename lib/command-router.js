const config = require('../config');
const { authorize, denialMessage } = require('./policy-engine');
const metrics = require('./metrics');
const audit = require('./audit-log');
const { allow } = require('./rate-limit');

function getMessageText(message) {
  const content = message?.message || {};
  return content.conversation || content.extendedTextMessage?.text || content.imageMessage?.caption || content.videoMessage?.caption || content.buttonsResponseMessage?.selectedButtonId || content.listResponseMessage?.singleSelectReply?.selectedRowId || '';
}
function getSender(message) { return message?.key?.participant || message?.key?.remoteJid || ''; }
function getChatId(message) { return message?.key?.remoteJid || ''; }
function buildCommandMap(registry) {
  const map = new Map();
  for (const command of registry) for (const name of [command.name, ...(command.aliases || [])].filter(Boolean)) map.set(String(name).toLowerCase(), command);
  return map;
}
function createReply(sock, message, chatId) { return (text, options = {}) => sock.sendMessage(chatId, typeof text === 'string' ? { text, ...options } : text, { quoted: message }); }
function createContext({ sock, message, body, commandName, args, adminStatus = {}, requestRestart = null, registry = [] }) {
  const chatId = getChatId(message);
  const sender = getSender(message);
  const isGroup = chatId.endsWith('@g.us');
  const reply = createReply(sock, message, chatId);
  const ownerNumber = String(config.OWNER_NUMBER).replace(/[^0-9]/g, '');
  const senderNumber = sender.replace(/[^0-9]/g, '');
  const isOwner = Boolean(message?.key?.fromMe) || senderNumber === ownerNumber;
  return {
    sock, message, chatId, from: chatId, sender, senderNumber, isOwner, isCreator: isOwner, isGroup,
    isSenderAdmin: Boolean(adminStatus.isSenderAdmin), isBotAdmin: Boolean(adminStatus.isBotAdmin),
    body, text: body, rawText: body, q: args.join(' '), args, command: commandName,
    botPrefix: '', prefix: '', botName: config.BOT_NAME, botOwner: config.OWNER_NAME,
    config: { botName: config.BOT_NAME, botOwner: config.OWNER_NAME, ownerNumber: config.OWNER_NUMBER, version: config.VERSION, mode: config.MODE, channelName: config.CHANNEL_NAME, channelId: config.CHANNEL_ID, channelLink: config.CHANNEL_LINK },
    channelInfo: { contextInfo: { forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: config.CHANNEL_ID, newsletterName: config.CHANNEL_NAME, serverMessageId: -1 } } },
    reply,
    react: (emoji) => sock.sendMessage(chatId, { react: { text: emoji, key: message.key } }),
    sendMessage: (payload, options) => sock.sendMessage(chatId, payload, options),
    registry,
    isAdmin: async () => adminStatus,
    requestRestart
  };
}
function normalizeMeta(command) {
  return { ...command.plugin, command: command.name, aliases: command.aliases || [], category: command.category || 'general', description: command.description || '', ownerOnly: Boolean(command.ownerOnly || command.plugin?.ownerOnly), strictOwnerOnly: Boolean(command.strictOwnerOnly || command.plugin?.strictOwnerOnly), groupOnly: Boolean(command.groupOnly || command.plugin?.groupOnly), adminOnly: Boolean(command.adminOnly || command.plugin?.adminOnly), requiresBotAdmin: Boolean(command.requiresBotAdmin || command.plugin?.requiresBotAdmin), requires: command.requires || command.plugin?.requires || [], dryRunWhenDenied: command.dryRunWhenDenied ?? command.plugin?.dryRunWhenDenied ?? true };
}
async function sendDenial(context, decision) {
  const suffix = decision.reason === 'BOT_ADMIN_REQUIRED' ? '\n\nOwner authorization pass hai, lekin WhatsApp action ke liye bot ko group admin banana zaroori hai.' : '';
  await context.reply(`❌ ${denialMessage(decision)}${suffix}`);
}

async function dispatchMessage({ sock, message, registry, logger = console, requestRestart = null }) {
  const body = getMessageText(message).trim();
  if (!body) return { handled: false, reason: 'empty-message' };
  const tokens = body.split(/\s+/).filter(Boolean);
  const commandName = (tokens.shift() || '').toLowerCase();
  const command = buildCommandMap(registry).get(commandName);
  if (!command) return { handled: false, reason: 'not-a-command' };

  const preliminary = createContext({ sock, message, body, commandName, args: tokens, requestRestart, registry });
  const rate = allow(`${preliminary.chatId}:${preliminary.sender}`, Number(process.env.COMMAND_RATE_LIMIT || 12), Number(process.env.COMMAND_RATE_WINDOW_MS || 10000));
  if (!rate.allowed && !preliminary.isOwner) {
    audit.record('rate-limit-denied', { command: commandName, chatId: preliminary.chatId, sender: preliminary.sender });
    await preliminary.reply('⏳ Thoda slow karo, command rate limit hit ho gayi.');
    return { handled: true, command: command.name, reason: 'rate-limited' };
  }

  const decision = await authorize({ command: normalizeMeta(command), context: preliminary, sock });
  const context = createContext({ sock, message, body, commandName, args: tokens, adminStatus: { isSenderAdmin: decision.senderAdmin, isBotAdmin: decision.botAdmin }, requestRestart, registry });
  audit.record(decision.allowed ? 'command-authorized' : 'command-denied', { command: command.name, chatId: context.chatId, sender: context.sender, reason: decision.reason, owner: decision.ownerAuthorized, senderAdmin: decision.senderAdmin, botAdmin: decision.botAdmin });
  if (!decision.allowed) { await sendDenial(context, decision); return { handled: true, command: command.name, reason: decision.reason }; }

  const timer = metrics.begin(command.name);
  try {
    if (command.style === 'legacy-execute') await command.handler(sock, message, message, { from: context.from, q: context.q, args: context.args, sender: context.sender, reply: context.reply, react: context.react, isGroup: context.isGroup, isOwner: context.isOwner, isBotAdmin: context.isBotAdmin });
    else await command.handler(sock, message, tokens, context);
    timer.end();
    return { handled: true, command: command.name };
  } catch (error) {
    timer.end(error);
    audit.record('command-error', { command: command.name, chatId: context.chatId, error: error.message });
    logger.error(`[command-error] ${command.name}: ${error.stack || error.message}`);
    await context.reply('❌ Command run karte waqt error aaya. Logs check karo.');
    return { handled: true, command: command.name, error };
  }
}
module.exports = { getMessageText, buildCommandMap, createContext, dispatchMessage };
