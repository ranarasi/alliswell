import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';
import pool from './db';

interface CSVRow {
  client: string;
  date: string;
  value: string;
}

async function importValues() {
  console.log('Starting value import...');

  const csvPath = path.join(__dirname, '../../../value_repository_q4.csv');
  const rows: CSVRow[] = [];

  // Read CSV file
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csvParser())
      .on('data', (row: any) => {
        if (row.client && row.client.trim()) {
          rows.push(row);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Found ${rows.length} CSV rows to process`);

  // Get admin user to use as submitted_by
  const adminResult = await pool.query(
    "SELECT id, name FROM users WHERE role = 'Admin' LIMIT 1"
  );

  if (adminResult.rows.length === 0) {
    throw new Error('No admin user found. Please create an admin user first.');
  }

  const adminUser = adminResult.rows[0];
  console.log(`Using admin user: ${adminUser.name} (${adminUser.id})`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const clientName = row.client.trim();

      // Skip empty rows
      if (!clientName || !row.value || !row.value.trim()) {
        skipped++;
        continue;
      }

      // Find project by client name
      const projectResult = await pool.query(
        'SELECT id, name, client FROM projects WHERE LOWER(client) = LOWER($1) LIMIT 1',
        [clientName]
      );

      if (projectResult.rows.length === 0) {
        console.log(`⚠️  No project found for client: ${clientName}`);
        skipped++;
        continue;
      }

      const project = projectResult.rows[0];

      // Check if this exact value already exists for this project
      const existingValue = await pool.query(
        'SELECT id FROM project_values WHERE project_id = $1 AND content = $2 LIMIT 1',
        [project.id, row.value]
      );

      if (existingValue.rows.length > 0) {
        console.log(`⏭️  Value already exists for ${project.name}, skipping...`);
        skipped++;
        continue;
      }

      // Insert value
      await pool.query(
        `INSERT INTO project_values (project_id, content, submitted_by, submitted_by_name, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [project.id, row.value, adminUser.id, adminUser.name]
      );

      console.log(`✅ Imported value for project: ${project.name} (${clientName})`);
      imported++;

    } catch (error) {
      console.error(`❌ Error processing row for client ${row.client}:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Import complete!');
  console.log('='.repeat(60));
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(60));

  await pool.end();
}

// Run the import
importValues().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
