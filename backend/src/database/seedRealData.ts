import pool from './db';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const SALT_ROUNDS = 10;

interface CSVRow {
  name: string;
  email: string;
  customer: string;
}

function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Skip header
  const dataLines = lines.slice(1);

  const rows: CSVRow[] = [];
  for (const line of dataLines) {
    // Handle CSV parsing with potential commas in quoted fields
    const matches = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
    if (matches && matches.length >= 3) {
      const name = matches[0].replace(/^,?"?|"?$/g, '').trim();
      const email = matches[1].replace(/^,?"?|"?$/g, '').trim();
      const customer = matches[2].replace(/^,?"?|"?$/g, '').trim();

      if (name && email && customer) {
        rows.push({ name, email, customer });
      }
    }
  }

  return rows;
}

async function seedRealData() {
  try {
    console.log('Starting real data seeding...\n');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../..', 'manager-project.csv');
    const data = parseCSV(csvPath);

    console.log(`✓ Parsed ${data.length} rows from CSV\n`);

    // Create Admin and Practice Head users first
    console.log('Creating Admin and Practice Head users...');

    const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    await pool.query(
      `INSERT INTO users (email, password, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password
       RETURNING id, email, name, role`,
      ['admin@alliswell.com', adminPassword, 'Admin User', 'Admin', true]
    );
    console.log('  ✓ Admin user created');

    const phPassword = await bcrypt.hash('head123', SALT_ROUNDS);
    await pool.query(
      `INSERT INTO users (email, password, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password
       RETURNING id, email, name, role`,
      ['head@alliswell.com', phPassword, 'Alex Kumar', 'Practice Head', true]
    );
    console.log('  ✓ Practice Head user created\n');

    // Get unique PDMs
    const uniquePDMs = new Map<string, string>();
    data.forEach(row => {
      if (!uniquePDMs.has(row.email)) {
        uniquePDMs.set(row.email, row.name);
      }
    });

    console.log(`Creating ${uniquePDMs.size} PDM users...`);
    const pdmMap = new Map<string, string>(); // email -> user_id

    for (const [email, name] of uniquePDMs) {
      // Generate password from first name (lowercase)
      const firstName = name.split(' ')[0].toLowerCase();
      const password = `${firstName}123`;
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const result = await pool.query(
        `INSERT INTO users (email, password, name, role, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE
         SET password = EXCLUDED.password, name = EXCLUDED.name
         RETURNING id, email, name`,
        [email, hashedPassword, name, 'PDM', true]
      );

      pdmMap.set(email, result.rows[0].id);
      console.log(`  ✓ ${name} (${email}) - password: ${password}`);
    }

    console.log(`\n✓ Created ${uniquePDMs.size} PDM users\n`);

    // Create projects and assign to PDMs
    console.log('Creating projects and assignments...');
    let projectCount = 0;

    for (const row of data) {
      const pdmId = pdmMap.get(row.email);
      if (!pdmId) {
        console.log(`  ⚠ Skipping ${row.customer} - PDM not found: ${row.email}`);
        continue;
      }

      // Check if project already exists
      const existingProject = await pool.query(
        'SELECT id FROM projects WHERE name = $1',
        [row.customer]
      );

      if (existingProject.rows.length > 0) {
        // Update existing project
        await pool.query(
          `UPDATE projects
           SET assigned_pdm = $1, status = 'Active'
           WHERE name = $2`,
          [pdmId, row.customer]
        );
      } else {
        // Create new project
        const startDate = new Date().toISOString().split('T')[0]; // Today's date
        await pool.query(
          `INSERT INTO projects (name, client, start_date, status, assigned_pdm)
           VALUES ($1, $2, $3, $4, $5)`,
          [row.customer, row.customer, startDate, 'Active', pdmId]
        );
      }

      projectCount++;
    }

    console.log(`✓ Created/updated ${projectCount} projects\n`);

    // Print summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✓ Real data seeding completed successfully!');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('Login Credentials:');
    console.log('──────────────────────────────────────────────────');
    console.log('Admin:         admin@alliswell.com / admin123');
    console.log('Practice Head: head@alliswell.com / head123\n');

    console.log('PDM Users (password format: firstname123):');
    console.log('──────────────────────────────────────────────────');
    for (const [email, name] of uniquePDMs) {
      const firstName = name.split(' ')[0].toLowerCase();
      console.log(`${name.padEnd(25)} ${email.padEnd(35)} ${firstName}123`);
    }
    console.log();

    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
}

seedRealData();
