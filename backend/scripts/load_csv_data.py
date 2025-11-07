#!/usr/bin/env python3
"""
Script to load project and operations data from CSV file.
Maps DD and BUH names to master data and loads 2025 operations.
"""

import csv
import re
import psycopg2
from decimal import Decimal
from datetime import datetime

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'alliswell',
    'user': 'ramesh',
    'password': ''
}

# Master data mappings (from database query)
DD_MAPPING = {
    'Anand Shah': 'f01db48a-a24d-4257-9f2d-b125b1f04050',
    'Bhavesh Yagnik': '32b7f76a-5933-4422-b7c9-1337f69d6509',
    'Mahesh Subramaniam': '71916dfa-ef1d-474b-9c5f-0f036273f46d',
    'Mahesh S': '71916dfa-ef1d-474b-9c5f-0f036273f46d',  # Alternative name
    'Munish Goyal': '543758bf-c1f4-4ed9-8c95-639228a002bb',
    'Nikhil Damwani': '3490b701-de1c-4622-8ef2-ee30b8e03a7d',
    'Sunil Das': '09773460-37df-47cb-8d0d-f0055a24ae86',
    'Swathi Kadoor': 'adfab707-1add-4792-aaae-4e7d08719948',
    'Swathi/Abhi': 'adfab707-1add-4792-aaae-4e7d08719948',  # Alternative name
    'Venugopal Reddy': '7dcb23a4-a8a4-4e15-883c-c9287cda04e0',
    'Vishal Gadge': '6f69a344-c8a4-473a-85d4-e18d0babea05',
    'Ashish Moses': '4af902f8-9d96-48ce-beee-409bd372e467',
    'Rajesh Singh': '7edee49c-54bb-431d-a6d5-efcb24479225',
    'Shubhanjali Sinha': 'f6592ebf-0467-4931-9767-7df1f1b37cc4',
    'Deepak': '0bff58ac-71eb-417e-8800-3a4578727162',
    'Ananth Rao': None,  # Not in master data
}

BUH_MAPPING = {
    'Anand': 'anand.raja@accionlabs.com',
    'Anand Raja': 'anand.raja@accionlabs.com',
    'Krishna': 'krishna.singh@accionlabs.com',
    'Krishna Singh': 'krishna.singh@accionlabs.com',
    'Nitin': 'nitin.agarwal@accionlabs.com',
    'Nitin Agarwal': 'nitin.agarwal@accionlabs.com',
    'Prathima': 'prathima.rao@accionlabs.com',
    'Ramesh': None,  # Not in master data - might be "Sat"?
    'Ramesh Narsimhan': None,  # Not in master data
    'Rohit': 'rohitj@accionlabs.com',
    'Santosh': 'santosh.saboo@accionlabs.com',
    'Santosh Saboo': 'santosh.saboo@accionlabs.com',
    'Sat': 'satyajit.bandyopadhyay@accionlabs.com',
    'Shyam': 'shreshth.upadhyay@accionlabs.com',
    'Tony': 'akernan@accionlabs.com',
    'Mikunj': 'anand.raja@accionlabs.com',  # Changed to Anand Raja
}

# Month name to number mapping
MONTH_MAPPING = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
}

discrepancies = []

def clean_numeric(value):
    """Clean and convert numeric values from CSV."""
    if not value or value.strip() == '':
        return None
    # Remove currency symbols, commas, spaces, and quotes
    cleaned = re.sub(r'[\$,\s"\']', '', value)
    try:
        return Decimal(cleaned)
    except:
        return None

def clean_percentage(value):
    """Clean and convert percentage values."""
    if not value or value.strip() == '':
        return None
    # Remove % sign and spaces
    cleaned = re.sub(r'[%\s]', '', value)
    try:
        return Decimal(cleaned)
    except:
        return None

def clean_integer(value):
    """Clean and convert integer values."""
    if not value or value.strip() == '':
        return None
    try:
        # Handle decimal strings like "3.00"
        return int(float(value))
    except:
        return None

def map_dd_name(dd_name):
    """Map DD name from CSV to user ID."""
    if not dd_name or dd_name.strip() == '':
        discrepancies.append(f"⚠️  Empty DD name found")
        return None

    dd_name = dd_name.strip()
    if dd_name in DD_MAPPING:
        if DD_MAPPING[dd_name] is None:
            discrepancies.append(f"❌ DD not found in master data: '{dd_name}'")
        return DD_MAPPING[dd_name]
    else:
        discrepancies.append(f"❌ Unknown DD name: '{dd_name}'")
        return None

def map_buh_name(buh_name):
    """Map BUH name from CSV to email."""
    if not buh_name or buh_name.strip() == '':
        discrepancies.append(f"⚠️  Empty BUH name found")
        return None

    buh_name = buh_name.strip()
    if buh_name in BUH_MAPPING:
        if BUH_MAPPING[buh_name] is None:
            discrepancies.append(f"❌ BUH not found in master data: '{buh_name}'")
        return BUH_MAPPING[buh_name]
    else:
        discrepancies.append(f"❌ Unknown BUH name: '{buh_name}'")
        return None

