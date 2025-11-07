-- Migration: Add Project Manager and Business Unit Head to projects table
-- Created: 2024-11-02

-- Add new columns for project contacts
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS project_manager VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_unit_head VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN projects.project_manager IS 'Email address of the Project Manager';
COMMENT ON COLUMN projects.business_unit_head IS 'Email address of the Business Unit Head';
