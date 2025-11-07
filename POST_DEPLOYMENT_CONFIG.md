# Post-Deployment Configuration Checklist

This document lists all configuration files, environment variables, and values that need to be updated after deploying to AWS.

---

## 🔴 CRITICAL - Must Update Before Deployment

### 1. Backend Environment Variables (.env)

**File Location:** `/backend/.env`

```bash
# ============================================================================
# DATABASE CONFIGURATION - CRITICAL
# ============================================================================
DB_HOST=your-rds-endpoint.rds.amazonaws.com
# ☝️ REPLACE WITH: Your RDS endpoint from AWS Console
# Find it: RDS > Databases > alliswell-db > Connectivity & security > Endpoint

DB_NAME=alliswell
# ☝️ Usually keep as 'alliswell' (or change if you used different name)

DB_USER=admin
# ☝️ REPLACE WITH: The master username you set when creating RDS

DB_PASSWORD=your-secure-password
# ☝️ REPLACE WITH: The master password you set when creating RDS
# ⚠️  NEVER commit this to git!

DB_PORT=5432
# ☝️ Keep as 5432 (default PostgreSQL port)

# ============================================================================
# SSL CONFIGURATION - CRITICAL FOR PRODUCTION
# ============================================================================
DB_SSL_REJECT_UNAUTHORIZED=true
# ☝️ Keep as 'true' for AWS RDS (it uses valid SSL certificates)
# Only set to 'false' if using self-signed certificates (not recommended)

# ============================================================================
# JWT SECURITY - CRITICAL
# ============================================================================
JWT_SECRET=ZQ1XEjRkgDcRvASvjUNHmyoI7UTP1gKmpUN1oCTTarM=
# ☝️ REPLACE WITH: A new strong secret key
# Generate using: openssl rand -base64 32
# ⚠️  NEVER use the default value in production!
# ⚠️  NEVER commit this to git!

JWT_EXPIRES_IN=7d
# ☝️ Keep as '7d' or change based on your security requirements
# Options: 1h, 24h, 7d, 30d

# ============================================================================
# CORS CONFIGURATION - CRITICAL
# ============================================================================
FRONTEND_URL=http://localhost:3000
# ☝️ REPLACE WITH: Your production frontend URL
# Examples:
#   - https://yourdomain.com
#   - https://alliswell.yourcompany.com
#   - https://your-cloudfront-id.cloudfront.net

# ============================================================================
# SERVER CONFIGURATION
# ============================================================================
NODE_ENV=production
# ☝️ MUST be 'production' for AWS deployment

PORT=3001
# ☝️ Keep as 3001 (or change if using different port)
# Note: Elastic Beanstalk uses port 8080 by default
```

---

### 2. Frontend Environment Variables (.env.production)

**File Location:** `/frontend/.env.production`

```bash
# ============================================================================
# API CONFIGURATION - CRITICAL
# ============================================================================
NEXT_PUBLIC_API_URL=http://localhost:3001/api
# ☝️ REPLACE WITH: Your production backend URL
# Examples:
#   - https://api.yourdomain.com/api
#   - https://your-alb-endpoint.us-east-1.elb.amazonaws.com/api
#   - https://your-eb-env.elasticbeanstalk.com/api
# ⚠️  Must include '/api' at the end!
# ⚠️  Use HTTPS in production!
```

---

## 🟡 IMPORTANT - Update for Full Functionality

### 3. Microsoft Azure AD (SSO) - Optional but Recommended

**File Location:** `/backend/.env`

```bash
# ============================================================================
# MICROSOFT AZURE AD CONFIGURATION - OPTIONAL
# ============================================================================
AZURE_AD_CLIENT_ID=your-application-client-id
# ☝️ REPLACE WITH: Application (client) ID from Azure Portal
# Find it: Azure Portal > App registrations > Your app > Overview

AZURE_AD_CLIENT_SECRET=your-client-secret-value
# ☝️ REPLACE WITH: Client secret from Azure Portal
# Find it: Azure Portal > App registrations > Your app > Certificates & secrets
# ⚠️  NEVER commit this to git!

AZURE_AD_TENANT_ID=your-tenant-id
# ☝️ REPLACE WITH: Directory (tenant) ID from Azure Portal
# Find it: Azure Portal > App registrations > Your app > Overview

AZURE_AD_REDIRECT_URI=http://localhost:3001/api/auth/microsoft/callback
# ☝️ REPLACE WITH: Your production callback URL
# Example: https://api.yourdomain.com/api/auth/microsoft/callback
# ⚠️  Must match the redirect URI configured in Azure Portal!
```

---

### 4. Database Connection Pool Settings

