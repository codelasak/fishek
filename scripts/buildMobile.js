#!/usr/bin/env node

/**
 * Mobile Build Script for Capacitor
 * 
 * This script builds a static version of the Next.js app for Capacitor
 * by temporarily removing API routes that cannot be statically exported.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DIR = path.join(__dirname, '..', 'app');
const API_DIR = path.join(APP_DIR, 'api');
const API_BACKUP_DIR = path.join(__dirname, '..', '.api.backup'); // Move outside app dir
const TRANSACTION_DIR = path.join(APP_DIR, 'transaction');
const TRANSACTION_BACKUP_DIR = path.join(__dirname, '..', '.transaction.backup');
const MIDDLEWARE_FILE = path.join(__dirname, '..', 'middleware.ts');
const MIDDLEWARE_BACKUP = path.join(__dirname, '..', '.middleware.ts.backup');

console.log('🚀 Starting mobile build process...\n');

try {
  // Step 1: Copy .env.mobile to .env.local
  console.log('📝 Step 1: Configuring environment variables...');
  if (fs.existsSync(path.join(__dirname, '..', '.env.mobile'))) {
    fs.copyFileSync(
      path.join(__dirname, '..', '.env.mobile'),
      path.join(__dirname, '..', '.env.local')
    );
    console.log('✅ Environment configured for mobile\n');
  } else {
    console.warn('⚠️  .env.mobile not found, skipping env setup\n');
  }

  // Step 2: Backup and remove API routes
  console.log('📦 Step 2: Backing up API routes...');
  if (fs.existsSync(API_DIR)) {
    if (fs.existsSync(API_BACKUP_DIR)) {
      fs.rmSync(API_BACKUP_DIR, { recursive: true, force: true });
    }
    fs.renameSync(API_DIR, API_BACKUP_DIR);
    console.log('✅ API routes backed up\n');
  }

  // Step 3: Backup and remove middleware
  console.log('📦 Step 3: Backing up middleware...');
  if (fs.existsSync(MIDDLEWARE_FILE)) {
    fs.renameSync(MIDDLEWARE_FILE, MIDDLEWARE_BACKUP);
    console.log('✅ Middleware backed up\n');
  }

  // Step 4: Backup and remove dynamic transaction route
  console.log('📦 Step 4: Backing up transaction detail page (dynamic route)...');
  if (fs.existsSync(TRANSACTION_DIR)) {
    if (fs.existsSync(TRANSACTION_BACKUP_DIR)) {
      fs.rmSync(TRANSACTION_BACKUP_DIR, { recursive: true, force: true });
    }
    fs.renameSync(TRANSACTION_DIR, TRANSACTION_BACKUP_DIR);
    console.log('✅ Transaction route backed up\n');
  }

  // Step 5: Build Next.js static export
  console.log('🏗️  Step 5: Building Next.js static export...');
  execSync('pnpm next build', { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, '..'),
    env: { 
      ...process.env, 
      SKIP_TYPE_CHECK: 'true',
      MOBILE_BUILD: 'true' // Enable static export mode
    }
  });
  console.log('✅ Next.js build complete\n');

  // Step 6: Restore API routes
  console.log('♻️  Step 6: Restoring API routes...');
  if (fs.existsSync(API_BACKUP_DIR)) {
    fs.renameSync(API_BACKUP_DIR, API_DIR);
    console.log('✅ API routes restored\n');
  }

  // Step 7: Restore middleware
  console.log('♻️  Step 7: Restoring middleware...');
  if (fs.existsSync(MIDDLEWARE_BACKUP)) {
    fs.renameSync(MIDDLEWARE_BACKUP, MIDDLEWARE_FILE);
    console.log('✅ Middleware restored\n');
  }

  // Step 8: Restore transaction route
  console.log('♻️  Step 8: Restoring transaction route...');
  if (fs.existsSync(TRANSACTION_BACKUP_DIR)) {
    fs.renameSync(TRANSACTION_BACKUP_DIR, TRANSACTION_DIR);
    console.log('✅ Transaction route restored\n');
  }

  // Step 9: Sync with Capacitor
  console.log('🔄 Step 9: Syncing with Capacitor...');
  execSync('npx cap sync', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Capacitor sync complete\n');

  console.log('🎉 Mobile build completed successfully!');
  console.log('\n📱 Next steps:');
  console.log('   • Run: pnpm run cap:open:ios');
  console.log('   • Or run: pnpm run cap:run:ios\n');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  
  // Attempt to restore files on error
  console.log('\n🔧 Attempting to restore files...');
  if (fs.existsSync(API_BACKUP_DIR) && !fs.existsSync(API_DIR)) {
    fs.renameSync(API_BACKUP_DIR, API_DIR);
    console.log('✅ API routes restored');
  }
  if (fs.existsSync(MIDDLEWARE_BACKUP) && !fs.existsSync(MIDDLEWARE_FILE)) {
    fs.renameSync(MIDDLEWARE_BACKUP, MIDDLEWARE_FILE);
    console.log('✅ Middleware restored');
  }
  if (fs.existsSync(TRANSACTION_BACKUP_DIR) && !fs.existsSync(TRANSACTION_DIR)) {
    fs.renameSync(TRANSACTION_BACKUP_DIR, TRANSACTION_DIR);
    console.log('✅ Transaction route restored');
  }
  
  process.exit(1);
}
