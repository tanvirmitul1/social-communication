#!/bin/sh
set -e

echo "🔄 Running database migrations..."
pnpm prisma migrate deploy

echo "✅ Migrations completed successfully"
echo "🚀 Starting application..."
exec node dist/main.js
