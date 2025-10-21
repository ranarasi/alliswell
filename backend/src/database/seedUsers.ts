import pool from './db';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function seedUsers() {
  try {
    console.log('Seeding users...');

    // Hash the password for admin
    const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);

    // Insert admin user
    const adminResult = await pool.query(
      `INSERT INTO users (email, password, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password
       RETURNING id, email, name, role`,
      ['admin@alliswell.com', adminPassword, 'Admin User', 'Admin', true]
    );

    console.log('✓ Admin user created/updated:', adminResult.rows[0]);

    // Create sample PDM user
    const pdmPassword = await bcrypt.hash('pdm123', SALT_ROUNDS);
    const pdmResult = await pool.query(
      `INSERT INTO users (email, password, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password
       RETURNING id, email, name, role`,
      ['pdm@alliswell.com', pdmPassword, 'Sarah Chen', 'PDM', true]
    );

    console.log('✓ PDM user created/updated:', pdmResult.rows[0]);

    // Create sample Practice Head user
    const phPassword = await bcrypt.hash('head123', SALT_ROUNDS);
    const phResult = await pool.query(
      `INSERT INTO users (email, password, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password
       RETURNING id, email, name, role`,
      ['head@alliswell.com', phPassword, 'Alex Kumar', 'Practice Head', true]
    );

    console.log('✓ Practice Head user created/updated:', phResult.rows[0]);

    console.log('\n✓ All users seeded successfully!');
    console.log('\nDefault credentials:');
    console.log('Admin:         admin@alliswell.com / admin123');
    console.log('PDM:           pdm@alliswell.com / pdm123');
    console.log('Practice Head: head@alliswell.com / head123');

    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
}

seedUsers();
