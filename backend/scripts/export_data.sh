#!/bin/bash

# Export Data Script for AllIsWell Application
# This script exports all data from the local database for migration to AWS

set -e

echo "=================================================="
echo "AllIsWell - Data Export Script"
echo "=================================================="

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-alliswell}"
DB_USER="${DB_USER:-ramesh}"
EXPORT_DIR="./data_export"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create export directory
mkdir -p "$EXPORT_DIR"

echo ""
echo "Export Configuration:"
echo "  Database: $DB_NAME"
echo "  Host: $DB_HOST"
echo "  User: $DB_USER"
echo "  Export Dir: $EXPORT_DIR"
echo ""

# Export full database dump (schema + data)
echo "📦 Exporting full database dump..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --file="$EXPORT_DIR/alliswell_full_dump_$TIMESTAMP.sql" \
  --clean --if-exists --create
echo "✓ Full dump: $EXPORT_DIR/alliswell_full_dump_$TIMESTAMP.sql"

# Export schema only
echo ""
echo "📋 Exporting schema only..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --schema-only \
  --file="$EXPORT_DIR/schema_only_$TIMESTAMP.sql"
echo "✓ Schema: $EXPORT_DIR/schema_only_$TIMESTAMP.sql"

# Export data only (for clean imports)
echo ""
echo "📊 Exporting data only..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --data-only \
  --file="$EXPORT_DIR/data_only_$TIMESTAMP.sql"
echo "✓ Data: $EXPORT_DIR/data_only_$TIMESTAMP.sql"

# Export each table separately for granular control
echo ""
echo "📑 Exporting individual tables..."

TABLES=(
  "users"
  "business_unit_heads"
  "projects"
  "project_operations"
  "project_values"
  "weekly_status"
)

for table in "${TABLES[@]}"; do
  echo "  - Exporting $table..."
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --table="$table" --data-only \
    --file="$EXPORT_DIR/${table}_$TIMESTAMP.sql"
done

echo "✓ Individual tables exported"

# Generate summary report
echo ""
echo "📊 Generating summary report..."

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$EXPORT_DIR/summary_$TIMESTAMP.txt" <<EOF
\echo '=================================================='
\echo 'Database Summary Report'
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
\echo 'Operations Data by Month (2025):'
\echo '---------------------------------'
SELECT
  month,
  COUNT(*) as records
FROM project_operations
WHERE year = 2025
GROUP BY month
ORDER BY month;
EOF

echo "✓ Summary: $EXPORT_DIR/summary_$TIMESTAMP.txt"

# Create a compressed archive
echo ""
echo "🗜️  Creating compressed archive..."
tar -czf "$EXPORT_DIR/alliswell_export_$TIMESTAMP.tar.gz" \
  -C "$EXPORT_DIR" \
  "alliswell_full_dump_$TIMESTAMP.sql" \
  "schema_only_$TIMESTAMP.sql" \
  "data_only_$TIMESTAMP.sql" \
  "summary_$TIMESTAMP.txt" \
  users_$TIMESTAMP.sql \
  business_unit_heads_$TIMESTAMP.sql \
  projects_$TIMESTAMP.sql \
  project_operations_$TIMESTAMP.sql \
  project_values_$TIMESTAMP.sql \
  weekly_status_$TIMESTAMP.sql

echo "✓ Archive: $EXPORT_DIR/alliswell_export_$TIMESTAMP.tar.gz"

echo ""
echo "=================================================="
echo "✅ Export Complete!"
echo "=================================================="
echo ""
echo "Exported files:"
echo "  - Full dump: alliswell_full_dump_$TIMESTAMP.sql"
echo "  - Schema only: schema_only_$TIMESTAMP.sql"
echo "  - Data only: data_only_$TIMESTAMP.sql"
echo "  - Individual tables: *_$TIMESTAMP.sql"
echo "  - Summary report: summary_$TIMESTAMP.txt"
echo "  - Compressed archive: alliswell_export_$TIMESTAMP.tar.gz"
echo ""
echo "Next steps:"
echo "  1. Review the summary report"
echo "  2. Upload the archive to AWS (S3 or direct to RDS)"
echo "  3. Run import_data.sh on your AWS environment"
echo ""
