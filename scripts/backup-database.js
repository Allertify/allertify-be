#!/usr/bin/env node

/**
 * Database Backup Script for Allertify
 * Handles full backups, incremental backups, and data export
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '15432',
  database: process.env.DB_NAME || 'allertify',
  user: process.env.DB_USER || 'allertify',
  password: process.env.DB_PASSWORD || '12345678'
};

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create full database backup using pg_dump
 */
async function createFullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `full_backup_${timestamp}.sql`);
  
  const command = `PGPASSWORD="${DB_CONFIG.password}" pg_dump -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -F c -f "${backupFile}"`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Full backup failed:', error.message);
        reject(error);
        return;
      }
      console.log(`✅ Full backup created: ${backupFile}`);
      resolve(backupFile);
    });
  });
}

/**
 * Export data to JSON format using Prisma
 */
async function exportDataToJSON() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportFile = path.join(BACKUP_DIR, `data_export_${timestamp}.json`);
  
  try {
    // Export all tables data
    const data = {
      users: await prisma.user.findMany(),
      products: await prisma.product.findMany(),
      allergens: await prisma.allergen.findMany(),
      emergency_contacts: await prisma.emergency_contact.findMany(),
      subscriptions: await prisma.subscription.findMany(),
      product_scans: await prisma.product_scan.findMany(),
      product_reports: await prisma.product_report.findMany(),
      user_allergens: await prisma.user_allergen.findMany(),
      daily_scan_usages: await prisma.daily_scan_usage.findMany(),
      email_verifications: await prisma.email_verification.findMany(),
      user_product_preferences: await prisma.user_product_preference.findMany(),
      password_resets: await prisma.password_reset.findMany(),
      tier_plans: await prisma.tier_plan.findMany()
    };
    
    fs.writeFileSync(exportFile, JSON.stringify(data, null, 2));
    console.log(`✅ Data exported to JSON: ${exportFile}`);
    return exportFile;
  } catch (error) {
    console.error('❌ Data export failed:', error.message);
    throw error;
  }
}

/**
 * Backup database schema
 */
async function backupSchema() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const schemaFile = path.join(BACKUP_DIR, `schema_${timestamp}.sql`);
  
  const command = `PGPASSWORD="${DB_CONFIG.password}" pg_dump -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} --schema-only -f "${schemaFile}"`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Schema backup failed:', error.message);
        reject(error);
        return;
      }
      console.log(`✅ Schema backup created: ${schemaFile}`);
      resolve(schemaFile);
    });
  });
}

/**
 * Clean old backups (keep last 7 days)
 */
function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  
  files.forEach(file => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime < sevenDaysAgo) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted old backup: ${file}`);
    }
  });
}

/**
 * Main backup function
 */
async function runBackup() {
  console.log('🚀 Starting database backup...');
  
  try {
    // Create full backup
    await createFullBackup();
    
    // Export data to JSON
    await exportDataToJSON();
    
    // Backup schema
    await backupSchema();
    
    // Clean old backups
    cleanOldBackups();
    
    console.log('🎉 Backup completed successfully!');
  } catch (error) {
    console.error('💥 Backup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runBackup();
}

module.exports = {
  createFullBackup,
  exportDataToJSON,
  backupSchema,
  cleanOldBackups,
  runBackup
};
