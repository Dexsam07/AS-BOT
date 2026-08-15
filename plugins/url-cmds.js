// ============================================
// 📦 PERMANENT UPLOAD SERVICES - NO FILE-TYPE
// ============================================

const axios = require('axios');
const FormData = require('form-data');
const { bandah, cmd } = require("../command");

// ============================================
// 🛠️ HELPER FUNCTIONS
// ============================================

function formatBytes(bytes) {
   if (bytes === 0) return '0 Bytes';
   const k = 1024;
   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   const i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileType(mimeType) {
   if (mimeType?.startsWith('image/')) return '🖼️ Image';
   else if (mimeType?.startsWith('video/')) return '🎥 Video';
   else if (mimeType?.startsWith('audio/')) return '🎵 Audio';
   return '📄 File';
}

function getExtension(mimeType) {
   if (mimeType?.includes('jpeg') || mimeType?.includes('jpg')) return '.jpg';
   else if (mimeType?.includes('png')) return '.png';
   else if (mimeType?.includes('gif')) return '.gif';
   else if (mimeType?.includes('webp')) return '.webp';
   else if (mimeType?.includes('mp4')) return '.mp4';
   else if (mimeType?.includes('webm')) return '.webm';
   else if (mimeType?.includes('mpeg') || mimeType?.includes('mp3')) return '.mp3';
   else if (mimeType?.includes('wav')) return '.wav';
   else if (mimeType?.includes('ogg') || mimeType?.includes('opus') || mimeType?.includes('ogx')) return '.ogg';
   else if (mimeType?.includes('m4a')) return '.m4a';
   else return '.jpg';
}

// ============================================
// 🔧 UNIVERSAL UPLOADER WITH 4x FALLBACK
// ============================================

async function tryUpload(buffer, mimeType) {
   const ext = getExtension(mimeType);
   const filename = `naveed_${Date.now()}${ext}`;
   const errors = [];

   // 1. Catbox - Most stable for PK
   try {
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', buffer, { filename, contentType: mimeType || 'application/octet-stream' });
      const res = await axios.post('https://catbox.moe/user/api.php', form, {
         headers: {...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
         maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 90000
      });
      if (res.data && res.data.toString().startsWith('https://')) return res.data.toString().trim();
   } catch (e) { errors.push('catbox:' + e.message); }

   // 2. Qu.ax
   try {
      const form = new FormData();
      form.append('files[]', buffer, { filename, contentType: mimeType || 'application/octet-stream' });
      const res = await axios.post('https://qu.ax/upload.php', form, {
         headers: { Origin: 'https://qu.ax', Referer: 'https://qu.ax/', 'User-Agent': 'Mozilla/5.0',...form.getHeaders() },
         maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 90000
      });
      const url = res.data.files?.[0]?.url || res.data.url;
      if (url) return url.trim();
   } catch (e) { errors.push('quax:' + e.message); }

   // 3. tmpfiles.org
   try {
      const form = new FormData();
      form.append('file', buffer, { filename });
      const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
         headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 90000
      });
      let url = res.data.data?.url || res.data.url;
      if (url) { if (url.includes('/dl/')) url = url.replace('/dl/', '/'); return url.trim(); }
   } catch (e) { errors.push('tmpfiles:' + e.message); }

   // 4. Envs.sh
   try {
      const form = new FormData();
      form.append('file', buffer, { filename });
      const res = await axios.post('https://envs.sh', form, {
         headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 90000
      });
      if (res.data && typeof res.data === 'string' && res.data.startsWith('https://')) return res.data.trim();
   } catch (e) { errors.push('envs:' + e.message); }

   throw new Error('All servers failed - ' + errors.join(' | '));
}

async function uploadQuax(b,m){ return tryUpload(b,m); }
async function uploadTelegraph(b,m){ return tryUpload(b,m); }
async function uploadUguu(b,m){ return tryUpload(b,m); }
async function uploadPuticu(b,m){ return tryUpload(b,m); }
async function uploadIimg(b,m){ return tryUpload(b,m); }
async function uploadCatbox(b,m){ return tryUpload(b,m); }
async function uploadAyanami(b,m){ return tryUpload(b,m); }
async function uploadEnvs(b,m){ return tryUpload(b,m); }

// ============================================
// 📡 WHATSAPP COMMANDS (.url SERIES) - FULL
// ============================================

