# AllIsWell - Data Migration Guide

This guide covers migrating your AllIsWell database from local development to AWS RDS PostgreSQL.

## 📊 Current Data Status

Based on the latest verification:

| Data Type | Count | Status |
|-----------|-------|--------|
| **Projects** | 108 | ✅ Ready |
| **Delivery Operations (2025)** | 612 records | ✅ Ready |
| **Delivery Directors (DDs)** | 14 users | ✅ Ready |
| **Business Unit Heads (BUHs)** | 13 users | ✅ Ready |
| **Weekly Status Updates** | Varies | ✅ Ready |

### Operations Data Breakdown (2025)

| Month | Records |
|-------|---------|
| January | 69 |
| February | 69 |
| March | 71 |
| April | 72 |
| May | 71 |
| June | 72 |
| July | 69 |
| August | 54 |
| September | 50 |
| October | 15 |

---

## 🚀 Migration Methods

Choose the method that best fits your needs:

### Method 1: Automated Scripts (Recommended)
**Best for:** Quick, reliable migration with verification
**Time:** ~5-10 minutes

### Method 2: Manual pg_dump/restore
**Best for:** Full control over the process
**Time:** ~10-15 minutes

### Method 3: Using psql Commands
**Best for:** Granular control, troubleshooting
**Time:** ~15-20 minutes

---

## Method 1: Automated Scripts (Recommended)

### Prerequisites

- AWS RDS PostgreSQL instance created and running
- RDS security group allows your IP address
- PostgreSQL client tools installed (`psql`, `pg_dump`)
- Network connectivity to RDS

### Step 1: Export Local Database

```bash
cd backend/scripts

# Make scripts executable
chmod +x export_data.sh import_data_to_aws.sh

# Run export
./export_data.sh
```

**Output:**
- `data_export/alliswell_full_dump_YYYYMMDD_HHMMSS.sql` - Complete backup
- `data_export/schema_only_YYYYMMDD_HHMMSS.sql` - Schema only
- `data_export/data_only_YYYYMMDD_HHMMSS.sql` - Data only
- `data_export/summary_YYYYMMDD_HHMMSS.txt` - Verification report
- `data_export/alliswell_export_YYYYMMDD_HHMMSS.tar.gz` - Compressed archive

### Step 2: Review Export

```bash
# Check the summary report
cat data_export/summary_*.txt

# Verify table counts match expectations:
# - 108 projects
# - 14 users (DDs)
# - 13 business unit heads
# - 612 project operations (2025)
```

### Step 3: Import to AWS RDS

```bash
cd backend/scripts

# Set RDS credentials
export RDS_HOST=your-rds-endpoint.rds.amazonaws.com
export RDS_PASSWORD=your-rds-password
export RDS_USER=admin
export RDS_DB=alliswell

# Run import
./import_data_to_aws.sh
```

The script will:
1. Test RDS connection
2. Create database if needed
3. Import schema
4. Import data
5. Verify import with counts

### Step 4: Verify Migration

```bash
# Connect to RDS
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U admin \
     -d alliswell

# Run verification queries
SELECT COUNT(*) FROM projects;  -- Should be 108
SELECT COUNT(*) FROM users WHERE role = 'PDM';  -- Should be 14
SELECT COUNT(*) FROM business_unit_heads;  -- Should be 13
SELECT COUNT(*) FROM project_operations WHERE year = 2025;  -- Should be 612
```

---

## Method 2: Manual pg_dump/restore

### Step 1: Create Full Database Dump

```bash
# Export from local database
pg_dump -h localhost \
        -U ramesh \
        -d alliswell \
        --clean \
        --if-exists \
        --file=alliswell_backup.sql
```

### Step 2: Transfer to AWS Environment

If deploying from a different machine:

```bash
# Upload to S3
aws s3 cp alliswell_backup.sql s3://your-bucket/database-backups/

# Or SCP to EC2 instance
scp alliswell_backup.sql ec2-user@your-ec2-instance:/tmp/
```

### Step 3: Import to RDS

```bash
# From your local machine or EC2 instance
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U admin \
     -d alliswell \
     -f alliswell_backup.sql
```

---

## Method 3: Schema + Data Separately

### Step 1: Export Schema

```bash
# Export schema only
pg_dump -h localhost \
        -U ramesh \
        -d alliswell \
        --schema-only \
        --file=schema.sql
```

