const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'alliswell',
  user: 'ramesh',
  password: ''
});

// Status data from CSV
const statusData = [
  { customer: 'Cision', status: 'PRNewswire; PR Newswire\'s revamped customer portal Amplify launched; 28 Accion members participated in Cision Hackathon (10 ideas, 4 winners); Migrated ~1.7M assets from legacy Media Studio to new Media Service; Supported migration of clients and media points from legacy WiSE to CDE; Comms Cloud & Regionals support; Started new BuzzSumo application DevOps/SRE support project; PA3 (on-prem) to GCP migration of Data-Flow app in Cision France; Implemented feature preventing unauthorized data mining for multi-session users in Eureka/Europresse; C3 team progressing Project Bellwether to refresh C3 DB from Cision MDM' },
  { customer: 'Apex', status: 'Team size crossed 50; Setup of Primary & DR for Paxus/Efront/MetrosoftApps in KSA using best practices; Compass (Salesforce) managed UAT users and two major releases with Workday integration; Technology third-party assurance ensuring SLA compliance and streamlined vendor due-diligence & OneTrust onboarding; Holtara (ESG) enhancements released; GAM applications (Purefunds & Actuare) migration support' },
  { customer: 'Rotary', status: 'Launched Domino on modern microservices, event-driven architecture using Azure Service Bus; Delivered 72 features on time; Migrated legacy Drupal sites to Sitecore AI; Established metrics for end-to-end Agile execution; Completed AI GitHub Copilot documentation, code migration POC, and PI execution' },
  { customer: 'Lead Venture', status: 'Delivered 70+ high-quality releases across 13 workstreams in Q4; GA go-live of Instavid Mobile platform; Demonstrated VR integration for dealer/prospect decisioning; Migrated on-prem apps and Docker clusters to VMware Tanzu and Rancher; Achieved 3000+ productivity hours; 6 hackathon ideas presented, 5 added to product roadmaps' },
  { customer: 'Everbridge', status: 'In-person meeting with CTO confirmed for Feb 5, 2026 focused on Accion AI capabilities; Objective to position Accion as strategic AI innovation partner; VCC Classic, REI, Nixle, VCC SaaS running with matured processes; Overall delivery status GREEN' },
  { customer: 'Echo', status: 'FY25 Q4 platform inflection across PPM, SelectPay and Data Administration with disruption-free go-lives; Modernized enrollment, fee and payment foundations; Improved financial controls and revenue flexibility; Automation and self-service improved operational leverage; EchoHub core processing streamlined; SelectPay expanded integrations onboarding new TPAs with enhanced observability' },
  { customer: 'Riskonnect', status: 'Approval secured for two new workstreams starting Q1; Delivered 35 features across Insights; Integrated Power BI reporting into Angular app; Launched Role Management module; Advanced data engineering foundations for Actions, Internal Contacts and Risks' },
  { customer: 'Pollard', status: 'Headcount crossed 53 with 10 new onboardings; Client visit in Dec 2025; Engagement completes 7 years in Feb 2026; PlayOn production releases across multiple states; Accessibility remediation achieving ~90% WCAG 2.0 AA compliance; Suretrack 2.0 Java 21 and React 18 upgrade; Kansas Catalyst 1.56 releases' },
  { customer: 'Liquid Web', status: 'Implemented high-availability cluster visibility for sub-accounts; Integrated Veriff for fraud detection; Improved client onboarding UI; POC for Breeze.ai PERL to Python migration; POC for AI-based DevOps/SRE anomaly detection' },
  { customer: 'Dell', status: 'Aligned with Dell MyTodd outcome-based engagement model; Shift to value-driven delivery; Expansion driven through new proposals; Engagement with senior Dell leaders onsite and in India; Access to Product Engineering group established' },
  { customer: 'KinderCare', status: 'LineLeader migration for pilot centers replacing homegrown FMS; Data Warehouse updates implemented; PowerBI reports refactored using Databricks; FamilyBuilder 2.0 improvements boosted inquiry-to-enrollment conversions; Workflow optimization reduced runtime from 8+ hours to under 5 hours' },
  { customer: 'MSA', status: 'AI-accelerated modernization of legacy VB and .NET apps to .NET 8 microservices; Automated code conversion, testing, documentation and SQL-to-Snowflake migration; Achieved 66% faster framework upgrades, 3x faster code migration, 30–40% productivity gains and reduced technical debt' },
  { customer: 'Conservice', status: 'Closed SFA Drop-1 UAT on schedule; Delivered Drop-2 UAT progressing well; Phase II SoW requested; Submitted $1.5M proposal for next-phase growth' },
  { customer: 'ANA', status: 'Executed PTAP and APPFA projects on schedule; Delivered Drop-1 UAT; 10-member support team meeting all SLAs; Initiated discussions for new 2025 workstreams' },
  { customer: 'McCain Foods', status: 'ServiceNow HAMPro implemented and live; Hardware assets onboarded as single source of truth for APACSA; LATAM, EMENA and GB rollout planned Q1 2026; AKS DevSecOps platform implemented with AGS onboarded; Azure Wave 0 migration completed; Wave 1 in progress' }
];