**File Location:** `/backend/.env`

```bash
# ============================================================================
# DATABASE POOL CONFIGURATION - TUNE FOR YOUR LOAD
# ============================================================================
DB_POOL_MAX=20
# ☝️ Maximum number of database connections
# Recommended values:
#   - Small app (< 100 users): 10-20
#   - Medium app (100-1000 users): 20-50
#   - Large app (> 1000 users): 50-100
# ⚠️  Don't exceed your RDS max_connections limit!

DB_POOL_MIN=2
# ☝️ Minimum number of idle connections
# Recommended: 2-5

DB_IDLE_TIMEOUT=30000
# ☝️ Time (ms) before idle connection is closed
# Recommended: 30000 (30 seconds)

DB_CONNECTION_TIMEOUT=10000
# ☝️ Time (ms) to wait for new connection
# Recommended: 10000 (10 seconds)
```

---

## 🟢 OPTIONAL - Enhance Your Deployment

### 5. AWS-Specific Configurations

#### Elastic Beanstalk Configuration

**File Location:** `/.elasticbeanstalk/config.yml` (created during `eb init`)

```yaml
branch-defaults:
  main:
    environment: alliswell-backend-prod
    group_suffix: null
global:
  application_name: alliswell-backend
  branch: null
  default_ec2_keyname: your-key-pair
  # ☝️ REPLACE WITH: Your EC2 key pair name

  default_platform: Node.js 18
  default_region: us-east-1
  # ☝️ REPLACE WITH: Your preferred AWS region

  include_git_submodules: true
  instance_profile: null
  platform_name: null
  platform_version: null
  profile: null
  repository: null
  sc: git
  workspace_type: Application
```

#### Environment Properties (Set via EB CLI or Console)

```bash
# Set via command line:
eb setenv \
  NODE_ENV=production \
  DB_HOST=your-rds-endpoint.rds.amazonaws.com \
  DB_NAME=alliswell \
  DB_USER=admin \
  DB_PASSWORD=your-password \
  JWT_SECRET=your-jwt-secret \
  FRONTEND_URL=https://yourdomain.com \
  DB_SSL_REJECT_UNAUTHORIZED=true

# Or set via AWS Console:
# Elastic Beanstalk > Environments > Your environment > Configuration >
# Software > Environment properties
```

---

### 6. AWS RDS Configuration

**Settings to verify in RDS Console:**

1. **Public Accessibility**: `No` (recommended for security)
2. **VPC Security Groups**: Configure to allow access from your backend servers
3. **Backup Retention**: `7 days` (minimum recommended)
4. **Encryption**: `Enabled` (use AWS KMS)
5. **Parameter Group**:
   - `max_connections`: Based on your instance size
   - `shared_buffers`: 25% of available RAM

---

### 7. CloudFront Configuration

**Settings to configure in CloudFront Console:**

```yaml
# Distribution Settings
Alternate Domain Names (CNAMEs):
  - yourdomain.com
  - www.yourdomain.com
  # ☝️ REPLACE WITH: Your actual domain names

SSL Certificate:
  - Custom SSL Certificate (from ACM)
  # ☝️ SELECT: Your ACM certificate for your domain

Default Root Object: index.html

Error Pages:
  - 403: /index.html (for SPA routing)
  - 404: /index.html (for SPA routing)

Origins:
  - S3 Bucket: alliswell-frontend-prod.s3.amazonaws.com
  # ☝️ REPLACE WITH: Your actual S3 bucket name
```

---

### 8. Route 53 DNS Configuration

**Records to create:**

```yaml
# Frontend (CloudFront)
Type: A
Name: yourdomain.com
# ☝️ REPLACE WITH: Your domain
Value: Alias to CloudFront distribution
# ☝️ SELECT: Your CloudFront distribution

# Backend API (ALB/ELB)
Type: A
Name: api.yourdomain.com
# ☝️ REPLACE WITH: Your API subdomain
Value: Alias to Application Load Balancer
# ☝️ SELECT: Your ALB or EB environment URL

# Optional: www redirect
Type: CNAME
Name: www.yourdomain.com
Value: yourdomain.com
```

---

## 📋 Configuration File Checklist

### Files to Create/Update:

- [ ] **Backend**
  - [ ] `/backend/.env` (from .env.example)
  - [ ] `/backend/.elasticbeanstalk/config.yml` (if using EB)

- [ ] **Frontend**
  - [ ] `/frontend/.env.production` (from .env.local.example)

- [ ] **AWS Console**
  - [ ] RDS database credentials
  - [ ] Security groups (RDS, EC2, ALB)
  - [ ] ACM SSL certificates
  - [ ] CloudFront distribution settings
  - [ ] Route 53 DNS records
  - [ ] Elastic Beanstalk environment variables

