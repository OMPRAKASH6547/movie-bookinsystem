#!/usr/bin/env bash
set -euo pipefail

echo "▶ Pulling latest"
git pull origin main

echo "▶ Installing deps"
npm ci

echo "▶ Building"
npm run build

echo "▶ Reloading PM2"
pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js

echo "▶ Health check"
curl -sf http://localhost:3000/api/v1/health | head -c 200
echo ""
echo "✅ Deploy complete"
