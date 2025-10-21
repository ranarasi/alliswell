# AllIsWell - Project Status Tracker

A lightweight web application for tracking weekly project status updates across multiple software delivery projects.

## MVP Features (Phase 1)

- ✅ User authentication (JWT-based)
- ✅ Project master data management (Admin)
- ✅ Basic status submission form (PDM)
- ✅ Dashboard with card view (Practice Head)
- ✅ Role-based access control

## Tech Stack

### Frontend
- Next.js 14 with TypeScript
- Tailwind CSS
- Axios for API calls

### Backend
- Node.js + Express + TypeScript
- PostgreSQL database
- JWT authentication
- bcrypt for password hashing

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (v14 or higher)

## Getting Started

### 1. Clone the Repository

```bash
cd claude-alliswell
```

### 2. Database Setup

#### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE alliswell;
CREATE USER alliswell_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE alliswell TO alliswell_user;

# Exit psql
\q
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `backend/.env` with your database credentials:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=alliswell
DB_USER=alliswell_user
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
```

Run database migrations and seed users:

```bash
# Create all tables and indexes
npm run db:migrate

# Seed default users
npm run db:seed
```

This will create all tables and three default users:
- **Admin:** `admin@alliswell.com` / `admin123`
- **PDM:** `pdm@alliswell.com` / `pdm123`
- **Practice Head:** `head@alliswell.com` / `head123`

⚠️ **Change these passwords in production!**

Start the backend server:

```bash
npm run dev
```

The backend will run on http://localhost:3001

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on http://localhost:3000

## Default Users

The system comes with three default users for testing:

| Role | Email | Password | User Name |
|------|-------|----------|-----------|
| Admin | `admin@alliswell.com` | `admin123` | Admin User |
| PDM | `pdm@alliswell.com` | `pdm123` | Sarah Chen |
| Practice Head | `head@alliswell.com` | `head123` | Alex Kumar |

⚠️ **Important:** Change all default passwords immediately in production!

## Usage Guide

### For Administrators

1. **Login** with admin credentials
2. **Navigate to "Manage Projects"** to add projects
3. **Create projects** with:
   - Project name
   - Client name
   - Start date
   - Status (Active/On Hold/Completed)
4. **Assign PDMs** to projects (you'll need to create PDM users first)

### For Project Delivery Managers (PDMs)

1. **Login** with PDM credentials
2. **Navigate to "Submit Status"**
3. **Select your assigned project** from the dropdown
4. **Fill in the form:**
   - Week ending date (defaults to next Friday)
   - Overall status (Green/Amber/Red)
   - All is Well (main update, 500-1000 chars)
   - Optional fields: Risks, Opportunities, Value Projects, Action Items
5. **Use "Copy from last week"** to pre-fill with previous submission
6. **Save as Draft** or **Submit** when ready
7. Auto-save runs every 30 seconds

### For Practice Head

1. **Login** with Practice Head credentials
2. **View Dashboard** showing all projects at a glance
3. **See color-coded status** indicators (Green/Amber/Red)
4. **Filter and search** projects
5. **View summary** showing total projects by status
6. **Click "View Details"** to see full project history (Phase 2 feature)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List all projects (filtered by role)
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project (Admin only)
- `PUT /api/projects/:id` - Update project (Admin only)
- `DELETE /api/projects/:id` - Delete project (Admin only)

### Status Updates
- `GET /api/status` - List status updates (filtered by role)
- `GET /api/status/latest` - Get latest status for all projects
- `GET /api/status/:id` - Get single status update
- `GET /api/status/previous/:projectId` - Get previous week's status
- `POST /api/status` - Create/update status
- `PUT /api/status/:id` - Update status
- `DELETE /api/status/:id` - Delete status

## Project Structure

```
claude-alliswell/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── database/          # DB connection and schema
│   │   ├── middleware/        # Auth middleware
│   │   ├── routes/            # API routes
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # JWT utilities
│   │   └── index.ts           # Main server file
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── admin/projects/    # Admin project management
│   │   ├── dashboard/         # Practice Head dashboard
│   │   ├── login/             # Login page
│   │   ├── submit/            # PDM status submission
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Reusable components
│   ├── lib/                   # API and auth utilities
│   ├── types/                 # TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
├── CLAUDE.md                  # Claude Code guidance
└── README.md
```

## Development Commands

### Backend

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run database migrations and seed users
npm run db:migrate
npm run db:seed
```

### Frontend

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Troubleshooting

### Database Connection Issues

If you see "connection refused" errors:

1. Check PostgreSQL is running:
   ```bash
   # macOS
   brew services list

   # Linux
   sudo systemctl status postgresql
   ```

2. Verify credentials in `backend/.env`
3. Check PostgreSQL is listening on the correct port (default: 5432)

### Port Already in Use

If ports 3000 or 3001 are in use:

**Backend:**
Change `PORT` in `backend/.env`

**Frontend:**
```bash
PORT=3002 npm run dev
```

### Auto-save Not Working

- Check browser console for errors
- Verify backend is running
- Check network tab for API calls
- Ensure you've selected a project and filled the "All is Well" field

## Next Steps (Phase 2 & 3)

Upcoming features:
- Email notifications (Thursday reminders, Monday digests)
- Project detail timeline view
- Comments system
- Reporting and analytics
- Export to PDF/Excel
- Full-text search
- Mobile optimization

## Security Notes

⚠️ **Before deploying to production:**

1. Change default admin password
2. Use strong JWT_SECRET in `.env`
3. Enable HTTPS
4. Set up proper CORS policies
5. Implement rate limiting
6. Add input validation
7. Set up database backups
8. Use environment-specific configs

## Support

For issues or questions, refer to the project requirements document: `AllIsWell_ProjectReq.docx`

## License

Proprietary - Internal use only
