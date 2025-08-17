#!/bin/sh

echo "🚀 Starting Allertify Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 3

# Generate Prisma client with proper binary targets
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "🎯 Starting application..."
exec node dist/index.js
