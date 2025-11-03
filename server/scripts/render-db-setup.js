#!/usr/bin/env node

/**
 * Render Database Setup Script
 *
 * This script initializes the database for Render deployments.
 * It runs the schema (db.sql), seeds base data (seed.sql), and runs
 * programmatic seeding (seed.js).
 *
 * Usage:
 *   NODE_ENV=production DATABASE_URL=<connection-string> node scripts/render-db-setup.js
 *   OR
 *   npm run db:setup:render
 */

import init from '../src/db/init.js';
import pool from '../src/db/pool.js';

console.log('🚀 Starting Render database setup...\n');

init()
  .then(() => {
    console.log('\n✅ Render database setup completed successfully!');
    process.exitCode = 0;
  })
  .catch((err) => {
    // If tables already exist (PostgreSQL error code 42P07), treat as success
    if (err.code === '42P07') {
      console.log('\n✅ Database already initialized (tables exist)');
      process.exitCode = 0;
    } else {
      console.error('\n❌ Render database setup failed:');
      console.error(err);
      process.exitCode = 1;
    }
  })
  .finally(async () => {
    console.log('\nClosing database connection...');
    await pool.end();
    console.log('Done.\n');
  });
