import pool from './db';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

/**
 * All-in-One Staging Deployment Script
 * This script:
 * 1. Runs all database migrations
 * 2. Seeds users (admin, practice head, PDMs)
 * 3. Seeds projects from CSV
 * 4. Displays all credentials
 */

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

async function deployStaging() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     AllIsWell Staging Deployment Script                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // STEP 1: Run all migrations
    console.log('STEP 1: Running database migrations...');
    console.log('─'.repeat(60));

    // Run base schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('✓ Base schema applied');

    // Run numbered migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/^\d+/)?.[0] || '999');
        const numB = parseInt(b.match(/^\d+/)?.[0] || '999');
        return numA - numB;
      });

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migration = fs.readFileSync(migrationPath, 'utf-8');
      try {
        await pool.query(migration);
        console.log(`✓ ${file}`);
      } catch (error: any) {
        console.log(`⚠ ${file} - ${error.message}`);
      }
    }

    console.log(`\n✓ All migrations completed (${migrationFiles.length + 1} files)\n`);

    // STEP 2: Seed system users
    console.log('STEP 2: Seeding system users...');
    console.log('─'.repeat(60));

    // Create Admin user
    const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    await pool.query(
      `INSERT INTO users (email, password, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password
       RETURNING id, email, name, role`,
      ['admin@alliswell.com', adminPassword, 'Admin User', 'Admin', true]
    );
    console.log('✓ Admin user created: admin@alliswell.com');

    // Create Practice Head user
    const phPassword = await bcrypt.hash('head123', SALT_ROUNDS);
    await pool.query(
      `INSERT INTO users (email, password, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password
       RETURNING id, email, name, role`,
      ['head@alliswell.com', phPassword, 'Alex Kumar', 'Practice Head', true]
    );
    console.log('✓ Practice Head user created: head@alliswell.com\n');

    // STEP 3: Seed real data from CSV
    console.log('STEP 3: Seeding projects and PDM users from CSV...');
    console.log('─'.repeat(60));

    const csvPath = path.join(__dirname, '../../..', 'manager-project.csv');

    if (!fs.existsSync(csvPath)) {
      console.log('⚠ CSV file not found at:', csvPath);
      console.log('  Skipping project and PDM seeding.');
      console.log('  To seed projects, place manager-project.csv in project root.\n');
    } else {
      const data = parseCSV(csvPath);
      console.log(`✓ Parsed ${data.length} rows from CSV`);

      // Get unique PDMs
      const uniquePDMs = new Map<string, string>();
      data.forEach(row => {
        if (!uniquePDMs.has(row.email)) {
          uniquePDMs.set(row.email, row.name);
        }
      });

      console.log(`\nCreating ${uniquePDMs.size} PDM users:`);
      const pdmMap = new Map<string, string>(); // email -> user_id
      const pdmCredentials: Array<{ name: string; email: string; password: string }> = [];

      for (const [email, name] of uniquePDMs) {
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
        pdmCredentials.push({ name, email, password });
        console.log(`  ✓ ${name} (${email})`);
      }

      console.log(`\n✓ Created ${uniquePDMs.size} PDM users`);

      // Create projects
      console.log(`\nCreating projects...`);
      let projectCount = 0;

      for (const row of data) {
        const pdmId = pdmMap.get(row.email);
        if (!pdmId) continue;

        const existingProject = await pool.query(
          'SELECT id FROM projects WHERE name = $1',
          [row.customer]
        );

        if (existingProject.rows.length > 0) {
          await pool.query(
            `UPDATE projects
             SET assigned_pdm = $1, status = 'Active'
             WHERE name = $2`,
            [pdmId, row.customer]
          );
        } else {
          const startDate = new Date().toISOString().split('T')[0];
          await pool.query(
            `INSERT INTO projects (name, client, start_date, status, assigned_pdm)
             VALUES ($1, $2, $3, $4, $5)`,
            [row.customer, row.customer, startDate, 'Active', pdmId]
          );
        }
        projectCount++;
      }

      console.log(`✓ Created/updated ${projectCount} projects\n`);

      // STEP 4: Display all credentials
      console.log('═'.repeat(60));
      console.log('✓ STAGING DEPLOYMENT COMPLETED SUCCESSFULLY!');
      console.log('═'.repeat(60));
      console.log('\n📋 LOGIN CREDENTIALS FOR STAGING\n');
      console.log('System Users:');
      console.log('─'.repeat(60));
      console.log('Admin:         admin@alliswell.com / admin123');
      console.log('Practice Head: head@alliswell.com / head123\n');

      console.log('PDM Users (password format: firstname123):');
      console.log('─'.repeat(60));
      pdmCredentials
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(({ name, email, password }) => {
          console.log(`${name.padEnd(25)} ${email.padEnd(40)} ${password}`);
        });
      console.log();
    }

    console.log('═'.repeat(60));
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'Not set');
    console.log('═'.repeat(60));
    console.log();

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Deployment failed:', error);
    process.exit(1);
  }
}

deployStaging();
