-- Add missing Delivery Directors (PDMs) to users table
INSERT INTO users (name, email, password, role, is_active) VALUES
  ('Ashish Moses', 'Ashish.Moses@accionlabs.com', '$2b$10$dummy.hash.for.now', 'PDM', true),
  ('Rajesh Singh', 'Rajesh.Singh@accionlabs.com', '$2b$10$dummy.hash.for.now', 'PDM', true),
  ('Deepak', 'deepak.sandha@accionlabs.com', '$2b$10$dummy.hash.for.now', 'PDM', true),
  ('Shubhanjali Sinha', 'Shubhanjali.sinha@accionlabs.com', '$2b$10$dummy.hash.for.now', 'PDM', true)
ON CONFLICT (email) DO NOTHING;
