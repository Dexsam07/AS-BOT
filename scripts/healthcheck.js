const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(process.env.HEALTH_FILE || './data/health.json');
const maxAgeMs = Number(process.env.HEALTH_MAX_AGE_MS || 120000);

try {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const updated = Date.parse(data.updatedAt || '');
  const fresh = data.state === 'open' && Number.isFinite(updated) && Date.now() - updated <= maxAgeMs;
  if (!fresh) {
    console.error(JSON.stringify({ healthy: false, state: data.state, updatedAt: data.updatedAt }));
    process.exit(1);
  }
  console.log(JSON.stringify({ healthy: true, state: data.state, updatedAt: data.updatedAt }));
} catch (error) {
  console.error(`healthcheck failed: ${error.message}`);
  process.exit(1);
}
