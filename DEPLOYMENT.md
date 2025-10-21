# Deployment Checklist

This checklist ensures a smooth deployment of AllIsWell to production.

## Pre-Deployment Checklist

### Security
- [ ] Change all default user passwords
- [ ] Generate strong JWT_SECRET (minimum 32 characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS for production domain only
- [ ] Implement rate limiting on API endpoints
- [ ] Add input validation and sanitization
- [ ] Review and restrict database user permissions
- [ ] Enable database connection encryption (SSL)
- [ ] Set secure session cookies (httpOnly, secure, sameSite)
- [ ] Add CSP (Content Security Policy) headers

### Environment Configuration
- [ ] Set NODE_ENV=production
- [ ] Configure production database credentials
- [ ] Set production API URL in frontend
- [ ] Remove or disable debug logging
- [ ] Configure error reporting (e.g., Sentry)
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategies

### Database
- [ ] Run migrations on production database
- [ ] Set up automated daily backups
- [ ] Configure connection pooling limits
- [ ] Test database performance under load
- [ ] Set up read replicas (if needed)
- [ ] Document database recovery procedures

### Code Quality
- [ ] Run all linters and fix warnings
- [ ] Run TypeScript type checking
- [ ] Remove console.log statements
- [ ] Review and optimize database queries
- [ ] Add error boundaries in React
- [ ] Test all user flows manually

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, etc.)

#### Backend Deployment
```bash
# On server
git clone <repository>
cd backend
npm install --production
npm run build

# Set up environment
cp .env.example .env
# Edit .env with production values

# Run migrations
npm run db:migrate
npm run db:seed

# Use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name alliswell-api
pm2 save
pm2 startup
```

#### Frontend Deployment
```bash
# Build locally
cd frontend
npm install
npm run build

# Deploy to server (rsync, SCP, etc.)
rsync -avz .next/ user@server:/var/www/alliswell/

# Or use PM2
pm2 start npm --name alliswell-web -- start
```

### Option 2: Platform as a Service

#### Frontend: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

Environment variables to set in Vercel:
- `NEXT_PUBLIC_API_URL`: Your backend API URL

#### Backend: Railway / Render / Heroku
1. Connect your GitHub repository
2. Set environment variables
3. Configure build command: `npm run build`
4. Configure start command: `npm start`
5. Add PostgreSQL add-on

#### Database: Railway PostgreSQL / AWS RDS / DigitalOcean Managed Database
1. Create PostgreSQL instance
2. Note connection credentials
3. Run migrations from local machine:
   ```bash
   DATABASE_URL=<production-url> npm run db:migrate
   DATABASE_URL=<production-url> npm run db:seed
   ```

### Option 3: Containerized (Docker + Kubernetes)

#### Create Dockerfiles

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm install --production
EXPOSE 3000
CMD ["npm", "start"]
```

## Post-Deployment Checklist

### Verification
- [ ] Test login for all user roles
- [ ] Test project creation (Admin)
- [ ] Test status submission (PDM)
- [ ] Test dashboard view (Practice Head)
- [ ] Verify auto-save functionality
- [ ] Test "copy from last week" feature
- [ ] Check all API endpoints respond correctly
- [ ] Verify database connections are stable
- [ ] Test error handling and logging

### Performance
- [ ] Run load tests (recommend: Apache Bench, k6)
- [ ] Check API response times (<500ms target)
- [ ] Verify dashboard loads in <2 seconds
- [ ] Monitor database query performance
- [ ] Set up CDN for static assets (optional)
- [ ] Enable gzip compression
- [ ] Configure caching headers

### Monitoring
- [ ] Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- [ ] Configure application performance monitoring (APM)
- [ ] Set up log aggregation (e.g., Logtail, Papertrail)
- [ ] Create alerts for errors and downtime
- [ ] Set up database performance monitoring
- [ ] Configure disk space alerts

### Documentation
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document rollback procedures
- [ ] Share credentials with team (use password manager)
- [ ] Update README with production URLs
- [ ] Document backup and restore procedures

## Environment Variables Reference

### Backend (.env)
```bash
# Server
PORT=3001
NODE_ENV=production

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=alliswell_prod
DB_USER=alliswell_user
DB_PASSWORD=<strong-password>

# JWT
JWT_SECRET=<strong-random-string-min-32-chars>
JWT_EXPIRES_IN=7d

# Email (Phase 2)
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASS=
```

### Frontend (.env.local or Vercel environment variables)
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## Rollback Procedures

### Frontend Rollback
```bash
# Vercel
vercel rollback

# Or redeploy previous version
git checkout <previous-commit>
vercel --prod
```

### Backend Rollback
```bash
# With PM2
pm2 stop alliswell-api
git checkout <previous-commit>
npm install
npm run build
pm2 restart alliswell-api
```

### Database Rollback
```bash
# Restore from backup
pg_restore -d alliswell_prod backup_file.sql

# Or manually revert migrations
psql -d alliswell_prod -f revert_migration.sql
```

## Performance Targets

Based on MVP requirements:
- **Dashboard load time:** <2 seconds ✅
- **Form submission time:** <3 minutes (user time) ✅
- **API response time:** <500ms ✅
- **Database queries:** <500ms ✅
- **Concurrent users:** 50+ ✅

## Security Hardening

### Additional Production Security
1. **Implement rate limiting:**
   ```bash
   npm install express-rate-limit
   ```

2. **Add helmet.js for security headers:**
   ```bash
   npm install helmet
   ```

3. **Add input validation:**
   ```bash
   npm install express-validator
   ```

4. **Set up WAF (Web Application Firewall):**
   - Cloudflare
   - AWS WAF
   - DigitalOcean Cloud Firewall

5. **Enable 2FA for admin users** (Phase 2)

## Backup Strategy

### Automated Backups
- Database: Daily automated backups (retain 30 days)
- Files: Weekly backups of uploaded files (if any)
- Configuration: Version control for all configs

### Backup Locations
- Primary: Cloud provider's backup service
- Secondary: Off-site backup (different region/provider)

### Test Restores
- Monthly: Test database restore from backup
- Quarterly: Full disaster recovery drill

## Maintenance Windows

Recommended maintenance schedule:
- **Updates:** Monthly (security patches)
- **Major upgrades:** Quarterly (with testing)
- **Database maintenance:** Weekly (VACUUM, ANALYZE)

## Support Contacts

Document key contacts:
- [ ] DevOps/Infrastructure team
- [ ] Database administrator
- [ ] Security team
- [ ] On-call rotation
- [ ] Escalation procedures

## Final Sign-Off

Before going live:
- [ ] Development team sign-off
- [ ] QA team sign-off
- [ ] Security team sign-off
- [ ] Stakeholder approval
- [ ] User acceptance testing complete

---

**Deployment Status:** ⏳ Pending

**Target Go-Live Date:** _________________

**Deployed By:** _________________

**Verified By:** _________________
