#!/bin/bash

# Vercel Build Script for HUNKCentral
echo "🚀 Starting Vercel build process..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations (only in production)
if [ "$VERCEL_ENV" = "production" ]; then
  echo "🗄️ Running production database migrations..."
  npx prisma migrate deploy
elif [ "$VERCEL_ENV" = "preview" ]; then
  echo "🗄️ Running preview database migrations..."
  npx prisma migrate deploy
fi

# Build the Next.js application
echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"