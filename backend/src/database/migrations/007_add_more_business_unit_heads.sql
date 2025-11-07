-- Add additional Business Unit Heads
INSERT INTO business_unit_heads (name, email) VALUES
  ('Prathima', 'prathima.rao@accionlabs.com'),
  ('Tony', 'akernan@accionlabs.com'),
  ('Abhishek', 'abhishek.sharma@accionlabs.com'),
  ('Ajay Tyagi', 'ajay.tyagi@accionlabs.com')
ON CONFLICT (email) DO NOTHING;
