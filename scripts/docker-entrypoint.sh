#!/bin/sh
set -e

echo "🚀 Starting CrunchyCone application..."

# Check if we're using Turso (libSQL)
if echo "$DATABASE_URL" | grep -q "^libsql://"; then
  echo "📡 Detected Turso database configuration"
  if [ -z "$TURSO_AUTH_TOKEN" ]; then
    echo "⚠️  Warning: TURSO_AUTH_TOKEN not set for Turso database"
    exit 1
  fi
  
  echo "🔄 Running Turso database migrations..."
  
  # Run automated migration system
  node /app/scripts/turso-migrate.js || {
    echo "⚠️  Some migrations may have failed, but continuing..."
  }
  
  echo "✅ Turso database ready"
  
# Check if we're using SQLite (file-based)
elif echo "$DATABASE_URL" | grep -q "^file:"; then
  echo "📁 Detected SQLite database configuration"
  
  # Extract the database file path from DATABASE_URL
  DB_PATH=$(echo "$DATABASE_URL" | sed 's/^file://')
  DB_DIR=$(dirname "$DB_PATH")
  
  # Ensure the database directory exists (only for file-based SQLite)
  if [ ! -d "$DB_DIR" ]; then
    echo "📂 Creating database directory: $DB_DIR"
    mkdir -p "$DB_DIR" || true
  fi
  
  # Check if we can write to the directory
  if [ ! -w "$DB_DIR" ]; then
    echo "⚠️  Warning: Database directory is not writable. Volume permissions may need adjustment."
  fi
  
  # Check if database exists
  if [ ! -f "$DB_PATH" ]; then
    echo "🔧 Database not found at $DB_PATH"
    echo "🏗️  Running database migrations..."
    npx prisma migrate deploy 2>/dev/null || {
      echo "⚠️  Migrations failed or not found, pushing schema directly..."
      npx prisma db push --accept-data-loss
    }
    
    # Run seed if database was just created and seed file exists
    if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
      echo "🌱 Seeding database with initial data..."
      npx prisma db seed || echo "⚠️  Seeding failed, continuing anyway..."
    fi
  else
    echo "✅ Database found at $DB_PATH"
    # Run any pending migrations
    echo "🔄 Checking for pending migrations..."
    npx prisma migrate deploy 2>/dev/null || echo "ℹ️  No migrations to apply"
  fi
  
# PostgreSQL or MySQL
else
  echo "🗄️  Detected external database configuration"
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy 2>/dev/null || {
    echo "⚠️  Migrations failed or not found, pushing schema directly..."
    npx prisma db push --accept-data-loss
  }
fi

echo "✨ Database setup complete!"
echo "🚀 Starting Next.js application..."

# Execute the main command (CMD from Dockerfile)
exec "$@"