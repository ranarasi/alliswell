import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';
import pool from './db';

interface CSVRow {
  client: string;
  date: string;
  value: string;
}

// Parse date from CSV format (e.g., "Nov-25", "Q4 2025", "Dec-24")
function parseValueDate(dateStr: string): Date {
  if (!dateStr || !dateStr.trim()) {
    return new Date(); // Default to today
  }

  const trimmed = dateStr.trim();

  // Handle "Month-Year" format (e.g., "Nov-25", "Dec-24")
  const monthYearMatch = trimmed.match(/^([A-Za-z]+)-(\d{2})$/);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1];
    const yearShort = monthYearMatch[2];
    const year = parseInt(yearShort) < 50 ? 2000 + parseInt(yearShort) : 1900 + parseInt(yearShort);

    const monthMap: { [key: string]: number } = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    const month = monthMap[monthName.toLowerCase().substring(0, 3)];
    if (month !== undefined) {
      return new Date(year, month, 1);
    }
  }

  // Handle "Q1 2025", "Q4 2025" format
  const quarterMatch = trimmed.match(/^Q(\d)\s+(\d{4})$/);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1]);
    const year = parseInt(quarterMatch[2]);
    const month = (quarter - 1) * 3; // Q1=0 (Jan), Q2=3 (Apr), Q3=6 (Jul), Q4=9 (Oct)
    return new Date(year, month, 1);
  }

  // Handle "Q4" format (assume current year)
  const quarterOnlyMatch = trimmed.match(/^Q(\d)$/);
  if (quarterOnlyMatch) {
    const quarter = parseInt(quarterOnlyMatch[1]);
    const year = 2025; // Default to 2025
    const month = (quarter - 1) * 3;
    return new Date(year, month, 1);
  }

  // Default to today if no match
  return new Date();
}

async function importValuesWithDates() {
  console.log('Starting value import with date parsing...');

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

  // Get admin user
  const adminResult = await pool.query(
    "SELECT id, name FROM users WHERE role = 'Admin' LIMIT 1"
  );

  if (adminResult.rows.length === 0) {
    throw new Error('No admin user found.');
  }

  const adminUser = adminResult.rows[0];
  console.log(`Using admin user: ${adminUser.name}`);

  // First, delete all existing values
  await pool.query('DELETE FROM project_values');
  console.log('Deleted all existing values');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const clientName = row.client.trim();

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
      const valueDate = parseValueDate(row.date);

      // Insert value with parsed date
      const valueDateStr = valueDate.toISOString();
      await pool.query(
        `INSERT INTO project_values (project_id, content, submitted_by, submitted_by_name, value_date, created_at)
         VALUES ($1, $2, $3, $4, $5::date, $5::timestamp)`,
        [project.id, row.value, adminUser.id, adminUser.name, valueDateStr]
      );

      console.log(`✅ Imported value for ${project.name} (${clientName}) - Date: ${valueDate.toISOString().split('T')[0]}`);
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
importValuesWithDates().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
