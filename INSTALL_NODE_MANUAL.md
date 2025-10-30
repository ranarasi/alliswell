# Install Node.js Manually (Recommended)

The Homebrew installation failed. Here's the faster, simpler method:

## Method 1: Download Official Installer (5 minutes)

### Step 1: Download

Visit: https://nodejs.org/en/download

Download: **macOS Installer (.pkg)** - LTS version (v20.x or v22.x)

### Step 2: Install

1. Double-click the downloaded `.pkg` file
2. Follow the installation wizard
3. Click "Continue" → "Install"
4. Enter your password when prompted
5. Click "Close" when done

### Step 3: Verify

Open Terminal and run:
```bash
node --version
npm --version
```

You should see:
```
v20.x.x (or v22.x.x)
10.x.x
```

✅ **Done!** Node.js is installed.

---

## Method 2: Use nvm (Node Version Manager)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Close and reopen terminal, then:
nvm install 20
nvm use 20

# Verify
node --version
npm --version
```

---

## After Node.js is Installed

Run the complete setup:

```bash
cd /Users/ramesh/Documents/projects/claude-alliswell
./complete-setup.sh
```

This will:
- ✅ Install PostgreSQL
- ✅ Install all dependencies
- ✅ Set up database
- ✅ Create default users

**Time:** 5-10 minutes

---

## Why Homebrew Failed

The error was:
```
FormulaUnavailableError: No available formula with the name "formula.jws.json"
```

This is a known issue with:
- macOS 13 (Tier 3 support - deprecated)
- Older Command Line Tools
- Complex dependency chains

The official installer is simpler and faster!

---

## Quick Start After Installation

```bash
# 1. Verify Node.js
node --version

# 2. Run complete setup
./complete-setup.sh

# 3. Start backend
cd backend && npm run dev

# 4. Start frontend (new terminal)
cd frontend && npm run dev

# 5. Open browser
open http://localhost:3000
```

Login: admin@alliswell.com / admin123

---

**Estimated Total Time:** 10-15 minutes
(Much faster than Homebrew!)
