#!/bin/sh
set -e

echo "⏳ Waiting DB..."
sleep 3

echo "🔧 Prisma generate..."
npx prisma generate

echo "🔄 Migrate deploy..."
npx prisma migrate deploy

echo "🌱 Seeding (idempotent)..."
npm run -s prisma:seed || npx prisma db seed || true

echo "🚀 Starting app..."
exec node dist/index.js