---

## 🔐 Secrets to Generate

Before deployment, generate these secure values:

```bash
# 1. JWT Secret (32-byte random string)
openssl rand -base64 32
# Copy output to JWT_SECRET

# 2. Database Password (strong password)
openssl rand -base64 24
# Copy output to DB_PASSWORD (when creating RDS)

# 3. Azure AD Client Secret (if using SSO)
# Generate in Azure Portal > App registrations > Certificates & secrets
```

---

## 🎯 Quick Setup Guide

### Step 1: Backend Configuration

```bash
cd backend

# Copy example file
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor

# Update these CRITICAL values:
# - DB_HOST (from RDS)
# - DB_PASSWORD (from RDS setup)
# - JWT_SECRET (generate new one)
# - FRONTEND_URL (your CloudFront/domain URL)
```

### Step 2: Frontend Configuration

```bash
cd frontend

# Create production env file
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
EOF

# Replace 'api.yourdomain.com' with your actual backend URL
```

### Step 3: Database Setup

```bash
# Connect to RDS
psql -h your-rds-endpoint.rds.amazonaws.com -U admin -d alliswell

# Run migrations (in order)
\i src/database/migrations/001_initial_schema.sql
\i src/database/migrations/002_add_microsoft_sso.sql
\i src/database/migrations/003_create_project_operations.sql
\i src/database/migrations/004_create_project_values_table.sql
\i src/database/migrations/005_add_project_manager_to_projects.sql
\i src/database/migrations/006_create_business_unit_heads.sql
\i src/database/migrations/007_add_more_business_unit_heads.sql
\i src/database/migrations/009_add_missing_dds.sql

# Verify tables created
\dt
```

### Step 4: Create Admin User

```bash
# Still in psql:
# First, generate password hash (use Node.js locally)
# node -e "console.log(require('bcrypt').hashSync('YourPassword123', 10))"

INSERT INTO users (name, email, password, role, is_active)
VALUES (
  'Admin User',
  'admin@yourcompany.com',
  '$2b$10$your-hashed-password',
  'Admin',
  true
);
```

---

## ⚡ Environment-Specific Values

### Development
```bash
NODE_ENV=development
DB_HOST=localhost
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Production
```bash
NODE_ENV=production
DB_HOST=alliswell-db.xxx.us-east-1.rds.amazonaws.com
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## 🚨 Common Mistakes to Avoid

1. **❌ Forgetting to update FRONTEND_URL** → CORS errors
2. **❌ Using HTTP instead of HTTPS in production** → Security issues
3. **❌ Forgetting '/api' in NEXT_PUBLIC_API_URL** → 404 errors
4. **❌ Not generating new JWT_SECRET** → Security vulnerability
5. **❌ Committing .env files to git** → Exposed credentials
6. **❌ Wrong DB_HOST format** → Connection failures
7. **❌ Mismatched Azure redirect URI** → SSO fails

---

## ✅ Verification Steps

After updating all configurations:

```bash
# 1. Test backend can connect to database
cd backend
npm run dev
# Look for: "Connected to PostgreSQL database"

# 2. Test backend health endpoint
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}

# 3. Test frontend can reach backend
cd frontend
npm run dev
# Try logging in - check Network tab in browser DevTools

# 4. Test production build
cd backend && npm run build
cd frontend && npm run build
# Both should complete without errors
```

---

## 📞 Need Help?

If you encounter issues:

1. Check CloudWatch Logs for errors
2. Verify security group rules allow traffic
3. Test database connectivity: `psql -h RDS_ENDPOINT -U admin -d alliswell`
4. Check CORS headers in browser DevTools
5. Verify environment variables are set: `eb printenv` (for EB)

---

## 📚 Reference

### Finding Your AWS Values

| Value Needed | Where to Find It |
|--------------|------------------|
| **RDS Endpoint** | RDS Console > Databases > Your DB > Connectivity |
| **RDS Password** | You set this when creating the database |
| **ALB DNS** | EC2 Console > Load Balancers > Your ALB > DNS name |
| **CloudFront Domain** | CloudFront Console > Distributions > Domain name |
| **EB Environment URL** | EB Console > Environments > Your env > URL |
| **ACM Certificate ARN** | Certificate Manager > Your cert > ARN |

### Elastic Beanstalk Quick Commands

```bash
# View current environment variables
eb printenv

# Set environment variable
eb setenv VAR_NAME=value

# View logs
eb logs

# SSH into instance
eb ssh

# Deploy new version
eb deploy

# Check status
eb status
```
