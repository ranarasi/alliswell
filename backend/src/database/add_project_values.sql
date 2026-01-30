-- Add project_values table for storing value entries
CREATE TABLE IF NOT EXISTS project_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  submitted_by UUID NOT NULL REFERENCES users(id),
  submitted_by_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_values_project ON project_values(project_id);
CREATE INDEX IF NOT EXISTS idx_project_values_created_at ON project_values(created_at);
