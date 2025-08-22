# 🚀 Allertify Backup Strategy & Procedures

## 📋 Overview

Backup strategy yang solid buat project Allertify dengan PostgreSQL database. Strategy ini mencakup regular backups, point-in-time recovery, dan data export/import procedures.

## 🎯 **Backup Strategy Components**

### **1. Regular Database Backups**
- **Daily Full Backups**: Backup lengkap database setiap hari jam 2 AM
- **Hourly WAL Archiving**: Continuous archiving untuk point-in-time recovery
- **Weekly Cleanup**: Auto-cleanup backup lama (retention 7 hari)
- **Monthly Verification**: Verifikasi backup integrity

### **2. Point-in-Time Recovery**
- **WAL (Write-Ahead Logging)** enabled dengan archive mode
- **Continuous archiving** ke dedicated backup volume
- **Recovery capability** ke waktu tertentu dalam 7 hari terakhir

### **3. Data Export/Import Procedures**
- **Prisma JSON Export**: Export semua data dalam format JSON
- **Schema Backup**: Backup struktur database
- **Environment Backup**: Backup konfigurasi dan environment variables

## 🛠️ **Setup & Configuration**

### **Prerequisites**
```bash
# Install PostgreSQL client tools
# Windows: Download from https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql-client
# Mac: brew install postgresql
```

### **Environment Variables**
```bash
# .env file
DB_HOST=localhost
DB_PORT=15432
DB_NAME=allertify
DB_USER=allertify
DB_PASSWORD=12345678
```

### **Docker Configuration**
Docker Compose sudah dikonfigurasi dengan:
- WAL archiving enabled
- Dedicated backup volume
- Archive command configured

## 📁 **Backup Directory Structure**
```
backups/
├── full_backup_2024-01-15T02-00-00.sql    # Daily full backup
├── schema_2024-01-15T02-00-00.sql         # Schema backup
├── data_export_2024-01-15T02-00-00.json   # JSON data export
└── archive/                                # WAL archive files
    ├── 000000010000000000000001
    ├── 000000010000000000000002
    └── ...
```

## 🚀 **Usage Commands**

### **Manual Backup**
```bash
# Create full backup
npm run backup

# List available backups
npm run backup:list

# Restore from backup
npm run restore backup <filename>

# Restore from JSON
npm run restore json <filename>

# Point-in-time recovery
npm run restore pitr "2024-01-15 14:30:00"
```

### **Automated Setup**
```bash
# Setup automated backups (Windows Task Scheduler / Unix Cron)
node scripts/setup-cron.js
```

## 📊 **Backup Types & Schedules**

| Type | Frequency | Time | Retention | Purpose |
|------|-----------|------|-----------|---------|
| Full Backup | Daily | 2:00 AM | 7 days | Complete database state |
| WAL Archive | Continuous | Real-time | 7 days | Point-in-time recovery |
| Schema Backup | Daily | 2:00 AM | 7 days | Database structure |
| JSON Export | Daily | 2:00 AM | 7 days | Data portability |
| Cleanup | Weekly | Sunday 3:00 AM | - | Remove old backups |

## 🔄 **Recovery Procedures**

### **Full Database Restore**
```bash
# 1. Stop application
docker-compose stop backend

# 2. Restore from backup
npm run restore backup full_backup_2024-01-15T02-00-00.sql

# 3. Restart application
docker-compose start backend
```

### **Point-in-Time Recovery**
```bash
# 1. Stop application
docker-compose stop backend

# 2. Restore to specific time
npm run restore pitr "2024-01-15 14:30:00"

# 3. Restart application
docker-compose start backend
```

### **Partial Data Restore**
```bash
# Restore specific tables from JSON
npm run restore json data_export_2024-01-15T02-00-00.json
```

## 🧪 **Testing & Verification**

### **Backup Testing**
```bash
# 1. Create test backup
npm run backup

# 2. Verify backup files
ls -la backups/

# 3. Test restore in test environment
npm run restore backup <filename>
```

