const crypto = require('node:crypto');

function normalizePrefix(value) {
  const prefix = String(value || '').trim();
  if (!prefix || !/^[A-Za-z0-9][A-Za-z0-9_~\-]{1,31}$/.test(prefix)) {
    throw new Error('SESSION_PREFIX must be 2-32 characters: letters, numbers, _, ~ or - only.');
  }
  return prefix;
}

function decodeBase64(value) {
  const encoded = String(value || '').trim();
  if (!encoded) throw new Error('Session Base64 payload is empty.');
  if (encoded.length < 8 || encoded.length > 200000) throw new Error('Session Base64 payload length is invalid.');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4 === 1) {
    throw new Error('Session payload is not valid standard Base64.');
  }

  const decoded = Buffer.from(encoded, 'base64');
  if (!decoded.length) throw new Error('Session payload decoded to empty data.');

  const canonical = decoded.toString('base64').replace(/=+$/, '');
  const suppliedCanonical = encoded.replace(/=+$/, '');
  if (canonical !== suppliedCanonical) throw new Error('Session Base64 canonical check failed.');

  return decoded;
}

function parseSessionPayload(decoded) {
  const text = decoded.toString('utf8').trim();
  if (!text) return { kind: 'binary', payload: null };

  try {
    const payload = JSON.parse(text);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { kind: 'text', payload: text };
    }
    return { kind: 'json', payload };
  } catch (_) {
    return { kind: 'binary-or-text', payload: text };
  }
}

function validateSessionId(sessionId, expectedPrefix) {
  const prefix = normalizePrefix(expectedPrefix);
  const supplied = String(sessionId || '').trim();

  if (!supplied.startsWith(prefix)) {
    throw new Error(`Session rejected: name must start with ${prefix}.`);
  }

  const encodedPayload = supplied.slice(prefix.length);
  const decoded = decodeBase64(encodedPayload);
  const parsed = parseSessionPayload(decoded);

  return {
    valid: true,
    prefix,
    sessionName: prefix,
    encodedPayload,
    decoded,
    kind: parsed.kind,
    payload: parsed.payload,
    fingerprint: crypto.createHash('sha256').update(decoded).digest('hex').slice(0, 16)
  };
}

function createDemoSessionId(prefix) {
  const safePrefix = normalizePrefix(prefix);
  const demoPayload = Buffer.from(JSON.stringify({
    demo: true,
    version: 1,
    createdFor: 'local-validation-only'
  }), 'utf8').toString('base64');
  return `${safePrefix}${demoPayload}`;
}

module.exports = {
  normalizePrefix,
  decodeBase64,
  validateSessionId,
  createDemoSessionId
};
