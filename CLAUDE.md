# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AllIsWell** is a lightweight web application for tracking weekly project status updates across multiple software delivery projects. It enables Project Delivery Managers (PDMs) to submit "All is Well" status updates in a feed-like interface, allowing the Delivery Practice Head to monitor all projects at a glance.

## Architecture

### System Design
- **Frontend**: React 18+ with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js + Express + TypeScript (recommended) OR Python + FastAPI
- **Database**: PostgreSQL (recommended for structured data, full-text search, and analytics)
- **Authentication**: JWT-based auth
- **Deployment**: Vercel (frontend) + Railway/Render (backend)

### Key Components
1. **Project Master Data Management**: Admin interface for managing projects (name, client, dates, status)
2. **Weekly Status Submission**: Form-based interface for PDMs with auto-save and "copy from last week" feature
3. **Dashboard**: Card-based summary view with color-coded status indicators (Green/Amber/Red)
4. **Project Detail View**: Timeline view of all status submissions for a single project
5. **Reporting & Analytics**: Weekly rollups, trend analysis, risk registers, exports

### Data Model

**Projects Table**:
- id, name, client, startDate, status (Active/On Hold/Completed), assignedPDM

**WeeklyStatus Table**:
- id, projectId, weekEndingDate, overallStatus (Green/Amber/Red), allIsWell (rich text), risks, opportunities, valueProjects, actionItems, submittedBy, isDraft

**Users Table**:
- id, email, name, role (Admin/Practice Head/PDM), isActive

**Comments Table** (optional):
- id, statusId, userId, comment

### User Roles & Permissions
- **Admin**: Full access, manage projects and users
- **Practice Head**: View all projects, comment, export reports
- **PDM**: Submit status for assigned projects only, view own submissions

## Development Commands

*Note: Commands will be added once the project scaffold is created*

### Recommended Stack Setup

**Frontend**:
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install @tanstack/react-query zustand react-hook-form @tiptap/react @tiptap/starter-kit recharts
```

**Backend (Node.js)**:
```bash
mkdir backend && cd backend
npm init -y
npm install express typescript @types/express @types/node ts-node-dev
npm install pg typeorm jsonwebtoken bcrypt
npm install --save-dev @types/jsonwebtoken @types/bcrypt
```

**Backend (Python)**:
```bash
mkdir backend && cd backend
poetry init
poetry add fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-jose passlib
```

## Key Features & Requirements

### Form Submission Requirements
- **Completion time**: Under 3 minutes
- **Auto-save**: Every 30 seconds
- **Week ending date**: Auto-fills to current Friday, can be overridden
- **"Copy from last week"**: Pre-fills all fields with previous submission
- **Character limits**: All is Well (500-1000 chars), optional fields (300 chars)

### Dashboard Requirements
- **Load time**: Under 2 seconds
- **Color coding**: Green (#10B981), Amber (#F59E0B), Red (#EF4444)
- **Filters**: By status, PDM, week, client
- **Full-text search**: Across all fields
- **Visual indicators**: Risks (⚠️), Opportunities (💡), Action Items (📌)

### Notifications
- Email reminder to PDMs on Thursday if status not submitted
- Email digest to Practice Head on Monday morning with summary

## Implementation Phases

### Phase 1: MVP (2-3 weeks)
- User authentication
- Project master data management
- Basic status submission form
- Simple dashboard with card view

### Phase 2: Enhanced Features (1-2 weeks)
- "Copy from last week" functionality
- Auto-save drafts
- Email notifications
- Project detail timeline view
- Basic filtering and search

### Phase 3: Reporting & Analytics (1-2 weeks)
- Weekly rollup reports
- Trend analysis
- Export functionality (PDF/Excel)
- Comments system
- Mobile optimization

## API Structure

### Core Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/projects` - List all projects (filtered by role)
- `POST /api/status` - Submit weekly status
- `GET /api/status/latest/:projectId` - Get latest status for a project
- `GET /api/reports/weekly-rollup` - Generate weekly report
- `POST /api/reports/export` - Export data to PDF/Excel

## UI/UX Guidelines

### Navigation Structure
- Dashboard (Practice Head view)
- My Projects (PDM view)
- Submit Status (PDM action)
- Reports (Practice Head)
- Manage Projects (Admin)

### Design Tokens
- Primary: #3B82F6 (Blue)
- Background: #F9FAFB
- Text: #111827
- Cards: White with subtle shadow
- Status colors as noted above

### Mobile Responsiveness
- Submission form must be fully mobile-responsive
- Dashboard should adapt gracefully to smaller screens
- Target: WCAG 2.1 AA compliance

## Performance Requirements
- Support 50+ concurrent users
- Handle 100+ projects with 52 weeks of history
- Database queries under 500ms
- Weekly automated backups
- Data retention: 3 years minimum

## Reference Documentation
The complete requirements specification is available in `AllIsWell_ProjectReq.docx` which includes:
- Detailed user personas (Sarah Chen - PDM, Alex Kumar - Practice Head)
- Complete wireframes for all screens
- Detailed user flows
- Example status entries for Green/Amber/Red scenarios
- Success metrics and future enhancements