### **Recovery Testing**
```bash
# 1. Create test data
# 2. Create backup
# 3. Modify/delete data
# 4. Restore and verify
# 5. Compare before/after state
```

## 📈 **Monitoring & Maintenance**

### **Log Monitoring**
```bash
# Check backup logs
tail -f logs/backup.log

# Check for errors
grep "ERROR\|FAILED" logs/backup.log
```

### **Backup Health Checks**
- **Size monitoring**: Backup file sizes should be consistent
- **Time monitoring**: Backups should complete within expected timeframe
- **Integrity checks**: Verify backup files can be restored
- **Space monitoring**: Ensure sufficient disk space

### **Performance Considerations**
- **Backup window**: Schedule during low-traffic hours
- **Compression**: Use compressed backup format (-Fc)
- **Parallel processing**: Consider pg_dump parallel options for large databases
- **Network bandwidth**: Consider backup location (local vs remote)

## 🚨 **Disaster Recovery Plan**

### **RTO (Recovery Time Objective)**
- **Full restore**: 15-30 minutes
- **Point-in-time recovery**: 30-60 minutes
- **Partial restore**: 10-20 minutes

### **RPO (Recovery Point Objective)**
- **Maximum data loss**: 1 hour (WAL archiving)
- **Typical data loss**: 0-15 minutes

### **Recovery Steps**
1. **Assess damage**: Identify affected systems/data
2. **Stop services**: Prevent further data corruption
3. **Choose recovery method**: Full restore vs point-in-time
4. **Execute recovery**: Run appropriate restore command
5. **Verify integrity**: Test application functionality
6. **Resume services**: Start application and monitor

## 🔒 **Security Considerations**

### **Backup Security**
- **Access control**: Limit backup file access
- **Encryption**: Consider encrypting sensitive backup files
- **Network security**: Secure backup transfer if using remote storage
- **Audit logging**: Log all backup/restore operations

### **Compliance**
- **Data retention**: Follow regulatory requirements
- **Audit trails**: Maintain backup/restore logs
- **Testing**: Regular disaster recovery testing

## 📚 **Best Practices**

### **Backup Best Practices**
1. **Test regularly**: Verify backups can be restored
2. **Monitor automation**: Check automated backup success
3. **Document procedures**: Keep recovery procedures updated
4. **Train team**: Ensure team knows recovery procedures
5. **Version control**: Track backup script changes

### **Recovery Best Practices**
1. **Plan ahead**: Have recovery procedures documented
2. **Test procedures**: Regular disaster recovery testing
3. **Monitor performance**: Track recovery time metrics
4. **Document lessons**: Learn from each recovery incident
5. **Update procedures**: Continuously improve based on experience

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Backup Fails**
```bash
# Check PostgreSQL connection
psql -h localhost -p 15432 -U allertify -d allertify

# Check disk space
df -h

# Check permissions
ls -la backups/
```

#### **Restore Fails**
```bash
# Check backup file integrity
file backups/full_backup_*.sql

# Check PostgreSQL logs
docker-compose logs postgres

# Verify database exists
psql -h localhost -p 15432 -U allertify -d postgres -c "\l"
```

#### **WAL Archiving Issues**
```bash
# Check archive status
psql -h localhost -p 15432 -U allertify -d allertify -c "SELECT * FROM pg_stat_archiver;"

# Check archive directory
ls -la backups/archive/

# Restart PostgreSQL if needed
docker-compose restart postgres
```

## 📞 **Support & Resources**

### **Documentation**
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Docker PostgreSQL Backup](https://hub.docker.com/_/postgres)

### **Tools**
- **pg_dump**: PostgreSQL backup utility
- **pg_restore**: PostgreSQL restore utility
- **Prisma Client**: Data export/import
- **Docker**: Container management

### **Monitoring**
- **Backup logs**: `logs/backup.log`
- **Application logs**: `logs/combined.log`
- **PostgreSQL logs**: `docker-compose logs postgres`

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Author**: Allertify Team
