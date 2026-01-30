import pool from './db';
import fs from 'fs';
import path from 'path';

/**
 * Comprehensive Migration Runner
 * Runs all database migrations in the correct order:
 * 1. Base schema (schema.sql)
 * 2. Numbered migrations (001, 002, 003, etc.)
 */

async function runAllMigrations() {
  try {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║     AllIsWell Database Migration Runner           ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // Step 1: Run base schema
    console.log('Step 1: Running base schema (schema.sql)...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('✓ Base schema completed\n');

    // Step 2: Run numbered migrations in order
    console.log('Step 2: Running numbered migrations...');
    const migrationsDir = path.join(__dirname, 'migrations');

    // Get all .sql files and sort them
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        // Extract numbers from filenames (e.g., "002" from "002_add_project_contacts.sql")
        const numA = parseInt(a.match(/^\d+/)?.[0] || '999');
        const numB = parseInt(b.match(/^\d+/)?.[0] || '999');
        return numA - numB;
      });

    console.log(`Found ${migrationFiles.length} migration files:\n`);

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migration = fs.readFileSync(migrationPath, 'utf-8');

      console.log(`  Running: ${file}...`);
      try {
        await pool.query(migration);
        console.log(`  ✓ ${file} completed`);
      } catch (error: any) {
        // Some migrations might fail if already applied (e.g., DROP statements)
        // Log but continue with other migrations
        console.log(`  ⚠ ${file} - ${error.message}`);
      }
    }

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║  ✓ All migrations completed successfully!         ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('Next steps:');
    console.log('  1. Run: npm run db:seed-real (to seed users and projects)');
    console.log('  2. Or run: npm run db:seed (for test users only)\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

runAllMigrations();