bandah({
   pattern: "url",
   alias: ["quax", "qu"],
   react: "🎯",
   desc: "Upload media to Qu.ax (Permanent & Highly Reliable)",
   category: "convert",
   use: ".url (reply to media)",
   filename: __filename
}, async (conn, mek, m, { reply }) => {
   try {
      const quoted = m.quoted? m.quoted : m;
      const mimeType = (quoted.msg || quoted).mimetype || "";
      if (!mimeType) return reply("❌ Reply to an image/video/audio file!");
      await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
      const buffer = await quoted.download();
      if (!buffer) throw "Failed to download media.";
      const url = await uploadQuax(buffer, mimeType);
      const fileType = getFileType(mimeType);
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
      await reply(`*🎯 Qu.ax Upload Successful!*\n\n📁 *Type:* ${fileType}\n📏 *Size:* ${formatBytes(buffer.length)}\n🔗 *URL:* ${url}\n\n> 🚀 Powered by AS-BOT`);
   } catch (err) {
      console.error("URL ERROR:", err);
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply(`❌ Error: ${err.message || err}`);
   }
});

bandah({
   pattern: "url2",
   alias: ["telegraph", "tg"],
   react: "📸",
   desc: "Upload media to Telegraph (Permanent for Images/Videos < 5MB)",
   category: "convert",
   use: ".url2 (reply to media)",
   filename: __filename
}, async (conn, mek, m, { reply }) => {
   try {
      const quoted = m.quoted? m.quoted : m;
      const mimeType = (quoted.msg || quoted).mimetype || "";
      if (!mimeType) return reply("❌ Reply to an image/video/audio file!");
      await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
      const buffer = await quoted.download();
      if (!buffer) throw "Failed to download media.";
      const url = await uploadTelegraph(buffer, mimeType);
      const fileType = getFileType(mimeType);
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
      await reply(`*📸 Telegraph Upload Successful!*\n\n📁 *Type:* ${fileType}\n📏 *Size:* ${formatBytes(buffer.length)}\n🔗 *URL:* ${url}\n\n> 🚀 Powered by AS-BOT`);
   } catch (err) {
      console.error("URL2 ERROR:", err);
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply(`❌ Error: ${err.message || err}`);
   }
});

bandah({
   pattern: "url3",
   alias: ["uguu", "ug"],
   react: "🌐",
   desc: "Upload media to Uguu.se (Permanent)",
   category: "convert",
   use: ".url3 (reply to media)",
   filename: __filename
}, async (conn, mek, m, { reply }) => {
   try {
      const quoted = m.quoted? m.quoted : m;
      const mimeType = (quoted.msg || quoted).mimetype || "";
      if (!mimeType) return reply("❌ Reply to an image/video/audio file!");
      await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
      const buffer = await quoted.download();
      if (!buffer) throw "Failed to download media.";
      const url = await uploadUguu(buffer, mimeType);
      const fileType = getFileType(mimeType);
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
      await reply(`*🌐 Uguu Upload Successful!*\n\n📁 *Type:* ${fileType}\n📏 *Size:* ${formatBytes(buffer.length)}\n🔗 *URL:* ${url}\n\n> 🚀 Powered by AS-BOT`);
   } catch (err) {
      console.error("URL3 ERROR:", err);
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply(`❌ Error: ${err.message || err}`);
   }
});

bandah({
   pattern: "url4",
   alias: ["puticu", "put"],
   react: "💊",
   desc: "Upload media to Put.icu (Permanent)",
   category: "convert",
   use: ".url4 (reply to media)",
   filename: __filename
}, async (conn, mek, m, { reply }) => {
   try {
      const quoted = m.quoted? m.quoted : m;
      const mimeType = (quoted.msg || quoted).mimetype || "";
      if (!mimeType) return reply("❌ Reply to an image/video/audio file!");
      await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
      const buffer = await quoted.download();
      if (!buffer) throw "Failed to download media.";
      const url = await uploadPuticu(buffer, mimeType);
      const fileType = getFileType(mimeType);
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
      await reply(`*💊 Put.icu Upload Successful!*\n\n📁 *Type:* ${fileType}\n📏 *Size:* ${formatBytes(buffer.length)}\n🔗 *URL:* ${url}\n\n> 🚀 Powered by AS-BOT`);
   } catch (err) {
      console.error("URL4 ERROR:", err);
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply(`❌ Error: ${err.message || err}`);
   }
});

