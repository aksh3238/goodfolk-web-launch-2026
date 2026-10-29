import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { isPostgresConfigured, initPostgresSchema, syncPostgresData, getPostgresPool } from '../src/server/postgres';

async function run() {
  console.log('====================================================');
  console.log(' Goodfolk Solution — Neon PostgreSQL Migration Tool');
  console.log('====================================================');

  if (!isPostgresConfigured()) {
    console.error('ERROR: DATABASE_URL environment variable is not defined.');
    console.error('Please set DATABASE_URL in your .env file or environment, e.g.:');
    console.error('DATABASE_URL="postgresql://user:pass@ep-xyz.region.neon.tech/neondb?sslmode=require"');
    process.exit(1);
  }

  const dbPath = path.resolve(process.cwd(), 'data', 'database.json');
  if (!fs.existsSync(dbPath)) {
    console.error(`ERROR: database.json file not found at ${dbPath}`);
    process.exit(1);
  }

  console.log(`[1/3] Reading source data from: ${dbPath}`);
  const rawData = fs.readFileSync(dbPath, 'utf-8');
  const databaseData = JSON.parse(rawData);

  console.log(`[2/3] Connecting to Neon PostgreSQL and initializing schema...`);
  const schemaReady = await initPostgresSchema();
  if (!schemaReady) {
    console.error('ERROR: Failed to initialize schema in PostgreSQL.');
    process.exit(1);
  }

  console.log(`[3/3] Migrating collections to Neon PostgreSQL...`);
  const syncSuccess = await syncPostgresData(databaseData);

  if (syncSuccess) {
    console.log('----------------------------------------------------');
    console.log('SUCCESS: Migration to Neon PostgreSQL completed!');
    console.log(`- Enquiries: ${databaseData.enquiries?.length || 0}`);
    console.log(`- Projects: ${databaseData.projects?.length || 0}`);
    console.log(`- Payments: ${databaseData.payments?.length || 0}`);
    console.log(`- Invoices: ${databaseData.invoices?.length || 0}`);
    console.log(`- Receipts: ${databaseData.receipts?.length || 0}`);
    console.log(`- Bank Accounts: ${databaseData.bankAccounts?.length || 0}`);
    console.log(`- Portfolio Projects: ${databaseData.portfolioProjects?.length || 0}`);
    console.log(`- Service Concepts: ${databaseData.serviceConcepts?.length || 0}`);
    console.log(`- Media Items: ${databaseData.mediaLibrary?.length || 0}`);
    console.log(`- Content Versions: ${databaseData.contentVersions?.length || 0}`);
    console.log('----------------------------------------------------');
  } else {
    console.error('ERROR: Migration encountered issues during synchronization.');
  }

  const pool = getPostgresPool();
  if (pool) {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration failed with unexpected error:', err);
  process.exit(1);
});
