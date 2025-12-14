#!/bin/bash
# Atomic edit wrapper for AdminLayoutClient.tsx
# This MUST be used for ALL edits to prevent corruption
# Usage: ./scripts/atomic-edit-admin-layout.sh <edit-command>
# Example: ./scripts/atomic-edit-admin-layout.sh "sed 's/old/new/g'"

set -e

FILE="components/admin/AdminLayoutClient.tsx"
TEMP_FILE="${FILE}.atomic.$$"
BACKUP_FILE="${FILE}.backup.$$"
LOCK_FILE="${FILE}.lock"

# Acquire lock
TIMEOUT=10
COUNT=0
while [ -f "$LOCK_FILE" ] && [ $COUNT -lt $TIMEOUT ]; do
    sleep 0.5
    COUNT=$((COUNT + 1))
done

if [ -f "$LOCK_FILE" ]; then
    echo "❌ Could not acquire lock"
    exit 1
fi

touch "$LOCK_FILE"
trap "rm -f $LOCK_FILE $TEMP_FILE $BACKUP_FILE" EXIT

# Create backup
cp "$FILE" "$BACKUP_FILE"

# Apply edit to temp file
if [ -z "$1" ]; then
    echo "Usage: $0 <edit-command>"
    exit 1
fi

# Execute edit command, writing to temp file
eval "$1" < "$FILE" > "$TEMP_FILE" || {
    echo "❌ Edit command failed"
    cp "$BACKUP_FILE" "$FILE"
    exit 1
}

# Verify temp file
if [ ! -s "$TEMP_FILE" ] || [ $(wc -l < "$TEMP_FILE") -lt 10 ]; then
    echo "❌ Edit resulted in invalid file"
    cp "$BACKUP_FILE" "$FILE"
    exit 1
fi

# Atomically replace
mv "$TEMP_FILE" "$FILE"

# Verify final file
if [ ! -s "$FILE" ] || [ $(wc -l < "$FILE") -lt 10 ]; then
    echo "❌ File is invalid after edit"
    cp "$BACKUP_FILE" "$FILE"
    exit 1
fi

echo "✅ File edited atomically"
rm -f "$BACKUP_FILE"











