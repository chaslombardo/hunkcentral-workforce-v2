import { describe, it, expect } from 'vitest';
import {
  LoginSchema,
  LogJobSchema,
  LogHourSchema,
  CommissionEntrySchema,
  DailyLogFormSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UserSearchSchema,
  UserRoleSchema,
  type LoginFormData,
  type LogJobFormData,
  type LogHourFormData,
  type CommissionEntryFormData,
  type DailyLogFormData,
  type CreateUserFormData,
  type UpdateUserFormData,
  type UserSearchFormData,
} from '@/lib/validations';

describe('Validation Schemas - Comprehensive Unit Tests', () => {
  describe('UserRoleSchema', () => {
    it('should accept valid roles', () => {
      const validRoles = ['admin', 'manager', 'captain', 'sales', 'wingman'];

      validRoles.forEach((role) => {
        expect(() => UserRoleSchema.parse(role)).not.toThrow();
      });
    });

    it('should reject invalid roles', () => {
      const invalidRoles = [
        'user',
        'employee',
        'supervisor',
        '',
        null,
        undefined,
      ];

      invalidRoles.forEach((role) => {
        expect(() => UserRoleSchema.parse(role)).toThrow();
      });
    });
  });

  describe('LoginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = LoginSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test.example.com',
        '',
        'test@.com',
        'test@com.',
      ];

      invalidEmails.forEach((email) => {
        expect(() =>
          LoginSchema.parse({ email, password: 'password123' })
        ).toThrow();
      });
    });

    it('should reject empty password', () => {
      expect(() =>
        LoginSchema.parse({ email: 'test@example.com', password: '' })
      ).toThrow();
    });

    it('should reject missing fields', () => {
      expect(() => LoginSchema.parse({ email: 'test@example.com' })).toThrow();
      expect(() => LoginSchema.parse({ password: 'password123' })).toThrow();
      expect(() => LoginSchema.parse({})).toThrow();
    });

    it('should handle whitespace in email', () => {
      // Zod email validation rejects emails with leading/trailing whitespace
      expect(() =>
        LoginSchema.parse({
          email: '  test@example.com  ',
          password: 'password123',
        })
      ).toThrow();

      // Valid email without whitespace should work
      const result = LoginSchema.parse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('LogJobSchema', () => {
    it('should validate correct junk job data', () => {
      const validJunkJob = {
        jobType: 'junk' as const,
        jobId: '1234567',
        clientName: 'Test Client',
        revenue: 1000,
        tips: 100,
        disposalCost: 50,
      };

      const result = LogJobSchema.parse(validJunkJob);
      expect(result).toEqual(validJunkJob);
    });

    it('should validate correct move job data', () => {
      const validMoveJob = {
        jobType: 'move' as const,
        jobId: '1234567890',
        clientName: 'Test Client',
        revenue: 2000,
        tips: 200,
        junkOnMove: 300,
        valuation: 5000,
        materials: 150,
      };

      const result = LogJobSchema.parse(validMoveJob);
      expect(result).toEqual(validMoveJob);
    });

    it('should validate job ID format', () => {
      const validJobIds = ['1234567', '12345678', '123456789', '1234567890'];
      const invalidJobIds = [
        '123456', // Too short
        '12345678901', // Too long
        'ABC1234', // Contains letters
        '123-456', // Contains special characters
        '', // Empty
        '1234567.0', // Contains decimal
      ];

      validJobIds.forEach((jobId) => {
        expect(() =>
          LogJobSchema.parse({
            jobType: 'junk',
            jobId,
            clientName: 'Test',
            revenue: 1000,
            tips: 100,
          })
        ).not.toThrow();
      });

      invalidJobIds.forEach((jobId) => {
        expect(() =>
          LogJobSchema.parse({
            jobType: 'junk',
            jobId,
            clientName: 'Test',
            revenue: 1000,
            tips: 100,
          })
        ).toThrow();
      });
    });

    it('should reject negative revenue and tips', () => {
      expect(() =>
        LogJobSchema.parse({
          jobType: 'junk',
          jobId: '1234567',
          clientName: 'Test',
          revenue: -100,
          tips: 50,
        })
      ).toThrow();

      expect(() =>
        LogJobSchema.parse({
          jobType: 'junk',
          jobId: '1234567',
          clientName: 'Test',
          revenue: 1000,
          tips: -50,
        })
      ).toThrow();
    });

    it('should accept zero revenue and tips', () => {
      const result = LogJobSchema.parse({
        jobType: 'junk',
        jobId: '1234567',
        clientName: 'Test',
        revenue: 0,
        tips: 0,
      });

      expect(result.revenue).toBe(0);
      expect(result.tips).toBe(0);
    });

    it('should handle optional move-specific fields', () => {
      const moveJobWithOptionals = {
        jobType: 'move' as const,
        jobId: '1234567',
        clientName: 'Test',
        revenue: 2000,
        tips: 200,
        junkOnMove: 300,
        valuation: 5000,
        materials: 150,
      };

      const moveJobWithoutOptionals = {
        jobType: 'move' as const,
        jobId: '1234567',
        clientName: 'Test',
        revenue: 2000,
        tips: 200,
      };

      expect(() => LogJobSchema.parse(moveJobWithOptionals)).not.toThrow();
      expect(() => LogJobSchema.parse(moveJobWithoutOptionals)).not.toThrow();
    });

    it('should reject empty client name', () => {
      expect(() =>
        LogJobSchema.parse({
          jobType: 'junk',
          jobId: '1234567',
          clientName: '',
          revenue: 1000,
          tips: 100,
        })
      ).toThrow();
    });

    it('should reject invalid job types', () => {
      expect(() =>
        LogJobSchema.parse({
          jobType: 'invalid',
          jobId: '1234567',
          clientName: 'Test',
          revenue: 1000,
          tips: 100,
        })
      ).toThrow();
    });

    it('should handle decimal values', () => {
      const result = LogJobSchema.parse({
        jobType: 'junk',
        jobId: '1234567',
        clientName: 'Test',
        revenue: 1000.5,
        tips: 100.25,
        disposalCost: 50.75,
      });

      expect(result.revenue).toBe(1000.5);
      expect(result.tips).toBe(100.25);
      expect(result.disposalCost).toBe(50.75);
    });
  });

  describe('LogHourSchema', () => {
    it('should validate correct hour data', () => {
      const validHour = {
        employeeId: 'emp-123',
        department: 'junk' as const,
        hours: 8,
        isCoCaptain: false,
      };

      const result = LogHourSchema.parse(validHour);
      expect(result).toEqual(validHour);
    });

    it('should validate all department types', () => {
      const departments = [
        'junk',
        'move',
        'zigma',
        'training',
        'estimating',
        'warehouse',
        'admin',
      ];

      departments.forEach((department) => {
        expect(() =>
          LogHourSchema.parse({
            employeeId: 'emp-123',
            department,
            hours: 8,
            isCoCaptain: false,
          })
        ).not.toThrow();
      });
    });

    it('should reject invalid departments', () => {
      expect(() =>
        LogHourSchema.parse({
          employeeId: 'emp-123',
          department: 'invalid',
          hours: 8,
          isCoCaptain: false,
        })
      ).toThrow();
    });

    it('should validate hour limits', () => {
      // Valid hours
      expect(() =>
        LogHourSchema.parse({
          employeeId: 'emp-123',
          department: 'junk',
          hours: 0,
          isCoCaptain: false,
        })
      ).not.toThrow();

      expect(() =>
        LogHourSchema.parse({
          employeeId: 'emp-123',
          department: 'junk',
          hours: 24,
          isCoCaptain: false,
        })
      ).not.toThrow();

      // Invalid hours
      expect(() =>
        LogHourSchema.parse({
          employeeId: 'emp-123',
          department: 'junk',
          hours: -1,
          isCoCaptain: false,
        })
      ).toThrow();

      expect(() =>
        LogHourSchema.parse({
          employeeId: 'emp-123',
          department: 'junk',
          hours: 25,
          isCoCaptain: false,
        })
      ).toThrow();
    });

    it('should handle decimal hours', () => {
      const result = LogHourSchema.parse({
        employeeId: 'emp-123',
        department: 'junk',
        hours: 8.5,
        isCoCaptain: false,
      });

      expect(result.hours).toBe(8.5);
    });

    it('should require employee ID', () => {
      expect(() =>
        LogHourSchema.parse({
          employeeId: '',
          department: 'junk',
          hours: 8,
          isCoCaptain: false,
        })
      ).toThrow();
    });

    it('should handle co-captain flag', () => {
      const coCaptainTrue = LogHourSchema.parse({
        employeeId: 'emp-123',
        department: 'junk',
        hours: 8,
        isCoCaptain: true,
      });

      const coCaptainFalse = LogHourSchema.parse({
        employeeId: 'emp-123',
        department: 'junk',
        hours: 8,
        isCoCaptain: false,
      });

      expect(coCaptainTrue.isCoCaptain).toBe(true);
      expect(coCaptainFalse.isCoCaptain).toBe(false);
    });
  });

  describe('CommissionEntrySchema', () => {
    it('should validate correct commission data', () => {
      const validCommission = {
        salesId: 'sales-123',
        jobId: '1234567',
        clientName: 'Test Client',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 1000,
      };

      const result = CommissionEntrySchema.parse(validCommission);
      expect(result.jobId).toBe('1234567'); // Should be trimmed
      expect(result.estimatedRevenue).toBe(1000);
    });

    it('should trim and validate job ID', () => {
      const result = CommissionEntrySchema.parse({
        salesId: 'sales-123',
        jobId: '  1234567  ',
        clientName: 'Test Client',
        jobType: 'junk',
        targetDate: new Date(),
        estimatedRevenue: 1000,
      });

      expect(result.jobId).toBe('1234567');
    });

    it('should validate job ID format after trimming', () => {
      const validJobIds = ['1234567', '12345678', '123456789', '1234567890'];
      const invalidJobIds = ['123456', '12345678901', 'ABC1234', '123-456'];

      validJobIds.forEach((jobId) => {
        expect(() =>
          CommissionEntrySchema.parse({
            salesId: 'sales-123',
            jobId: `  ${jobId}  `,
            clientName: 'Test',
            jobType: 'junk',
            targetDate: new Date(),
            estimatedRevenue: 1000,
          })
        ).not.toThrow();
      });

      invalidJobIds.forEach((jobId) => {
        expect(() =>
          CommissionEntrySchema.parse({
            salesId: 'sales-123',
            jobId: `  ${jobId}  `,
            clientName: 'Test',
            jobType: 'junk',
            targetDate: new Date(),
            estimatedRevenue: 1000,
          })
        ).toThrow();
      });
    });

    it('should validate client name length', () => {
      const validName = 'A'.repeat(100);
      const invalidName = 'A'.repeat(101);

      expect(() =>
        CommissionEntrySchema.parse({
          salesId: 'sales-123',
          jobId: '1234567',
          clientName: validName,
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 1000,
        })
      ).not.toThrow();

      expect(() =>
        CommissionEntrySchema.parse({
          salesId: 'sales-123',
          jobId: '1234567',
          clientName: invalidName,
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 1000,
        })
      ).toThrow();
    });

    it('should validate estimated revenue minimum', () => {
      expect(() =>
        CommissionEntrySchema.parse({
          salesId: 'sales-123',
          jobId: '1234567',
          clientName: 'Test',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 0,
        })
      ).toThrow();

      expect(() =>
        CommissionEntrySchema.parse({
          salesId: 'sales-123',
          jobId: '1234567',
          clientName: 'Test',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 0.01,
        })
      ).not.toThrow();
    });

    it('should validate job types', () => {
      ['junk', 'move'].forEach((jobType) => {
        expect(() =>
          CommissionEntrySchema.parse({
            salesId: 'sales-123',
            jobId: '1234567',
            clientName: 'Test',
            jobType,
            targetDate: new Date(),
            estimatedRevenue: 1000,
          })
        ).not.toThrow();
      });

      expect(() =>
        CommissionEntrySchema.parse({
          salesId: 'sales-123',
          jobId: '1234567',
          clientName: 'Test',
          jobType: 'invalid',
          targetDate: new Date(),
          estimatedRevenue: 1000,
        })
      ).toThrow();
    });

    it('should require all fields', () => {
      const requiredFields = [
        'salesId',
        'jobId',
        'clientName',
        'jobType',
        'targetDate',
        'estimatedRevenue',
      ];

      const validData = {
        salesId: 'sales-123',
        jobId: '1234567',
        clientName: 'Test',
        jobType: 'junk' as const,
        targetDate: new Date(),
        estimatedRevenue: 1000,
      };

      requiredFields.forEach((field) => {
        const invalidData = { ...validData };
        delete invalidData[field as keyof typeof invalidData];

        expect(() => CommissionEntrySchema.parse(invalidData)).toThrow();
      });
    });

    it('should handle date objects', () => {
      const result = CommissionEntrySchema.parse({
        salesId: 'sales-123',
        jobId: '1234567',
        clientName: 'Test',
        jobType: 'junk',
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 1000,
      });

      expect(result.targetDate).toBeInstanceOf(Date);
    });
  });

  describe('DailyLogFormSchema', () => {
    it('should validate complete daily log form', () => {
      const validLog = {
        captainId: 'captain-123',
        logDate: new Date('2024-01-15'),
        sections: {
          junk: true,
          move: false,
          otherHours: true,
        },
        jobs: [
          {
            jobType: 'junk' as const,
            jobId: '1234567',
            clientName: 'Test Client',
            revenue: 1000,
            tips: 100,
          },
        ],
        hours: [
          {
            employeeId: 'emp-123',
            department: 'junk' as const,
            hours: 8,
            isCoCaptain: false,
          },
        ],
        disposalCost: 50,
      };

      const result = DailyLogFormSchema.parse(validLog);
      expect(result).toEqual(validLog);
    });

    it('should validate sections object', () => {
      const validSections = {
        junk: true,
        move: false,
        otherHours: true,
      };

      expect(() =>
        DailyLogFormSchema.parse({
          captainId: 'captain-123',
          logDate: new Date(),
          sections: validSections,
          jobs: [],
          hours: [],
        })
      ).not.toThrow();
    });

    it('should validate empty jobs and hours arrays', () => {
      expect(() =>
        DailyLogFormSchema.parse({
          captainId: 'captain-123',
          logDate: new Date(),
          sections: { junk: false, move: false, otherHours: false },
          jobs: [],
          hours: [],
        })
      ).not.toThrow();
    });

    it('should validate optional disposal cost', () => {
      const withDisposalCost = DailyLogFormSchema.parse({
        captainId: 'captain-123',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [],
        hours: [],
        disposalCost: 100,
      });

      const withoutDisposalCost = DailyLogFormSchema.parse({
        captainId: 'captain-123',
        logDate: new Date(),
        sections: { junk: true, move: false, otherHours: false },
        jobs: [],
        hours: [],
      });

      expect(withDisposalCost.disposalCost).toBe(100);
      expect(withoutDisposalCost.disposalCost).toBeUndefined();
    });

    it('should reject negative disposal cost', () => {
      expect(() =>
        DailyLogFormSchema.parse({
          captainId: 'captain-123',
          logDate: new Date(),
          sections: { junk: true, move: false, otherHours: false },
          jobs: [],
          hours: [],
          disposalCost: -50,
        })
      ).toThrow();
    });

    it('should require captain ID', () => {
      expect(() =>
        DailyLogFormSchema.parse({
          captainId: '',
          logDate: new Date(),
          sections: { junk: true, move: false, otherHours: false },
          jobs: [],
          hours: [],
        })
      ).toThrow();
    });
  });

  describe('CreateUserSchema', () => {
    it('should validate complete user creation data', () => {
      const validUser = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123',
        roles: ['captain' as const],
        rateJunkCaptain: 25,
        rateJunkWingman: 20,
        rateMoveCaptain: 27,
        rateMoveWingman: 22,
        salaryAmount: 50000,
        salaryFrequency: 'bi-weekly' as const,
        salaryType: 'base' as const,
        commissionRate: 5,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      };

      const result = CreateUserSchema.parse(validUser);
      expect(result).toEqual(validUser);
    });

    it('should validate minimum required fields', () => {
      const minimalUser = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123',
        roles: ['wingman' as const],
      };

      const result = CreateUserSchema.parse(minimalUser);
      expect(result.email).toBe('test@example.com');
      expect(result.fullName).toBe('Test User');
      expect(result.roles).toEqual(['wingman']);
      expect(result.junkBonusGoal).toBe(0.14); // Default value
      expect(result.moveBonusGoal).toBe(0.24); // Default value
    });

    it('should validate password length', () => {
      const validPasswords = ['password', '12345678', 'a'.repeat(50)];
      const invalidPasswords = ['1234567', '', 'short'];

      validPasswords.forEach((password) => {
        expect(() =>
          CreateUserSchema.parse({
            email: 'test@example.com',
            fullName: 'Test User',
            password,
            roles: ['wingman'],
          })
        ).not.toThrow();
      });

      invalidPasswords.forEach((password) => {
        expect(() =>
          CreateUserSchema.parse({
            email: 'test@example.com',
            fullName: 'Test User',
            password,
            roles: ['wingman'],
          })
        ).toThrow();
      });
    });

    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org',
      ];
      const invalidEmails = ['invalid', 'test@', '@example.com', ''];

      validEmails.forEach((email) => {
        expect(() =>
          CreateUserSchema.parse({
            email,
            fullName: 'Test User',
            password: 'password123',
            roles: ['wingman'],
          })
        ).not.toThrow();
      });

      invalidEmails.forEach((email) => {
        expect(() =>
          CreateUserSchema.parse({
            email,
            fullName: 'Test User',
            password: 'password123',
            roles: ['wingman'],
          })
        ).toThrow();
      });
    });

    it('should validate roles array', () => {
      expect(() =>
        CreateUserSchema.parse({
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'password123',
          roles: [],
        })
      ).toThrow();

      expect(() =>
        CreateUserSchema.parse({
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'password123',
          roles: ['admin', 'manager'],
        })
      ).not.toThrow();
    });

    it('should validate rate fields', () => {
      const validRates = [0, 15.5, 25, 100];
      const invalidRates = [-1, -10.5];

      validRates.forEach((rate) => {
        expect(() =>
          CreateUserSchema.parse({
            email: 'test@example.com',
            fullName: 'Test User',
            password: 'password123',
            roles: ['captain'],
            rateJunkCaptain: rate,
          })
        ).not.toThrow();
      });

      invalidRates.forEach((rate) => {
        expect(() =>
          CreateUserSchema.parse({
            email: 'test@example.com',
            fullName: 'Test User',
            password: 'password123',
            roles: ['captain'],
            rateJunkCaptain: rate,
          })
        ).toThrow();
      });
    });

    it('should validate salary fields', () => {
      const validSalaryData = {
        salaryAmount: 50000,
        salaryFrequency: 'monthly' as const,
        salaryType: 'guaranteed' as const,
      };

      expect(() =>
        CreateUserSchema.parse({
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'password123',
          roles: ['admin'],
          ...validSalaryData,
        })
      ).not.toThrow();
    });

    it('should validate commission rate limits', () => {
      expect(() =>
        CreateUserSchema.parse({
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'password123',
          roles: ['sales'],
          commissionRate: 101,
        })
      ).toThrow();

      expect(() =>
        CreateUserSchema.parse({
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'password123',
          roles: ['sales'],
          commissionRate: -1,
        })
      ).toThrow();

      expect(() =>
        CreateUserSchema.parse({
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'password123',
          roles: ['sales'],
          commissionRate: 50,
        })
      ).not.toThrow();
    });

    it('should validate bonus goal limits', () => {
      expect(() =>
        CreateUserSchema.parse({
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'password123',
          roles: ['captain'],
          junkBonusGoal: 1.1,
        })
      ).toThrow();

      expect(() =>
        CreateUserSchema.parse({
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'password123',
          roles: ['captain'],
          junkBonusGoal: -0.1,
        })
      ).toThrow();

      expect(() =>
        CreateUserSchema.parse({
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'password123',
          roles: ['captain'],
          junkBonusGoal: 0.5,
        })
      ).not.toThrow();
    });
  });

  describe('UpdateUserSchema', () => {
    it('should validate user update with all fields', () => {
      const validUpdate = {
        id: 'user-123',
        email: 'updated@example.com',
        fullName: 'Updated User',
        password: 'newpassword123',
        roles: ['manager' as const],
        rateJunkCaptain: 30,
      };

      const result = UpdateUserSchema.parse(validUpdate);
      expect(result).toEqual({
        ...validUpdate,
        junkBonusGoal: 0.14, // Default value
        moveBonusGoal: 0.24, // Default value
      });
    });

    it('should handle optional password field', () => {
      const withPassword = UpdateUserSchema.parse({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'newpassword123',
        roles: ['wingman'],
      });

      const withoutPassword = UpdateUserSchema.parse({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['wingman'],
      });

      const withEmptyPassword = UpdateUserSchema.parse({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        password: '',
        roles: ['wingman'],
      });

      expect(withPassword.password).toBe('newpassword123');
      expect(withoutPassword.password).toBeUndefined();
      expect(withEmptyPassword.password).toBeUndefined();
    });

    it('should validate password length when provided', () => {
      expect(() =>
        UpdateUserSchema.parse({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'short',
          roles: ['wingman'],
        })
      ).toThrow();

      expect(() =>
        UpdateUserSchema.parse({
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'validpassword',
          roles: ['wingman'],
        })
      ).not.toThrow();
    });

    it('should require user ID', () => {
      expect(() =>
        UpdateUserSchema.parse({
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['wingman'],
        })
      ).toThrow();
    });

    it('should transform empty password to undefined', () => {
      const result = UpdateUserSchema.parse({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        password: '',
        roles: ['wingman'],
      });

      expect(result.password).toBeUndefined();
    });
  });

  describe('UserSearchSchema', () => {
    it('should validate search with all parameters', () => {
      const validSearch = {
        search: 'john doe',
        roles: ['captain' as const, 'manager' as const],
        sortBy: 'fullName' as const,
        sortOrder: 'desc' as const,
        page: 2,
        limit: 50,
      };

      const result = UserSearchSchema.parse(validSearch);
      expect(result).toEqual(validSearch);
    });

    it('should apply default values', () => {
      const minimalSearch = {};

      const result = UserSearchSchema.parse(minimalSearch);
      expect(result.sortBy).toBe('fullName');
      expect(result.sortOrder).toBe('asc');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should validate sort parameters', () => {
      const validSortBy = ['fullName', 'email', 'createdAt'];
      const validSortOrder = ['asc', 'desc'];

      validSortBy.forEach((sortBy) => {
        expect(() => UserSearchSchema.parse({ sortBy })).not.toThrow();
      });

      validSortOrder.forEach((sortOrder) => {
        expect(() => UserSearchSchema.parse({ sortOrder })).not.toThrow();
      });

      expect(() => UserSearchSchema.parse({ sortBy: 'invalid' })).toThrow();

      expect(() => UserSearchSchema.parse({ sortOrder: 'invalid' })).toThrow();
    });

    it('should validate pagination parameters', () => {
      expect(() => UserSearchSchema.parse({ page: 0 })).toThrow();

      expect(() => UserSearchSchema.parse({ page: -1 })).toThrow();

      expect(() => UserSearchSchema.parse({ limit: 0 })).toThrow();

      expect(() => UserSearchSchema.parse({ limit: 101 })).toThrow();

      expect(() =>
        UserSearchSchema.parse({ page: 1, limit: 100 })
      ).not.toThrow();
    });

    it('should handle optional search and roles', () => {
      const withSearch = UserSearchSchema.parse({ search: 'test' });
      const withRoles = UserSearchSchema.parse({ roles: ['admin'] });
      const withBoth = UserSearchSchema.parse({
        search: 'test',
        roles: ['admin', 'manager'],
      });

      expect(withSearch.search).toBe('test');
      expect(withRoles.roles).toEqual(['admin']);
      expect(withBoth.search).toBe('test');
      expect(withBoth.roles).toEqual(['admin', 'manager']);
    });

    it('should transform undefined values to defaults', () => {
      const result = UserSearchSchema.parse({
        search: 'test',
        sortBy: undefined,
        sortOrder: undefined,
        page: undefined,
        limit: undefined,
      });

      expect(result.sortBy).toBe('fullName');
      expect(result.sortOrder).toBe('asc');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values appropriately', () => {
      expect(() => LoginSchema.parse(null)).toThrow();
      expect(() => LoginSchema.parse(undefined)).toThrow();
      expect(() => LogJobSchema.parse({})).toThrow();
    });

    it('should handle extra fields in objects', () => {
      const dataWithExtraFields = {
        email: 'test@example.com',
        password: 'password123',
        extraField: 'should be ignored',
      };

      const result = LoginSchema.parse(dataWithExtraFields);
      expect(result).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });
      expect('extraField' in result).toBe(false);
    });

    it('should handle type coercion appropriately', () => {
      // Zod doesn't automatically coerce string numbers to numbers in strict mode
      expect(() =>
        LogJobSchema.parse({
          jobType: 'junk',
          jobId: '1234567',
          clientName: 'Test',
          revenue: '1000', // String number - should fail
          tips: '100', // String number - should fail
        })
      ).toThrow();

      // Proper number types should work
      const result = LogJobSchema.parse({
        jobType: 'junk',
        jobId: '1234567',
        clientName: 'Test',
        revenue: 1000,
        tips: 100,
      });

      expect(typeof result.revenue).toBe('number');
      expect(typeof result.tips).toBe('number');
      expect(result.revenue).toBe(1000);
      expect(result.tips).toBe(100);
    });

    it('should handle boolean coercion', () => {
      // Zod doesn't automatically coerce string booleans in strict mode
      expect(() =>
        LogHourSchema.parse({
          employeeId: 'emp-123',
          department: 'junk',
          hours: 8,
          isCoCaptain: 'true', // String boolean - should fail
        })
      ).toThrow();

      // Proper boolean types should work
      const result = LogHourSchema.parse({
        employeeId: 'emp-123',
        department: 'junk',
        hours: 8,
        isCoCaptain: true,
      });

      expect(typeof result.isCoCaptain).toBe('boolean');
      expect(result.isCoCaptain).toBe(true);
    });

    it('should provide meaningful error messages', () => {
      try {
        LoginSchema.parse({ email: 'invalid-email', password: '' });
      } catch (error: any) {
        expect(error.issues).toBeDefined();
        expect(error.issues.length).toBeGreaterThan(0);
        expect(error.issues.some((e: any) => e.path.includes('email'))).toBe(
          true
        );
        expect(error.issues.some((e: any) => e.path.includes('password'))).toBe(
          true
        );
      }
    });

    it('should handle very large numbers', () => {
      expect(() =>
        LogJobSchema.parse({
          jobType: 'junk',
          jobId: '1234567',
          clientName: 'Test',
          revenue: Number.MAX_SAFE_INTEGER,
          tips: 100,
        })
      ).not.toThrow();
    });

    it('should handle very small decimal numbers', () => {
      expect(() =>
        LogJobSchema.parse({
          jobType: 'junk',
          jobId: '1234567',
          clientName: 'Test',
          revenue: 0.01,
          tips: 0.01,
        })
      ).not.toThrow();
    });

    it('should handle special characters in strings', () => {
      const specialChars =
        'Test Client with Special Chars: !@#$%^&*()_+-=[]{}|;\':",./<>?';

      expect(() =>
        LogJobSchema.parse({
          jobType: 'junk',
          jobId: '1234567',
          clientName: specialChars,
          revenue: 1000,
          tips: 100,
        })
      ).not.toThrow();
    });

    it('should handle unicode characters', () => {
      const unicodeClient = 'Test Client 测试客户 🏠';

      expect(() =>
        LogJobSchema.parse({
          jobType: 'junk',
          jobId: '1234567',
          clientName: unicodeClient,
          revenue: 1000,
          tips: 100,
        })
      ).not.toThrow();
    });
  });
});