### Step 2: Export Data in Order

```bash
# Export tables in dependency order
pg_dump -h localhost -U ramesh -d alliswell \
        --data-only \
        --table=users \
        --file=users_data.sql

pg_dump -h localhost -U ramesh -d alliswell \
        --data-only \
        --table=business_unit_heads \
        --file=buh_data.sql

pg_dump -h localhost -U ramesh -d alliswell \
        --data-only \
        --table=projects \
        --file=projects_data.sql

pg_dump -h localhost -U ramesh -d alliswell \
        --data-only \
        --table=project_operations \
        --file=operations_data.sql

pg_dump -h localhost -U ramesh -d alliswell \
        --data-only \
        --table=project_values \
        --file=values_data.sql

pg_dump -h localhost -U ramesh -d alliswell \
        --data-only \
        --table=weekly_status \
        --file=status_data.sql
```

### Step 3: Import to RDS

```bash
# Set connection details
RDS_HOST="your-rds-endpoint.rds.amazonaws.com"
RDS_USER="admin"
RDS_DB="alliswell"

# Import schema
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f schema.sql

# Import data in order
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f users_data.sql
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f buh_data.sql
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f projects_data.sql
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f operations_data.sql
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f values_data.sql
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -f status_data.sql
```

---

## 🔍 Verification Checklist

After migration, verify all data:

### 1. Table Counts

```sql
-- Connect to RDS
psql -h your-rds-endpoint.rds.amazonaws.com -U admin -d alliswell

-- Run verification queries
SELECT
  'users' as table_name,
  COUNT(*) as count,
  '14 (DDs + Admin)' as expected
FROM users
UNION ALL
SELECT
  'business_unit_heads',
  COUNT(*),
  '13'
FROM business_unit_heads
UNION ALL
SELECT
  'projects',
  COUNT(*),
  '108'
FROM projects
UNION ALL
SELECT
  'project_operations (2025)',
  COUNT(*),
  '612'
FROM project_operations
WHERE year = 2025
UNION ALL
SELECT
  'project_values',
  COUNT(*),
  'varies'
FROM project_values
UNION ALL
SELECT
  'weekly_status',
  COUNT(*),
  'varies'
FROM weekly_status;
```

### 2. Data Integrity

```sql
-- Check all projects have assigned DDs
SELECT COUNT(*) as projects_with_dd
FROM projects
WHERE assigned_pdm IS NOT NULL;
-- Should be 108

-- Check projects with BUH assigned
SELECT COUNT(*) as projects_with_buh
FROM projects
WHERE business_unit_head IS NOT NULL;
-- Should be 84 (24 are missing BUH by design)

-- Check operations data completeness
SELECT
  month,
  COUNT(*) as records
FROM project_operations
WHERE year = 2025
GROUP BY month
ORDER BY month;
-- Should match the breakdown above
```

### 3. Relationships

```sql
-- Verify project-DD relationships
SELECT
  u.name as dd_name,
  COUNT(p.id) as project_count
FROM users u
LEFT JOIN projects p ON u.id = p.assigned_pdm
WHERE u.role = 'PDM'
GROUP BY u.name
ORDER BY project_count DESC;

-- Check for orphaned records
SELECT COUNT(*) as orphaned_operations
FROM project_operations po
LEFT JOIN projects p ON po.project_id = p.id
WHERE p.id IS NULL;
-- Should be 0
```

### 4. Sample Data

```sql
-- View sample projects
SELECT
  p.name,
  p.client,
  p.status,
  u.name as dd_name,
  p.business_unit_head
FROM projects p
LEFT JOIN users u ON p.assigned_pdm = u.id
LIMIT 10;

-- View sample operations data
SELECT
  p.name,
  po.month,
  po.team_size,
  po.revenue,
  po.gm_percentage
FROM project_operations po
JOIN projects p ON po.project_id = p.id
WHERE po.year = 2025
ORDER BY p.name, po.month
LIMIT 10;
```

---

## 🚨 Troubleshooting

### Issue 1: Connection Refused

**Symptoms:** Cannot connect to RDS
**Causes:**
- Security group doesn't allow your IP
- Wrong endpoint
- Wrong credentials

**Solutions:**
```bash
# Check security group in AWS Console
# EC2 > Security Groups > Your RDS security group
# Add inbound rule: PostgreSQL (5432) from Your IP

# Test connection
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U admin \
     -d postgres \
     -c "SELECT version();"
```

