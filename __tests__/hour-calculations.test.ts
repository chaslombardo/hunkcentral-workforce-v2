import { describe, it, expect } from 'vitest';
import {
  calculateSectionHours,
  getHourlyRate,
  calculateTipsPerHunk,
  calculateLaborCostPercentage,
  validateHourEntries,
} from '@/lib/hourCalculations';
import type { LogHourFormData } from '@/lib/validations';
import type { User } from '@/types';

// Mock user data for testing
const mockUsers: User[] = [
  {
    id: '1',
    email: 'captain@test.com',
    fullName: 'John Captain',
    roles: ['captain'],
    rateJunkCaptain: 20.0,
    rateJunkWingman: 15.0,
    rateMoveCaptain: 22.0,
    rateMoveWingman: 17.0,
    rateZigma: 18.0,
    rateTraining: 16.0,
    rateEstimating: 25.0,
    rateWarehouse: 14.0,
    rateAdmin: 20.0,
    junkBonusGoal: 0.14,
    moveBonusGoal: 0.24,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    email: 'wingman@test.com',
    fullName: 'Mike Wingman',
    roles: ['wingman'],
    rateJunkWingman: 15.0,
    rateMoveWingman: 17.0,
    rateZigma: 18.0,
    junkBonusGoal: 0.14,
    moveBonusGoal: 0.24,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('Hour Calculations', () => {
  describe('getHourlyRate', () => {
    it('should return captain rate for co-captain in junk department', () => {
      const rate = getHourlyRate(mockUsers[0], 'junk', true);
      expect(rate).toBe(20.0);
    });

    it('should return wingman rate for regular employee in junk department', () => {
      const rate = getHourlyRate(mockUsers[0], 'junk', false);
      expect(rate).toBe(15.0);
    });

    it('should return captain rate for co-captain in move department', () => {
      const rate = getHourlyRate(mockUsers[0], 'move', true);
      expect(rate).toBe(22.0);
    });

    it('should return wingman rate for regular employee in move department', () => {
      const rate = getHourlyRate(mockUsers[0], 'move', false);
      expect(rate).toBe(17.0);
    });

    it('should return appropriate rate for other departments', () => {
      expect(getHourlyRate(mockUsers[0], 'zigma', false)).toBe(18.0);
      expect(getHourlyRate(mockUsers[0], 'training', false)).toBe(16.0);
      expect(getHourlyRate(mockUsers[0], 'estimating', false)).toBe(25.0);
      expect(getHourlyRate(mockUsers[0], 'warehouse', false)).toBe(14.0);
      expect(getHourlyRate(mockUsers[0], 'admin', false)).toBe(20.0);
    });

    it('should use default rates when employee rates are not set', () => {
      const userWithoutRates: User = {
        ...mockUsers[1],
        rateJunkWingman: undefined,
        rateMoveWingman: undefined,
      };

      expect(getHourlyRate(userWithoutRates, 'junk', false)).toBe(15.0);
      expect(getHourlyRate(userWithoutRates, 'move', false)).toBe(17.0);
    });
  });

  describe('calculateSectionHours', () => {
    const mockHours: LogHourFormData[] = [
      {
        employeeId: '1',
        department: 'junk',
        hours: 8,
        isCoCaptain: true,
      },
      {
        employeeId: '2',
        department: 'junk',
        hours: 6,
        isCoCaptain: false,
      },
      {
        employeeId: '1',
        department: 'move',
        hours: 4,
        isCoCaptain: false,
      },
    ];

    it('should calculate total hours and labor costs correctly', () => {
      const result = calculateSectionHours(mockHours, mockUsers);

      expect(result.totalHours).toBe(18); // 8 + 6 + 4
      // Labor cost: (8 * 20) + (6 * 15) + (4 * 17) = 160 + 90 + 68 = 318
      expect(result.totalLaborCost).toBe(318);
    });

    it('should filter hours by section correctly', () => {
      const junkResult = calculateSectionHours(mockHours, mockUsers, 'junk');

      expect(junkResult.totalHours).toBe(14); // 8 + 6
      // Labor cost: (8 * 20) + (6 * 15) = 160 + 90 = 250
      expect(junkResult.totalLaborCost).toBe(250);
    });

    it('should generate employee summary correctly', () => {
      const result = calculateSectionHours(mockHours, mockUsers);

      expect(result.employeeSummary).toHaveLength(2);

      const captain = result.employeeSummary.find(
        (emp) => emp.employeeId === '1'
      );
      expect(captain).toBeDefined();
      expect(captain?.totalHours).toBe(12); // 8 + 4
      expect(captain?.laborCost).toBe(228); // (8 * 20) + (4 * 17)
      expect(captain?.isCoCaptain).toBe(true);
      expect(captain?.departments).toHaveLength(2);

      const wingman = result.employeeSummary.find(
        (emp) => emp.employeeId === '2'
      );
      expect(wingman).toBeDefined();
      expect(wingman?.totalHours).toBe(6);
      expect(wingman?.laborCost).toBe(90); // 6 * 15
      expect(wingman?.isCoCaptain).toBe(false);
      expect(wingman?.departments).toHaveLength(1);
    });

    it('should handle other hours section correctly', () => {
      const otherHours: LogHourFormData[] = [
        {
          employeeId: '1',
          department: 'training',
          hours: 2,
          isCoCaptain: false,
        },
        {
          employeeId: '2',
          department: 'admin',
          hours: 3,
          isCoCaptain: false,
        },
      ];

      const result = calculateSectionHours(otherHours, mockUsers, 'other');

      expect(result.totalHours).toBe(5); // 2 + 3
      // Labor cost: (2 * 16) + (3 * 20) = 32 + 60 = 92
      expect(result.totalLaborCost).toBe(92);
    });
  });

  describe('calculateTipsPerHunk', () => {
    it('should calculate tips per HUNK correctly', () => {
      const hours: LogHourFormData[] = [
        { employeeId: '1', department: 'junk', hours: 8, isCoCaptain: false },
        { employeeId: '2', department: 'junk', hours: 6, isCoCaptain: false },
        { employeeId: '1', department: 'move', hours: 4, isCoCaptain: false }, // Same employee, different dept
      ];

      const tipsPerHunk = calculateTipsPerHunk(100, hours);
      expect(tipsPerHunk).toBe(50); // $100 / 2 unique employees
    });

    it('should return 0 when no employees', () => {
      const tipsPerHunk = calculateTipsPerHunk(100, []);
      expect(tipsPerHunk).toBe(0);
    });
  });

  describe('calculateLaborCostPercentage', () => {
    it('should calculate labor cost percentage correctly', () => {
      const percentage = calculateLaborCostPercentage(250, 1000);
      expect(percentage).toBe(25);
    });

    it('should return 0 when revenue is 0', () => {
      const percentage = calculateLaborCostPercentage(250, 0);
      expect(percentage).toBe(0);
    });
  });

  describe('validateHourEntries', () => {
    it('should return no errors for valid entries', () => {
      const validHours: LogHourFormData[] = [
        { employeeId: '1', department: 'junk', hours: 8, isCoCaptain: false },
        { employeeId: '2', department: 'move', hours: 6, isCoCaptain: false },
      ];

      const errors = validateHourEntries(validHours);
      expect(errors).toHaveLength(0);
    });

    it('should detect duplicate employee-department combinations', () => {
      const duplicateHours: LogHourFormData[] = [
        { employeeId: '1', department: 'junk', hours: 4, isCoCaptain: false },
        { employeeId: '1', department: 'junk', hours: 4, isCoCaptain: false },
      ];

      const errors = validateHourEntries(duplicateHours);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('multiple entries');
    });

    it('should detect employees with more than 24 hours total', () => {
      const excessiveHours: LogHourFormData[] = [
        { employeeId: '1', department: 'junk', hours: 15, isCoCaptain: false },
        { employeeId: '1', department: 'move', hours: 12, isCoCaptain: false },
      ];

      const errors = validateHourEntries(excessiveHours);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('more than 24 hours');
    });

    it('should allow same employee in different departments', () => {
      const validMultipleDepts: LogHourFormData[] = [
        { employeeId: '1', department: 'junk', hours: 8, isCoCaptain: false },
        { employeeId: '1', department: 'move', hours: 8, isCoCaptain: false },
      ];

      const errors = validateHourEntries(validMultipleDepts);
      expect(errors).toHaveLength(0);
    });
  });
});
