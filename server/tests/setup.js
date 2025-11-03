import { beforeAll, afterAll } from 'vitest';
import pool from '../src/db/pool.js';

beforeAll(async () => {
  // Ensure database connection is established
  try {
    const client = await pool.connect();
    console.log('Test database connection established');
    client.release();
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

// Teardown DB when tests are done
afterAll(async () => {
  // Close database connection pool
  await pool.end();
  console.log('Test database connection closed');
});
