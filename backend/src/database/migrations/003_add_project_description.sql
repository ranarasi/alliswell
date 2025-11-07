-- Migration: Add description field to projects table
-- Created: 2024-11-02

-- Add description column
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN projects.description IS 'Brief description of the project';
