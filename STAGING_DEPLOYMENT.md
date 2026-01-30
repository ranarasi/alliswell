# AllIsWell Staging Deployment Guide

This guide provides step-by-step instructions for deploying the AllIsWell database to staging environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Recommended)](#quick-start-recommended)
3. [Manual Step-by-Step Deployment](#manual-step-by-step-deployment)
4. [Database Scripts Reference](#database-scripts-reference)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Environment Setup

Ensure you have a `.env` file in the `backend/` directory with the following:

```env
DATABASE_URL=postgresql://username:password@host:port/database_name
JWT_SECRET=your-jwt-secret-key
PORT=3001
```

**Example for local staging:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/alliswell_staging
JWT_SECRET=your-staging-jwt-secret
PORT=3001
```

**Example for Railway/Render:**
```env
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
JWT_SECRET=your-staging-jwt-secret
PORT=3001
```

### 2. PostgreSQL Database

Ensure you have:
- PostgreSQL 12+ running
- Database created (e.g., `alliswell_staging`)
- Database credentials configured in `.env`

### 3. CSV Data File (Optional)

If seeding projects and PDM users:
- Place `manager-project.csv` in the project root directory
- Format: `name,email,customer` (with header row)

---

## Quick Start (Recommended)

### Option 1: All-in-One Deployment (With Data)

This runs migrations AND seeds all data:

```bash
cd backend
npm run db:deploy-staging
```

This will:
1. ✓ Run base schema
2. ✓ Run all numbered migrations
3. ✓ Create Admin and Practice Head users
4. ✓ Create PDM users from CSV
5. ✓ Create projects from CSV
6. ✓ Display all login credentials

**Output Example:**
```
═══════════════════════════════════════════════════════════
✓ STAGING DEPLOYMENT COMPLETED SUCCESSFULLY!
═══════════════════════════════════════════════════════════

📋 LOGIN CREDENTIALS FOR STAGING

System Users:
────────────────────────────────────────────────────────────
Admin:         admin@alliswell.com / admin123
Practice Head: head@alliswell.com / head123

PDM Users (password format: firstname123):
────────────────────────────────────────────────────────────
John Doe              john.doe@example.com                john123
Sarah Chen            sarah.chen@example.com              sarah123
...
```

### Option 2: Migrations Only (No Data)

If you just want to set up the schema:

```bash
cd backend
npm run db:migrate-all
```

Then seed data separately:

```bash
npm run db:seed-real    # Real data from CSV
# OR
npm run db:seed         # Test users only
```

---

## Manual Step-by-Step Deployment

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

Create/update `.env` file with your database credentials:

```bash
cp .env.example .env
# Edit .env with your staging database URL
```

### Step 3: Reset Database (Optional)

⚠️ **WARNING: This deletes all data!** Only use for clean slate deployments.

```bash
npm run db:reset
```

This drops all tables including:
- users
- projects
- weekly_status
- comments
- business_unit_heads
- project_values
- project_operations

### Step 4: Run Migrations

```bash
npm run db:migrate-all
```

This executes:
1. `schema.sql` - Base tables (users, projects, weekly_status, comments)
2. `002_add_project_contacts.sql` - Adds project_manager, business_unit_head columns
3. `003_add_project_description.sql` - Adds description column
4. `004_add_project_operations.sql` - Creates project_operations table
5. `005_add_project_values.sql` - Creates project_values table
6. `006_create_business_unit_heads.sql` - Creates business_unit_heads table
7. `007_add_more_business_unit_heads.sql` - Adds additional BU heads
8. `008_delete_non_vishal_projects.sql` - Data cleanup
9. `009_add_missing_dds.sql` - Adds missing delivery directors
10. `add_microsoft_sso.sql` - Adds Microsoft SSO support

### Step 5: Seed Data

**Option A: Full Data Seeding (from CSV)**

```bash
npm run db:seed-real
```

Creates:
- Admin user: `admin@alliswell.com` / `admin123`
- Practice Head: `head@alliswell.com` / `head123`
- PDM users from CSV with passwords `firstname123`
- Projects assigned to PDMs from CSV

**Option B: Test Users Only**

```bash
npm run db:seed
```

Creates only:
- Admin: `admin@alliswell.com` / `admin123`
- Practice Head: `head@alliswell.com` / `head123`
- Sample PDM: `pdm@alliswell.com` / `pdm123`

### Step 6: Verify Deployment

Test database connection:

```bash
npm run dev
```

Visit: `http://localhost:3001/api/health` (or your staging URL)

Test login with admin credentials.

---

## Database Scripts Reference

### NPM Scripts

| Script | Description | Use Case |
|--------|-------------|----------|
| `npm run db:deploy-staging` | All-in-one: migrations + full data seeding | **Recommended for staging** |
| `npm run db:migrate-all` | Run all migrations (schema + numbered migrations) | Schema setup only |
| `npm run db:migrate` | Run base schema only | Initial setup |
| `npm run db:seed-real` | Seed users + projects from CSV | Real data deployment |
| `npm run db:seed` | Seed test users only | Testing/development |
| `npm run db:reset` | Drop all tables ⚠️ DESTRUCTIVE | Clean slate deployment |

### Script Files

All scripts located in: `backend/src/database/`

| File | Purpose |
|------|---------|
| `deployStaging.ts` | All-in-one staging deployment |
| `runAllMigrations.ts` | Comprehensive migration runner |
| `migrate.ts` | Base schema runner |
| `seedRealData.ts` | Real data seeding from CSV |
| `seedUsers.ts` | Test user seeding |
| `resetDatabase.ts` | Database reset (drop all tables) |
| `schema.sql` | Base database schema |
| `migrations/*.sql` | Numbered migration files |

---

## Deployment Scenarios

### Scenario 1: Fresh Staging Environment

```bash
cd backend
npm install
npm run db:deploy-staging
npm run dev
```

### Scenario 2: Update Existing Staging with New Migration

```bash
cd backend
npm run db:migrate-all   # Runs all migrations (safe to re-run)
```

### Scenario 3: Reset and Redeploy Staging

```bash
cd backend
npm run db:reset
npm run db:deploy-staging
```

### Scenario 4: Deploy to Production-like Staging

```bash
cd backend
# Set production-like DATABASE_URL in .env
npm run db:migrate-all
npm run db:seed-real
```

---

## Troubleshooting

### Error: "Connection refused" or "connect ECONNREFUSED"

**Cause:** Cannot connect to PostgreSQL database

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # macOS
   brew services list | grep postgresql

   # Linux
   systemctl status postgresql
   ```

2. Check `.env` DATABASE_URL:
   ```bash
   cat backend/.env | grep DATABASE_URL
   ```

3. Test connection:
   ```bash
   psql $DATABASE_URL
   ```

### Error: "database does not exist"

**Cause:** Database not created

**Solution:**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE alliswell_staging;"

# Or using DATABASE_URL
createdb -U username database_name
```

### Error: "relation already exists"

**Cause:** Tables already exist, trying to re-run migrations

**Solution:**

This is usually safe to ignore. The scripts use `IF NOT EXISTS` and `ON CONFLICT` to handle existing objects.

If you need a clean slate:
```bash
npm run db:reset
npm run db:deploy-staging
```

### Error: "CSV file not found"

**Cause:** `manager-project.csv` not in project root

**Solution:**
```bash
# Place CSV file in project root
cp /path/to/manager-project.csv ./

# Or run without real data
npm run db:seed  # Test users only
```

### Migration fails on specific numbered migration

**Cause:** Migration has already been applied or conflicts with data

**Solution:**

The migration runner continues even if individual migrations fail. Check the error:
- If it's a duplicate/conflict error, it's safe to ignore
- If it's a syntax/logic error, fix the migration file and re-run

### Cannot drop tables (foreign key constraints)

**Cause:** Tables have dependencies

**Solution:**

Use the reset script which handles dependencies:
```bash
npm run db:reset
```

Or manually:
```bash
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## Security Notes

### Passwords

All seed scripts use default passwords (`admin123`, `head123`, `firstname123`)

⚠️ **IMPORTANT:**
- These are for STAGING only
- Change passwords immediately after first login in production
- Consider using environment variables for seed passwords
- Enable Microsoft SSO for production

### Database Access

- Never commit `.env` files to version control
- Use separate database credentials for staging and production
- Rotate database passwords regularly
- Restrict database access by IP whitelist

### CSV Data

- The `manager-project.csv` may contain real employee emails
- Ensure CSV file is in `.gitignore`
- Do not commit CSV files with real data to repository

---

## Advanced Usage

### Custom CSV Format

If your CSV has different columns, modify `backend/src/database/seedRealData.ts`:

```typescript
interface CSVRow {
  name: string;
  email: string;
  customer: string;
  // Add your custom columns here
}
```

### Adding Custom Seed Data

Create a new seed script:

```typescript
// backend/src/database/seedCustom.ts
import pool from './db';

async function seedCustomData() {
  // Your seeding logic here
}

seedCustomData();
```

Add to `package.json`:
```json
"scripts": {
  "db:seed-custom": "ts-node src/database/seedCustom.ts"
}
```

### Backup Before Reset

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Reset and redeploy
npm run db:reset
npm run db:deploy-staging

# Restore if needed
psql $DATABASE_URL < backup_20240101_120000.sql
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd backend && npm install

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
        run: cd backend && npm run db:migrate-all

      - name: Seed data (optional)
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
        run: cd backend && npm run db:seed-real
```

### Railway/Render Deploy Script

Add to your platform's build command:

```bash
cd backend && npm install && npm run db:migrate-all && npm run build
```

Start command:
```bash
cd backend && npm start
```

---

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review script output for specific error messages
3. Check database logs: `tail -f /var/log/postgresql/postgresql-*.log`
4. Verify environment variables: `echo $DATABASE_URL`

---

## Summary

**For most staging deployments, just run:**

```bash
cd backend
npm install
npm run db:deploy-staging
```

This handles everything and displays all credentials. Save the credentials output for team access.
