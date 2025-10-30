# AllIsWell - Setup Instructions

## Current Status

⏳ **Node.js** - Installing in background (Python 3.13 dependency currently installing)
⏳ **PostgreSQL** - Waiting for Node.js dependencies to finish
✅ **Application Code** - Complete and ready
❌ **Dependencies** - Cannot install until Node.js is ready

---

## What You Need To Do

### Step 1: Wait for Node.js Installation ⏳

The Node.js installation is running in the background. Check if it's complete:

```bash
node --version
npm --version
```

If you see version numbers (e.g., v24.10.0), Node.js is installed! ✅
If you see "command not found", keep waiting. ⏳

**Estimated time:** 10-20 more minutes

---

### Step 2: Install Dependencies (Once Node.js is Ready)

**Option A: Use the automated script (Recommended)**
```bash
./install-dependencies.sh
```

**Option B: Manual installation**
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

This will install:

**Backend (~20 packages):**
- express (web framework)
- pg (PostgreSQL client)
- bcrypt (password hashing)
- jsonwebtoken (authentication)
- TypeScript and dev tools

**Frontend (~30+ packages):**
- Next.js 14 (React framework)
- React 18
- Tailwind CSS (styling)
- Axios (HTTP client)
- TypeScript

**Installation time:** 2-5 minutes

---

### Step 3: Complete Setup

Once dependencies are installed, run the complete setup:

```bash
./complete-setup.sh
```

This will:
1. ✅ Install PostgreSQL (if needed)
2. ✅ Start PostgreSQL service
3. ✅ Create 'alliswell' database
4. ✅ Run database migrations (create tables)
5. ✅ Seed default users
6. ✅ Create environment files

**Setup time:** 3-5 minutes

---

### Step 4: Start the Application

Open **TWO terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
You should see: `✓ Server running on port 3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
You should see: `✓ Ready on http://localhost:3000`

---

### Step 5: Access the Application

Open your browser to: **http://localhost:3000**

Login with default users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@alliswell.com | admin123 |
| PDM | pdm@alliswell.com | pdm123 |
| Practice Head | head@alliswell.com | head123 |

---

## Quick Commands Reference

```bash
# Check Node.js installation
node --version
npm --version

# Check PostgreSQL installation
psql --version

# Verify complete setup
./verify-setup.sh

# Install dependencies only
./install-dependencies.sh

# Complete setup (database + users)
./complete-setup.sh

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev
```

---

## Troubleshooting

### "node: command not found"
**Issue:** Node.js is still installing
**Solution:** Wait for installation to complete, then try again

### "Cannot connect to database"
**Issue:** PostgreSQL not running
**Solution:**
```bash
brew services start postgresql@14
psql postgres -c "SELECT version();"
```

### "Port 3001 already in use"
**Issue:** Backend already running
**Solution:**
```bash
lsof -i :3001
kill -9 <PID>
```

### npm install fails
**Issue:** Network or permission error
**Solution:**
```bash
# Try with verbose logging
npm install --verbose

# Or clean cache and retry
npm cache clean --force
npm install
```

---

## File Structure After Installation

```
claude-alliswell/
├── backend/
│   ├── node_modules/          ← Installed after npm install
│   ├── .env                    ← Created during setup
│   └── src/
├── frontend/
│   ├── node_modules/          ← Installed after npm install
│   ├── .env.local             ← Created during setup
│   └── app/
└── scripts (you're here!)
    ├── install-dependencies.sh
    ├── complete-setup.sh
    └── verify-setup.sh
```

---

## Expected Package Counts

After installation you should have approximately:

- **Backend:** ~20 direct dependencies, ~200+ total packages
- **Frontend:** ~30 direct dependencies, ~500+ total packages
- **Total disk space:** ~400-500MB

---

## What's Happening Right Now

```
Current Background Processes:
├── Node.js installation (Task ID: 5b38df)
│   ├── ✅ OpenSSL 3.6.0 - Complete
│   ├── ⏳ Python 3.13 - Installing...
│   └── ⏳ 10+ more dependencies pending
└── PostgreSQL installation (Task ID: eec5de)
    └── ⏳ Waiting for Node.js lock to clear
```

---

## Timeline Estimate

| Step | Time | Status |
|------|------|--------|
| Node.js installation | 10-20 min | ⏳ In Progress |
| PostgreSQL installation | 5-10 min | ⏳ Pending |
| Install dependencies | 2-5 min | ⏳ Pending |
| Database setup | 1-2 min | ⏳ Pending |
| **Total** | **~20-40 min** | **~50% Complete** |

---

## Need Help?

1. Check `README.md` for detailed documentation
2. Run `./verify-setup.sh` to see what's missing
3. Check QUICKSTART.md for the 5-minute setup guide
4. Review DEPLOYMENT.md for production setup

---

**Last Updated:** 2025-10-21
**Status:** Waiting for Node.js installation to complete
