const config = require('../config');

const CAPABILITIES = Object.freeze({
  READ: 'read',
  REPLY: 'reply',
  GROUP_METADATA: 'group-metadata',
  DELETE: 'message-delete',
  REMOVE_MEMBER: 'group-member-remove',
  PROMOTE: 'group-member-promote',
  GROUP_SETTINGS: 'group-settings-write',
  SETTINGS_WRITE: 'settings-write',
  EXTERNAL_API: 'external-api'
});

function cleanNumber(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function isOwner(senderId, message = {}) {
  const sender = cleanNumber(senderId);
  const owner = cleanNumber(config.OWNER_NUMBER);
  return Boolean(message?.key?.fromMe) || (Boolean(sender) && sender === owner);
}

function normalizeRequirements(meta = {}) {
  const requires = Array.isArray(meta.requires) ? meta.requires : [];
  return {
    ownerOnly: Boolean(meta.ownerOnly || meta.strictOwnerOnly),
    strictOwnerOnly: Boolean(meta.strictOwnerOnly),
    groupOnly: Boolean(meta.groupOnly),
    adminOnly: Boolean(meta.adminOnly),
    requiresBotAdmin: Boolean(meta.requiresBotAdmin || meta.botAdminOnly),
    capabilities: [...new Set([...requires, ...(Array.isArray(meta.capabilities) ? meta.capabilities : [])])],
    dryRunWhenDenied: meta.dryRunWhenDenied !== false
  };
}

async function getAdminStatus(sock, chatId, senderId, isGroup) {
  if (!isGroup || !sock || typeof sock.groupMetadata !== 'function') {
    return { isSenderAdmin: false, isBotAdmin: false };
  }
  try {
    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata?.participants || [];
    const sender = participants.find((item) => item.id === senderId);
    const botUser = sock.user?.id?.split(':')[0];
    const botIds = new Set([`${botUser}@s.whatsapp.net`, sock.user?.id].filter(Boolean));
    const bot = participants.find((item) => botIds.has(item.id));
    return {
      isSenderAdmin: Boolean(sender?.admin),
      isBotAdmin: Boolean(bot?.admin),
      senderRole: sender?.admin || null,
      botRole: bot?.admin || null
    };
  } catch (error) {
    return { isSenderAdmin: false, isBotAdmin: false, lookupError: error.message };
  }
}

async function authorize({ command = {}, context = {}, sock }) {
  const requirements = normalizeRequirements(command);
  const senderIsOwner = isOwner(context.sender, context.message);
  const isGroup = Boolean(context.isGroup);
  const admin = await getAdminStatus(sock, context.chatId, context.sender, isGroup);
  const userAuthorized = senderIsOwner || admin.isSenderAdmin;
  const result = {
    allowed: true,
    userAuthorized,
    ownerAuthorized: senderIsOwner,
    senderAdmin: admin.isSenderAdmin,
    botAdmin: admin.isBotAdmin,
    isGroup,
    requirements,
    reason: 'ALLOWED',
    safeAction: 'execute'
  };

  if (requirements.strictOwnerOnly && !senderIsOwner) {
    result.allowed = false;
    result.reason = 'OWNER_ONLY';
  } else if (requirements.ownerOnly && !senderIsOwner) {
    result.allowed = false;
    result.reason = 'OWNER_ONLY';
  } else if (requirements.groupOnly && !isGroup) {
    result.allowed = false;
    result.reason = 'GROUP_ONLY';
  } else if ((requirements.adminOnly || requirements.requiresBotAdmin) && !isGroup) {
    result.allowed = false;
    result.reason = 'GROUP_ONLY';
  } else if (requirements.adminOnly && !admin.isSenderAdmin && !senderIsOwner) {
    result.allowed = false;
    result.reason = 'SENDER_ADMIN_REQUIRED';
  } else if (requirements.requiresBotAdmin && !admin.isBotAdmin) {
    result.allowed = false;
    result.reason = 'BOT_ADMIN_REQUIRED';
  }

  if (!result.allowed && requirements.dryRunWhenDenied) result.safeAction = 'dry-run';
  return result;
}

function denialMessage(result) {
  const messages = {
    OWNER_ONLY: 'Ye command sirf owner ke liye hai.',
    GROUP_ONLY: 'Ye command sirf group mein chalega.',
    SENDER_ADMIN_REQUIRED: 'Is command ke liye sender ka group admin hona zaroori hai.',
    BOT_ADMIN_REQUIRED: 'Owner authorization pass hai, lekin WhatsApp action ke liye bot ko group admin banana zaroori hai.'
  };
  return messages[result.reason] || 'Permission denied.';
}

module.exports = { CAPABILITIES, authorize, denialMessage, getAdminStatus, isOwner, normalizeRequirements };
