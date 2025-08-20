import { describe, it, expect } from 'vitest';
import { CommissionEntrySchema } from '@/lib/validations';

describe('Commission Entry Validation', () => {
  describe('Job ID validation', () => {
    it('should accept valid job IDs', () => {
      const validJobIds = [
        'JOB123',
        'MOVE-456',
        'JUNK_789',
        'ABC123DEF',
        '12345',
        'TEST-JOB-001',
      ];

      validJobIds.forEach((jobId) => {
        const result = CommissionEntrySchema.safeParse({
          salesId: 'user-123',
          jobId,
          clientName: 'Test Client',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 100.0,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.jobId).toBe(jobId.toUpperCase());
        }
      });
    });

    it('should reject invalid job IDs', () => {
      const invalidJobIds = [
        '', // empty
        'job with spaces', // spaces
        'job@123', // special characters
        'job.123', // periods
        'a'.repeat(51), // too long
        'lowercase', // should be transformed to uppercase
      ];

      invalidJobIds.forEach((jobId) => {
        const result = CommissionEntrySchema.safeParse({
          salesId: 'user-123',
          jobId,
          clientName: 'Test Client',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 100.0,
        });

        if (jobId === 'lowercase') {
          // This should succeed but be transformed
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.jobId).toBe('LOWERCASE');
          }
        } else {
          expect(result.success).toBe(false);
        }
      });
    });

    it('should transform job ID to uppercase and trim whitespace', () => {
      const result = CommissionEntrySchema.safeParse({
        salesId: 'user-123',
        jobId: '  job123  ',
        clientName: 'Test Client',
        jobType: 'junk',
        targetDate: new Date(),
        estimatedRevenue: 100.0,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.jobId).toBe('JOB123');
      }
    });
  });

  describe('Sales ID validation', () => {
    it('should require sales consultant selection', () => {
      const result = CommissionEntrySchema.safeParse({
        salesId: '',
        jobId: 'JOB123',
        clientName: 'Test Client',
        jobType: 'junk',
        targetDate: new Date(),
        estimatedRevenue: 100.0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes('salesId') &&
              issue.message.includes('required')
          )
        ).toBe(true);
      }
    });
  });

  describe('Client name validation', () => {
    it('should require client name', () => {
      const result = CommissionEntrySchema.safeParse({
        salesId: 'user-123',
        jobId: 'JOB123',
        clientName: '',
        jobType: 'junk',
        targetDate: new Date(),
        estimatedRevenue: 100.0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes('clientName') &&
              issue.message.includes('required')
          )
        ).toBe(true);
      }
    });

    it('should reject client names that are too long', () => {
      const result = CommissionEntrySchema.safeParse({
        salesId: 'user-123',
        jobId: 'JOB123',
        clientName: 'a'.repeat(101),
        jobType: 'junk',
        targetDate: new Date(),
        estimatedRevenue: 100.0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes('clientName') &&
              issue.message.includes('100 characters')
          )
        ).toBe(true);
      }
    });
  });

  describe('Job type validation', () => {
    it('should accept valid job types', () => {
      const validTypes = ['junk', 'move'] as const;

      validTypes.forEach((jobType) => {
        const result = CommissionEntrySchema.safeParse({
          salesId: 'user-123',
          jobId: 'JOB123',
          clientName: 'Test Client',
          jobType,
          targetDate: new Date(),
          estimatedRevenue: 100.0,
        });

        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid job types', () => {
      const result = CommissionEntrySchema.safeParse({
        salesId: 'user-123',
        jobId: 'JOB123',
        clientName: 'Test Client',
        jobType: 'invalid' as any,
        targetDate: new Date(),
        estimatedRevenue: 100.0,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Estimated revenue validation', () => {
    it('should require positive revenue', () => {
      const invalidRevenues = [0, -1, -100];

      invalidRevenues.forEach((estimatedRevenue) => {
        const result = CommissionEntrySchema.safeParse({
          salesId: 'user-123',
          jobId: 'JOB123',
          clientName: 'Test Client',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(
            result.error.issues.some(
              (issue) =>
                issue.path.includes('estimatedRevenue') &&
                issue.message.includes('greater than $0.00')
            )
          ).toBe(true);
        }
      });
    });

    it('should accept valid revenue amounts', () => {
      const validRevenues = [0.01, 1, 100, 1000.5, 9999.99];

      validRevenues.forEach((estimatedRevenue) => {
        const result = CommissionEntrySchema.safeParse({
          salesId: 'user-123',
          jobId: 'JOB123',
          clientName: 'Test Client',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue,
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Target date validation', () => {
    it('should require a valid date', () => {
      const result = CommissionEntrySchema.safeParse({
        salesId: 'user-123',
        jobId: 'JOB123',
        clientName: 'Test Client',
        jobType: 'junk',
        targetDate: 'invalid-date' as any,
        estimatedRevenue: 100.0,
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid dates', () => {
      const validDates = [
        new Date(),
        new Date('2024-12-31'),
        new Date(Date.now() + 86400000), // tomorrow
      ];

      validDates.forEach((targetDate) => {
        const result = CommissionEntrySchema.safeParse({
          salesId: 'user-123',
          jobId: 'JOB123',
          clientName: 'Test Client',
          jobType: 'junk',
          targetDate,
          estimatedRevenue: 100.0,
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Complete valid entry', () => {
    it('should accept a complete valid commission entry', () => {
      const validEntry = {
        salesId: 'user-123',
        jobId: 'JOB123',
        clientName: 'John Doe',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 250.0,
      };

      const result = CommissionEntrySchema.safeParse(validEntry);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.salesId).toBe('user-123');
        expect(result.data.jobId).toBe('JOB123');
        expect(result.data.clientName).toBe('John Doe');
        expect(result.data.jobType).toBe('junk');
        expect(result.data.estimatedRevenue).toBe(250.0);
      }
    });
  });
});
