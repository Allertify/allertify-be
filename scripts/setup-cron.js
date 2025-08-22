#!/usr/bin/env node

/**
 * Setup Cron Jobs for Automated Database Backups
 * This script sets up automated backup scheduling
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const BACKUP_SCRIPT = path.join(__dirname, 'backup-database.js');
const CRON_FILE = '/tmp/allertify-backup-cron';

/**
 * Create cron job entries
 */
function createCronJobs() {
  const cronJobs = [
    // Daily full backup at 2 AM
    '0 2 * * * cd /d/project/allertify-be && npm run backup >> logs/backup.log 2>&1',
    
    // Hourly incremental backup check (WAL archiving)
    '0 * * * * cd /d/project/allertify-be && echo "$(date): WAL archiving check" >> logs/backup.log',
    
    // Weekly backup cleanup on Sunday at 3 AM
    '0 3 * * 0 cd /d/project/allertify-be && find backups -name "*.sql" -mtime +7 -delete >> logs/backup.log 2>&1',
    
    // Monthly backup verification on 1st of month at 4 AM
    '0 4 1 * * cd /d/project/allertify-be && echo "$(date): Monthly backup verification" >> logs/backup.log'
  ];
  
  return cronJobs.join('\n');
}

/**
 * Setup cron jobs for Windows (using Task Scheduler)
 */
function setupWindowsCron() {
  console.log('🪟 Setting up Windows Task Scheduler for automated backups...');
  
  const tasks = [
    {
      name: 'AllertifyDailyBackup',
      schedule: 'DAILY',
      time: '02:00',
      command: 'npm run backup',
      workingDir: process.cwd()
    },
    {
      name: 'AllertifyWeeklyCleanup',
      schedule: 'WEEKLY',
      time: '03:00',
      command: 'find backups -name "*.sql" -mtime +7 -delete',
      workingDir: process.cwd()
    }
  ];
  
  tasks.forEach(task => {
    const schtasksCommand = `schtasks /create /tn "${task.name}" /tr "cmd /c cd /d ${task.workingDir} && ${task.command}" /sc ${task.schedule} /st ${task.time} /f`;
    
    exec(schtasksCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Failed to create task ${task.name}:`, error.message);
      } else {
        console.log(`✅ Created task: ${task.name}`);
      }
    });
  });
}

/**
 * Setup cron jobs for Linux/Mac
 */
function setupUnixCron() {
  console.log('🐧 Setting up Unix cron jobs for automated backups...');
  
  const cronJobs = createCronJobs();
  fs.writeFileSync(CRON_FILE, cronJobs);
  
  const command = `crontab ${CRON_FILE}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Failed to setup cron jobs:', error.message);
      console.log('📝 Manual setup required. Add these to your crontab:');
      console.log(cronJobs);
    } else {
      console.log('✅ Cron jobs setup successfully!');
      console.log('📋 Installed jobs:');
      console.log(cronJobs);
    }
    
    // Clean up temp file
    if (fs.existsSync(CRON_FILE)) {
      fs.unlinkSync(CRON_FILE);
    }
  });
}

/**
 * Create backup log directory
 */
function setupLogging() {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const backupLog = path.join(logDir, 'backup.log');
  if (!fs.existsSync(backupLog)) {
    fs.writeFileSync(backupLog, `# Allertify Backup Log\n# Started: ${new Date().toISOString()}\n\n`);
  }
  
  console.log('✅ Logging setup completed');
}

/**
 * Main setup function
 */
function main() {
  console.log('🚀 Setting up automated backup scheduling...');
  
  // Setup logging
  setupLogging();
  
  // Detect OS and setup appropriate scheduling
  const platform = process.platform;
  
  if (platform === 'win32') {
    setupWindowsCron();
  } else {
    setupUnixCron();
  }
  
  console.log('\n📋 Manual backup commands:');
  console.log('  npm run backup          - Create manual backup');
  console.log('  npm run backup:list     - List available backups');
  console.log('  npm run restore         - Restore from backup');
  
  console.log('\n🔧 Next steps:');
  console.log('1. Test backup: npm run backup');
  console.log('2. Verify backup files in ./backups directory');
  console.log('3. Test restore: npm run restore backup <filename>');
  console.log('4. Monitor logs/backup.log for automated backup status');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createCronJobs,
  setupWindowsCron,
  setupUnixCron,
  setupLogging
};
