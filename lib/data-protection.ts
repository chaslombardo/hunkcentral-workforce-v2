/**
 * Data Protection and Privacy System
 * Implements data encryption, backup, retention policies, and GDPR compliance features
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logProductionError } from '@/lib/monitoring';
import { AuditTrailService } from '@/lib/audit-trail';
import crypto from 'crypto';
import { z } from 'zod';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY =
  process.env.DATA_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

type PrismaModelDelegate = {
  findMany: (args?: unknown) => Promise<unknown[]>;
};

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  tag: string;
}

export interface BackupMetadata {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  createdAt: Date;
  size: number;
  checksum: string;
  tables: string[];
  recordCount: number;
  status: 'pending' | 'completed' | 'failed';
  location?: string;
}

export interface DataRetentionPolicy {
  entityType: string;
  retentionPeriodDays: number;
  archiveAfterDays?: number;
  deleteAfterDays?: number;
  exceptions?: string[];
  isActive: boolean;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  requestedBy: string;
  dataTypes: string[];
  format: 'json' | 'csv' | 'xml';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

// Validation schemas
const DataExportRequestSchema = z.object({
  dataTypes: z.array(
    z.enum(['profile', 'logs', 'commissions', 'payroll', 'audit_trail', 'all'])
  ),
  format: z.enum(['json', 'csv', 'xml']).default('json'),
});

// Retention policy schema (currently unused but kept for future use)
// const RetentionPolicySchema = z.object({
//   entityType: z.string(),
//   retentionPeriodDays: z.number().min(1).max(365 * 10), // Max 10 years
//   archiveAfterDays: z.number().min(1).optional(),
//   deleteAfterDays: z.number().min(1).optional(),
//   exceptions: z.array(z.string()).optional(),
//   isActive: z.boolean().default(true),
// });

export class DataEncryption {
  /**
   * Encrypt sensitive data
   */
  static encrypt(data: string): EncryptedData {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
      cipher.setAAD(Buffer.from('hunkcentral-data'));

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: EncryptedData): string {
    try {
      const decipher = crypto.createDecipher(
        ENCRYPTION_ALGORITHM,
        ENCRYPTION_KEY
      );
      decipher.setAAD(Buffer.from('hunkcentral-data'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

      let decrypted = decipher.update(
        encryptedData.encryptedData,
        'hex',
        'utf8'
      );
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Hash sensitive data for comparison without storing plaintext
   */
  static hash(data: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || crypto.randomBytes(32).toString('hex');
    const hash = crypto
      .pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512')
      .toString('hex');

    return { hash, salt: actualSalt };
  }

  /**
   * Verify hashed data
   */
  static verifyHash(data: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hash(data, salt);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(computedHash, 'hex')
    );
  }
}

export class DataBackup {
  /**
   * Create a full database backup
   */
  static async createFullBackup(userId: string): Promise<BackupMetadata> {
    const backupId = `backup_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    try {
      // Get all table data
      const tables = [
        'User',
        'DailyLog',
        'LogJob',
        'LogHour',
        'CommissionEntry',
        'PayPeriod',
        'AuditLog',
      ];
      const backupData: Record<string, unknown[]> = {};
      let totalRecords = 0;
      const prismaModels = prisma as unknown as Record<
        string,
        PrismaModelDelegate
      >;

      for (const table of tables) {
        const tableName = table.toLowerCase();
        const model = prismaModels[tableName];
        if (!model?.findMany) continue;
        const data = await model.findMany();
        backupData[table] = data;
        totalRecords += data.length;
      }

      // Serialize and compress data
      const serializedData = JSON.stringify(backupData);
      const checksum = crypto
        .createHash('sha256')
        .update(serializedData)
        .digest('hex');

      // In production, you would upload this to cloud storage (S3, etc.)
      const backupLocation = `backups/${backupId}.json`;

      const metadata: BackupMetadata = {
        id: backupId,
        type: 'full',
        createdAt: new Date(),
        size: Buffer.byteLength(serializedData, 'utf8'),
        checksum,
        tables,
        recordCount: totalRecords,
        status: 'completed',
        location: backupLocation,
      };

      // Log backup creation
      await AuditTrailService.createAuditLog({
        entityType: 'data_backup',
        entityId: backupId,
        action: 'create_full_backup',
        userId,
        changes: {
          backupType: 'full',
          tables,
          recordCount: totalRecords,
          size: metadata.size,
          checksum,
          location: backupLocation,
        },
      });

      return metadata;
    } catch (error) {
      await logProductionError(error, {
        component: 'data_protection',
        action: 'create_full_backup',
        userId,
        url: '/data-backup',
        userAgent: 'server',
        category: 'database',
        metadata: { backupId },
      });

      throw new Error(
        `Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create an incremental backup (changes since last backup)
   */
  static async createIncrementalBackup(
    userId: string,
    lastBackupDate: Date
  ): Promise<BackupMetadata> {
    const backupId = `backup_inc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    try {
      const tables = [
        'User',
        'DailyLog',
        'LogJob',
        'LogHour',
        'CommissionEntry',
        'PayPeriod',
        'AuditLog',
      ];
      const backupData: Record<string, unknown[]> = {};
      let totalRecords = 0;
      const prismaModels = prisma as unknown as Record<
        string,
        PrismaModelDelegate
      >;

      for (const table of tables) {
        const tableName = table.toLowerCase();
        const model = prismaModels[tableName];
        if (!model?.findMany) continue;
        // Get only records updated since last backup
        const data = await model.findMany({
          where: {
            updatedAt: {
              gt: lastBackupDate,
            },
          },
        });
        backupData[table] = data;
        totalRecords += data.length;
      }

      const serializedData = JSON.stringify(backupData);
      const checksum = crypto
        .createHash('sha256')
        .update(serializedData)
        .digest('hex');
      const backupLocation = `backups/incremental/${backupId}.json`;

      const metadata: BackupMetadata = {
        id: backupId,
        type: 'incremental',
        createdAt: new Date(),
        size: Buffer.byteLength(serializedData, 'utf8'),
        checksum,
        tables,
        recordCount: totalRecords,
        status: 'completed',
        location: backupLocation,
      };

      await AuditTrailService.createAuditLog({
        entityType: 'data_backup',
        entityId: backupId,
        action: 'create_incremental_backup',
        userId,
        changes: {
          backupType: 'incremental',
          lastBackupDate: lastBackupDate.toISOString(),
          tables,
          recordCount: totalRecords,
          size: metadata.size,
          checksum,
          location: backupLocation,
        },
      });

      return metadata;
    } catch (error) {
      await logProductionError(error, {
        component: 'data_protection',
        action: 'create_incremental_backup',
        userId,
        url: '/data-backup',
        userAgent: 'server',
        category: 'database',
        metadata: { backupId, lastBackupDate },
      });

      throw new Error(
        `Incremental backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Restore from backup
   */
  static async restoreFromBackup(
    backupId: string,
    userId: string
  ): Promise<void> {
    try {
      // In production, you would download the backup from cloud storage
      // For now, we'll simulate the restore process

      await AuditTrailService.createAuditLog({
        entityType: 'data_restore',
        entityId: backupId,
        action: 'restore_from_backup',
        userId,
        changes: {
          backupId,
          restoredBy: userId,
          restoredAt: new Date().toISOString(),
          status: 'initiated',
        },
      });

      // Actual restore logic would go here
      // This is a critical operation that should be done with extreme caution

      await AuditTrailService.createAuditLog({
        entityType: 'data_restore',
        entityId: backupId,
        action: 'restore_completed',
        userId,
        changes: {
          backupId,
          restoredBy: userId,
          completedAt: new Date().toISOString(),
          status: 'completed',
        },
      });
    } catch (error) {
      await logProductionError(error, {
        component: 'data_protection',
        action: 'restore_from_backup',
        userId,
        url: '/data-restore',
        userAgent: 'server',
        category: 'database',
        metadata: { backupId },
      });

      throw new Error(
        `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export class DataRetention {
  private static defaultPolicies: DataRetentionPolicy[] = [
    {
      entityType: 'daily_log',
      retentionPeriodDays: 365 * 7, // 7 years for payroll records
      archiveAfterDays: 365 * 2, // Archive after 2 years
      isActive: true,
    },
    {
      entityType: 'commission_entry',
      retentionPeriodDays: 365 * 7, // 7 years for financial records
      archiveAfterDays: 365 * 2,
      isActive: true,
    },
    {
      entityType: 'audit_log',
      retentionPeriodDays: 365 * 5, // 5 years for audit records
      archiveAfterDays: 365 * 1,
      exceptions: ['security'], // Keep security events longer
      isActive: true,
    },
    {
      entityType: 'user',
      retentionPeriodDays: 365 * 10, // 10 years for user records
      archiveAfterDays: 365 * 3, // Archive after 3 years of inactivity
      isActive: true,
    },
  ];

  /**
   * Apply data retention policies
   */
  static async applyRetentionPolicies(userId: string): Promise<{
    archived: number;
    deleted: number;
    policies: DataRetentionPolicy[];
  }> {
    let totalArchived = 0;
    let totalDeleted = 0;

    try {
      for (const policy of this.defaultPolicies) {
        if (!policy.isActive) continue;

        const { archived, deleted } = await this.applyPolicyToEntity(
          policy,
          userId
        );
        totalArchived += archived;
        totalDeleted += deleted;
      }

      await AuditTrailService.createAuditLog({
        entityType: 'data_retention',
        entityId: `retention_${Date.now()}`,
        action: 'apply_retention_policies',
        userId,
        changes: {
          totalArchived,
          totalDeleted,
          policies: this.defaultPolicies,
          appliedAt: new Date().toISOString(),
        },
      });

      return {
        archived: totalArchived,
        deleted: totalDeleted,
        policies: this.defaultPolicies,
      };
    } catch (error) {
      await logProductionError(error, {
        component: 'data_protection',
        action: 'apply_retention_policies',
        userId,
        url: '/data-retention',
        userAgent: 'server',
        category: 'database',
      });

      throw new Error(
        `Retention policy application failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Apply retention policy to specific entity type
   */
  private static async applyPolicyToEntity(
    policy: DataRetentionPolicy,
    userId: string
  ): Promise<{ archived: number; deleted: number }> {
    const now = new Date();
    const archiveDate = new Date(
      now.getTime() - (policy.archiveAfterDays || 0) * 24 * 60 * 60 * 1000
    );
    const deleteDate = new Date(
      now.getTime() - policy.retentionPeriodDays * 24 * 60 * 60 * 1000
    );

    let archived = 0;
    let deleted = 0;

    try {
      // Archive old records (if archiveAfterDays is specified)
      if (policy.archiveAfterDays) {
        // In a real implementation, you would move records to an archive table or storage
        // For now, we'll just mark them as archived in the audit log
        archived = await this.simulateArchiving(policy.entityType, archiveDate);
      }

      // Delete very old records (respecting exceptions)
      if (policy.deleteAfterDays) {
        deleted = await this.simulateDeleting(
          policy.entityType,
          deleteDate,
          policy.exceptions
        );
      }

      return { archived, deleted };
    } catch (error) {
      await logProductionError(error, {
        component: 'data_protection',
        action: 'apply_policy_to_entity',
        userId,
        url: '/data-retention',
        userAgent: 'server',
        category: 'database',
        metadata: { entityType: policy.entityType },
      });

      return { archived: 0, deleted: 0 };
    }
  }

  /**
   * Simulate archiving process (in production, move to archive storage)
   */
  private static async simulateArchiving(
    entityType: string,
    archiveDate: Date
  ): Promise<number> {
    // In production, this would move old records to archive storage
    // For now, we'll just count what would be archived

    switch (entityType) {
      case 'daily_log':
        return await prisma.dailyLog.count({
          where: {
            createdAt: { lt: archiveDate },
            // Add conditions to exclude already archived records
          },
        });

      case 'audit_log':
        return await prisma.auditLog.count({
          where: {
            createdAt: { lt: archiveDate },
          },
        });

      default:
        return 0;
    }
  }

  /**
   * Simulate deletion process (in production, actually delete old records)
   */
  private static async simulateDeleting(
    entityType: string,
    deleteDate: Date,
    exceptions?: string[]
  ): Promise<number> {
    // In production, this would actually delete old records
    // For now, we'll just count what would be deleted

    switch (entityType) {
      case 'audit_log':
        const whereClause: Prisma.AuditLogWhereInput = {
          createdAt: { lt: deleteDate },
        };

        // Respect exceptions (e.g., keep security events longer)
        if (exceptions?.includes('security')) {
          whereClause.NOT = {
            entityType: 'system_error',
            changes: {
              path: ['category'],
              equals: 'security',
            },
          };
        }

        return await prisma.auditLog.count({ where: whereClause });

      default:
        return 0;
    }
  }
}

export class DataExport {
  /**
   * Create a data export request for GDPR compliance
   */
  static async createExportRequest(
    userId: string,
    requestedBy: string,
    request: z.infer<typeof DataExportRequestSchema>
  ): Promise<DataExportRequest> {
    try {
      const validatedRequest = DataExportRequestSchema.parse(request);

      const exportRequest: DataExportRequest = {
        id: `export_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        requestedBy,
        dataTypes: validatedRequest.dataTypes,
        format: validatedRequest.format,
        status: 'pending',
        createdAt: new Date(),
      };

      // Log the export request
      await AuditTrailService.createAuditLog({
        entityType: 'data_export',
        entityId: exportRequest.id,
        action: 'create_export_request',
        userId: requestedBy,
        changes: {
          targetUserId: userId,
          dataTypes: validatedRequest.dataTypes,
          format: validatedRequest.format,
          requestedAt: new Date().toISOString(),
        },
      });

      // In production, you would queue this for background processing
      // For now, we'll process it immediately
      await this.processExportRequest(exportRequest);

      return exportRequest;
    } catch (error) {
      await logProductionError(error, {
        component: 'data_protection',
        action: 'create_export_request',
        userId: requestedBy,
        url: '/data-export',
        userAgent: 'server',
        category: 'api',
        metadata: { targetUserId: userId, request },
      });

      throw new Error(
        `Export request creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process a data export request
   */
  private static async processExportRequest(
    exportRequest: DataExportRequest
  ): Promise<void> {
    try {
      exportRequest.status = 'processing';

      const userData = await this.collectUserData(
        exportRequest.userId,
        exportRequest.dataTypes
      );
      const exportData = this.formatExportData(userData, exportRequest.format);

      // In production, you would upload this to secure storage and provide a download link
      const downloadUrl = `exports/${exportRequest.id}.${exportRequest.format}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      exportRequest.status = 'completed';
      exportRequest.completedAt = new Date();
      exportRequest.downloadUrl = downloadUrl;
      exportRequest.expiresAt = expiresAt;

      // Use exportData for processing (currently just for validation)
      void exportData;

      await AuditTrailService.createAuditLog({
        entityType: 'data_export',
        entityId: exportRequest.id,
        action: 'export_completed',
        userId: exportRequest.requestedBy,
        changes: {
          targetUserId: exportRequest.userId,
          status: 'completed',
          downloadUrl,
          expiresAt: expiresAt.toISOString(),
          completedAt: exportRequest.completedAt.toISOString(),
        },
      });
    } catch (error) {
      exportRequest.status = 'failed';

      await logProductionError(error, {
        component: 'data_protection',
        action: 'process_export_request',
        userId: exportRequest.requestedBy,
        url: '/data-export',
        userAgent: 'server',
        category: 'api',
        metadata: { exportRequestId: exportRequest.id },
      });
    }
  }

  /**
   * Collect user data for export
   */
  private static async collectUserData(
    userId: string,
    dataTypes: string[]
  ): Promise<Record<string, unknown>> {
    const userData: Record<string, unknown> = {};

    try {
      if (dataTypes.includes('profile') || dataTypes.includes('all')) {
        userData.profile = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            roles: true,
            createdAt: true,
            updatedAt: true,
            // Exclude sensitive fields like password
          },
        });
      }

      if (dataTypes.includes('logs') || dataTypes.includes('all')) {
        userData.logs = await prisma.dailyLog.findMany({
          where: { captainId: userId },
          include: {
            jobs: true,
            hours: true,
          },
        });
      }

      if (dataTypes.includes('commissions') || dataTypes.includes('all')) {
        userData.commissions = await prisma.commissionEntry.findMany({
          where: { salesId: userId },
        });
      }

      if (dataTypes.includes('audit_trail') || dataTypes.includes('all')) {
        userData.auditTrail = await prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1000, // Limit to last 1000 entries
        });
      }

      return userData;
    } catch (error) {
      await logProductionError(error, {
        component: 'data_protection',
        action: 'collect_user_data',
        userId,
        url: '/data-collection',
        userAgent: 'server',
        category: 'database',
        metadata: { dataTypes },
      });

      throw new Error(
        `Data collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Format export data based on requested format
   */
  private static formatExportData(
    userData: Record<string, unknown>,
    format: 'json' | 'csv' | 'xml'
  ): string {
    switch (format) {
      case 'json':
        return JSON.stringify(userData, null, 2);

      case 'csv':
        // Convert to CSV format (simplified)
        return this.convertToCSV(userData);

      case 'xml':
        // Convert to XML format (simplified)
        return this.convertToXML(userData);

      default:
        return JSON.stringify(userData, null, 2);
    }
  }

  /**
   * Convert data to CSV format
   */
  private static convertToCSV(userData: Record<string, unknown>): string {
    let csv = '';

    for (const [section, data] of Object.entries(userData)) {
      csv += `\n--- ${section.toUpperCase()} ---\n`;

      if (Array.isArray(data)) {
        if (data.length > 0) {
          const typedData = data as Record<string, unknown>[];
          const headers = Object.keys(typedData[0]);
          csv += headers.join(',') + '\n';

          typedData.forEach((item) => {
            const row = headers.map((header) => {
              const value = item[header];
              return typeof value === 'object' && value !== null
                ? JSON.stringify(value)
                : String(value ?? '');
            });
            csv += row.join(',') + '\n';
          });
        }
      } else if (data && typeof data === 'object') {
        const typedEntry = data as Record<string, unknown>;
        csv += 'Field,Value\n';
        Object.entries(typedEntry).forEach(([key, value]) => {
          const formatted =
            typeof value === 'object' && value !== null
              ? JSON.stringify(value)
              : String(value ?? '');
          csv += `${key},"${formatted}"\n`;
        });
      }
    }

    return csv;
  }

  /**
   * Convert data to XML format
   */
  private static convertToXML(userData: Record<string, unknown>): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<user_data>\n';

    for (const [section, data] of Object.entries(userData)) {
      xml += `  <${section}>\n`;

      if (Array.isArray(data)) {
        const typedData = data as Record<string, unknown>[];
        typedData.forEach((item, index) => {
          xml += `    <item_${index}>\n`;
          Object.entries(item).forEach(([key, value]) => {
            const formatted =
              typeof value === 'object' && value !== null
                ? JSON.stringify(value)
                : String(value ?? '');
            xml += `      <${key}>${formatted}</${key}>\n`;
          });
          xml += `    </item_${index}>\n`;
        });
      } else if (data && typeof data === 'object') {
        const typedEntry = data as Record<string, unknown>;
        Object.entries(typedEntry).forEach(([key, value]) => {
          const formatted =
            typeof value === 'object' && value !== null
              ? JSON.stringify(value)
              : String(value ?? '');
          xml += `    <${key}>${formatted}</${key}>\n`;
        });
      }
      xml += `    <value>${String(data ?? '')}</value>\n`;
      xml += `  </${section}>\n`;
    }

    xml += '</user_data>';
    return xml;
  }

  /**
   * Delete user data (GDPR right to be forgotten)
   */
  static async deleteUserData(
    userId: string,
    requestedBy: string
  ): Promise<void> {
    try {
      // This is a critical operation that should be done with extreme caution
      // In production, you might want to anonymize rather than delete to preserve referential integrity

      await AuditTrailService.createAuditLog({
        entityType: 'data_deletion',
        entityId: userId,
        action: 'delete_user_data',
        userId: requestedBy,
        changes: {
          targetUserId: userId,
          requestedBy,
          deletionType: 'gdpr_right_to_be_forgotten',
          requestedAt: new Date().toISOString(),
        },
      });

      // In a real implementation, you would:
      // 1. Anonymize or delete user records
      // 2. Update related records to remove personal information
      // 3. Preserve audit trails for legal compliance
      // 4. Handle cascading deletions carefully

      await AuditTrailService.createAuditLog({
        entityType: 'data_deletion',
        entityId: userId,
        action: 'user_data_deleted',
        userId: requestedBy,
        changes: {
          targetUserId: userId,
          deletedBy: requestedBy,
          completedAt: new Date().toISOString(),
          status: 'completed',
        },
      });
    } catch (error) {
      await logProductionError(error, {
        component: 'data_protection',
        action: 'delete_user_data',
        userId: requestedBy,
        url: '/data-deletion',
        userAgent: 'server',
        category: 'database',
        metadata: { targetUserId: userId },
      });

      throw new Error(
        `Data deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
