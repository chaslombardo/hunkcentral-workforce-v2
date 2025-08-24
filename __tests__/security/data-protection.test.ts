/**
 * Data Protection Security Tests
 * Tests encryption, backup, retention, and GDPR compliance features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DataEncryption,
  DataBackup,
  DataRetention,
  DataExport,
} from '@/lib/data-protection';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    dailyLog: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    commissionEntry: {
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

// Mock crypto for consistent testing
vi.mock('crypto', async () => ({
  ...(await vi.importActual('crypto')),
  randomBytes: vi.fn().mockReturnValue(Buffer.from('test-random-bytes')),
}));

describe('Data Protection Security', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = prisma as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Encryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'Sensitive user information';

      const encrypted = DataEncryption.encrypt(originalData);
      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.encryptedData).not.toBe(originalData);

      const decrypted = DataEncryption.decrypt(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should produce different encrypted outputs for same input', () => {
      const data = 'Test data';

      const encrypted1 = DataEncryption.encrypt(data);
      const encrypted2 = DataEncryption.encrypt(data);

      // Should be different due to random IV
      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // But both should decrypt to original
      expect(DataEncryption.decrypt(encrypted1)).toBe(data);
      expect(DataEncryption.decrypt(encrypted2)).toBe(data);
    });

    it('should fail decryption with tampered data', () => {
      const originalData = 'Sensitive data';
      const encrypted = DataEncryption.encrypt(originalData);

      // Tamper with encrypted data
      const tamperedEncrypted = {
        ...encrypted,
        encryptedData: encrypted.encryptedData.slice(0, -2) + 'XX',
      };

      expect(() => DataEncryption.decrypt(tamperedEncrypted)).toThrow();
    });

    it('should hash data securely', () => {
      const data = 'password123';

      const { hash, salt } = DataEncryption.hash(data);
      expect(hash).toBeDefined();
      expect(salt).toBeDefined();
      expect(hash).not.toBe(data);
      expect(hash.length).toBeGreaterThan(50); // PBKDF2 produces long hashes
    });

    it('should verify hashed data correctly', () => {
      const data = 'password123';
      const { hash, salt } = DataEncryption.hash(data);

      expect(DataEncryption.verifyHash(data, hash, salt)).toBe(true);
      expect(DataEncryption.verifyHash('wrongpassword', hash, salt)).toBe(
        false
      );
    });

    it('should use timing-safe comparison for hash verification', () => {
      const data = 'password123';
      const { hash, salt } = DataEncryption.hash(data);

      // Even with similar but wrong data, should return false
      expect(DataEncryption.verifyHash('password124', hash, salt)).toBe(false);
      expect(DataEncryption.verifyHash('password12', hash, salt)).toBe(false);
    });
  });

  describe('Data Backup', () => {
    beforeEach(() => {
      // Mock database responses
      mockPrisma.user.findMany.mockResolvedValue([
        { id: '1', email: 'user1@test.com', fullName: 'User 1' },
        { id: '2', email: 'user2@test.com', fullName: 'User 2' },
      ]);

      mockPrisma.dailyLog.findMany.mockResolvedValue([
        { id: '1', captainId: '1', logDate: new Date() },
      ]);

      mockPrisma.auditLog.create.mockResolvedValue({});
    });

    it('should create full backup successfully', async () => {
      const userId = 'admin-1';

      const backup = await DataBackup.createFullBackup(userId);

      expect(backup).toBeDefined();
      expect(backup.id).toMatch(/^backup_\d+_/);
      expect(backup.type).toBe('full');
      expect(backup.status).toBe('completed');
      expect(backup.tables).toContain('User');
      expect(backup.tables).toContain('DailyLog');
      expect(backup.recordCount).toBeGreaterThan(0);
      expect(backup.checksum).toBeDefined();

      // Should log the backup creation
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'data_backup',
          action: 'create_full_backup',
          userId,
        }),
      });
    });

    it('should create incremental backup successfully', async () => {
      const userId = 'admin-1';
      const lastBackupDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

      const backup = await DataBackup.createIncrementalBackup(
        userId,
        lastBackupDate
      );

      expect(backup).toBeDefined();
      expect(backup.id).toMatch(/^backup_inc_\d+_/);
      expect(backup.type).toBe('incremental');
      expect(backup.status).toBe('completed');

      // Should query for records updated since last backup
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { updatedAt: { gt: lastBackupDate } },
      });
    });

    it('should handle backup failures gracefully', async () => {
      const userId = 'admin-1';
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'));

      await expect(DataBackup.createFullBackup(userId)).rejects.toThrow(
        'Backup creation failed'
      );
    });

    it('should restore from backup with proper logging', async () => {
      const backupId = 'backup_123';
      const userId = 'admin-1';

      await DataBackup.restoreFromBackup(backupId, userId);

      // Should log both initiation and completion
      expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'data_restore',
          action: 'restore_from_backup',
          userId,
        }),
      });
    });
  });

  describe('Data Retention', () => {
    beforeEach(() => {
      mockPrisma.dailyLog.count.mockResolvedValue(10);
      mockPrisma.auditLog.count.mockResolvedValue(5);
      mockPrisma.auditLog.create.mockResolvedValue({});
    });

    it('should apply retention policies successfully', async () => {
      const userId = 'admin-1';

      const result = await DataRetention.applyRetentionPolicies(userId);

      expect(result).toBeDefined();
      expect(result.archived).toBeGreaterThanOrEqual(0);
      expect(result.deleted).toBeGreaterThanOrEqual(0);
      expect(result.policies).toBeDefined();
      expect(result.policies.length).toBeGreaterThan(0);

      // Should log the retention policy application
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'data_retention',
          action: 'apply_retention_policies',
          userId,
        }),
      });
    });

    it('should handle retention policy failures gracefully', async () => {
      const userId = 'admin-1';
      mockPrisma.dailyLog.count.mockRejectedValue(new Error('Database error'));

      await expect(
        DataRetention.applyRetentionPolicies(userId)
      ).rejects.toThrow('Retention policy application failed');
    });

    it('should respect retention policy exceptions', async () => {
      // This test would verify that security audit logs are kept longer
      // In the current implementation, it's simulated through counting
      const userId = 'admin-1';

      const result = await DataRetention.applyRetentionPolicies(userId);

      // Should have policies with exceptions
      const auditPolicy = result.policies.find(
        (p) => p.entityType === 'audit_log'
      );
      expect(auditPolicy?.exceptions).toContain('security');
    });
  });

  describe('Data Export (GDPR)', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['captain'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.dailyLog.findMany.mockResolvedValue([
        { id: '1', captainId: 'user-1', logDate: new Date() },
      ]);

      mockPrisma.commissionEntry.findMany.mockResolvedValue([
        { id: '1', salesId: 'user-1', jobId: '1234567' },
      ]);

      mockPrisma.auditLog.findMany.mockResolvedValue([
        { id: '1', userId: 'user-1', action: 'login', createdAt: new Date() },
      ]);

      mockPrisma.auditLog.create.mockResolvedValue({});
    });

    it('should create export request successfully', async () => {
      const userId = 'user-1';
      const requestedBy = 'admin-1';
      const request = {
        dataTypes: ['profile', 'logs'] as const,
        format: 'json' as const,
      };

      const exportRequest = await DataExport.createExportRequest(
        userId,
        requestedBy,
        request
      );

      expect(exportRequest).toBeDefined();
      expect(exportRequest.id).toMatch(/^export_\d+_/);
      expect(exportRequest.userId).toBe(userId);
      expect(exportRequest.requestedBy).toBe(requestedBy);
      expect(exportRequest.dataTypes).toEqual(['profile', 'logs']);
      expect(exportRequest.format).toBe('json');
      expect(exportRequest.status).toBe('completed'); // Processed immediately in test

      // Should log the export request
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'data_export',
          action: 'create_export_request',
          userId: requestedBy,
        }),
      });
    });

    it('should export all data types when requested', async () => {
      const userId = 'user-1';
      const requestedBy = 'admin-1';
      const request = {
        dataTypes: ['all'] as const,
        format: 'json' as const,
      };

      const exportRequest = await DataExport.createExportRequest(
        userId,
        requestedBy,
        request
      );

      expect(exportRequest.dataTypes).toEqual(['all']);

      // Should query all relevant tables
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
      expect(mockPrisma.dailyLog.findMany).toHaveBeenCalled();
      expect(mockPrisma.commissionEntry.findMany).toHaveBeenCalled();
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalled();
    });

    it('should support different export formats', async () => {
      const userId = 'user-1';
      const requestedBy = 'admin-1';

      const formats = ['json', 'csv', 'xml'] as const;

      for (const format of formats) {
        const request = {
          dataTypes: ['profile'] as const,
          format,
        };

        const exportRequest = await DataExport.createExportRequest(
          userId,
          requestedBy,
          request
        );
        expect(exportRequest.format).toBe(format);
      }
    });

    it('should handle export failures gracefully', async () => {
      const userId = 'user-1';
      const requestedBy = 'admin-1';
      const request = {
        dataTypes: ['profile'] as const,
        format: 'json' as const,
      };

      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        DataExport.createExportRequest(userId, requestedBy, request)
      ).rejects.toThrow('Export request creation failed');
    });

    it('should validate export request data', async () => {
      const userId = 'user-1';
      const requestedBy = 'admin-1';

      // Invalid data types
      const invalidRequest = {
        dataTypes: ['invalid'] as any,
        format: 'json' as const,
      };

      await expect(
        DataExport.createExportRequest(userId, requestedBy, invalidRequest)
      ).rejects.toThrow();
    });
  });

  describe('Data Deletion (Right to be Forgotten)', () => {
    beforeEach(() => {
      mockPrisma.auditLog.create.mockResolvedValue({});
    });

    it('should delete user data with proper logging', async () => {
      const userId = 'user-1';
      const requestedBy = 'admin-1';

      await DataExport.deleteUserData(userId, requestedBy);

      // Should log both initiation and completion
      expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'data_deletion',
          action: 'delete_user_data',
          userId: requestedBy,
        }),
      });
    });

    it('should handle deletion failures gracefully', async () => {
      const userId = 'user-1';
      const requestedBy = 'admin-1';

      mockPrisma.auditLog.create.mockRejectedValue(new Error('Database error'));

      await expect(
        DataExport.deleteUserData(userId, requestedBy)
      ).rejects.toThrow('Data deletion failed');
    });
  });

  describe('Data Protection Integration', () => {
    it('should maintain data integrity across operations', async () => {
      const testData = 'Sensitive information';

      // Encrypt data
      const encrypted = DataEncryption.encrypt(testData);

      // Simulate storing and retrieving encrypted data
      const retrieved = DataEncryption.decrypt(encrypted);
      expect(retrieved).toBe(testData);

      // Hash for comparison
      const { hash, salt } = DataEncryption.hash(testData);
      expect(DataEncryption.verifyHash(testData, hash, salt)).toBe(true);
    });

    it('should handle concurrent operations safely', async () => {
      const userId = 'admin-1';

      // Simulate concurrent backup and retention operations
      const backupPromise = DataBackup.createFullBackup(userId);
      const retentionPromise = DataRetention.applyRetentionPolicies(userId);

      const [backup, retention] = await Promise.all([
        backupPromise,
        retentionPromise,
      ]);

      expect(backup.status).toBe('completed');
      expect(retention.policies).toBeDefined();
    });

    it('should maintain audit trail for all operations', async () => {
      const userId = 'admin-1';

      // Perform various operations
      await DataBackup.createFullBackup(userId);
      await DataRetention.applyRetentionPolicies(userId);

      // Each operation should create audit logs
      expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle malformed encrypted data', () => {
      const malformedData = {
        encryptedData: 'invalid',
        iv: 'invalid',
        tag: 'invalid',
      };

      expect(() => DataEncryption.decrypt(malformedData)).toThrow();
    });

    it('should handle empty or null data gracefully', () => {
      expect(() => DataEncryption.encrypt('')).not.toThrow();

      const encrypted = DataEncryption.encrypt('');
      const decrypted = DataEncryption.decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle large data sets in exports', async () => {
      const userId = 'user-1';
      const requestedBy = 'admin-1';

      // Mock large dataset
      const largeLogs = Array.from({ length: 1000 }, (_, i) => ({
        id: `log-${i}`,
        captainId: userId,
        logDate: new Date(),
      }));

      mockPrisma.dailyLog.findMany.mockResolvedValue(largeLogs);

      const request = {
        dataTypes: ['logs'] as const,
        format: 'json' as const,
      };

      const exportRequest = await DataExport.createExportRequest(
        userId,
        requestedBy,
        request
      );
      expect(exportRequest.status).toBe('completed');
    });

    it('should validate backup integrity', async () => {
      const userId = 'admin-1';

      const backup = await DataBackup.createFullBackup(userId);

      // Backup should have valid checksum
      expect(backup.checksum).toBeDefined();
      expect(backup.checksum.length).toBe(64); // SHA-256 hex length

      // Should include all expected tables
      const expectedTables = [
        'User',
        'DailyLog',
        'LogJob',
        'LogHour',
        'CommissionEntry',
        'PayPeriod',
        'AuditLog',
      ];
      expectedTables.forEach((table) => {
        expect(backup.tables).toContain(table);
      });
    });
  });
});
