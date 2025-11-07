# Configuration Quick Reference

## 📄 Files to Update

| File | Location | Purpose |
|------|----------|---------|
| `.env` | `/backend/.env` | Backend environment variables |
| `.env.production` | `/frontend/.env.production` | Frontend production config |
| `.elasticbeanstalk/config.yml` | `/backend/.elasticbeanstalk/config.yml` | EB configuration (if using EB) |

---

## 🔑 Environment Variables - Backend

| Variable | Current/Example Value | What to Replace With | Priority |
|----------|----------------------|----------------------|----------|
| `DB_HOST` | `localhost` | RDS endpoint (e.g., `alliswell-db.xxx.us-east-1.rds.amazonaws.com`) | 🔴 CRITICAL |
| `DB_PASSWORD` | `postgres` | Your RDS master password | 🔴 CRITICAL |
| `JWT_SECRET` | `ZQ1X...` | **Generate new**: `openssl rand -base64 32` | 🔴 CRITICAL |
| `FRONTEND_URL` | `http://localhost:3000` | Your domain (e.g., `https://yourdomain.com`) | 🔴 CRITICAL |
| `NODE_ENV` | `development` | `production` | 🔴 CRITICAL |
| `DB_NAME` | `alliswell` | Keep or change to your DB name | 🟡 Important |
| `DB_USER` | `postgres` | Your RDS master username (usually `admin`) | 🟡 Important |
| `DB_PORT` | `5432` | Keep as `5432` | 🟢 Optional |
| `PORT` | `3001` | Keep as `3001` (or `8080` for EB) | 🟢 Optional |
| `JWT_EXPIRES_IN` | `7d` | Keep or adjust (`1h`, `24h`, `7d`, `30d`) | 🟢 Optional |
| `DB_SSL_REJECT_UNAUTHORIZED` | - | `true` (for AWS RDS) | 🟡 Important |
| `DB_POOL_MAX` | `20` | Adjust based on load (10-100) | 🟢 Optional |
| `DB_POOL_MIN` | `2` | Keep as `2-5` | 🟢 Optional |
| `AZURE_AD_CLIENT_ID` | - | From Azure Portal (if using SSO) | 🟢 Optional |
| `AZURE_AD_CLIENT_SECRET` | - | From Azure Portal (if using SSO) | 🟢 Optional |
| `AZURE_AD_TENANT_ID` | - | From Azure Portal (if using SSO) | 🟢 Optional |
| `AZURE_AD_REDIRECT_URI` | `http://localhost:3001/...` | `https://api.yourdomain.com/api/auth/microsoft/callback` | 🟢 Optional |

---

## 🔑 Environment Variables - Frontend

| Variable | Current/Example Value | What to Replace With | Priority |
|----------|----------------------|----------------------|----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Backend URL (e.g., `https://api.yourdomain.com/api`) | 🔴 CRITICAL |

---

## 🔐 Secrets to Generate

| Secret | How to Generate | Where to Use |
|--------|-----------------|--------------|
| JWT Secret | `openssl rand -base64 32` | Backend: `JWT_SECRET` |
| DB Password | `openssl rand -base64 24` | RDS creation, Backend: `DB_PASSWORD` |
| Azure Client Secret | Azure Portal > App registrations | Backend: `AZURE_AD_CLIENT_SECRET` |

---

## 🌐 AWS Resources Needed

| Resource | Where to Get Value | Variable Name |
|----------|-------------------|---------------|
| **RDS Endpoint** | RDS Console > Databases > Your DB > Connectivity & security | `DB_HOST` |
| **RDS Password** | You set this when creating RDS | `DB_PASSWORD` |
| **RDS Username** | You set this when creating RDS (usually `admin`) | `DB_USER` |
| **CloudFront Domain** | CloudFront Console > Distributions > Domain Name | Use in Route 53 |
| **ALB DNS** | EC2 Console > Load Balancers > DNS name | Use for `FRONTEND_URL` backend calls |
| **ACM Certificate** | Certificate Manager > Your cert | Use in CloudFront settings |
| **S3 Bucket Name** | S3 Console > Your bucket | Use for frontend deployment |

---

## 📋 Deployment Checklist

### Before Deployment
- [ ] Generate new JWT secret
- [ ] Generate strong database password
- [ ] Update all CRITICAL environment variables
- [ ] Test locally with production-like settings
- [ ] Ensure .env files are in .gitignore

