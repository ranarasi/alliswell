# AllIsWell - AWS Deployment Guide

This guide provides step-by-step instructions for deploying the AllIsWell application to AWS.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Database Setup (RDS)](#database-setup-rds)
4. [Backend Deployment (EC2/ECS)](#backend-deployment)
5. [Frontend Deployment (S3 + CloudFront)](#frontend-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Post-Deployment Steps](#post-deployment-steps)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Node.js 18+ and npm installed locally
- PostgreSQL client (psql) installed
- Domain name (optional, but recommended)

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Route 53  │────▶│  CloudFront  │────▶│   S3 Bucket │
│   (DNS)     │     │   (CDN)      │     │  (Frontend) │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  ALB/API GW  │
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  EC2/ECS/EB  │────▶│   RDS PG    │
                    │   (Backend)  │     │  (Database) │
                    └──────────────┘     └─────────────┘
```

---

## Database Setup (RDS)

### 1. Create RDS PostgreSQL Instance

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier alliswell-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-XXXXXXXXX \
  --db-subnet-group-name your-subnet-group \
  --publicly-accessible false \
  --backup-retention-period 7 \
  --multi-az false \
  --storage-encrypted true
```

**Via AWS Console:**
1. Go to RDS > Create database
2. Choose PostgreSQL (version 15.4 or higher)
3. Template: Free tier (for testing) or Production
4. DB instance identifier: `alliswell-db`
5. Master username: `admin`
6. Master password: (set a strong password)
7. Storage: 20 GB SSD
8. Enable automated backups
9. Enable encryption
10. Note the endpoint URL after creation

### 2. Create Database and Tables

```bash
# Connect to RDS instance
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U admin \
     -d postgres

# Create database
CREATE DATABASE alliswell;

# Exit and reconnect to new database
\q
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U admin \
     -d alliswell

# Run migrations
\i /path/to/backend/src/database/migrations/001_initial_schema.sql
\i /path/to/backend/src/database/migrations/002_add_microsoft_sso.sql
# ... run all migrations in order
```

### 3. Create Read Replicas (Optional, for production)

For high availability:
```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier alliswell-db-replica \
  --source-db-instance-identifier alliswell-db
```

---

## Backend Deployment

### Option A: AWS Elastic Beanstalk (Recommended for ease)

#### 1. Prepare Application

```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create .ebignore file
cat > .ebignore << EOF
node_modules/
src/
.git/
.env
*.md
EOF
```

#### 2. Initialize Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p node.js-18 alliswell-backend --region us-east-1

# Create environment
eb create alliswell-backend-prod \
  --instance-type t3.micro \
  --envvars \
  NODE_ENV=production,\
  DB_HOST=your-rds-endpoint.rds.amazonaws.com,\
  DB_NAME=alliswell,\
  DB_USER=admin,\
  DB_PASSWORD=your-db-password,\
  JWT_SECRET=$(openssl rand -base64 32),\
  FRONTEND_URL=https://your-domain.com
```

#### 3. Deploy

```bash
# Deploy application
eb deploy

# Check status
eb status

# View logs
eb logs
```

### Option B: AWS EC2 (Manual setup)

#### 1. Launch EC2 Instance

```bash
# Launch Amazon Linux 2 instance
aws ec2 run-instances \
  --image-id ami-XXXXXXXXX \
  --instance-type t3.micro \
  --key-name your-key-pair \
  --security-group-ids sg-XXXXXXXXX \
  --subnet-id subnet-XXXXXXXXX \
  --user-data file://backend-setup.sh
```

#### 2. Setup Script (backend-setup.sh)

```bash
#!/bin/bash
# Update system
yum update -y

# Install Node.js 18
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install PM2
npm install -g pm2

# Clone or copy application
mkdir -p /var/app
cd /var/app

# Copy files (you'll need to scp them)
# Or use CodeDeploy

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name alliswell-backend
pm2 startup
pm2 save
```

#### 3. Configure Nginx as Reverse Proxy

```bash
# Install nginx
yum install -y nginx

# Configure nginx
cat > /etc/nginx/conf.d/alliswell.conf << 'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Start nginx
systemctl start nginx
systemctl enable nginx
```

### Option C: AWS ECS with Fargate

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY dist ./dist

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/index.js"]
```

#### 2. Build and Push to ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name alliswell-backend

# Get login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t alliswell-backend .

# Tag image
docker tag alliswell-backend:latest \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/alliswell-backend:latest

# Push to ECR
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/alliswell-backend:latest
```

#### 3. Create ECS Task Definition

```json
{
  "family": "alliswell-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/alliswell-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {"name": "DB_HOST", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/alliswell-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

## Frontend Deployment (S3 + CloudFront)

### 1. Build Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create production environment file
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
EOF

# Build for production
npm run build
```

### 2. Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://alliswell-frontend-prod

# Enable static website hosting
aws s3 website s3://alliswell-frontend-prod \
  --index-document index.html \
  --error-document 404.html

# Upload build files
aws s3 sync out/ s3://alliswell-frontend-prod --delete
```

### 3. Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name alliswell-frontend-prod.s3.amazonaws.com \
  --default-root-object index.html
```

**Via AWS Console:**
1. Go to CloudFront > Create Distribution
2. Origin Domain: Select your S3 bucket
3. Origin Access: Legacy access identities
4. Default Cache Behavior:
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS
5. Settings:
   - Alternate Domain Names (CNAMEs): yourdomain.com
   - SSL Certificate: Request or import certificate
   - Default Root Object: index.html
6. Create Distribution
7. Note the CloudFront domain name

### 4. Configure SSL Certificate (ACM)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com \
  --validation-method DNS
```

---

## Environment Configuration

### Backend Environment Variables (.env)

```bash
# Server
PORT=3001
NODE_ENV=production

# Database (RDS)
DB_HOST=alliswell-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=alliswell
DB_USER=admin
DB_PASSWORD=your-secure-password

# Database Pool
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000
DB_SSL_REJECT_UNAUTHORIZED=true

# JWT (Generate using: openssl rand -base64 32)
JWT_SECRET=generate-a-strong-secret-key
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://yourdomain.com

# Optional: Microsoft SSO
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_REDIRECT_URI=https://api.yourdomain.com/api/auth/microsoft/callback
```

### Frontend Environment Variables (.env.production)

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## Post-Deployment Steps

### 1. Configure DNS (Route 53)

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone --name yourdomain.com

# Create A record for frontend
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "CLOUDFRONT_ZONE_ID",
          "DNSName": "your-distribution.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'

# Create A record for backend API
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.yourdomain.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "YOUR_EC2_IP"}]
      }
    }]
  }'
