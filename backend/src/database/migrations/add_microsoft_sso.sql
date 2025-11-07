-- Migration: Add Microsoft SSO Support
-- Description: Adds columns to support Microsoft Azure AD authentication
-- Date: 2024-10-30

-- Add columns for Microsoft SSO
ALTER TABLE users
ADD COLUMN IF NOT EXISTS microsoft_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Make password optional for SSO users (they won't have passwords)
ALTER TABLE users
ALTER COLUMN password DROP NOT NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_microsoft_id ON users(microsoft_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Add comments for documentation
COMMENT ON COLUMN users.microsoft_id IS 'Unique identifier from Microsoft Azure AD';
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: local, microsoft';
COMMENT ON COLUMN users.profile_picture IS 'URL to user profile picture from SSO provider';
