# Database Scripts - Quick Reference Card

## 🚀 Quick Start

```bash
cd backend
./deploy-staging.sh    # Interactive menu (RECOMMENDED)
# OR
npm run db:deploy-staging    # One command deployment
```

---

## 📋 Available Commands

### NPM Scripts

```bash
# Full deployment (migrations + data)
npm run db:deploy-staging      # ⭐ RECOMMENDED FOR STAGING

# Migrations only
npm run db:migrate-all         # Run all migrations
npm run db:migrate             # Run base schema only

# Data seeding
npm run db:seed-real           # Real data from CSV
npm run db:seed                # Test users only

# Database reset
npm run db:reset               # ⚠️ Drop all tables (DESTRUCTIVE)
```

### Shell Script (Interactive)

```bash
cd backend
./deploy-staging.sh
```

Options:
1. Full Deployment (migrations + data) ⭐ Recommended
2. Migrations Only
3. Reset Database ⚠️ Destructive
4. Reset + Full Deployment
5. Seed Data Only
6. Exit

---

## 📁 Script Files Location

All files in: `backend/src/database/`

| File | Purpose |
|------|---------|
| `deployStaging.ts` | ⭐ All-in-one staging deployment |
| `runAllMigrations.ts` | Run all migrations in order |
| `migrate.ts` | Run base schema only |
| `seedRealData.ts` | Seed users + projects from CSV |
| `seedUsers.ts` | Seed test users |
| `resetDatabase.ts` | Drop all tables |
| `schema.sql` | Base database schema |
| `migrations/*.sql` | Numbered migration files |

---

## 🎯 Common Scenarios

### Scenario 1: Fresh Staging Setup

```bash
cd backend
npm run db:deploy-staging
```

Output: Complete credentials list

### Scenario 2: Update Schema Only

```bash
cd backend
npm run db:migrate-all
```

### Scenario 3: Reset Everything

```bash
cd backend
npm run db:reset
npm run db:deploy-staging
```

### Scenario 4: Add Missing Data

```bash
cd backend
npm run db:seed-real    # With CSV file
# OR
npm run db:seed         # Test users only
```

---

## 🔑 Default Credentials (Staging)

Created by seed scripts:

```
Admin:         admin@alliswell.com / admin123
Practice Head: head@alliswell.com / head123
PDMs:          {email} / {firstname}123
```

Example PDM:
- Name: Sarah Chen
- Email: sarah.chen@example.com
- Password: sarah123

---

## 📦 What Gets Created

### Tables

1. **users** - All user accounts (Admin, Practice Head, PDMs)
2. **projects** - Project master data
3. **weekly_status** - Status submissions
4. **comments** - Comments on status (optional)
5. **business_unit_heads** - BU head master data
6. **project_values** - Project value tracking
7. **project_operations** - Operations data

### Indexes

- users(email)
- projects(status, assigned_pdm)
- weekly_status(project_id, week_ending_date, overall_status)
- business_unit_heads(email, is_active)

---

## ⚙️ Prerequisites

### 1. Environment File

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-jwt-secret
PORT=3001
```

### 2. CSV File (Optional)

For real data seeding, place `manager-project.csv` in project root:

```csv
name,email,customer
John Doe,john.doe@example.com,Acme Corp
Sarah Chen,sarah.chen@example.com,TechStart Inc
```

### 3. Dependencies

```bash
cd backend
npm install
```

---

## 🛠 Migration Order

Executed automatically by `db:deploy-staging` or `db:migrate-all`:

1. `schema.sql` - Base tables
2. `002_add_project_contacts.sql` - PM & BU head columns
3. `003_add_project_description.sql` - Description field
4. `004_add_project_operations.sql` - Operations table
5. `005_add_project_values.sql` - Values table
6. `006_create_business_unit_heads.sql` - BU heads table
7. `007_add_more_business_unit_heads.sql` - Additional BU heads
8. `008_delete_non_vishal_projects.sql` - Data cleanup
9. `009_add_missing_dds.sql` - Missing DDs
10. `add_microsoft_sso.sql` - Microsoft SSO support

---

## ⚠️ Important Notes

### Safety

- `db:reset` is DESTRUCTIVE - only use in staging/dev
- Reset script checks for "production" or "prod" in DATABASE_URL
- Always backup before destructive operations

### CSV Format

```csv
name,email,customer
```

- Header row required
- Supports quoted fields for commas in values
- PDM password generated as: `{firstname}123`

### Migrations

- All migrations are idempotent (safe to re-run)
- Use `IF NOT EXISTS` and `ON CONFLICT` clauses
- Failed migrations logged but don't stop execution

---

## 🐛 Troubleshooting

### "Connection refused"
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Test connection
psql $DATABASE_URL
```

### "Database does not exist"
```bash
createdb -U postgres alliswell_staging
```

### "CSV file not found"
```bash
# Place in project root
cp /path/to/manager-project.csv ./alliswell/
```

### "Relation already exists"
- Safe to ignore (scripts handle existing objects)
- Or reset: `npm run db:reset`

---

## 📊 Verify Deployment

### 1. Check Database

```bash
psql $DATABASE_URL

\dt              # List tables
\d users         # Describe users table
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM projects;
```

### 2. Test Backend

```bash
cd backend
npm run dev
```

Visit: `http://localhost:3001/api/health`

### 3. Test Login

Use admin credentials to login via frontend or API:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alliswell.com","password":"admin123"}'
```

---

## 📞 Need Help?

See full documentation: `STAGING_DEPLOYMENT.md`

---

## 🎉 Success Checklist

After running `npm run db:deploy-staging`:

- [✓] All migrations completed
- [✓] Admin user created
- [✓] Practice Head user created
- [✓] PDM users created (if CSV provided)
- [✓] Projects created (if CSV provided)
- [✓] All credentials displayed
- [✓] Backend starts successfully
- [✓] Can login with admin credentials

---

**Most Common Command:**

```bash
cd backend && npm run db:deploy-staging
```

This handles everything. Save the credentials output!
