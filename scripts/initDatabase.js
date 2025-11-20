#!/usr/bin/env node

/**
 * Database Initialization Script for Fishek
 *
 * This script initializes the Neon PostgreSQL database with the required schema
 * Run with: node scripts/initDatabase.js
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('Please make sure your .env file contains the DATABASE_URL');
  process.exit(1);
}

console.log('🚀 Starting database initialization...\n');

async function initializeDatabase() {
  try {
    // Create SQL client
    const sql = neon(DATABASE_URL);

    // Read schema file
    const schemaPath = join(__dirname, '..', 'db', 'schema.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf-8');

    console.log('📖 Read schema from:', schemaPath);
    console.log('🔧 Executing database migrations...\n');

    // Execute the entire schema using unsafe SQL
    // This is safe for initialization scripts where we control the SQL content
    const result = await sql.unsafe(schemaSQL);

    console.log('✅ Database schema created successfully!');
    console.log('✅ Initial categories inserted');
    console.log('✅ Sample transactions inserted');
    console.log('\n🎉 Database initialization completed successfully!\n');
    console.log('You can now run your application with: pnpm dev\n');

  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(error.message);

    if (error.code) {
      console.error('Error code:', error.code);
    }

    console.error('\nPlease check:');
    console.error('1. Your DATABASE_URL is correct');
    console.error('2. Your database is accessible');
    console.error('3. You have the necessary permissions');

    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
