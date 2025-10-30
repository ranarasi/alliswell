# 🔐 AllIsWell - Real Data Login Credentials

## Database Summary
- **Total Projects**: 112
- **Total PDMs**: 9
- **Admin Users**: 1
- **Practice Heads**: 1

---

## 🌐 Access URL
**http://localhost:3000**

---

## Admin & Practice Head Access

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@alliswell.com | admin123 |
| **Practice Head** | head@alliswell.com | head123 |

---

## PDM (Delivery Manager) Access

All PDM passwords follow the format: `firstname123` (lowercase)

| Name | Email | Password | Projects |
|------|-------|----------|----------|
| Vishal Gadge | vishal.ghadge@accionlabs.com | vishal123 | 22 |
| Venugopal Reddy | venu.reddy@accionlabs.com | venugopal123 | 20 |
| Sunil Das | sunil.das@accionlabs.com | sunil123 | 16 |
| Munish Goyal | munish.goyal@accionlabs.com | munish123 | 15 |
| Anand Shah | anand.shah@accionlabs.com | anand123 | 12 |
| Swathi Kadoor | swathi.kadoor@accionlabs.com | swathi123 | 12 |
| Bhavesh Yagnik | bhavesh.yagnik@accionlabs.com | bhavesh123 | 8 |
| Nikhil Damwani | nikhil.damwani@accionlabs.com | nikhil123 | 5 |
| Mahesh Subramaniam | mahesh.s@accionlabs.com | mahesh123 | 2 |

---

## Sample Projects by PDM

### Anand Shah (12 projects)
- Pollard Banknote Ltd.
- Safety.io
- Frontline Performance Group
- Freshworks
- TSL
- ... and 7 more

### Vishal Gadge (22 projects)
- Johnson Matthey Plc_UK
- Conservice LLC
- SAGE Publications, Inc.
- Microsoft
- BCBS
- ... and 17 more

### Venugopal Reddy (20 projects)
- Dell
- Everbridge, Inc.
- HID Global Corporation
- Wolters Kluwer
- Entertainment Partners
- ... and 15 more

### Sunil Das (16 projects)
- Confluence Technologies, Inc.
- Proofpoint, Inc.
- EXPERITY, INC
- Bits Pilani
- Neighborly
- ... and 11 more

---

## How to Re-seed with Real Data

If you need to re-run the seed script:

```bash
cd backend
npm run db:seed-real
```

This will:
1. Create/update all PDM users from `manager-project.csv`
2. Create/update all 112 projects
3. Assign each project to the correct PDM

---

## Testing the Application

### As Admin:
1. Login with `admin@alliswell.com` / `admin123`
2. Navigate to "Manage Projects"
3. You should see all 112 projects
4. Try editing or creating a new project

### As Practice Head:
1. Login with `head@alliswell.com` / `head123`
2. View the dashboard
3. See all projects (no status updates yet)
4. Use filters and search

### As PDM (example: Anand Shah):
1. Login with `anand.shah@accionlabs.com` / `anand123`
2. Navigate to "Submit Status"
3. Select one of your 12 projects
4. Submit a weekly status update
5. Test the auto-save feature (wait 30 seconds)

### Then as Practice Head again:
1. Re-login as Practice Head
2. View the dashboard
3. You should now see the status update from Anand Shah

---

## Quick Commands

### Start the application:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Check database:
```bash
# Count projects
psql alliswell -c "SELECT COUNT(*) FROM projects;"

# View PDM assignments
psql alliswell -c "SELECT u.name, COUNT(p.id) as projects FROM users u LEFT JOIN projects p ON u.id = p.assigned_pdm WHERE u.role = 'PDM' GROUP BY u.name;"
```

---

**Last Updated**: 2025-10-21
**Data Source**: manager-project.csv
