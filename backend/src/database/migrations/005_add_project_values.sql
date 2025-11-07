-- Create project_values table
CREATE TABLE IF NOT EXISTS project_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  submitted_by UUID NOT NULL REFERENCES users(id),
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_values_project_id ON project_values(project_id);
CREATE INDEX IF NOT EXISTS idx_project_values_created_at ON project_values(created_at DESC);
