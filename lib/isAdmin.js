module.exports = async function isAdmin(sock, groupJid, senderJid) {
  try {
    const metadata = await sock.groupMetadata(groupJid);
    const participants = metadata?.participants || [];
    const sender = participants.find((participant) => participant.id === senderJid);
    const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const bot = participants.find((participant) => participant.id === botId);
    return {
      isSenderAdmin: Boolean(sender?.admin),
      isBotAdmin: Boolean(bot?.admin)
    };
  } catch (_) {
    return { isSenderAdmin: false, isBotAdmin: false };
  }
};
