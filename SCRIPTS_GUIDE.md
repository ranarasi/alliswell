# 🚀 AllIsWell - Application Control Scripts

This guide explains how to use the control scripts to manage your AllIsWell application.

## 📋 Available Scripts

### 1. **`start.sh`** - Start the Application
Starts both backend and frontend servers in the background.

```bash
./start.sh
```

**What it does:**
- ✅ Checks if Node.js is available
- ✅ Starts PostgreSQL if not running
- ✅ Installs dependencies if needed
- ✅ Starts backend server on port 3001
- ✅ Starts frontend server on port 3000
- ✅ Creates log files in `logs/` directory
- ✅ Saves process IDs for later management

**Output:**
```
════════════════════════════════════════════════════════════════
           Starting AllIsWell Application
════════════════════════════════════════════════════════════════

✓ Node.js found: v20.19.5
✓ PostgreSQL is already running

Starting Backend Server...
✓ Backend server starting (PID: 12345)
  Log: logs/backend.log

Starting Frontend Server...
✓ Frontend server starting (PID: 12346)
  Log: logs/frontend.log

════════════════════════════════════════════════════════════════
✓ AllIsWell Application Started Successfully!
════════════════════════════════════════════════════════════════

Application URL:
  http://localhost:3000

Server PIDs:
  Backend:  12345 (logs/backend.log)
  Frontend: 12346 (logs/frontend.log)

Application is ready! Open http://localhost:3000 in your browser.
```

---

### 2. **`stop.sh`** - Stop the Application
Stops both backend and frontend servers.

```bash
./stop.sh
```

**What it does:**
- ✅ Stops backend server gracefully
- ✅ Stops frontend server gracefully
- ✅ Force kills if processes don't stop
- ✅ Cleans up PID files
- ✅ Kills any processes on ports 3000/3001
- ✅ Removes stray node processes

**Output:**
```
════════════════════════════════════════════════════════════════
           Stopping AllIsWell Application
════════════════════════════════════════════════════════════════

Stopping Backend (PID: 12345)...
✓ Backend stopped

Stopping Frontend (PID: 12346)...
✓ Frontend stopped

════════════════════════════════════════════════════════════════
✓ AllIsWell Application Stopped
════════════════════════════════════════════════════════════════
```

---

### 3. **`status.sh`** - Check Application Status
Checks if the application is running and displays detailed status.

```bash
./status.sh
```

**What it does:**
- ✅ Checks PostgreSQL status
- ✅ Checks backend server status
- ✅ Checks frontend server status
- ✅ Tests API connectivity
- ✅ Shows process IDs and log locations

**Output:**
```
════════════════════════════════════════════════════════════════
           AllIsWell Application Status
════════════════════════════════════════════════════════════════

PostgreSQL:
  ✓ Running

Backend Server (Port 3001):
  ✓ Running (PID: 12345)
    Log: logs/backend.log

Frontend Server (Port 3000):
  ✓ Running (PID: 12346)
    Log: logs/frontend.log

Connectivity Test:
  ✓ Backend API responding
  ✓ Frontend responding

════════════════════════════════════════════════════════════════
✓ Application is running

Access the application at:
  http://localhost:3000
════════════════════════════════════════════════════════════════
```

---

## 📖 Common Usage Scenarios

### Starting Fresh After Computer Restart

```bash
cd /Users/ramesh/Documents/projects/claude-alliswell
./start.sh
```

That's it! The script will:
1. Start PostgreSQL if needed
2. Start both servers
3. Show you the URL to access

### Stopping Before Shutdown

```bash
cd /Users/ramesh/Documents/projects/claude-alliswell
./stop.sh
```

### Checking If Application Is Running

```bash
cd /Users/ramesh/Documents/projects/claude-alliswell
./status.sh
```

### Restarting the Application

```bash
./stop.sh && ./start.sh
```

### Viewing Live Logs

**Backend logs:**
```bash
tail -f logs/backend.log
```

**Frontend logs:**
```bash
tail -f logs/frontend.log
```

**Both at once (in separate terminals):**
```bash
# Terminal 1
tail -f logs/backend.log

# Terminal 2
tail -f logs/frontend.log
```

---

## 🔧 Troubleshooting

### Issue: "Permission denied" when running scripts

**Fix:**
```bash
chmod +x start.sh stop.sh status.sh
```

### Issue: Port already in use

**Check what's using the port:**
```bash
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
```

**Kill the process:**
```bash
./stop.sh  # This will clean up ports
```

### Issue: Backend won't start

**Check the logs:**
```bash
cat logs/backend.log
```

**Common fixes:**
1. Make sure PostgreSQL is running:
   ```bash
   brew services start postgresql@14
   ```

2. Check database exists:
   ```bash
   psql alliswell -c "SELECT 1;"
   ```

3. Reinstall dependencies:
   ```bash
   cd backend
   rm -rf node_modules
   npm install
   ```

### Issue: Frontend won't start

**Check the logs:**
```bash
cat logs/frontend.log
```

**Common fix:**
```bash
cd frontend
rm -rf node_modules .next
npm install
```

### Issue: Can't connect to database

**Recreate the database:**
```bash
./stop.sh
psql postgres -c "DROP DATABASE IF EXISTS alliswell;"
./run-complete-setup.sh
./start.sh
```

---

## 📁 File Locations

```
claude-alliswell/
├── start.sh              # Start script
├── stop.sh               # Stop script
├── status.sh             # Status check script
├── backend.pid           # Backend process ID (created by start.sh)
├── frontend.pid          # Frontend process ID (created by start.sh)
├── logs/
│   ├── backend.log       # Backend server logs
│   └── frontend.log      # Frontend server logs
├── backend/              # Backend source code
├── frontend/             # Frontend source code
└── run-complete-setup.sh # Database setup script
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Start app | `./start.sh` |
| Stop app | `./stop.sh` |
| Check status | `./status.sh` |
| Restart | `./stop.sh && ./start.sh` |
| View backend logs | `tail -f logs/backend.log` |
| View frontend logs | `tail -f logs/frontend.log` |
| Setup database | `./run-complete-setup.sh` |

---

## 🔐 Default Credentials

After starting, access the app at **http://localhost:3000**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@alliswell.com | admin123 |
| Practice Head | head@alliswell.com | head123 |
| PDM (Anand Shah) | anand.shah@accionlabs.com | anand123 |
| PDM (Vishal Gadge) | vishal.ghadge@accionlabs.com | vishal123 |

See `REAL_DATA_CREDENTIALS.md` for all PDM accounts.

---

## 💡 Tips

1. **Always use `./start.sh`** instead of manually starting servers
   - Ensures proper background execution
   - Creates log files
   - Tracks process IDs

2. **Use `./status.sh`** to check if app is running
   - Quick health check
   - Shows process IDs
   - Tests connectivity

3. **Check logs** if something goes wrong
   - Backend: `logs/backend.log`
   - Frontend: `logs/frontend.log`

4. **Clean shutdown** before computer restart
   ```bash
   ./stop.sh
   ```

5. **After computer restart**, just run:
   ```bash
   ./start.sh
   ```

---

**Last Updated:** 2025-10-21
