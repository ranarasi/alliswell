-- Create database (run this manually first)
-- CREATE DATABASE alliswell;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Practice Head', 'PDM')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  client VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'On Hold', 'Completed')),
  assigned_pdm UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly status table
CREATE TABLE IF NOT EXISTS weekly_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_ending_date DATE NOT NULL,
  overall_status VARCHAR(50) NOT NULL CHECK (overall_status IN ('Green', 'Amber', 'Red')),
  all_is_well TEXT NOT NULL,
  risks TEXT,
  opportunities TEXT,
  value_projects TEXT,
  action_items TEXT,
  submitted_by UUID NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_draft BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, week_ending_date)
);

-- Comments table (optional, for future use)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_id UUID NOT NULL REFERENCES weekly_status(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_pdm ON projects(assigned_pdm);
CREATE INDEX IF NOT EXISTS idx_weekly_status_project ON weekly_status(project_id);
CREATE INDEX IF NOT EXISTS idx_weekly_status_date ON weekly_status(week_ending_date);
CREATE INDEX IF NOT EXISTS idx_weekly_status_overall ON weekly_status(overall_status);

-- Note: Run 'npm run db:seed' to create default users with proper password hashes
