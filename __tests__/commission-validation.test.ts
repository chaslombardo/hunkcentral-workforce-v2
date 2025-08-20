import { describe, it, expect } from 'vitest';
import { CommissionEntrySchema } from '@/lib/validations';

describe('Commission Entry Validation', () => {
  describe('CommissionEntrySchema', () => {
    it('should validate a valid commission entry', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('should require salesId', () => {
      const invalidEntry = {
        jobId: 'JOB-001',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('salesId');
      }
    });

    it('should require jobId', () => {
      const invalidEntry = {
        salesId: 'user-123',
        jobId: '',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Job ID is required');
      }
    });

    it('should require clientName', () => {
      const invalidEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: '',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Client name is required');
      }
    });

    it('should only allow valid job types', () => {
      const invalidEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: 'John Doe',
        jobType: 'invalid' as any,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    it('should accept junk job type', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('should accept move job type', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: 'John Doe',
        jobType: 'move' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('should require targetDate to be a valid date', () => {
      const invalidEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: 'invalid-date' as any,
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    it('should require estimatedRevenue to be positive', () => {
      const invalidEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: -100,
      };

      const result = CommissionEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Estimated revenue must be greater than $0.00'
        );
      }
    });

    it('should not allow zero estimatedRevenue', () => {
      const invalidEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 0,
      };

      const result = CommissionEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Estimated revenue must be greater than $0.00'
        );
      }
    });

    it('should handle decimal values for estimatedRevenue', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 123.45,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('should handle large revenue values', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: 'John Doe',
        jobType: 'move' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 50000.0,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });
  });

  describe('Job ID Validation', () => {
    it('should accept alphanumeric job IDs', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'ABC123',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('should accept job IDs with hyphens', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001-A',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('should accept job IDs with underscores', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'JOB_001_A',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });
  });

  describe('Client Name Validation', () => {
    it('should accept names with spaces', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: 'John Smith Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 500.0,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('should accept company names', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: 'ABC Corporation LLC',
        jobType: 'move' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 1500.0,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('should accept names with special characters', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'JOB-001',
        clientName: "O'Connor & Associates",
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 750.0,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });
  });
});
