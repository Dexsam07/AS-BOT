import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const _fmt = (msg) => `╭─❏ 「 GROUP STATUS 」\n│ ${msg}\n╰───────────────\n> ©𓋜 𝐒𝐇𝐘𝐀𝐌-𝐗𝐌𝐃 ツ`;

async function _downloadMedia(sourceMsg, type) {
  const stream = await downloadContentFromMessage(sourceMsg, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function _sendStatusToGroup(sock, jid, mediaType, buffer, caption) {
  if (mediaType === 'image') {
    await sock.sendMessage(jid, {
      image: buffer, caption: caption || '',
      contextInfo: { isGroupStatus: true, statusSourceType: 'IMAGE', statusAttributions: [{ type: 10 }], statusAudienceMetadata: { audienceType: 'CLOSE_FRIENDS' } }
    });
  } else if (mediaType === 'video') {
    await sock.sendMessage(jid, {
      video: buffer, caption: caption || '',
      contextInfo: { isGroupStatus: true, statusSourceType: 'VIDEO', statusAttributions: [{ type: 10 }], statusAudienceMetadata: { audienceType: 'CLOSE_FRIENDS' } }
    });
  } else if (mediaType === 'audio') {
    await sock.sendMessage(jid, {
      audio: buffer, mimetype: 'audio/mp4',
      contextInfo: { isGroupStatus: true, statusSourceType: 'AUDIO', statusAttributions: [{ type: 10 }], statusAudienceMetadata: { audienceType: 'CLOSE_FRIENDS' } }
    });
  } else {
    await sock.sendMessage(jid, {
      text: caption || '',
      contextInfo: { isGroupStatus: true, statusSourceType: 'TEXT', statusAttributions: [{ type: 10 }], statusAudienceMetadata: { audienceType: 'CLOSE_FRIENDS' } }
    });
  }
}

export default {
    command: 'post',
    aliases: ['gpstatus', 'gs'],
    category: 'group',
    description: 'Posts media or text as a silent group status.',
    usage: '.gstatus <all|link|jid> [caption]',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const isGroup = context.isGroup || false;
        const prefix = context.prefix || '.';
        const botName = context.botName || 'Bot';

        try {
            const bodyStr = (message.body || '').trim();
            const spaceIdx = bodyStr.indexOf(' ');
            const afterCmd = spaceIdx !== -1 ? bodyStr.slice(spaceIdx + 1).trim() : '';
            const parts = afterCmd.split(/\s+/);
            const firstArg = (parts[0] || '').toLowerCase();

            if (firstArg === 'all') {
                await sock.sendMessage(chatId, { react: { text: '⌛', key: message.key } });

                const inlineText = parts.slice(1).join(' ').trim() || null;
                let mediaType = null;
                let sourceMsg = null;
                let caption = inlineText;

                // Get quoted message
                const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                
                if (message.message?.imageMessage) {
                    sourceMsg = message.message.imageMessage; mediaType = 'image';
                    caption = message.message.imageMessage?.caption || inlineText || null;
                } else if (message.message?.videoMessage) {
                    sourceMsg = message.message.videoMessage; mediaType = 'video';
                    caption = message.message.videoMessage?.caption || inlineText || null;
                } else if (message.message?.audioMessage) {
                    sourceMsg = message.message.audioMessage; mediaType = 'audio';
                } else if (quoted?.imageMessage) {
                    sourceMsg = quoted.imageMessage; mediaType = 'image';
                    caption = quoted.imageMessage?.caption || inlineText || null;
                } else if (quoted?.videoMessage) {
                    sourceMsg = quoted.videoMessage; mediaType = 'video';
                    caption = quoted.videoMessage?.caption || inlineText || null;
                } else if (quoted?.audioMessage) {
                    sourceMsg = quoted.audioMessage; mediaType = 'audio';
                }

                if (!sourceMsg && !inlineText) {
                    await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                    return await sock.sendMessage(chatId, {
                        text: _fmt('Reply to media or provide text.\n│ Example:\n│ ' + prefix + 'gstatus all Hello groups!\n│ Reply to image + ' + prefix + 'gstatus all Caption'),
                        ...channelInfo
                    }, { quoted: message });
                }

                let buffer = null;
                if (sourceMsg && mediaType) {
                    try { buffer = await _downloadMedia(sourceMsg, mediaType); }
                    catch (e) {
                        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                        return await sock.sendMessage(chatId, { 
                            text: _fmt('Failed to download media: ' + e.message),
                            ...channelInfo
                        }, { quoted: message });
                    }
                }

                const allGroups = await sock.groupFetchAllParticipating();
                const groupJids = Object.keys(allGroups);

                if (!groupJids.length) {
                    await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                    return await sock.sendMessage(chatId, { 
                        text: _fmt('Bot is not in any groups.'),
                        ...channelInfo
                    }, { quoted: message });
                }

                const results = { success: [], failed: [] };
                for (const jid of groupJids) {
                    try {
                        await _sendStatusToGroup(sock, jid, mediaType, buffer, caption);
                        results.success.push(allGroups[jid]?.subject || jid);
                    } catch (e) {
                        results.failed.push({ name: allGroups[jid]?.subject || jid, error: (e.message || '').slice(0, 60) });
                    }
                    await new Promise(r => setTimeout(r, 500));
                }

                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                let report = `╭─❏ 「 GSTATUS REPORT 」\n│\n│ ✅ Success: ${results.success.length}/${groupJids.length}\n│ ❌ Failed: ${results.failed.length}/${groupJids.length}`;
                if (results.failed.length) {
                    report += '\n│\n│ 📋 Failed:';
                    for (const f of results.failed) report += `\n│  • ${f.name}: ${f.error}`;
                }
                report += '\n╰───────────────\n> ©𓋜 𝐒𝐇𝐘𝐀𝐌-𝐗𝐌𝐃 ツ';
                return await sock.sendMessage(chatId, { 
                    text: report,
                    ...channelInfo
                }, { quoted: message });
            }

            let targetGroupJid = null;
            let inlineText = null;

            if (isGroup) {
                targetGroupJid = chatId;
                inlineText = afterCmd || null;
            } else {
                if (!afterCmd) {
                    await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                    return await sock.sendMessage(chatId, {
                        text: `╭─❏ 「 GROUP STATUS 」\n│ Reply to media and provide a group link or JID.\n│ Example:\n│ ${prefix}gstatus https://chat.whatsapp.com/xxxxx\n│ ${prefix}gstatus 120363@g.us\n│ ${prefix}gstatus all Caption — send to ALL groups\n╰───────────────\n> ©𓋜 𝐒𝐇𝐘𝐀𝐌-𝐗𝐌𝐃 ツ`,
                        ...channelInfo
                    }, { quoted: message });
                }
                const p = parts;
                const input = p[0];
                const rest = p.slice(1).join(' ').trim();

                if (input.includes('chat.whatsapp.com')) {
                    let code;
                    try { const url = new URL(input); code = url.pathname.replace(/^\/+/, ''); }
                    catch { code = input.split('/').pop(); }
                    try {
                        const res = await sock.groupGetInviteInfo(code);
                        targetGroupJid = res?.id || res?.groupId || res?.gid;
                        if (!targetGroupJid) throw new Error('no id');
                    } catch {
                        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                        return await sock.sendMessage(chatId, { 
                            text: `╭─❏ 「 GROUP STATUS 」\n│ Invalid or expired group link.\n╰───────────────\n> ©𓋜 𝐒𝐇𝐘𝐀𝐌-𝐗𝐌𝐃 ツ`,
                            ...channelInfo
                        }, { quoted: message });
                    }
                } else if (input.includes('@g.us')) {
                    targetGroupJid = input.trim();
                } else {
                    await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                    return await sock.sendMessage(chatId, { 
                        text: `╭─❏ 「 GROUP STATUS 」\n│ Invalid group link or JID.\n╰───────────────\n> ©𓋜 𝐒𝐇𝐘𝐀𝐌-𝐗𝐌𝐃 ツ`,
                        ...channelInfo
                    }, { quoted: message });
                }
                inlineText = rest || null;
            }

            await sock.sendMessage(chatId, { react: { text: '⌛', key: message.key } });

            let caption = null;
            let sourceMsg = null;
            let mediaType = null;

            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (message.message?.imageMessage) {
                sourceMsg = message.message.imageMessage; mediaType = 'image';
                caption = message.message.imageMessage?.caption || inlineText || null;
            } else if (message.message?.videoMessage) {
                sourceMsg = message.message.videoMessage; mediaType = 'video';
                caption = message.message.videoMessage?.caption || inlineText || null;
            } else if (message.message?.audioMessage) {
                sourceMsg = message.message.audioMessage; mediaType = 'audio';
            } else if (quoted) {
                if (quoted.imageMessage) {
                    sourceMsg = quoted.imageMessage; mediaType = 'image';
                    caption = quoted.imageMessage?.caption || inlineText || null;
                } else if (quoted.videoMessage) {
                    sourceMsg = quoted.videoMessage; mediaType = 'video';
                    caption = quoted.videoMessage?.caption || inlineText || null;
                } else if (quoted.audioMessage) {
                    sourceMsg = quoted.audioMessage; mediaType = 'audio';
                }
            }

            if (!sourceMsg && !inlineText) {
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return await sock.sendMessage(chatId, { 
                    text: _fmt('Reply to media or add text after the command.'),
                    ...channelInfo
                }, { quoted: message });
            }

            caption = caption || inlineText || null;

            let buffer = null;
            if (sourceMsg && mediaType) {
                const stream = await downloadContentFromMessage(sourceMsg, mediaType);
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                buffer = Buffer.concat(chunks);
            }

            await _sendStatusToGroup(sock, targetGroupJid, mediaType, buffer, caption);

            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
            if (!isGroup) {
                await sock.sendMessage(chatId, { 
                    text: _fmt('✅ Status posted to group!'),
                    ...channelInfo
                }, { quoted: message });
            }

        } catch (error) {
            console.error('GStatus Error:', error);
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            await sock.sendMessage(chatId, { 
                text: _fmt('Error: ' + error.message),
                ...channelInfo
            }, { quoted: message });
        }
    }
};