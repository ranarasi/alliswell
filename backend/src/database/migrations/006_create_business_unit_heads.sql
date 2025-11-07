-- Create Business Unit Heads table
CREATE TABLE IF NOT EXISTS business_unit_heads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Business Unit Heads
INSERT INTO business_unit_heads (name, email) VALUES
  ('Anand', 'anand.raja@accionlabs.com'),
  ('Shyam', 'shreshth.upadhyay@accionlabs.com'),
  ('Nitin', 'nitin.agarwal@accionlabs.com'),
  ('Sat', 'satyajit.bandyopadhyay@accionlabs.com'),
  ('Rohit', 'rohitj@accionlabs.com'),
  ('Santosh', 'santosh.saboo@accionlabs.com'),
  ('Krishna', 'krishna.singh@accionlabs.com'),
  ('Subra', 'subra@accionlabs.com'),
  ('Jaywant', 'jaywant.deshpande@e-zest.com')
ON CONFLICT (email) DO NOTHING;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_buh_email ON business_unit_heads(email);
CREATE INDEX IF NOT EXISTS idx_buh_active ON business_unit_heads(is_active);
