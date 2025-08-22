#!/usr/bin/env node

/**
 * Database Restore Script for Allertify
 * Handles full restore and point-in-time recovery
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '15432',
  database: process.env.DB_NAME || 'allertify',
  user: process.env.DB_USER || 'allertify',
  password: process.env.DB_PASSWORD || '12345678'
};

/**
 * List available backups
 */
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ No backup directory found');
    return [];
  }
  
  const files = fs.readdirSync(BACKUP_DIR);
  const backups = files
    .filter(file => file.endsWith('.sql'))
    .map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
        date: stats.mtime
      };
    })
    .sort((a, b) => b.date - a.date);
  
  return backups;
}

/**
 * Restore from full backup
 */
async function restoreFromBackup(backupFile) {
  console.log(`🔄 Restoring from backup: ${backupFile}`);
  
  // Drop and recreate database
  const dropCommand = `PGPASSWORD="${DB_CONFIG.password}" psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d postgres -c "DROP DATABASE IF EXISTS ${DB_CONFIG.database};"`;
  const createCommand = `PGPASSWORD="${DB_CONFIG.password}" psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d postgres -c "CREATE DATABASE ${DB_CONFIG.database};"`;
  
  try {
    // Drop database
    await execCommand(dropCommand);
    console.log('✅ Database dropped');
    
    // Create new database
    await execCommand(createCommand);
    console.log('✅ Database created');
    
    // Restore from backup
    const restoreCommand = `PGPASSWORD="${DB_CONFIG.password}" pg_restore -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} "${backupFile}"`;
    await execCommand(restoreCommand);
    
    console.log('✅ Database restored successfully!');
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

/**
 * Restore from JSON export
 */
async function restoreFromJSON(jsonFile) {
  console.log(`🔄 Restoring from JSON: ${jsonFile}`);
  
  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Clear existing data
    await prisma.$transaction([
      prisma.password_reset.deleteMany(),
      prisma.user_product_preference.deleteMany(),
      prisma.email_verification.deleteMany(),
      prisma.daily_scan_usage.deleteMany(),
      prisma.user_allergen.deleteMany(),
      prisma.product_report.deleteMany(),
      prisma.product_scan.deleteMany(),
      prisma.subscription.deleteMany(),
      prisma.emergency_contact.deleteMany(),
      prisma.user.deleteMany(),
      prisma.product.deleteMany(),
      prisma.allergen.deleteMany(),
      prisma.tier_plan.deleteMany()
    ]);
    
    // Restore data
    if (data.tier_plans) {
      await prisma.tier_plan.createMany({ data: data.tier_plans });
      console.log('✅ Tier plans restored');
    }
    
    if (data.allergens) {
      await prisma.allergen.createMany({ data: data.allergens });
      console.log('✅ Allergens restored');
    }
    
    if (data.users) {
      await prisma.user.createMany({ data: data.users });
      console.log('✅ Users restored');
    }
    
    if (data.products) {
      await prisma.product.createMany({ data: data.products });
      console.log('✅ Products restored');
    }
    
    if (data.emergency_contacts) {
      await prisma.emergency_contact.createMany({ data: data.emergency_contacts });
      console.log('✅ Emergency contacts restored');
    }
    
    if (data.subscriptions) {
      await prisma.subscription.createMany({ data: data.subscriptions });
      console.log('✅ Subscriptions restored');
    }
    
    if (data.product_scans) {
      await prisma.product_scan.createMany({ data: data.product_scans });
      console.log('✅ Product scans restored');
    }
    
    if (data.product_reports) {
      await prisma.product_report.createMany({ data: data.product_reports });
      console.log('✅ Product reports restored');
    }
    
    if (data.user_allergens) {
      await prisma.user_allergen.createMany({ data: data.user_allergens });
      console.log('✅ User allergens restored');
    }
    
    if (data.daily_scan_usages) {
      await prisma.daily_scan_usage.createMany({ data: data.daily_scan_usages });
      console.log('✅ Daily scan usages restored');
    }
    
    if (data.email_verifications) {
      await prisma.email_verification.createMany({ data: data.email_verifications });
      console.log('✅ Email verifications restored');
    }
    
    if (data.user_product_preferences) {
      await prisma.user_product_preference.createMany({ data: data.user_product_preferences });
      console.log('✅ User product preferences restored');
    }
    
    if (data.password_resets) {
      await prisma.password_reset.createMany({ data: data.password_resets });
      console.log('✅ Password resets restored');
    }
    
    await prisma.$disconnect();
    console.log('✅ JSON restore completed successfully!');
  } catch (error) {
    console.error('❌ JSON restore failed:', error.message);
    throw error;
  }
}

/**
 * Point-in-time recovery (if WAL archiving is enabled)
 */
async function pointInTimeRecovery(targetTime) {
  console.log(`🔄 Starting point-in-time recovery to: ${targetTime}`);
  
  // This requires WAL archiving to be properly configured
  // and the target time to be within the archived WAL range
  
  const command = `PGPASSWORD="${DB_CONFIG.password}" pg_restore -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} --recovery-target-time="${targetTime}"`;
  
  try {
    await execCommand(command);
    console.log('✅ Point-in-time recovery completed!');
  } catch (error) {
    console.error('❌ Point-in-time recovery failed:', error.message);
    throw error;
  }
}

/**
 * Helper function to execute shell commands
 */
function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Main restore function
 */
async function runRestore() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Available backups:');
    const backups = listBackups();
    
    if (backups.length === 0) {
      console.log('❌ No backups found');
      return;
    }
    
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.name} (${backup.size}) - ${backup.date.toLocaleString()}`);
    });
    
    console.log('\nUsage:');
    console.log('  node restore-database.js backup <filename>  - Restore from SQL backup');
    console.log('  node restore-database.js json <filename>    - Restore from JSON export');
    console.log('  node restore-database.js pitr <timestamp>   - Point-in-time recovery');
    return;
  }
  
  const [action, filename] = args;
  
  try {
    switch (action) {
      case 'backup':
        if (!filename) {
          console.error('❌ Please specify backup filename');
          return;
        }
        const backupPath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(backupPath)) {
          console.error('❌ Backup file not found');
          return;
        }
        await restoreFromBackup(backupPath);
        break;
        
      case 'json':
        if (!filename) {
          console.error('❌ Please specify JSON filename');
          return;
        }
        const jsonPath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(jsonPath)) {
          console.error('❌ JSON file not found');
          return;
        }
        await restoreFromJSON(jsonPath);
        break;
        
      case 'pitr':
        if (!filename) {
          console.error('❌ Please specify target timestamp (YYYY-MM-DD HH:MM:SS)');
          return;
        }
        await pointInTimeRecovery(filename);
        break;
        
      default:
        console.error('❌ Unknown action. Use: backup, json, or pitr');
    }
  } catch (error) {
    console.error('💥 Restore failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runRestore();
}

module.exports = {
  listBackups,
  restoreFromBackup,
  restoreFromJSON,
  pointInTimeRecovery
};
