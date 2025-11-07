-- Migration: Add project operations table
-- Created: 2024-11-02

-- Create project_operations table
CREATE TABLE IF NOT EXISTS project_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  team_size INTEGER DEFAULT 0,
  revenue NUMERIC(15, 2) DEFAULT 0,
  cost NUMERIC(15, 2) DEFAULT 0,
  gm_percentage NUMERIC(5, 2) DEFAULT 0,
  utilization_percentage NUMERIC(5, 2) DEFAULT 0,
  shadows INTEGER DEFAULT 0,
  ramp_up INTEGER DEFAULT 0,
  ramp_down INTEGER DEFAULT 0,
  open_positions INTEGER DEFAULT 0,
  submitted_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, month, year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_operations_project ON project_operations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_operations_date ON project_operations(year DESC, month DESC);

-- Add comments for documentation
COMMENT ON TABLE project_operations IS 'Monthly operational metrics for projects';
COMMENT ON COLUMN project_operations.month IS 'Month (1-12)';
COMMENT ON COLUMN project_operations.year IS 'Year (4 digits)';
COMMENT ON COLUMN project_operations.team_size IS 'Number of team members';
COMMENT ON COLUMN project_operations.revenue IS 'Revenue in currency';
COMMENT ON COLUMN project_operations.cost IS 'Cost in currency';
COMMENT ON COLUMN project_operations.gm_percentage IS 'Gross Margin percentage';
COMMENT ON COLUMN project_operations.utilization_percentage IS 'Utilization percentage';
COMMENT ON COLUMN project_operations.shadows IS 'Number of shadows';
COMMENT ON COLUMN project_operations.ramp_up IS 'Number of ramp ups';
COMMENT ON COLUMN project_operations.ramp_down IS 'Number of ramp downs';
COMMENT ON COLUMN project_operations.open_positions IS 'Number of open positions at end of month';
