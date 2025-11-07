#!/bin/bash

# Import Data Script for AWS RDS
# This script imports data into AWS RDS PostgreSQL instance

set -e

echo "=================================================="
echo "AllIsWell - AWS RDS Data Import Script"
echo "=================================================="

# Configuration - Override these with environment variables
RDS_HOST="${RDS_HOST:-your-rds-endpoint.rds.amazonaws.com}"
RDS_PORT="${RDS_PORT:-5432}"
RDS_DB="${RDS_DB:-alliswell}"
RDS_USER="${RDS_USER:-admin}"
# RDS_PASSWORD should be set as environment variable
IMPORT_DIR="${IMPORT_DIR:-./data_export}"

# Check required variables
if [ "$RDS_HOST" = "your-rds-endpoint.rds.amazonaws.com" ]; then
  echo "❌ ERROR: RDS_HOST not set!"
  echo "Please set environment variables:"
  echo "  export RDS_HOST=your-rds-endpoint.rds.amazonaws.com"
  echo "  export RDS_PASSWORD=your-rds-password"
  exit 1
fi

if [ -z "$RDS_PASSWORD" ]; then
  echo "❌ ERROR: RDS_PASSWORD not set!"
  echo "Please set: export RDS_PASSWORD=your-rds-password"
  exit 1
fi

export PGPASSWORD="$RDS_PASSWORD"

echo ""
echo "Import Configuration:"
echo "  RDS Host: $RDS_HOST"
echo "  RDS Port: $RDS_PORT"
echo "  Database: $RDS_DB"
echo "  User: $RDS_USER"
echo "  Import Dir: $IMPORT_DIR"
echo ""

# Test connection
echo "🔌 Testing RDS connection..."
if psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d postgres -c "SELECT 1" > /dev/null 2>&1; then
  echo "✓ Connection successful"
else
  echo "❌ Connection failed!"
  echo "Please check:"
  echo "  1. RDS endpoint is correct"
  echo "  2. Security group allows your IP"
  echo "  3. RDS credentials are correct"
  exit 1
fi

# Create database if it doesn't exist
echo ""
echo "📊 Creating database if not exists..."
psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d postgres <<EOF
SELECT 'CREATE DATABASE $RDS_DB'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$RDS_DB')\gexec
EOF
echo "✓ Database ready"

# Find the latest export files
echo ""
echo "📂 Looking for export files in $IMPORT_DIR..."

LATEST_SCHEMA=$(ls -t "$IMPORT_DIR"/schema_only_*.sql 2>/dev/null | head -1)
LATEST_DATA=$(ls -t "$IMPORT_DIR"/data_only_*.sql 2>/dev/null | head -1)
LATEST_FULL=$(ls -t "$IMPORT_DIR"/alliswell_full_dump_*.sql 2>/dev/null | head -1)

if [ -z "$LATEST_SCHEMA" ] && [ -z "$LATEST_FULL" ]; then
  echo "❌ No export files found!"
  echo "Please run export_data.sh first or extract the archive."
  exit 1
fi

# Option 1: Import full dump (includes schema + data)
if [ -n "$LATEST_FULL" ]; then
  echo ""
  echo "📦 Found full dump: $(basename "$LATEST_FULL")"
  read -p "Import full dump? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⏳ Importing full dump..."
    psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" \
      -f "$LATEST_FULL" \
      --quiet \
      2>&1 | grep -v "NOTICE:" | grep -v "DROP" | grep -v "CREATE" || true
    echo "✓ Full dump imported"

    # Verify import
    echo ""
    echo "📊 Verifying data..."
    psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" <<EOF
\echo 'Table Counts:'
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'Business Unit Heads', COUNT(*) FROM business_unit_heads
UNION ALL SELECT 'Projects', COUNT(*) FROM projects
UNION ALL SELECT 'Project Operations', COUNT(*) FROM project_operations
UNION ALL SELECT 'Weekly Status', COUNT(*) FROM weekly_status;
EOF

    echo ""
    echo "✅ Import complete!"
    unset PGPASSWORD
    exit 0
  fi
fi

# Option 2: Import schema + data separately
echo ""
echo "📋 Importing schema..."
if [ -n "$LATEST_SCHEMA" ]; then
  psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" \
    -f "$LATEST_SCHEMA" \
    --quiet \
    2>&1 | grep -v "NOTICE:" | grep -v "DROP" | grep -v "CREATE" || true
  echo "✓ Schema imported: $(basename "$LATEST_SCHEMA")"
else
  echo "⚠️  No schema file found, assuming schema exists..."
fi

# Import data
echo ""
echo "📊 Importing data..."
if [ -n "$LATEST_DATA" ]; then
  psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" \
    -f "$LATEST_DATA" \
    --quiet \
    2>&1 | grep -v "NOTICE:" | grep -v "INSERT" || true
  echo "✓ Data imported: $(basename "$LATEST_DATA")"
else
  echo "❌ No data file found!"
  unset PGPASSWORD
  exit 1
fi

# Verify import
echo ""
echo "📊 Verifying imported data..."
psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" <<EOF
\echo ''
\echo '=================================================='
\echo 'Import Verification Report'
\echo '=================================================='
\echo ''
\echo 'Table Counts:'
\echo '-------------'
SELECT
  'Users' as table_name,
  COUNT(*) as count
FROM users
UNION ALL
SELECT
  'Business Unit Heads',
  COUNT(*)
FROM business_unit_heads
UNION ALL
SELECT
  'Projects',
  COUNT(*)
FROM projects
UNION ALL
SELECT
  'Project Operations (2025)',
  COUNT(*)
FROM project_operations
WHERE year = 2025
UNION ALL
SELECT
  'Project Values',
  COUNT(*)
FROM project_values
UNION ALL
SELECT
  'Weekly Status',
  COUNT(*)
FROM weekly_status;

\echo ''
\echo 'Projects by Delivery Director:'
\echo '------------------------------'
SELECT
  u.name as dd_name,
  COUNT(p.id) as project_count
FROM users u
LEFT JOIN projects p ON u.id = p.assigned_pdm
WHERE u.role = 'PDM'
GROUP BY u.name
ORDER BY project_count DESC;

\echo ''
\echo 'Sample Projects:'
\echo '----------------'
SELECT name, client, status
FROM projects
LIMIT 5;
EOF

echo ""
echo "=================================================="
echo "✅ Import Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "  1. Verify the data above matches your local database"
echo "  2. Test your backend connection to RDS"
echo "  3. Test your application endpoints"
echo ""

# Clean up
unset PGPASSWORD