def process_csv(csv_file_path):
    """Process CSV file and load data into database."""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Get admin user ID for submitted_by field
    cursor.execute("SELECT id FROM users WHERE role = 'Admin' LIMIT 1")
    admin_user_id = cursor.fetchone()[0]

    projects_created = 0
    projects_updated = 0
    operations_inserted = 0
    skipped_rows = 0

    with open(csv_file_path, 'r', encoding='utf-8-sig') as file:
        reader = csv.DictReader(file)

        for row_num, row in enumerate(reader, start=2):
            account_name = row.get('Account Name', '').strip()

            # Skip empty rows
            if not account_name:
                continue

            status = row.get('Status', '').strip()
            buh_name = row.get('BUH', '').strip()
            dd_name = row.get('DD', '').strip()

            # Map DD and BUH
            dd_id = map_dd_name(dd_name)
            buh_email = map_buh_name(buh_name)

            if not dd_id:
                discrepancies.append(f"⚠️  Row {row_num} ({account_name}): Skipping - no valid DD mapping")
                skipped_rows += 1
                continue

            # Check if project exists
            cursor.execute(
                "SELECT id FROM projects WHERE LOWER(name) = LOWER(%s) LIMIT 1",
                (account_name,)
            )
            result = cursor.fetchone()

            if result:
                project_id = result[0]
                # Update project with DD and BUH
                cursor.execute("""
                    UPDATE projects
                    SET assigned_pdm = %s,
                        business_unit_head = %s,
                        status = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (dd_id, buh_email, status if status else 'Active', project_id))
                projects_updated += 1
            else:
                # Create new project with default start_date
                cursor.execute("""
                    INSERT INTO projects (name, assigned_pdm, business_unit_head, status, client, start_date)
                    VALUES (%s, %s, %s, %s, %s, '2025-01-01')
                    RETURNING id
                """, (account_name, dd_id, buh_email, status if status else 'Active', account_name))
                project_id = cursor.fetchone()[0]
                projects_created += 1

            # Process operations data for each month
            for month_name, month_num in MONTH_MAPPING.items():
                team_size_key = f'{month_name} Team size'
                shadows_key = f'{month_name} shadows'
                ramp_up_key = f'{month_name} ramp up'
                ramp_down_key = f'{month_name} ramp down'
                utilization_key = f'{month_name} utilization'
                revenue_key = f'{month_name} Revenue'
                cost_key = f'{month_name} Cost'

                # Check if data exists for this month
                team_size = clean_integer(row.get(team_size_key, ''))
                revenue = clean_numeric(row.get(revenue_key, ''))
                cost = clean_numeric(row.get(cost_key, ''))

                # Skip if no data for this month
                if team_size is None and revenue is None and cost is None:
                    continue

                shadows = clean_integer(row.get(shadows_key, '')) or 0
                ramp_up = clean_integer(row.get(ramp_up_key, '')) or 0
                ramp_down = clean_integer(row.get(ramp_down_key, '')) or 0
                utilization = clean_percentage(row.get(utilization_key, '')) or Decimal('0')

                # Calculate GM percentage if revenue and cost are available
                gm_percentage = Decimal('0')
                if revenue and revenue > 0 and cost:
                    gm_percentage = ((revenue - cost) / revenue * 100).quantize(Decimal('0.01'))

                # Insert or update operations data
                try:
                    cursor.execute("""
                        INSERT INTO project_operations
                        (project_id, month, year, team_size, revenue, cost, gm_percentage,
                         utilization_percentage, shadows, ramp_up, ramp_down, submitted_by)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (project_id, month, year)
                        DO UPDATE SET
                            team_size = EXCLUDED.team_size,
                            revenue = EXCLUDED.revenue,
                            cost = EXCLUDED.cost,
                            gm_percentage = EXCLUDED.gm_percentage,
                            utilization_percentage = EXCLUDED.utilization_percentage,
                            shadows = EXCLUDED.shadows,
                            ramp_up = EXCLUDED.ramp_up,
                            ramp_down = EXCLUDED.ramp_down,
                            updated_at = CURRENT_TIMESTAMP
                    """, (project_id, month_num, 2025, team_size or 0, revenue or 0, cost or 0,
                          gm_percentage, utilization, shadows, ramp_up, ramp_down, admin_user_id))
                    operations_inserted += 1
                except Exception as e:
                    discrepancies.append(f"⚠️  Error inserting operations for {account_name} - {month_name}: {str(e)}")

    conn.commit()
    cursor.close()
    conn.close()

    return projects_created, projects_updated, operations_inserted, skipped_rows

def main():
    print("=" * 80)
    print("CSV DATA LOADER - AllIsWell Project")
    print("=" * 80)
    print()

    csv_file_path = '/Users/ramesh/Documents/projects/alliswell/Delivery_GM_Utilization_ 2025.csv'

    try:
        projects_created, projects_updated, operations_inserted, skipped_rows = process_csv(csv_file_path)

        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"✅ Projects Created: {projects_created}")
        print(f"✅ Projects Updated: {projects_updated}")
        print(f"✅ Operations Records Inserted: {operations_inserted}")
        print(f"⚠️  Rows Skipped: {skipped_rows}")

        if discrepancies:
            print("\n" + "=" * 80)
            print("DISCREPANCIES FOUND")
            print("=" * 80)
            # Deduplicate discrepancies
            unique_discrepancies = list(set(discrepancies))
            for disc in sorted(unique_discrepancies):
                print(disc)
        else:
            print("\n✅ No discrepancies found!")

        print("\n" + "=" * 80)
        print("Load completed successfully!")
        print("=" * 80)

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
