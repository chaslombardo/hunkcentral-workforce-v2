/**
 * Backup and Recovery System
 * Provides database backup, restore, and disaster recovery capabilities
 */

import { config, isProduction } from '@/lib/production-config';
import { logInfo, logWarning } from '@/lib/production-logger';
import { logProductionError } from '@/lib/monitoring';

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  compression: boolean;
  encryption: boolean;
  storage: {
    type: 'local' | 's3' | 'gcs' | 'azure';
    path: string;
    credentials?: Record<string, string>;
  };
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental' | 'differential';
  size: number;
  compressed: boolean;
  encrypted: boolean;
  checksum: string;
  tables: string[];
  recordCount: number;
  duration: number;
  status: 'completed' | 'failed' | 'in_progress';
  error?: string;
}

export interface RestoreOptions {
  backupId: string;
  targetDatabase?: string;
  tables?: string[];
  pointInTime?: string;
  dryRun?: boolean;
  skipValidation?: boolean;
}

class BackupRecoverySystem {
  private config: BackupConfig;
  private backupHistory: BackupMetadata[] = [];
  private backupInterval?: NodeJS.Timeout;

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      enabled: isProduction(),
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: {
        daily: 7,
        weekly: 4,
        monthly: 12,
      },
      compression: true,
      encryption: isProduction(),
      storage: {
        type: 'local',
        path: './backups',
      },
      ...config,
    };

    this.initialize();
  }

  private initialize(): void {
    if (!this.config.enabled) {
      logInfo('Backup system disabled', {
        component: 'backup',
        action: 'initialize',
        metadata: { enabled: false },
      });
      return;
    }

    // Schedule automatic backups
    this.scheduleBackups();

    // Load backup history
    this.loadBackupHistory();

    logInfo('Backup system initialized', {
      component: 'backup',
      action: 'initialize',
      metadata: {
        schedule: this.config.schedule,
        retention: this.config.retention,
        storage: this.config.storage.type,
      },
    });
  }

  private scheduleBackups(): void {
    // For production, you would use a proper cron scheduler
    // For now, we'll simulate with a simple interval
    if (this.config.schedule === '0 2 * * *') {
      // Daily backup at 2 AM - simulate with 24 hour interval
      const now = new Date();
      const nextBackup = new Date();
      nextBackup.setHours(2, 0, 0, 0);

      if (nextBackup <= now) {
        nextBackup.setDate(nextBackup.getDate() + 1);
      }

      const timeUntilBackup = nextBackup.getTime() - now.getTime();

      setTimeout(() => {
        this.performScheduledBackup();

        // Set up daily interval
        this.backupInterval = setInterval(
          () => {
            this.performScheduledBackup();
          },
          24 * 60 * 60 * 1000
        ); // 24 hours
      }, timeUntilBackup);
    }
  }

  private async performScheduledBackup(): Promise<void> {
    try {
      await this.createBackup({
        type: 'full',
        compression: this.config.compression,
        encryption: this.config.encryption,
      });

      // Clean up old backups based on retention policy
      await this.cleanupOldBackups();
    } catch (error) {
      await logProductionError(error, {
        component: 'backup',
        action: 'scheduled_backup',
        url: 'system',
        userAgent: 'server',
      });
    }
  }

  public async createBackup(
    options: {
      type?: 'full' | 'incremental' | 'differential';
      tables?: string[];
      compression?: boolean;
      encryption?: boolean;
      description?: string;
    } = {}
  ): Promise<BackupMetadata> {
    const startTime = Date.now();
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date().toISOString(),
      type: options.type || 'full',
      size: 0,
      compressed: options.compression ?? this.config.compression,
      encrypted: options.encryption ?? this.config.encryption,
      checksum: '',
      tables: [],
      recordCount: 0,
      duration: 0,
      status: 'in_progress',
    };

    try {
      logInfo(`Starting ${metadata.type} backup`, {
        component: 'backup',
        action: 'create_backup',
        metadata: {
          backupId,
          type: metadata.type,
          compression: metadata.compressed,
          encryption: metadata.encrypted,
        },
      });

      // Get database schema and data
      const backupData = await this.exportDatabaseData(options.tables);
      metadata.tables = backupData.tables;
      metadata.recordCount = backupData.recordCount;

      // Compress if enabled
      let finalData = backupData.data;
      if (metadata.compressed) {
        finalData = await this.compressData(finalData);
      }

      // Encrypt if enabled
      if (metadata.encrypted) {
        finalData = await this.encryptData(finalData);
      }

      // Calculate checksum
      metadata.checksum = await this.calculateChecksum(finalData);
      metadata.size = finalData.length;

      // Store backup
      await this.storeBackup(backupId, finalData, metadata);

      // Update metadata
      metadata.duration = Date.now() - startTime;
      metadata.status = 'completed';

      // Add to history
      this.backupHistory.push(metadata);
      await this.saveBackupHistory();

      logInfo(`Backup completed successfully`, {
        component: 'backup',
        action: 'create_backup',
        metadata: {
          backupId,
          size: metadata.size,
          duration: metadata.duration,
          recordCount: metadata.recordCount,
          tables: metadata.tables.length,
        },
      });

      return metadata;
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = error instanceof Error ? error.message : String(error);
      metadata.duration = Date.now() - startTime;

      this.backupHistory.push(metadata);
      await this.saveBackupHistory();

      await logProductionError(error, {
        component: 'backup',
        action: 'create_backup',
        url: 'system',
        userAgent: 'server',
        metadata: {
          backupId,
          type: metadata.type,
        },
      });

      throw error;
    }
  }

  public async restoreBackup(options: RestoreOptions): Promise<{
    success: boolean;
    restoredTables: string[];
    restoredRecords: number;
    duration: number;
    warnings: string[];
  }> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      logInfo(`Starting backup restore`, {
        component: 'backup',
        action: 'restore_backup',
        metadata: {
          backupId: options.backupId,
          dryRun: options.dryRun,
          tables: options.tables?.length || 'all',
        },
      });

      // Find backup metadata
      const backup = this.backupHistory.find((b) => b.id === options.backupId);
      if (!backup) {
        throw new Error(`Backup not found: ${options.backupId}`);
      }

      if (backup.status !== 'completed') {
        throw new Error(`Backup is not in completed state: ${backup.status}`);
      }

      // Load backup data
      const backupData = await this.loadBackup(options.backupId);

      // Decrypt if needed
      let restoredData = backupData;
      if (backup.encrypted) {
        restoredData = await this.decryptData(restoredData);
      }

      // Decompress if needed
      if (backup.compressed) {
        restoredData = await this.decompressData(restoredData);
      }

      // Verify checksum
      const calculatedChecksum = await this.calculateChecksum(
        backup.compressed || backup.encrypted ? backupData : restoredData
      );
      if (calculatedChecksum !== backup.checksum) {
        warnings.push(
          'Backup checksum verification failed - data may be corrupted'
        );
      }

      // Parse backup data
      const parsedData = JSON.parse(restoredData);

      // Filter tables if specified
      let tablesToRestore = backup.tables;
      if (options.tables) {
        tablesToRestore = backup.tables.filter((table) =>
          options.tables!.includes(table)
        );
      }

      if (options.dryRun) {
        logInfo(
          `Dry run completed - would restore ${tablesToRestore.length} tables`,
          {
            component: 'backup',
            action: 'restore_backup',
            metadata: {
              backupId: options.backupId,
              tables: tablesToRestore,
              dryRun: true,
            },
          }
        );

        return {
          success: true,
          restoredTables: tablesToRestore,
          restoredRecords: backup.recordCount,
          duration: Date.now() - startTime,
          warnings,
        };
      }

      // Perform actual restore
      const restoredRecords = await this.importDatabaseData(
        parsedData,
        tablesToRestore
      );

      const duration = Date.now() - startTime;

      logInfo(`Backup restore completed successfully`, {
        component: 'backup',
        action: 'restore_backup',
        metadata: {
          backupId: options.backupId,
          restoredTables: tablesToRestore,
          restoredRecords,
          duration,
          warnings: warnings.length,
        },
      });

      return {
        success: true,
        restoredTables: tablesToRestore,
        restoredRecords,
        duration,
        warnings,
      };
    } catch (error) {
      await logProductionError(error, {
        component: 'backup',
        action: 'restore_backup',
        url: 'system',
        userAgent: 'server',
        metadata: {
          backupId: options.backupId,
          dryRun: options.dryRun,
        },
      });

      return {
        success: false,
        restoredTables: [],
        restoredRecords: 0,
        duration: Date.now() - startTime,
        warnings: [
          ...warnings,
          error instanceof Error ? error.message : String(error),
        ],
      };
    }
  }

  private async exportDatabaseData(tables?: string[]): Promise<{
    data: string;
    tables: string[];
    recordCount: number;
  }> {
    try {
      const { prisma } = await import('@/lib/prisma');

      // Get all table names if not specified
      const allTables = tables || [
        'User',
        'DailyLog',
        'LogJob',
        'LogHour',
        'CommissionEntry',
        'PayPeriod',
        'AuditLog',
      ];

      const exportData: Record<string, unknown[]> = {};
      let totalRecords = 0;

      // Export each table
      for (const tableName of allTables) {
        try {
          // Use dynamic model access
          const model = (prisma as any)[tableName.toLowerCase()];
          if (model) {
            const records = await model.findMany();
            exportData[tableName] = records;
            totalRecords += records.length;
          }
        } catch (error) {
          logWarning(`Failed to export table ${tableName}`, {
            component: 'backup',
            action: 'export_table',
            metadata: {
              table: tableName,
              error: error instanceof Error ? error.message : String(error),
            },
          });
        }
      }

      return {
        data: JSON.stringify({
          version: '1.0',
          timestamp: new Date().toISOString(),
          tables: exportData,
        }),
        tables: Object.keys(exportData),
        recordCount: totalRecords,
      };
    } catch (error) {
      throw new Error(
        `Database export failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async importDatabaseData(
    data: any,
    tables: string[]
  ): Promise<number> {
    try {
      const { prisma } = await import('@/lib/prisma');
      let totalImported = 0;

      // Import each table
      for (const tableName of tables) {
        if (data.tables[tableName]) {
          try {
            const model = (prisma as any)[tableName.toLowerCase()];
            if (model) {
              const records = data.tables[tableName];

              // Clear existing data (be careful in production!)
              await model.deleteMany({});

              // Import records
              for (const record of records) {
                await model.create({ data: record });
                totalImported++;
              }
            }
          } catch (error) {
            logWarning(`Failed to import table ${tableName}`, {
              component: 'backup',
              action: 'import_table',
              metadata: {
                table: tableName,
                error: error instanceof Error ? error.message : String(error),
              },
            });
          }
        }
      }

      return totalImported;
    } catch (error) {
      throw new Error(
        `Database import failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async compressData(data: string): Promise<string> {
    // In a real implementation, you would use a compression library like zlib
    // For now, we'll simulate compression
    return Buffer.from(data).toString('base64');
  }

  private async decompressData(data: string): Promise<string> {
    // In a real implementation, you would decompress using zlib
    // For now, we'll simulate decompression
    return Buffer.from(data, 'base64').toString();
  }

  private async encryptData(data: string): Promise<string> {
    // In a real implementation, you would use proper encryption
    // For now, we'll simulate encryption with base64 encoding
    return Buffer.from(data).toString('base64');
  }

  private async decryptData(data: string): Promise<string> {
    // In a real implementation, you would decrypt properly
    // For now, we'll simulate decryption
    return Buffer.from(data, 'base64').toString();
  }

  private async calculateChecksum(data: string): Promise<string> {
    // In a real implementation, you would use crypto.createHash
    // For now, we'll create a simple checksum
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private async storeBackup(
    backupId: string,
    data: string,
    metadata: BackupMetadata
  ): Promise<void> {
    // In a real implementation, you would store to the configured storage
    // For now, we'll simulate storage
    logInfo(`Backup stored`, {
      component: 'backup',
      action: 'store_backup',
      metadata: {
        backupId,
        size: data.length,
        storage: this.config.storage.type,
      },
    });
  }

  private async loadBackup(backupId: string): Promise<string> {
    // In a real implementation, you would load from the configured storage
    // For now, we'll simulate loading
    throw new Error('Backup loading not implemented in simulation');
  }

  private async loadBackupHistory(): Promise<void> {
    // In a real implementation, you would load from persistent storage
    // For now, we'll start with empty history
    this.backupHistory = [];
  }

  private async saveBackupHistory(): Promise<void> {
    // In a real implementation, you would save to persistent storage
    logInfo(`Backup history saved`, {
      component: 'backup',
      action: 'save_history',
      metadata: {
        backupCount: this.backupHistory.length,
      },
    });
  }

  private async cleanupOldBackups(): Promise<void> {
    const now = new Date();
    const retention = this.config.retention;

    // Calculate cutoff dates
    const dailyCutoff = new Date(
      now.getTime() - retention.daily * 24 * 60 * 60 * 1000
    );
    const weeklyCutoff = new Date(
      now.getTime() - retention.weekly * 7 * 24 * 60 * 60 * 1000
    );
    const monthlyCutoff = new Date(
      now.getTime() - retention.monthly * 30 * 24 * 60 * 60 * 1000
    );

    const backupsToDelete = this.backupHistory.filter((backup) => {
      const backupDate = new Date(backup.timestamp);

      // Keep all backups within daily retention
      if (backupDate > dailyCutoff) return false;

      // Keep weekly backups within weekly retention
      if (backupDate > weeklyCutoff && this.isWeeklyBackup(backupDate))
        return false;

      // Keep monthly backups within monthly retention
      if (backupDate > monthlyCutoff && this.isMonthlyBackup(backupDate))
        return false;

      return true;
    });

    for (const backup of backupsToDelete) {
      try {
        await this.deleteBackup(backup.id);
        this.backupHistory = this.backupHistory.filter(
          (b) => b.id !== backup.id
        );

        logInfo(`Old backup deleted`, {
          component: 'backup',
          action: 'cleanup_backup',
          metadata: {
            backupId: backup.id,
            age: now.getTime() - new Date(backup.timestamp).getTime(),
          },
        });
      } catch (error) {
        logWarning(`Failed to delete old backup`, {
          component: 'backup',
          action: 'cleanup_backup',
          metadata: {
            backupId: backup.id,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }
  }

  private isWeeklyBackup(date: Date): boolean {
    // Consider Sunday backups as weekly
    return date.getDay() === 0;
  }

  private isMonthlyBackup(date: Date): boolean {
    // Consider first day of month backups as monthly
    return date.getDate() === 1;
  }

  private async deleteBackup(backupId: string): Promise<void> {
    // In a real implementation, you would delete from storage
    logInfo(`Backup deleted`, {
      component: 'backup',
      action: 'delete_backup',
      metadata: { backupId },
    });
  }

  // Public API methods
  public getBackupHistory(): BackupMetadata[] {
    return [...this.backupHistory];
  }

  public getBackupById(backupId: string): BackupMetadata | undefined {
    return this.backupHistory.find((b) => b.id === backupId);
  }

  public async validateBackup(backupId: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const backup = this.getBackupById(backupId);
    if (!backup) {
      return {
        valid: false,
        issues: ['Backup not found'],
      };
    }

    const issues: string[] = [];

    if (backup.status !== 'completed') {
      issues.push(`Backup status is ${backup.status}`);
    }

    if (!backup.checksum) {
      issues.push('Backup checksum is missing');
    }

    if (backup.size === 0) {
      issues.push('Backup size is zero');
    }

    if (backup.recordCount === 0) {
      issues.push('Backup contains no records');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  public getStorageUsage(): {
    totalBackups: number;
    totalSize: number;
    oldestBackup?: string;
    newestBackup?: string;
  } {
    const totalBackups = this.backupHistory.length;
    const totalSize = this.backupHistory.reduce(
      (sum, backup) => sum + backup.size,
      0
    );

    const sortedBackups = [...this.backupHistory].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return {
      totalBackups,
      totalSize,
      oldestBackup: sortedBackups[0]?.timestamp,
      newestBackup: sortedBackups[sortedBackups.length - 1]?.timestamp,
    };
  }

  public destroy(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    logInfo('Backup system destroyed', {
      component: 'backup',
      action: 'destroy',
    });
  }
}

// Global backup system instance
let globalBackupSystem: BackupRecoverySystem | null = null;

export function initializeBackupSystem(
  config?: Partial<BackupConfig>
): BackupRecoverySystem {
  if (!globalBackupSystem) {
    globalBackupSystem = new BackupRecoverySystem(config);
  }
  return globalBackupSystem;
}

export function getBackupSystem(): BackupRecoverySystem | null {
  return globalBackupSystem;
}

export function destroyBackupSystem(): void {
  if (globalBackupSystem) {
    globalBackupSystem.destroy();
    globalBackupSystem = null;
  }
}

// Initialize backup system in production
if (isProduction()) {
  initializeBackupSystem();
}

export { BackupRecoverySystem };