### Issue 2: Permission Denied

**Symptoms:** "permission denied for table" errors
**Causes:**
- RDS user doesn't have required permissions
- Wrong database

**Solutions:**
```sql
-- Connect as admin user
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE alliswell TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
```

### Issue 3: Duplicate Key Violations

**Symptoms:** "duplicate key value violates unique constraint"
**Causes:**
- Data already exists in RDS
- Import run multiple times

**Solutions:**
```bash
# Option 1: Drop and recreate database
psql -h $RDS_HOST -U $RDS_USER -d postgres <<EOF
DROP DATABASE IF EXISTS alliswell;
CREATE DATABASE alliswell;
EOF

# Option 2: Use --clean flag in pg_dump
pg_dump --clean --if-exists ...
```

### Issue 4: Foreign Key Violations

**Symptoms:** "violates foreign key constraint"
**Causes:**
- Importing tables in wrong order
- Missing referenced data

**Solutions:**
```bash
# Import full dump instead of individual tables
# Or disable constraints temporarily:
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB <<EOF
-- Disable constraints
SET session_replication_role = 'replica';

-- Import data here

-- Re-enable constraints
SET session_replication_role = 'origin';
EOF
```

---

## 📋 Post-Migration Steps

### 1. Update Backend Configuration

Update `/backend/.env` with RDS details:

```bash
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_NAME=alliswell
DB_USER=admin
DB_PASSWORD=your-rds-password
DB_PORT=5432
DB_SSL_REJECT_UNAUTHORIZED=true
NODE_ENV=production
```

### 2. Test Backend Connection

```bash
cd backend
npm run dev

# Check logs for:
# "Connected to PostgreSQL database"
```

### 3. Test API Endpoints

```bash
# Health check
curl https://your-backend-url/health

# Login
curl -X POST https://your-backend-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Get projects
curl https://your-backend-url/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Backup RDS

```bash
# Create manual snapshot in AWS Console
# RDS > Databases > Your DB > Actions > Take snapshot

# Or via CLI
aws rds create-db-snapshot \
  --db-instance-identifier alliswell-db \
  --db-snapshot-identifier alliswell-initial-import-$(date +%Y%m%d)
```

---

## 🔒 Security Best Practices

### 1. Protect Database Credentials

```bash
# Never commit credentials to git
echo ".env" >> .gitignore

# Use AWS Secrets Manager for production
aws secretsmanager create-secret \
  --name alliswell/rds/password \
  --secret-string "your-rds-password"
```

### 2. Restrict RDS Access

- Set RDS to private subnet (no public access)
- Use VPC peering or VPN for access
- Only allow backend security group to access RDS

### 3. Enable Encryption

- Enable encryption at rest for RDS
- Enable SSL/TLS for connections
- Use AWS KMS for key management

### 4. Regular Backups

```bash
# Automated backups (set in RDS console)
# Retention: 7-30 days
# Backup window: Off-peak hours

# Manual snapshots before major changes
aws rds create-db-snapshot \
  --db-instance-identifier alliswell-db \
  --db-snapshot-identifier alliswell-pre-deployment-$(date +%Y%m%d)
```

---

## 📊 Migration Summary

Your database is now ready for AWS deployment with:

✅ **108 Projects** - All account data loaded
✅ **612 Operations Records** - Full 2025 data (Jan-Oct)
✅ **14 Delivery Directors** - Complete DD master data
✅ **13 Business Unit Heads** - Complete BUH master data
✅ **Migration Scripts** - Automated export/import tools
✅ **Verification Queries** - Data integrity checks

### Next Steps

1. Follow AWS_DEPLOYMENT_GUIDE.md for infrastructure setup
2. Use export_data.sh to backup current data
3. Use import_data_to_aws.sh to migrate to RDS
4. Update backend .env with RDS credentials
5. Deploy backend and frontend
6. Run verification queries
7. Test application end-to-end

---

## 🆘 Need Help?

If you encounter issues:

1. Check CloudWatch Logs for errors
2. Verify RDS endpoint and credentials
3. Test direct psql connection to RDS
4. Review security group rules
5. Check the summary report from export script

For detailed AWS setup instructions, see:
- `AWS_DEPLOYMENT_GUIDE.md`
- `POST_DEPLOYMENT_CONFIG.md`
- `CONFIG_QUICK_REFERENCE.md`
