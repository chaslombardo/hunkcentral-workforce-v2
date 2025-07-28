import { describe, it, expect } from 'vitest';
import { DailyLogFormSchema, LogJobSchema, type DailyLogFormData } from '@/lib/validations';

// Focus on validation logic and business rules

describe('Job Entry System', () => {
  describe('Job Data Structure Validation', () => {
    it('should validate junk job structure correctly', () => {
      const junkJob = {
        jobType: 'junk' as const,
        jobId: 'J12345',
        clientName: 'John Doe',
        revenue: 250.00,
        tips: 20.00,
      };

      const result = LogJobSchema.safeParse(junkJob);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.jobType).toBe('junk');
        expect(result.data.jobId).toBe('J12345');
        expect(result.data.clientName).toBe('John Doe');
        expect(result.data.revenue).toBe(250.00);
        expect(result.data.tips).toBe(20.00);
      }
    });

    it('should validate move job structure with upsells', () => {
      const moveJob = {
        jobType: 'move' as const,
        jobId: 'M67890',
        clientName: 'Jane Smith',
        revenue: 800.00,
        tips: 50.00,
        junkOnMove: 150.00,
        valuation: 100.00,
        materials: 75.00,
      };

      const result = LogJobSchema.safeParse(moveJob);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.jobType).toBe('move');
        expect(result.data.junkOnMove).toBe(150.00);
        expect(result.data.valuation).toBe(100.00);
        expect(result.data.materials).toBe(75.00);
      }
    });

    it('should validate move job without upsells', () => {
      const moveJobWithoutUpsells = {
        jobType: 'move' as const,
        jobId: 'M67890',
        clientName: 'Jane Smith',
        revenue: 800.00,
        tips: 50.00,
      };

      const result = LogJobSchema.safeParse(moveJobWithoutUpsells);
      expect(result.success).toBe(true);
    });

    it('should reject job with missing required fields', () => {
      const invalidJob = {
        jobType: 'junk' as const,
        jobId: '', // Empty job ID should fail
        clientName: 'John Doe',
        revenue: 250.00,
        tips: 20.00,
      };

      const result = LogJobSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Job ID is required');
      }
    });

    it('should reject job with negative revenue', () => {
      const invalidJob = {
        jobType: 'junk' as const,
        jobId: 'J12345',
        clientName: 'John Doe',
        revenue: -100.00, // Negative revenue should fail
        tips: 20.00,
      };

      const result = LogJobSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Revenue must be a positive number');
      }
    });

    it('should reject job with negative tips', () => {
      const invalidJob = {
        jobType: 'junk' as const,
        jobId: 'J12345',
        clientName: 'John Doe',
        revenue: 250.00,
        tips: -10.00, // Negative tips should fail
      };

      const result = LogJobSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tips must be a positive number');
      }
    });
  });

  describe('Daily Log Integration', () => {
    it('should validate complete daily log with multiple jobs', () => {
      const validJunkJob = {
        jobType: 'junk' as const,
        jobId: 'J12345',
        clientName: 'John Doe',
        revenue: 250.00,
        tips: 20.00,
      };

      const validMoveJob = {
        jobType: 'move' as const,
        jobId: 'M67890',
        clientName: 'Jane Smith',
        revenue: 800.00,
        tips: 50.00,
        junkOnMove: 150.00,
        valuation: 100.00,
        materials: 75.00,
      };

      const validDailyLog = {
        captainId: 'captain-123',
        logDate: new Date(),
        sections: {
          junk: true,
          move: true,
          otherHours: false,
        },
        jobs: [validJunkJob, validMoveJob],
        disposalCost: 75.00,
        hours: [],
      };

      const result = DailyLogFormSchema.safeParse(validDailyLog);
      expect(result.success).toBe(true);
    });

    it('should handle edge cases in job validation', () => {
      const edgeCaseJobs = [
        {
          jobType: 'junk' as const,
          jobId: 'J-SPECIAL-123',
          clientName: 'Client with Special Characters!@#',
          revenue: 0.01, // Minimum positive value
          tips: 0.00, // Zero tips allowed
        },
        {
          jobType: 'move' as const,
          jobId: 'MOVE_2024_001',
          clientName: 'Very Long Client Name That Should Still Be Valid',
          revenue: 9999.99, // Large revenue
          tips: 999.99, // Large tips
          junkOnMove: 0, // Zero upsells allowed
          valuation: 0,
          materials: 0,
        }
      ];

      edgeCaseJobs.forEach((job) => {
        const dailyLog = {
          captainId: 'captain-123',
          logDate: new Date(),
          sections: {
            junk: job.jobType === 'junk',
            move: job.jobType === 'move',
            otherHours: false,
          },
          jobs: [job],
          hours: [],
        };

        const result = DailyLogFormSchema.safeParse(dailyLog);
        expect(result.success).toBe(true);
      });
    });

    it('should validate job filtering by type', () => {
      const mixedJobs = [
        {
          jobType: 'junk' as const,
          jobId: 'J12345',
          clientName: 'Junk Client',
          revenue: 100.00,
          tips: 10.00,
        },
        {
          jobType: 'move' as const,
          jobId: 'M67890',
          clientName: 'Move Client',
          revenue: 200.00,
          tips: 20.00,
          junkOnMove: 50.00,
          valuation: 25.00,
          materials: 15.00,
        }
      ];

      const dailyLog = {
        captainId: 'captain-123',
        logDate: new Date(),
        sections: {
          junk: true,
          move: true,
          otherHours: false,
        },
        jobs: mixedJobs,
        disposalCost: 30.00,
        hours: [],
      };

      const result = DailyLogFormSchema.safeParse(dailyLog);
      expect(result.success).toBe(true);

      if (result.success) {
        const junkJobs = result.data.jobs.filter(job => job.jobType === 'junk');
        const moveJobs = result.data.jobs.filter(job => job.jobType === 'move');
        
        expect(junkJobs).toHaveLength(1);
        expect(moveJobs).toHaveLength(1);
        expect(junkJobs[0].clientName).toBe('Junk Client');
        expect(moveJobs[0].clientName).toBe('Move Client');
      }
    });

    it('should validate "Add Another Job" functionality logic', () => {
      // Test that multiple jobs of the same type can be added
      const multipleJunkJobs = [
        {
          jobType: 'junk' as const,
          jobId: 'J12345',
          clientName: 'First Junk Client',
          revenue: 100.00,
          tips: 10.00,
        },
        {
          jobType: 'junk' as const,
          jobId: 'J67890',
          clientName: 'Second Junk Client',
          revenue: 150.00,
          tips: 15.00,
        },
        {
          jobType: 'junk' as const,
          jobId: 'J11111',
          clientName: 'Third Junk Client',
          revenue: 200.00,
          tips: 20.00,
        }
      ];

      const dailyLog = {
        captainId: 'captain-123',
        logDate: new Date(),
        sections: {
          junk: true,
          move: false,
          otherHours: false,
        },
        jobs: multipleJunkJobs,
        disposalCost: 50.00,
        hours: [],
      };

      const result = DailyLogFormSchema.safeParse(dailyLog);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.jobs).toHaveLength(3);
        expect(result.data.jobs.every(job => job.jobType === 'junk')).toBe(true);
      }
    });
  });

  describe('Move-Specific Fields Validation', () => {
    it('should validate all move upsell fields', () => {
      const moveJobWithAllUpsells = {
        jobType: 'move' as const,
        jobId: 'M12345',
        clientName: 'Full Service Move',
        revenue: 1000.00,
        tips: 100.00,
        junkOnMove: 200.00,
        valuation: 150.00,
        materials: 75.00,
      };

      const result = LogJobSchema.safeParse(moveJobWithAllUpsells);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.junkOnMove).toBe(200.00);
        expect(result.data.valuation).toBe(150.00);
        expect(result.data.materials).toBe(75.00);
      }
    });

    it('should validate partial move upsells', () => {
      const moveJobWithPartialUpsells = {
        jobType: 'move' as const,
        jobId: 'M12345',
        clientName: 'Partial Upsell Move',
        revenue: 800.00,
        tips: 80.00,
        junkOnMove: 100.00,
        // valuation and materials omitted (should default to undefined/0)
      };

      const result = LogJobSchema.safeParse(moveJobWithPartialUpsells);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.junkOnMove).toBe(100.00);
        expect(result.data.valuation).toBeUndefined();
        expect(result.data.materials).toBeUndefined();
      }
    });

    it('should reject negative move upsells', () => {
      const invalidMoveJob = {
        jobType: 'move' as const,
        jobId: 'M12345',
        clientName: 'Invalid Move',
        revenue: 800.00,
        tips: 80.00,
        junkOnMove: -50.00, // Negative upsell should fail
      };

      const result = LogJobSchema.safeParse(invalidMoveJob);
      expect(result.success).toBe(false);
    });
  });
});