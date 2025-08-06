import { describe, it, expect } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';
import {
  decimalToNumber,
  numberToDecimal,
  optionalDecimalToNumber,
  optionalNumberToDecimal,
  convertUserDecimalFields,
  convertLogJobDecimalFields,
  convertLogHourDecimalFields,
  convertCommissionDecimalFields,
} from '@/lib/decimal-utils';

describe('decimal-utils', () => {
  describe('decimalToNumber', () => {
    it('should convert Decimal to number', () => {
      const decimal = new Decimal('123.45');
      expect(decimalToNumber(decimal)).toBe(123.45);
    });

    it('should return 0 for null/undefined', () => {
      expect(decimalToNumber(null)).toBe(0);
      expect(decimalToNumber(undefined)).toBe(0);
    });
  });

  describe('numberToDecimal', () => {
    it('should convert number to Decimal', () => {
      const result = numberToDecimal(123.45);
      expect(result).toBeInstanceOf(Decimal);
      expect(result?.toNumber()).toBe(123.45);
    });

    it('should return null for null/undefined', () => {
      expect(numberToDecimal(null)).toBe(null);
      expect(numberToDecimal(undefined)).toBe(null);
    });
  });

  describe('optionalDecimalToNumber', () => {
    it('should convert Decimal to number', () => {
      const decimal = new Decimal('123.45');
      expect(optionalDecimalToNumber(decimal)).toBe(123.45);
    });

    it('should return undefined for null/undefined', () => {
      expect(optionalDecimalToNumber(null)).toBe(undefined);
      expect(optionalDecimalToNumber(undefined)).toBe(undefined);
    });
  });

  describe('convertUserDecimalFields', () => {
    it('should convert all user decimal fields to numbers', () => {
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        fullName: 'Test User',
        rateJunkCaptain: new Decimal('25.50'),
        rateJunkWingman: new Decimal('20.00'),
        salaryAmount: new Decimal('50000.00'),
        commissionRate: new Decimal('0.05'),
        junkBonusGoal: new Decimal('0.14'),
        moveBonusGoal: new Decimal('0.24'),
      };

      const result = convertUserDecimalFields(user);

      expect(result.rateJunkCaptain).toBe(25.50);
      expect(result.rateJunkWingman).toBe(20.00);
      expect(result.salaryAmount).toBe(50000.00);
      expect(result.commissionRate).toBe(0.05);
      expect(result.junkBonusGoal).toBe(0.14);
      expect(result.moveBonusGoal).toBe(0.24);
      expect(result.id).toBe('test-id');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('convertLogJobDecimalFields', () => {
    it('should convert all job decimal fields to numbers', () => {
      const job = {
        id: 'job-id',
        logId: 'log-id',
        jobType: 'junk' as const,
        jobId: 'JOB123',
        clientName: 'Test Client',
        revenue: new Decimal('1500.00'),
        tips: new Decimal('75.50'),
        junkOnMove: new Decimal('200.00'),
        valuation: new Decimal('5000.00'),
        materials: new Decimal('150.00'),
        disposalCost: new Decimal('100.00'),
      };

      const result = convertLogJobDecimalFields(job);

      expect(result.revenue).toBe(1500.00);
      expect(result.tips).toBe(75.50);
      expect(result.junkOnMove).toBe(200.00);
      expect(result.valuation).toBe(5000.00);
      expect(result.materials).toBe(150.00);
      expect(result.disposalCost).toBe(100.00);
      expect(result.id).toBe('job-id');
      expect(result.jobType).toBe('junk');
    });
  });

  describe('convertLogHourDecimalFields', () => {
    it('should convert hour decimal fields to numbers', () => {
      const hour = {
        id: 'hour-id',
        logId: 'log-id',
        employeeId: 'emp-id',
        department: 'junk' as const,
        hours: new Decimal('8.5'),
        isCoCaptain: false,
      };

      const result = convertLogHourDecimalFields(hour);

      expect(result.hours).toBe(8.5);
      expect(result.id).toBe('hour-id');
      expect(result.department).toBe('junk');
      expect(result.isCoCaptain).toBe(false);
    });
  });

  describe('convertCommissionDecimalFields', () => {
    it('should convert commission decimal fields to numbers', () => {
      const commission = {
        id: 'comm-id',
        salesId: 'sales-id',
        jobId: 'JOB123',
        estimatedRevenue: new Decimal('1000.00'),
        actualRevenue: new Decimal('1200.00'),
        commissionAmount: new Decimal('60.00'),
        status: 'matched' as const,
      };

      const result = convertCommissionDecimalFields(commission);

      expect(result.estimatedRevenue).toBe(1000.00);
      expect(result.actualRevenue).toBe(1200.00);
      expect(result.commissionAmount).toBe(60.00);
      expect(result.id).toBe('comm-id');
      expect(result.status).toBe('matched');
    });

    it('should handle null actualRevenue and commissionAmount', () => {
      const commission = {
        id: 'comm-id',
        salesId: 'sales-id',
        jobId: 'JOB123',
        estimatedRevenue: new Decimal('1000.00'),
        actualRevenue: null,
        commissionAmount: null,
        status: 'pending' as const,
      };

      const result = convertCommissionDecimalFields(commission);

      expect(result.estimatedRevenue).toBe(1000.00);
      expect(result.actualRevenue).toBe(null);
      expect(result.commissionAmount).toBe(null);
    });
  });
});