const { randomUUID } = require('node:crypto');

const MAX_CONCURRENCY = Math.max(1, Number(process.env.JOB_MAX_CONCURRENCY || 2));
const MAX_QUEUE = Math.max(5, Number(process.env.JOB_MAX_QUEUE || 40));
const PER_CHAT_LIMIT = Math.max(1, Number(process.env.JOB_PER_CHAT_LIMIT || 3));
const DEFAULT_TIMEOUT = Math.max(5000, Number(process.env.JOB_TIMEOUT_MS || 180000));

const pending = [];
const running = new Map();
const chatCounts = new Map();
const history = [];
let paused = false;
let pauseReason = '';
let completed = 0;
let failed = 0;
let cancelled = 0;

function remember(entry) {
  history.push(entry);
  if (history.length > 100) history.shift();
}

function pump() {
  if (paused) return;
  while (running.size < MAX_CONCURRENCY && pending.length) {
    const job = pending.shift();
    if (!job || job.cancelled) continue;
    const activeForChat = chatCounts.get(job.chatId) || 0;
    chatCounts.set(job.chatId, activeForChat + 1);
    running.set(job.id, job);
    job.status = 'running';
    job.startedAt = Date.now();
    let timer;
    Promise.race([
      Promise.resolve().then(job.task),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error('Job timed out.');
          error.code = 'JOB_TIMEOUT';
          reject(error);
        }, job.timeout);
      })
    ]).then((result) => {
      completed += 1;
      job.status = 'completed';
      job.result = result;
      job.resolve(result);
      remember({ id: job.id, type: job.type, chatId: job.chatId, status: job.status, ms: Date.now() - job.queuedAt });
    }).catch((error) => {
      failed += 1;
      job.status = 'failed';
      job.error = String(error.message || error);
      job.reject(error);
      remember({ id: job.id, type: job.type, chatId: job.chatId, status: job.status, error: job.error, ms: Date.now() - job.queuedAt });
    }).finally(() => {
      clearTimeout(timer);
      running.delete(job.id);
      const nextCount = Math.max(0, (chatCounts.get(job.chatId) || 1) - 1);
      if (nextCount) chatCounts.set(job.chatId, nextCount); else chatCounts.delete(job.chatId);
      pump();
    });
  }
}

function submit(type, chatId, task, options = {}) {
  const id = randomUUID().slice(0, 12);
  if (paused) return Promise.reject(Object.assign(new Error(`Job queue paused: ${pauseReason}`), { code: 'JOB_QUEUE_PAUSED' }));
  if (typeof task !== 'function') return Promise.reject(new Error('Job task must be a function.'));
  const key = String(chatId || 'unknown');
  const activeForChat = (chatCounts.get(key) || 0) + pending.filter((job) => job.chatId === key && !job.cancelled).length;
  if (activeForChat >= Number(options.perChatLimit || PER_CHAT_LIMIT)) {
    return Promise.reject(Object.assign(new Error('Too many active jobs for this chat.'), { code: 'CHAT_JOB_LIMIT' }));
  }
  if (pending.length >= Number(options.maxQueue || MAX_QUEUE)) {
    return Promise.reject(Object.assign(new Error('Job queue is full.'), { code: 'JOB_QUEUE_FULL' }));
  }
  const job = {
    id,
    type: String(type || 'job'),
    chatId: key,
    task,
    timeout: Number(options.timeout || DEFAULT_TIMEOUT),
    queuedAt: Date.now(),
    status: 'queued',
    cancelled: false,
    resolve: null,
    reject: null
  };
  const promise = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });
  promise.jobId = id;
  pending.push(job);
  pump();
  return promise;
}

function cancel(id) {
  const job = pending.find((item) => item.id === id && !item.cancelled);
  if (!job) return false;
  job.cancelled = true;
  job.status = 'cancelled';
  cancelled += 1;
  job.reject(Object.assign(new Error('Job cancelled.'), { code: 'JOB_CANCELLED' }));
  return true;
}

function pause(reason = 'manual') { paused = true; pauseReason = String(reason); return true; }
function resume() { paused = false; pauseReason = ''; pump(); return true; }
function getStatus() {
  return { maxConcurrency: MAX_CONCURRENCY, maxQueue: MAX_QUEUE, perChatLimit: PER_CHAT_LIMIT, queued: pending.filter((job) => !job.cancelled).length, running: running.size, completed, failed, cancelled, paused, pauseReason, recent: history.slice(-10) };
}

module.exports = { submit, cancel, pause, resume, pauseQueue: pause, resumeQueue: resume, getStatus, MAX_CONCURRENCY, MAX_QUEUE, PER_CHAT_LIMIT, DEFAULT_TIMEOUT };
