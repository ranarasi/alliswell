# 🚀 Start AllIsWell Application

## Quick Start (After Setup Complete)

Once npm installations finish, follow these steps:

### Step 1: Complete Database Setup

```bash
cd /Users/ramesh/Documents/projects/claude-alliswell

# Run the complete setup script
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
./run-complete-setup.sh
```

This will:
- Create the database
- Run migrations (create tables)
- Seed default users
- Create environment files

### Step 2: Start Backend Server

Open **Terminal 1**:

```bash
cd /Users/ramesh/Documents/projects/claude-alliswell/backend
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
npm run dev
```

Wait for: `✓ Server running on port 3001`

### Step 3: Start Frontend Server

Open **Terminal 2** (new terminal window):

```bash
cd /Users/ramesh/Documents/projects/claude-alliswell/frontend
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

### Step 4: Access the Application

Click this URL or copy to your browser:

**🌐 http://localhost:3000**

### Step 5: Login

Use these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@alliswell.com | admin123 |
| **PDM** | pdm@alliswell.com | pdm123 |
| **Practice Head** | head@alliswell.com | head123 |

---

## Manual Setup (If Script Doesn't Work)

### 1. Create Database

```bash
/opt/homebrew/opt/postgresql@14/bin/psql postgres -c "CREATE DATABASE alliswell;"
```

### 2. Setup Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` if needed (should work with defaults).

### 3. Run Database Migrations

```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
npm run db:migrate
```

### 4. Seed Default Users

```bash
npm run db:seed
```

### 5. Setup Frontend Environment

```bash
cd ../frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
```

### 6. Start Servers (as above)

---

## Troubleshooting

### Backend won't start:
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# If not running, start it
brew services start postgresql@14

# Wait a few seconds, then try again
```

### Frontend won't start:
```bash
# Make sure backend is running first on port 3001
# Check with:
curl http://localhost:3001/health
```

### "node: command not found":
```bash
# Add to every terminal session:
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Or add permanently to ~/.zshrc:
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## What You'll See

### Login Page
- Email input
- Password input
- Login button

### Admin Dashboard
- All projects view
- Create/edit/delete projects
- Color-coded status cards

### PDM Submit Status
- Project selector
- Week ending date
- Status (Green/Amber/Red)
- All is Well text area
- Optional fields (Risks, Opportunities, etc.)
- Auto-save every 30 seconds
- "Copy from last week" button

### Practice Head Dashboard
- Summary statistics
- All project status cards
- Filter by status
- Search projects
- Color-coded view

---

## Next Steps After Login

1. **As Admin:**
   - Go to "Manage Projects"
   - Add a test project
   - Assign to PDM user

2. **As PDM:**
   - Go to "Submit Status"
   - Select your project
   - Fill in weekly update
   - Submit

3. **As Practice Head:**
   - View Dashboard
   - See all project statuses
   - Filter and search
   - Review weekly updates

---

**🎉 Enjoy your AllIsWell application!**
