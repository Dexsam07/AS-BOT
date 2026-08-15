const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isUrl = (value) => /^(https?:\/\/|www\.)/i.test(String(value || '').trim());
const getRandom = (items = []) => items[Math.floor(Math.random() * items.length)];
const Json = (value) => JSON.stringify(value, null, 2);
const runtime = (seconds = 0) => {
  const s = Number(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};
const h2k = (value) => String(value ?? '');
const fetch = (...args) => axios(...args);
const fetchJson = async (url, options) => (await axios.get(url, options)).data;
const getBuffer = async (url, options = {}) => Buffer.from((await axios.get(url, { ...options, responseType: 'arraybuffer' })).data);
const getSizeMedia = async (buffer) => Buffer.byteLength(buffer);
const reSize = async (buffer) => buffer;
const generateMessageTag = (epoch = Date.now()) => `${epoch}.${Math.random().toString(36).slice(2, 8)}`;
const getJsonFile = (file, fallback = {}) => {
  try { return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')); } catch (_) { return fallback; }
};

function getGroupAdmins(participants = []) {
  return participants.filter((participant) => participant.admin).map((participant) => participant.id);
}

module.exports = {
  sleep,
  isUrl,
  getRandom,
  Json,
  runtime,
  h2k,
  fetch,
  fetchJson,
  getBuffer,
  getSizeMedia,
  reSize,
  generateMessageTag,
  getGroupAdmins,
  getJsonFile
};
