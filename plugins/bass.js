import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

async function getAudio(message) {
    const m = message.message || {};
    const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage;
    const audio = m.audioMessage || m.voiceMessage || quoted?.audioMessage || quoted?.voiceMessage;
    if (!audio) return null;
    const stream = await downloadContentFromMessage(audio, 'audio');
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    return Buffer.concat(chunks);
}

export default {
    command: 'bass',
    aliases: ['bassboost'],
    category: 'audio',
    description: 'Boost bass of audio',
    usage: '.bass (reply to audio)',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const audioBuffer = await getAudio(message);

        if (!audioBuffer) {
            return await sock.sendMessage(chatId, {
                text: '❌ Reply to an audio/voice note with .bass',
                contextInfo: {}
            }, { quoted: message });
        }

        try {
            const tmp = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
            const input = path.join(tmp, `in_${Date.now()}.ogg`);
            const output = path.join(tmp, `out_${Date.now()}.ogg`);
            fs.writeFileSync(input, audioBuffer);
            const filter = 'equalizer=f=94:width_type=o:width=2:g=30';
            exec(`ffmpeg -y -i "${input}" -af "${filter},aresample=48000,asetpts=N/SR" -c:a libopus -b:a 64k -ac 1 "${output}"`, async () => {
                const out = fs.readFileSync(output);
                await sock.sendMessage(chatId, {
                    audio: out,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                    contextInfo: {}
                });
                try { fs.unlinkSync(input); } catch {}
                try { fs.unlinkSync(output); } catch {}
            });
        } catch {
            await sock.sendMessage(chatId, {
                text: '❌ Audio processing failed. Make sure ffmpeg is installed.',
                contextInfo: {}
            }, { quoted: message });
        }
    }
};