import { describe, it, expect } from 'vitest';
import { LogJobSchema, DailyLogFormSchema } from '@/lib/validations';

describe('Job Validation Logic', () => {
  describe('LogJobSchema', () => {
    it('should validate a valid junk job', () => {
      const validJunkJob = {
        jobType: 'junk' as const,
        jobId: 'J12345',
        clientName: 'John Doe',
        revenue: 250.0,
        tips: 20.0,
        disposalCost: 50.0,
      };

      const result = LogJobSchema.safeParse(validJunkJob);
      expect(result.success).toBe(true);
    });

    it('should validate a valid move job with upsells', () => {
      const validMoveJob = {
        jobType: 'move' as const,
        jobId: 'M67890',
        clientName: 'Jane Smith',
        revenue: 800.0,
        tips: 50.0,
        junkOnMove: 150.0,
        valuation: 100.0,
        materials: 75.0,
      };

      const result = LogJobSchema.safeParse(validMoveJob);
      expect(result.success).toBe(true);
    });

    it('should require jobId', () => {
      const invalidJob = {
        jobType: 'junk' as const,
        jobId: '',
        clientName: 'John Doe',
        revenue: 250.0,
        tips: 20.0,
      };

      const result = LogJobSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Job ID is required');
    });

    it('should require clientName', () => {
      const invalidJob = {
        jobType: 'junk' as const,
        jobId: 'J12345',
        clientName: '',
        revenue: 250.0,
        tips: 20.0,
      };

      const result = LogJobSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Client name is required');
    });

    it('should require positive revenue', () => {
      const invalidJob = {
        jobType: 'junk' as const,
        jobId: 'J12345',
        clientName: 'John Doe',
        revenue: -100.0,
        tips: 20.0,
      };

      const result = LogJobSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Revenue must be a positive number'
      );
    });

    it('should require non-negative tips', () => {
      const invalidJob = {
        jobType: 'junk' as const,
        jobId: 'J12345',
        clientName: 'John Doe',
        revenue: 250.0,
        tips: -10.0,
      };

      const result = LogJobSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        'Tips must be a positive number'
      );
    });

    it('should allow zero tips', () => {
      const validJob = {
        jobType: 'junk' as const,
        jobId: 'J12345',
        clientName: 'John Doe',
        revenue: 250.0,
        tips: 0.0,
      };

      const result = LogJobSchema.safeParse(validJob);
      expect(result.success).toBe(true);
    });

    it('should validate move-specific fields as optional', () => {
      const moveJobWithoutUpsells = {
        jobType: 'move' as const,
        jobId: 'M67890',
        clientName: 'Jane Smith',
        revenue: 800.0,
        tips: 50.0,
      };

      const result = LogJobSchema.safeParse(moveJobWithoutUpsells);
      expect(result.success).toBe(true);
    });

    it('should require non-negative move upsells when provided', () => {
      const invalidMoveJob = {
        jobType: 'move' as const,
        jobId: 'M67890',
        clientName: 'Jane Smith',
        revenue: 800.0,
        tips: 50.0,
        junkOnMove: -50.0,
      };

      const result = LogJobSchema.safeParse(invalidMoveJob);
      expect(result.success).toBe(false);
    });

    it('should only accept junk or move as jobType', () => {
      const invalidJob = {
        jobType: 'invalid' as any,
        jobId: 'J12345',
        clientName: 'John Doe',
        revenue: 250.0,
        tips: 20.0,
      };

      const result = LogJobSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
    });
  });

  describe('DailyLogFormSchema with Jobs', () => {
    it('should validate a daily log with multiple jobs', () => {
      const validDailyLog = {
        captainId: 'captain-123',
        logDate: new Date(),
        sections: {
          junk: true,
          move: true,
          otherHours: false,
        },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: 'J12345',
            clientName: 'John Doe',
            revenue: 250.0,
            tips: 20.0,
          },
          {
            jobType: 'move' as const,
            jobId: 'M67890',
            clientName: 'Jane Smith',
            revenue: 800.0,
            tips: 50.0,
            junkOnMove: 150.0,
          },
        ],
        disposalCost: 75.0,
        hours: [],
      };

      const result = DailyLogFormSchema.safeParse(validDailyLog);
      expect(result.success).toBe(true);
    });

    it('should validate disposal cost as optional', () => {
      const validDailyLog = {
        captainId: 'captain-123',
        logDate: new Date(),
        sections: {
          junk: true,
          move: false,
          otherHours: false,
        },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: 'J12345',
            clientName: 'John Doe',
            revenue: 250.0,
            tips: 20.0,
          },
        ],
        hours: [],
      };

      const result = DailyLogFormSchema.safeParse(validDailyLog);
      expect(result.success).toBe(true);
    });

    it('should require non-negative disposal cost when provided', () => {
      const invalidDailyLog = {
        captainId: 'captain-123',
        logDate: new Date(),
        sections: {
          junk: true,
          move: false,
          otherHours: false,
        },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: 'J12345',
            clientName: 'John Doe',
            revenue: 250.0,
            tips: 20.0,
          },
        ],
        disposalCost: -25.0,
        hours: [],
      };

      const result = DailyLogFormSchema.safeParse(invalidDailyLog);
      expect(result.success).toBe(false);
    });

    it('should validate empty jobs array', () => {
      const validDailyLog = {
        captainId: 'captain-123',
        logDate: new Date(),
        sections: {
          junk: false,
          move: false,
          otherHours: true,
        },
        jobs: [],
        hours: [],
      };

      const result = DailyLogFormSchema.safeParse(validDailyLog);
      expect(result.success).toBe(true);
    });

    it('should fail validation with invalid job in array', () => {
      const invalidDailyLog = {
        captainId: 'captain-123',
        logDate: new Date(),
        sections: {
          junk: true,
          move: false,
          otherHours: false,
        },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: '', // Invalid: empty job ID
            clientName: 'John Doe',
            revenue: 250.0,
            tips: 20.0,
          },
        ],
        hours: [],
      };

      const result = DailyLogFormSchema.safeParse(invalidDailyLog);
      expect(result.success).toBe(false);
    });
  });

  describe('Business Logic Validation', () => {
    it('should handle decimal precision for currency fields', () => {
      const jobWithDecimals = {
        jobType: 'move' as const,
        jobId: 'M12345',
        clientName: 'Test Client',
        revenue: 1234.56,
        tips: 78.9,
        junkOnMove: 123.45,
        valuation: 67.89,
        materials: 34.12,
      };

      const result = LogJobSchema.safeParse(jobWithDecimals);
      expect(result.success).toBe(true);
    });

    it('should handle edge case of zero revenue (business rule validation)', () => {
      const zeroRevenueJob = {
        jobType: 'junk' as const,
        jobId: 'J12345',
        clientName: 'John Doe',
        revenue: 0.0,
        tips: 20.0,
      };

      const result = LogJobSchema.safeParse(zeroRevenueJob);
      expect(result.success).toBe(true);
    });

    it('should validate job ID format flexibility', () => {
      const jobsWithDifferentIds = [
        {
          jobType: 'junk' as const,
          jobId: 'J-12345',
          clientName: 'Client 1',
          revenue: 100.0,
          tips: 10.0,
        },
        {
          jobType: 'move' as const,
          jobId: 'MOVE_67890',
          clientName: 'Client 2',
          revenue: 200.0,
          tips: 20.0,
        },
        {
          jobType: 'junk' as const,
          jobId: '12345',
          clientName: 'Client 3',
          revenue: 300.0,
          tips: 30.0,
        },
      ];

      jobsWithDifferentIds.forEach((job) => {
        const result = LogJobSchema.safeParse(job);
        expect(result.success).toBe(true);
      });
    });
  });
});
