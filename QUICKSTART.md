# Quick Start Guide - AllIsWell MVP

This guide will get you up and running with the AllIsWell MVP in under 10 minutes.

## Prerequisites Check

```bash
# Check Node.js (need v18+)
node --version

# Check npm
npm --version

# Check PostgreSQL (need v14+)
psql --version
```

If any are missing, install them first (see README.md).

## 5-Minute Setup

### 1. Database Setup (2 minutes)

```bash
# Start PostgreSQL (if not already running)
# macOS:
brew services start postgresql@14

# Linux:
sudo systemctl start postgresql

# Create database
psql postgres -c "CREATE DATABASE alliswell;"
```

### 2. Backend Setup (2 minutes)

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=alliswell
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
EOF

# Run migrations and seed data
npm run db:migrate
npm run db:seed

# Start backend
npm run dev
```

Backend should now be running on http://localhost:3001

### 3. Frontend Setup (1 minute)

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local

# Start frontend
npm run dev
```

Frontend should now be running on http://localhost:3000

## Test Your Installation

1. Open http://localhost:3000 in your browser
2. You should see the AllIsWell login page
3. Try logging in with:
   - Email: `admin@alliswell.com`
   - Password: `admin123`

## What to Do Next

### As Admin (admin@alliswell.com)
1. Change your password (future feature)
2. Click "Manage Projects"
3. Add a test project:
   - Name: "Project Alpha"
   - Client: "Acme Corp"
   - Start Date: Today
   - Status: Active
4. Assign the project to PDM: `pdm@alliswell.com`

### As PDM (pdm@alliswell.com)
1. Logout (click your name → Logout)
2. Login as PDM:
   - Email: `pdm@alliswell.com`
   - Password: `pdm123`
3. Click "Submit Status"
4. Select "Project Alpha"
5. Fill in the form:
   - Status: Green
   - All is Well: "Project kickoff completed successfully. Team is ramped up and ready to start Sprint 1. Initial planning done. Client stakeholders identified. Development environment setup complete. Target delivery date confirmed for Q2."
6. Click "Submit"

### As Practice Head (head@alliswell.com)
1. Logout
2. Login as Practice Head:
   - Email: `head@alliswell.com`
   - Password: `head123`
3. View the Dashboard
4. You should see "Project Alpha" with a green status

## Common Issues

### Port Already in Use

```bash
# Find what's using port 3001
lsof -i :3001

# Kill it or change port in backend/.env
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
psql postgres -c "SELECT version();"

# If you get an error, verify DB credentials in backend/.env
```

### Frontend Can't Connect to Backend

1. Check backend is running on http://localhost:3001
2. Test: `curl http://localhost:3001/health`
3. Check `frontend/.env.local` has correct API URL

## Development Workflow

### Daily Development

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Adding New Projects

As admin, go to http://localhost:3000/admin/projects

### Submitting Weekly Updates

As PDM, go to http://localhost:3000/submit

### Viewing Dashboard

As Practice Head or Admin, go to http://localhost:3000/dashboard

## MVP Features Available

✅ User login with 3 roles
✅ Project management (Admin only)
✅ Weekly status submission (PDM)
✅ Dashboard view (Practice Head & Admin)
✅ Color-coded status (Green/Amber/Red)
✅ Auto-save drafts (every 30 seconds)
✅ Copy from last week
✅ Role-based access control

## Coming in Phase 2

- Email notifications
- Project history timeline
- Comments on status updates
- Search and filters (enhanced)
- Export to PDF/Excel

## Need Help?

See the full README.md for:
- Detailed setup instructions
- API documentation
- Troubleshooting guide
- Architecture details