```

### 2. Setup SSL/TLS

- Ensure ACM certificates are validated
- Update CloudFront distribution to use custom SSL certificate
- Configure backend load balancer with HTTPS listener

### 3. Initialize Database with Seed Data

```bash
# Connect to RDS
psql -h your-rds-endpoint.rds.amazonaws.com -U admin -d alliswell

# Run seed scripts
\i /path/to/006_create_business_unit_heads.sql
\i /path/to/007_add_more_business_unit_heads.sql
\i /path/to/009_add_missing_dds.sql
```

### 4. Create First Admin User

```sql
-- Connect to database and run:
INSERT INTO users (name, email, password, role, is_active)
VALUES (
  'Admin User',
  'admin@yourdomain.com',
  '$2b$10$hashedpassword', -- Use bcrypt to hash password
  'Admin',
  true
);
```

---

## Monitoring and Maintenance

### 1. Setup CloudWatch Alarms

```bash
# CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name alliswell-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

# Database connections alarm
aws cloudwatch put-metric-alarm \
  --alarm-name alliswell-db-connections \
  --alarm-description "Alert when DB connections exceed 80%" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### 2. Enable CloudWatch Logs

- Backend: Configure application to send logs to CloudWatch
- RDS: Enable query logs and error logs
- CloudFront: Enable access logs

### 3. Setup Automated Backups

RDS automated backups are enabled by default. For additional safety:

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier alliswell-db \
  --db-snapshot-identifier alliswell-snapshot-$(date +%Y%m%d)
```

### 4. Regular Maintenance Tasks

- **Weekly**: Review CloudWatch metrics and logs
- **Monthly**: Update dependencies and apply security patches
- **Quarterly**: Review and optimize costs
- **Yearly**: Review architecture and scaling requirements

---

## Troubleshooting

### Common Issues

**Backend can't connect to RDS:**
- Check security group rules
- Verify RDS endpoint is correct
- Ensure VPC configuration allows communication

**CORS errors:**
- Verify FRONTEND_URL environment variable
- Check CloudFront origin settings
- Review backend CORS configuration

**High latency:**
- Check RDS connection pool settings
- Consider enabling CloudFront caching
- Review EC2 instance type

---

## Cost Optimization

### Estimated Monthly Costs (Small deployment)

- RDS db.t3.micro: ~$15
- EC2 t3.micro: ~$10
- S3 + CloudFront: ~$5
- **Total: ~$30/month**

### Optimization Tips

1. Use Reserved Instances for predictable workloads
2. Enable S3 Intelligent-Tiering
3. Configure CloudFront cache behaviors
4. Use RDS storage auto-scaling
5. Consider AWS Savings Plans

---

## Security Best Practices

1. **Use AWS Secrets Manager** for sensitive data
2. **Enable MFA** on AWS root account
3. **Configure VPC** with private subnets for RDS
4. **Use IAM roles** instead of access keys
5. **Enable AWS WAF** for CloudFront
6. **Regular security audits** using AWS Security Hub
7. **Enable CloudTrail** for audit logging

---

## Support and Resources

- AWS Documentation: https://docs.aws.amazon.com/
- AWS Well-Architected Framework: https://aws.amazon.com/architecture/well-architected/
- AWS Support: https://aws.amazon.com/support/

---

## Quick Reference

### Useful AWS CLI Commands

```bash
# View RDS status
aws rds describe-db-instances --db-instance-identifier alliswell-db

# View EB environment status
eb status

# View CloudFront distributions
aws cloudfront list-distributions

# Check S3 bucket contents
aws s3 ls s3://alliswell-frontend-prod

# View CloudWatch logs
aws logs tail /aws/elasticbeanstalk/alliswell-backend-prod --follow
```