// Client name mapping
const clientMapping = {
  'Cision': 'Cision',
  'Apex': 'Apex Group',
  'Rotary': 'Rotary All Accounts',
  'Lead Venture': 'LeadVenture',
  'Everbridge': 'Everbridge',
  'Echo': 'Echo Health',
  'Riskonnect': 'Riskonnect',
  'Pollard': 'Pollard',
  'Liquid Web': 'LiquidWeb',
  'Dell': 'DELL',
  'KinderCare': 'Kindercare',
  'MSA': 'MSA All Accounts',
  'Conservice': 'Conservice LLC',
  'ANA': 'American Nurse Association',
  'McCain Foods': 'McCain'
};

async function importStatuses() {
  const updatedClients = [];
  const weekEndingDate = '2024-12-30';

  try {
    for (const entry of statusData) {
      const mappedClient = clientMapping[entry.customer];

      if (!mappedClient) {
        console.log(`⚠️  No mapping found for: ${entry.customer}`);
        continue;
      }

      // Find project by client name
      const projectResult = await pool.query(
        'SELECT id, name, client FROM projects WHERE client = $1',
        [mappedClient]
      );

      if (projectResult.rows.length === 0) {
        console.log(`⚠️  No project found for client: ${mappedClient}`);
        continue;
      }

      const project = projectResult.rows[0];

      // Get a user to attribute the status to (use first PDM)
      const userResult = await pool.query(
        "SELECT id, name FROM users WHERE role = 'PDM' LIMIT 1"
      );

      if (userResult.rows.length === 0) {
        console.log('❌ No PDM users found in database');
        break;
      }

      const user = userResult.rows[0];

      // Insert status
      await pool.query(
        `INSERT INTO weekly_status
         (project_id, week_ending_date, overall_status, all_is_well, submitted_by, is_draft)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [project.id, weekEndingDate, 'Green', entry.status, user.id, false]
      );

      updatedClients.push({
        csvName: entry.customer,
        matchedClient: mappedClient,
        projectName: project.name
      });

      console.log(`✅ Updated: ${entry.customer} → ${mappedClient} (${project.name})`);
    }

    console.log('\n📊 Summary:');
    console.log(`Total entries in CSV: ${statusData.length}`);
    console.log(`Successfully updated: ${updatedClients.length}`);
    console.log(`\n✅ Updated clients:`);
    updatedClients.forEach(c => {
      console.log(`   - ${c.csvName} → ${c.matchedClient}`);
    });

  } catch (error) {
    console.error('Error importing statuses:', error);
  } finally {
    await pool.end();
  }
}

importStatuses();
