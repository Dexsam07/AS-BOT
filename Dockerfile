FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    SESSION_DIR=/app/data/session \
    AUDIT_FILE=/app/data/audit.jsonl

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg tini ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY . .
RUN mkdir -p /app/data/session /app/data/protected /app/temp /app/logs \
  && chown -R node:node /app

USER node
VOLUME ["/app/data", "/app/temp", "/app/logs"]
HEALTHCHECK --interval=60s --timeout=10s --start-period=90s --retries=3 CMD node scripts/healthcheck.js

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "index.js"]