### AWS Setup
- [ ] Create RDS PostgreSQL instance
- [ ] Note RDS endpoint and credentials
- [ ] Create S3 bucket for frontend
- [ ] Create CloudFront distribution
- [ ] Request ACM SSL certificate
- [ ] Configure Route 53 DNS records
- [ ] Set up security groups (allow backend → RDS)

### Data Migration
- [ ] Export local database: `cd backend/scripts && ./export_data.sh`
- [ ] Review export summary: `cat data_export/summary_*.txt`
- [ ] Verify counts: 108 projects, 14 DDs, 13 BUHs, 612 operations
- [ ] Set RDS credentials: `export RDS_HOST=...` `export RDS_PASSWORD=...`
- [ ] Import to RDS: `./import_data_to_aws.sh`
- [ ] Verify import with sample queries

### Backend Deployment
- [ ] Create/update `/backend/.env`
- [ ] Set all environment variables
- [ ] Deploy to EB/EC2/ECS
- [ ] Test health endpoint: `curl https://api.yourdomain.com/health`

### Frontend Deployment
- [ ] Create `/frontend/.env.production`
- [ ] Build production: `npm run build`
- [ ] Upload to S3: `aws s3 sync out/ s3://your-bucket`
- [ ] Invalidate CloudFront cache
- [ ] Test frontend loads: Visit your domain

### Post-Deployment
- [ ] Test login functionality
- [ ] Test CORS (check browser console)
- [ ] Verify database connectivity
- [ ] Set up CloudWatch alarms
- [ ] Configure automated backups
- [ ] Test Microsoft SSO (if enabled)

---

## 🚨 Common Issues & Solutions

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| CORS errors | Wrong `FRONTEND_URL` | Update backend `FRONTEND_URL` to match your actual frontend domain |
| Can't connect to database | Wrong `DB_HOST` or security group | Check RDS endpoint and security group rules |
| 401 Unauthorized | Wrong JWT secret or expired token | Verify `JWT_SECRET` is set correctly |
| 404 on API calls | Wrong `NEXT_PUBLIC_API_URL` | Ensure it ends with `/api` and uses HTTPS |
| Microsoft SSO fails | Wrong redirect URI | Match `AZURE_AD_REDIRECT_URI` with Azure Portal config |
| Connection timeout | Security group blocks access | Allow backend security group to access RDS security group |

---

## 💡 Quick Commands

### Generate Secrets
```bash
# JWT Secret (Backend)
openssl rand -base64 32

# Database Password (RDS)
openssl rand -base64 24

# Verify environment variables (EB)
eb printenv
```

### Data Migration
```bash
# Export local database
cd backend/scripts
./export_data.sh

# Import to AWS RDS
export RDS_HOST=your-rds-endpoint.rds.amazonaws.com
export RDS_PASSWORD=your-rds-password
export RDS_USER=admin
export RDS_DB=alliswell
./import_data_to_aws.sh

# Manual backup/restore
pg_dump -h localhost -U ramesh -d alliswell --file=backup.sql
psql -h RDS_HOST -U admin -d alliswell -f backup.sql
```

### Test Connections
```bash
# Test database connection
psql -h your-rds-endpoint.rds.amazonaws.com -U admin -d alliswell

# Test backend health
curl https://api.yourdomain.com/health

# Test CORS
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://api.yourdomain.com/api/auth/login
```

### Deploy
```bash
# Backend (Elastic Beanstalk)
cd backend
eb deploy

# Frontend (S3 + CloudFront)
cd frontend
npm run build
aws s3 sync out/ s3://your-bucket --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

## 📞 Where to Find Help

- **RDS Endpoint**: AWS Console → RDS → Databases → Your DB → Connectivity
- **EB Environment URL**: AWS Console → Elastic Beanstalk → Environments
- **CloudFront Domain**: AWS Console → CloudFront → Distributions
- **Security Groups**: AWS Console → EC2 → Security Groups
- **Logs**: AWS Console → CloudWatch → Log groups

---

## ✅ Verification

After updating all configs, verify:

```bash
# 1. Backend connects to RDS
✓ Check logs for "Connected to PostgreSQL database"

# 2. Health check works
✓ curl https://api.yourdomain.com/health returns {"status":"ok"}

# 3. Frontend can reach backend
✓ No CORS errors in browser console
✓ Login page loads
✓ Can successfully log in

# 4. HTTPS works
✓ Browser shows secure lock icon
✓ Certificate is valid

# 5. Database has data
✓ Connect to RDS and run: SELECT COUNT(*) FROM users;
```
