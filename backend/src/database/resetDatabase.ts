import pool from './db';

/**
 * Database Reset Script
 * WARNING: This will DROP ALL TABLES and delete all data!
 * Use only in staging/development environments!
 */

async function resetDatabase() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              DATABASE RESET SCRIPT                         ║');
    console.log('║                                                            ║');
    console.log('║  ⚠️  WARNING: This will DELETE ALL DATA! ⚠️                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Check environment
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('production') || dbUrl.includes('prod')) {
      console.error('✗ ABORTED: Cannot run reset on production database!');
      console.error('  Database URL contains "production" or "prod"');
      process.exit(1);
    }

    console.log('Database:', dbUrl.replace(/:[^:@]+@/, ':****@'));
    console.log('\nDropping all tables...\n');

    // Drop tables in reverse order of dependencies
    const dropStatements = [
      'DROP TABLE IF EXISTS comments CASCADE;',
      'DROP TABLE IF EXISTS weekly_status CASCADE;',
      'DROP TABLE IF EXISTS projects CASCADE;',
      'DROP TABLE IF EXISTS business_unit_heads CASCADE;',
      'DROP TABLE IF EXISTS users CASCADE;',
      'DROP TABLE IF EXISTS project_values CASCADE;',
      'DROP TABLE IF EXISTS project_operations CASCADE;',
    ];

    for (const statement of dropStatements) {
      const tableName = statement.match(/DROP TABLE IF EXISTS (\w+)/)?.[1];
      try {
        await pool.query(statement);
        console.log(`  ✓ Dropped table: ${tableName}`);
      } catch (error: any) {
        console.log(`  ⚠ Table ${tableName}: ${error.message}`);
      }
    }

    console.log('\n✓ Database reset completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run db:deploy-staging (full deployment with data)');
    console.log('  2. Or run: npm run db:migrate-all (migrations only)\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
