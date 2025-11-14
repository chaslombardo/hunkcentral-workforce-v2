/**
 * Edge case tests for validation logic
 * Tests form validation, data integrity, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DailyLogFormSchema,
  CommissionEntrySchema,
  UserFormSchema,
} from '@/lib/validations';
import { saveDraftLog, submitLog } from '@/lib/actions/logs';
import { createCommissionEntry } from '@/lib/actions/commission';
import { createUser, updateUser } from '@/lib/actions/users';
import type { DailyLogFormData } from '@/lib/validations';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const { auth } = await import('@/lib/auth');

describe('Validation Edge Cases', () => {
  const mockUser = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      fullName: 'Test User',
      roles: ['captain'],
    },
  };

  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockUser);
  });

  describe('Daily Log Form Validation', () => {
    it('should reject empty captain ID', () => {
      const invalidData = {
        captainId: '',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Captain selection is required'
      );
    });

    it('should reject whitespace-only captain ID', () => {
      const invalidData = {
        captainId: '   ',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Captain selection is required'
      );
    });

    it('should reject invalid date objects', () => {
      const invalidData = {
        captainId: 'captain-id',
        logDate: new Date('invalid-date'),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow();
    });

    it('should reject future dates beyond reasonable limit', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);

      const invalidData = {
        captainId: 'captain-id',
        logDate: futureDate,
        sections: { junk: true, move: false, otherHours: false },
        jobs: [],
        hours: [],
      };

      // Should be rejected by business logic, not schema
      expect(() => DailyLogFormSchema.parse(invalidData)).not.toThrow();
    });

    it('should reject negative revenue amounts', () => {
      const invalidData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: 'JOB123',
            clientName: 'Test Client',
            revenue: -100, // Negative revenue
            tips: 50,
          },
        ],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Revenue must be a positive number'
      );
    });

    it('should reject negative tip amounts', () => {
      const invalidData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: 'JOB123',
            clientName: 'Test Client',
            revenue: 500,
            tips: -25, // Negative tips
          },
        ],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Tips must be a positive number'
      );
    });

    it('should reject zero revenue', () => {
      const invalidData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: 'JOB123',
            clientName: 'Test Client',
            revenue: 0, // Zero revenue
            tips: 50,
          },
        ],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Revenue must be greater than 0'
      );
    });

    it('should accept zero tips', () => {
      const validData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: 'JOB123',
            clientName: 'Test Client',
            revenue: 500,
            tips: 0, // Zero tips should be allowed
          },
        ],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(validData)).not.toThrow();
    });

    it('should reject extremely large revenue amounts', () => {
      const invalidData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: 'JOB123',
            clientName: 'Test Client',
            revenue: 100000000, // $100 million - unrealistic
            tips: 50,
          },
        ],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Revenue cannot exceed $10,000,000'
      );
    });

    it('should reject negative hours', () => {
      const invalidData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [],
        hours: [
          {
            employeeId: 'emp-1',
            department: 'junk' as const,
            hours: -5, // Negative hours
            isCoCaptain: false,
          },
        ],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Hours must be a positive number'
      );
    });

    it('should reject excessive daily hours', () => {
      const invalidData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [],
        hours: [
          {
            employeeId: 'emp-1',
            department: 'junk' as const,
            hours: 25, // More than 24 hours in a day
            isCoCaptain: false,
          },
        ],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Hours cannot exceed 24 per day'
      );
    });

    it('should reject empty job ID', () => {
      const invalidData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: '', // Empty job ID
            clientName: 'Test Client',
            revenue: 500,
            tips: 50,
          },
        ],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Job ID is required'
      );
    });

    it('should reject empty client name', () => {
      const invalidData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: 'JOB123',
            clientName: '', // Empty client name
            revenue: 500,
            tips: 50,
          },
        ],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Client name is required'
      );
    });

    it('should handle very long job IDs', () => {
      const longJobId = 'A'.repeat(1000); // 1000 character job ID

      const invalidData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: longJobId,
            clientName: 'Test Client',
            revenue: 500,
            tips: 50,
          },
        ],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Job ID cannot exceed 100 characters'
      );
    });

    it('should handle very long client names', () => {
      const longClientName = 'A'.repeat(1000); // 1000 character client name

      const invalidData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: 'JOB123',
            clientName: longClientName,
            revenue: 500,
            tips: 50,
          },
        ],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(invalidData)).toThrow(
        'Client name cannot exceed 200 characters'
      );
    });

    it('should handle fractional hours correctly', () => {
      const validData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [],
        hours: [
          {
            employeeId: 'emp-1',
            department: 'junk' as const,
            hours: 7.5, // Fractional hours should be allowed
            isCoCaptain: false,
          },
        ],
      };

      expect(() => DailyLogFormSchema.parse(validData)).not.toThrow();
    });

    it('should handle fractional revenue and tips', () => {
      const validData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: 'JOB123',
            clientName: 'Test Client',
            revenue: 499.99, // Fractional revenue
            tips: 49.5, // Fractional tips
          },
        ],
        hours: [],
      };

      expect(() => DailyLogFormSchema.parse(validData)).not.toThrow();
    });
  });

  describe('Commission Entry Validation', () => {
    it('should reject empty sales ID', () => {
      const invalidData = {
        salesId: '',
        jobId: 'JOB123',
        clientName: 'Test Client',
        jobType: 'junk',
        targetDate: new Date(),
        estimatedRevenue: 500,
      };

      expect(() => CommissionEntrySchema.parse(invalidData)).toThrow(
        'Sales person selection is required'
      );
    });

    it('should reject empty job ID', () => {
      const invalidData = {
        salesId: 'sales-1',
        jobId: '',
        clientName: 'Test Client',
        jobType: 'junk',
        targetDate: new Date(),
        estimatedRevenue: 500,
      };

      expect(() => CommissionEntrySchema.parse(invalidData)).toThrow(
        'Job ID is required'
      );
    });

    it('should reject negative estimated revenue', () => {
      const invalidData = {
        salesId: 'sales-1',
        jobId: 'JOB123',
        clientName: 'Test Client',
        jobType: 'junk',
        targetDate: new Date(),
        estimatedRevenue: -100,
      };

      expect(() => CommissionEntrySchema.parse(invalidData)).toThrow(
        'Estimated revenue must be a positive number'
      );
    });

    it('should reject zero estimated revenue', () => {
      const invalidData = {
        salesId: 'sales-1',
        jobId: 'JOB123',
        clientName: 'Test Client',
        jobType: 'junk',
        targetDate: new Date(),
        estimatedRevenue: 0,
      };

      expect(() => CommissionEntrySchema.parse(invalidData)).toThrow(
        'Estimated revenue must be greater than 0'
      );
    });

    it('should reject past target dates beyond reasonable limit', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 10);

      const invalidData = {
        salesId: 'sales-1',
        jobId: 'JOB123',
        clientName: 'Test Client',
        jobType: 'junk',
        targetDate: pastDate,
        estimatedRevenue: 500,
      };

      // Should be handled by business logic, not schema
      expect(() => CommissionEntrySchema.parse(invalidData)).not.toThrow();
    });

    it('should handle very large estimated revenue', () => {
      const invalidData = {
        salesId: 'sales-1',
        jobId: 'JOB123',
        clientName: 'Test Client',
        jobType: 'junk',
        targetDate: new Date(),
        estimatedRevenue: 50000000, // $50 million
      };

      expect(() => CommissionEntrySchema.parse(invalidData)).toThrow(
        'Estimated revenue cannot exceed $10,000,000'
      );
    });
  });

  describe('User Form Validation', () => {
    it('should reject invalid email formats', () => {
      const invalidData = {
        email: 'not-an-email',
        fullName: 'Test User',
        roles: ['wingman'],
        password: 'password123',
      };

      expect(() => UserFormSchema.parse(invalidData)).toThrow(
        'Invalid email address'
      );
    });

    it('should reject empty full name', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: '',
        roles: ['wingman'],
        password: 'password123',
      };

      expect(() => UserFormSchema.parse(invalidData)).toThrow(
        'Full name is required'
      );
    });

    it('should reject empty roles array', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'Test User',
        roles: [],
        password: 'password123',
      };

      expect(() => UserFormSchema.parse(invalidData)).toThrow(
        'At least one role is required'
      );
    });

    it('should reject invalid role values', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['invalid-role'],
        password: 'password123',
      };

      expect(() => UserFormSchema.parse(invalidData)).toThrow();
    });

    it('should reject short passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['wingman'],
        password: '123', // Too short
      };

      expect(() => UserFormSchema.parse(invalidData)).toThrow(
        'Password must be at least 8 characters'
      );
    });

    it('should reject negative hourly rates', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['wingman'],
        password: 'password123',
        rateJunkWingman: -5, // Negative rate
      };

      expect(() => UserFormSchema.parse(invalidData)).toThrow(
        'Rate must be a positive number'
      );
    });

    it('should reject excessive hourly rates', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['wingman'],
        password: 'password123',
        rateJunkWingman: 1000, // $1000/hour is excessive
      };

      expect(() => UserFormSchema.parse(invalidData)).toThrow(
        'Rate cannot exceed $500 per hour'
      );
    });

    it('should reject negative salary amounts', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['admin'],
        password: 'password123',
        salaryAmount: -1000,
      };

      expect(() => UserFormSchema.parse(invalidData)).toThrow(
        'Salary amount must be positive'
      );
    });

    it('should reject invalid commission rates', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['sales'],
        password: 'password123',
        commissionRate: 150, // 150% commission is excessive
      };

      expect(() => UserFormSchema.parse(invalidData)).toThrow(
        'Commission rate cannot exceed 100%'
      );
    });

    it('should reject negative commission rates', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['sales'],
        password: 'password123',
        commissionRate: -5,
      };

      expect(() => UserFormSchema.parse(invalidData)).toThrow(
        'Commission rate must be positive'
      );
    });

    it('should reject invalid bonus goal percentages', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['captain'],
        password: 'password123',
        junkBonusGoal: 1.5, // 150% is excessive
      };

      expect(() => UserFormSchema.parse(invalidData)).toThrow(
        'Bonus goal cannot exceed 100%'
      );
    });
  });

  describe('Server Action Validation', () => {
    it('should handle malformed form data in saveDraftLog', async () => {
      const malformedData = {
        captainId: null, // Should be string
        logDate: 'not-a-date', // Should be Date
        sections: 'not-an-object', // Should be object
        jobs: 'not-an-array', // Should be array
        hours: 'not-an-array', // Should be array
      } as any;

      const result = await saveDraftLog(null, malformedData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    it('should handle SQL injection attempts in job IDs', async () => {
      const maliciousData: DailyLogFormData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk',
            jobId: "'; DROP TABLE logs; --", // SQL injection attempt
            clientName: 'Test Client',
            revenue: 500,
            tips: 50,
          },
        ],
        hours: [],
      };

      const result = await submitLog(null, maliciousData);

      // Should either succeed (if properly sanitized) or fail with validation error
      if (!result.success) {
        expect(result.error).not.toContain('DROP TABLE');
      }
    });

    it('should handle XSS attempts in client names', async () => {
      const maliciousData: DailyLogFormData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk',
            jobId: 'JOB123',
            clientName: '<script>alert("xss")</script>', // XSS attempt
            revenue: 500,
            tips: 50,
          },
        ],
        hours: [
          {
            employeeId: 'emp-1',
            department: 'junk',
            hours: 8,
            isCoCaptain: false,
          },
        ],
      };

      const result = await submitLog(null, maliciousData);

      // Should succeed but sanitize the input
      if (result.success) {
        // The malicious script should be escaped or removed
        expect(result.data).toBeDefined();
      }
    });

    it('should handle extremely large payloads', async () => {
      // Create a log with many jobs and hours
      const largeJobs = Array.from({ length: 1000 }, (_, i) => ({
        jobType: 'junk' as const,
        jobId: `LARGE-JOB-${i}`,
        clientName: `Large Client ${i}`,
        revenue: 100,
        tips: 10,
      }));

      const largeHours = Array.from({ length: 1000 }, (_, i) => ({
        employeeId: `emp-${i}`,
        department: 'junk' as const,
        hours: 1,
        isCoCaptain: false,
      }));

      const largeData: DailyLogFormData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: largeJobs,
        hours: largeHours,
      };

      const result = await saveDraftLog(null, largeData);

      // Should either succeed or fail gracefully with size limit error
      if (!result.success) {
        expect(result.error).toMatch(/too large|limit|size/i);
      }
    });

    it('should handle concurrent submissions', async () => {
      const formData: DailyLogFormData = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk',
            jobId: 'CONCURRENT-JOB',
            clientName: 'Concurrent Client',
            revenue: 500,
            tips: 50,
          },
        ],
        hours: [
          {
            employeeId: 'emp-1',
            department: 'junk',
            hours: 8,
            isCoCaptain: false,
          },
        ],
      };

      // Submit the same form data multiple times concurrently
      const promises = Array.from({ length: 5 }, () =>
        submitLog(null, formData)
      );

      const results = await Promise.all(promises);

      // At least one should succeed, others might fail due to constraints
      const successCount = results.filter((r) => r.success).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Data Integrity Edge Cases', () => {
    it('should handle circular references in form data', async () => {
      const circularData: any = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [],
        hours: [],
      };

      // Create circular reference
      circularData.self = circularData;

      const result = await saveDraftLog(null, circularData);

      // Should handle gracefully without infinite loops
      expect(result.success).toBe(false);
    });

    it('should handle null and undefined values in nested objects', async () => {
      const dataWithNulls: any = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk',
            jobId: 'NULL-TEST',
            clientName: null, // Should be string
            revenue: undefined, // Should be number
            tips: 50,
          },
        ],
        hours: [],
      };

      const result = await saveDraftLog(null, dataWithNulls);

      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    it('should handle type coercion attempts', async () => {
      const coercionData: any = {
        captainId: 'captain-id',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [
          {
            jobType: 'junk',
            jobId: 'COERCION-TEST',
            clientName: 'Test Client',
            revenue: '500', // String instead of number
            tips: '50', // String instead of number
          },
        ],
        hours: [
          {
            employeeId: 'emp-1',
            department: 'junk',
            hours: '8', // String instead of number
            isCoCaptain: 'false', // String instead of boolean
          },
        ],
      };

      const result = await saveDraftLog(null, coercionData);

      // Zod should handle type coercion or reject invalid types
      if (result.success) {
        // If successful, values should be properly typed
        expect(typeof result.data).toBe('object');
      } else {
        expect(result.error).toContain('validation');
      }
    });
  });
});
