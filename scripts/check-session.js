const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const { validateSessionId, createDemoSessionId } = require('../lib/session-validator');

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const demo = process.argv.includes('--demo');
const supplied = readArg('--session') || process.env.SESSION_ID || (demo ? createDemoSessionId(config.SESSION_PREFIX) : '');

try {
  const result = validateSessionId(supplied, config.SESSION_PREFIX);
  console.log(JSON.stringify({
    valid: result.valid,
    prefix: result.prefix,
    sessionName: result.sessionName,
    kind: result.kind,
    fingerprint: result.fingerprint,
    demo
  }, null, 2));
  process.exitCode = 0;
} catch (error) {
  console.error(`INVALID_SESSION: ${error.message}`);
  process.exitCode = 1;
}
