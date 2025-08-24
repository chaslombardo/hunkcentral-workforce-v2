import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculatePayroll,
  calculateEnhancedPayroll,
  applySalaryRules,
} from '@/lib/payCalculator';
import type { User, DailyLog, CommissionEntry } from '@/types';

// Mock data helpers
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['captain'],
  rateJunkCaptain: 25,
  rateJunkWingman: 20,
  rateMoveCaptain: 27,
  rateMoveWingman: 22,
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Payroll Generation and Export Workflow - Integration Tests', () => {
  describe('Comprehensive Payroll Generation', () => {
    it('should generate complete payroll for mixed employee types', () => {
      // Setup diverse employee types
      const employees = [
        createMockUser({
          id: 'captain-1',
          roles: ['captain'],
          fullName: 'Captain Smith',
          rateJunkCaptain: 25,
          junkBonusGoal: 0.15,
        }),
        createMockUser({
          id: 'wingman-1',
          roles: ['wingman'],
          fullName: 'Wingman Jones',
          rateJunkWingman: 20,
        }),
        createMockUser({
          id: 'salary-1',
          roles: ['admin'],
          fullName: 'Admin Johnson',
          rateAdmin: 22,
          salaryAmount: 1200,
          salaryFrequency: 'weekly',
          salaryType: 'base',
        }),
        createMockUser({
          id: 'sales-1',
          roles: ['sales'],
          fullName: 'Sales Rep',
          commissionRate: 6,
        }),
      ];

      // Create comprehensive test data
      const payroll = calculatePayroll(
        employees,
        [], // No logs for this test
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(payroll).toHaveLength(4);

      // Verify each employee has proper payroll structure
      payroll.forEach((p) => {
        expect(p).toHaveProperty('employeeId');
        expect(p).toHaveProperty('employee');
        expect(p).toHaveProperty('totalHours');
        expect(p).toHaveProperty('grossWages');
        expect(p).toHaveProperty('tips');
        expect(p).toHaveProperty('commission');
        expect(p).toHaveProperty('bonuses');
        expect(p).toHaveProperty('totalPay');
        expect(p).toHaveProperty('breakdown');
      });
    });
  });
});