bandah({
   pattern: "url5",
   alias: ["iimg", "img"],
   react: "🖼️",
   desc: "Upload media to iimg.live (Permanent)",
   category: "convert",
   use: ".url5 (reply to media)",
   filename: __filename
}, async (conn, mek, m, { reply }) => {
   try {
      const quoted = m.quoted? m.quoted : m;
      const mimeType = (quoted.msg || quoted).mimetype || "";
      if (!mimeType) return reply("❌ Reply to an image/video/audio file!");
      await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
      const buffer = await quoted.download();
      if (!buffer) throw "Failed to download media.";
      const url = await uploadIimg(buffer, mimeType);
      const fileType = getFileType(mimeType);
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
      await reply(`*🖼️ iimg.live Upload Successful!*\n\n📁 *Type:* ${fileType}\n📏 *Size:* ${formatBytes(buffer.length)}\n🔗 *URL:* ${url}\n\n> 🚀 Powered by AS-BOT`);
   } catch (err) {
      console.error("URL5 ERROR:", err);
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply(`❌ Error: ${err.message || err}`);
   }
});

bandah({
   pattern: "url6",
   alias: ["catbox", "cb"],
   react: "📦",
   desc: "Upload media to Catbox.moe (Permanent)",
   category: "convert",
   use: ".url6 (reply to media)",
   filename: __filename
}, async (conn, mek, m, { reply }) => {
   try {
      const quoted = m.quoted? m.quoted : m;
      const mimeType = (quoted.msg || quoted).mimetype || "";
      if (!mimeType) return reply("❌ Reply to an image/video/audio file!");
      await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
      const buffer = await quoted.download();
      if (!buffer) throw "Failed to download media.";
      const url = await uploadCatbox(buffer, mimeType);
      const fileType = getFileType(mimeType);
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
      await reply(`*📦 Catbox Upload Successful!*\n\n📁 *Type:* ${fileType}\n📏 *Size:* ${formatBytes(buffer.length)}\n🔗 *URL:* ${url}\n\n> 🐱 Powered by AS-BOT`);
   } catch (err) {
      console.error("URL6 ERROR:", err);
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply(`❌ Error: ${err.message || err}`);
   }
});

bandah({
   pattern: "url7",
   alias: ["ayanami", "aya"],
   react: "🌸",
   desc: "Upload media to Ayanami.upload (Permanent)",
   category: "convert",
   use: ".url7 (reply to media)",
   filename: __filename
}, async (conn, mek, m, { reply }) => {
   try {
      const quoted = m.quoted? m.quoted : m;
      const mimeType = (quoted.msg || quoted).mimetype || "";
      if (!mimeType) return reply("❌ Reply to an image/video/audio file!");
      await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
      const buffer = await quoted.download();
      if (!buffer) throw "Failed to download media.";
      const url = await uploadAyanami(buffer, mimeType);
      const fileType = getFileType(mimeType);
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
      await reply(`*🌸 Ayanami Upload Successful!*\n\n📁 *Type:* ${fileType}\n📏 *Size:* ${formatBytes(buffer.length)}\n🔗 *URL:* ${url}\n\n> 🚀 Powered by AS-BOT`);
   } catch (err) {
      console.error("URL7 ERROR:", err);
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply(`❌ Error: ${err.message || err}`);
   }
});

bandah({
   pattern: "url8",
   alias: ["envs", "es"],
   react: "🌿",
   desc: "Upload media to Envs.sh (Permanent)",
   category: "convert",
   use: ".url8 (reply to media)",
   filename: __filename
}, async (conn, mek, m, { reply }) => {
   try {
      const quoted = m.quoted? m.quoted : m;
      const mimeType = (quoted.msg || quoted).mimetype || "";
      if (!mimeType) return reply("❌ Reply to an image/video/audio file!");
      await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
      const buffer = await quoted.download();
      if (!buffer) throw "Failed to download media.";
      const url = await uploadEnvs(buffer, mimeType);
      const fileType = getFileType(mimeType);
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
      await reply(`*🌿 Envs.sh Upload Successful!*\n\n📁 *Type:* ${fileType}\n📏 *Size:* ${formatBytes(buffer.length)}\n🔗 *URL:* ${url}\n\n> 🚀 Powered by AS-BOT`);
   } catch (err) {
      console.error("URL8 ERROR:", err);
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply(`❌ Error: ${err.message || err}`);
   }
});
