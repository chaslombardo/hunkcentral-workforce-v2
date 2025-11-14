import { calculatePayroll } from '@/lib/payCalculator';
import {
  formatCurrency,
  formatHours,
  calculateLaborPercentage,
  calculateTrend,
} from '@/lib/formatters';
import type {
  User,
  DailyLog,
  LogJob,
  LogHour,
  CommissionEntry,
  PayPeriod,
} from '@/types';

// Mock data helpers
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['wingman'],
  rateJunkCaptain: 20,
  rateJunkWingman: 15,
  rateMoveCaptain: 22,
  rateMoveWingman: 17,
  rateZigma: 18,
  rateTraining: 16,
  rateEstimating: 25,
  rateWarehouse: 14,
  rateAdmin: 20,
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockPayPeriod = (
  overrides: Partial<PayPeriod> = {}
): PayPeriod => ({
  id: 'period-1',
  name: 'January 2025 - Week 1',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-07'),
  status: 'closed',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Payroll Report Generation', () => {
  describe('Report Data Aggregation', () => {
    it('should aggregate payroll data correctly for report generation', () => {
      const payPeriod = createMockPayPeriod();

      const users = [
        createMockUser({
          id: 'captain-1',
          fullName: 'John Captain',
          roles: ['captain'],
          rateJunkCaptain: 20,
        }),
        createMockUser({
          id: 'wingman-1',
          fullName: 'Jane Wingman',
          roles: ['wingman'],
          rateJunkWingman: 15,
        }),
        createMockUser({
          id: 'sales-1',
          fullName: 'Bob Sales',
          roles: ['sales'],
          commissionRate: 0.1,
        }),
      ];

      // Mock logs and commissions would be passed here
      const logs: DailyLog[] = [];
      const commissions: CommissionEntry[] = [];

      const payrollData = calculatePayroll(
        users,
        logs,
        commissions,
        payPeriod.startDate,
        payPeriod.endDate
      );

      // Verify report structure
      expect(payrollData).toHaveLength(3);
      expect(payrollData.every((p) => p.employeeId)).toBe(true);
      expect(payrollData.every((p) => p.employee)).toBe(true);
      expect(payrollData.every((p) => typeof p.totalPay === 'number')).toBe(
        true
      );
    });

    it('should calculate summary metrics for dashboard cards', () => {
      const payrollData = [
        {
          employeeId: 'emp-1',
          employee: createMockUser({ id: 'emp-1', fullName: 'Employee 1' }),
          totalHours: 40,
          hoursByDepartment: {
            junk: 40,
            move: 0,
            zigma: 0,
            training: 0,
            estimating: 0,
            warehouse: 0,
            admin: 0,
          },
          grossWages: 600,
          tips: 150,
          bonuses: 85,
          commission: 0,
          totalPay: 835,
          breakdown: {
            hourlyWages: 600,
            salaryAmount: 0,
            salaryType: null,
            salaryFrequency: null,
            tips: 150,
            commission: 0,
            laborBonuses: 85,
            totalBeforeSalaryAdjustment: 835,
            finalPay: 835,
          },
        },
        {
          employeeId: 'emp-2',
          employee: createMockUser({ id: 'emp-2', fullName: 'Employee 2' }),
          totalHours: 35,
          hoursByDepartment: {
            junk: 0,
            move: 35,
            zigma: 0,
            training: 0,
            estimating: 0,
            warehouse: 0,
            admin: 0,
          },
          grossWages: 595,
          tips: 200,
          bonuses: 120,
          commission: 0,
          totalPay: 915,
          breakdown: {
            hourlyWages: 595,
            salaryAmount: 0,
            salaryType: null,
            salaryFrequency: null,
            tips: 200,
            commission: 0,
            laborBonuses: 120,
            totalBeforeSalaryAdjustment: 915,
            finalPay: 915,
          },
        },
      ];

      // Calculate summary metrics
      const totalEmployees = payrollData.length;
      const totalPayroll = payrollData.reduce(
        (sum, calc) => sum + calc.totalPay,
        0
      );
      const totalHours = payrollData.reduce(
        (sum, calc) => sum + calc.totalHours,
        0
      );
      const totalTips = payrollData.reduce((sum, calc) => sum + calc.tips, 0);
      const totalBonuses = payrollData.reduce(
        (sum, calc) => sum + calc.bonuses,
        0
      );

      expect(totalEmployees).toBe(2);
      expect(totalPayroll).toBe(1750); // 835 + 915
      expect(totalHours).toBe(75); // 40 + 35
      expect(totalTips).toBe(350); // 150 + 200
      expect(totalBonuses).toBe(205); // 85 + 120
    });

    it('should format currency values correctly for reports', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should format hours correctly for reports', () => {
      expect(formatHours(40)).toBe('40.0h');
      expect(formatHours(37.5)).toBe('37.5h');
      expect(formatHours(0)).toBe('0.0h');
    });
  });

  describe('Report Filtering and Sorting', () => {
    it('should filter payroll data by department', () => {
      const payrollData = [
        {
          employeeId: 'emp-1',
          employee: createMockUser({ id: 'emp-1' }),
          hoursByDepartment: {
            junk: 40,
            move: 0,
            zigma: 0,
            training: 0,
            estimating: 0,
            warehouse: 0,
            admin: 0,
          },
          totalPay: 835,
        },
        {
          employeeId: 'emp-2',
          employee: createMockUser({ id: 'emp-2' }),
          hoursByDepartment: {
            junk: 0,
            move: 35,
            zigma: 0,
            training: 0,
            estimating: 0,
            warehouse: 0,
            admin: 0,
          },
          totalPay: 915,
        },
        {
          employeeId: 'emp-3',
          employee: createMockUser({ id: 'emp-3' }),
          hoursByDepartment: {
            junk: 0,
            move: 0,
            zigma: 0,
            training: 0,
            estimating: 0,
            warehouse: 0,
            admin: 40,
          },
          totalPay: 800,
        },
      ];

      // Filter by junk department
      const junkEmployees = payrollData.filter((emp) => {
        const primaryDept = Object.entries(emp.hoursByDepartment).find(
          ([, hours]) => hours > 0
        )?.[0];
        return primaryDept === 'junk';
      });

      expect(junkEmployees).toHaveLength(1);
      expect(junkEmployees[0].employeeId).toBe('emp-1');

      // Filter by move department
      const moveEmployees = payrollData.filter((emp) => {
        const primaryDept = Object.entries(emp.hoursByDepartment).find(
          ([, hours]) => hours > 0
        )?.[0];
        return primaryDept === 'move';
      });

      expect(moveEmployees).toHaveLength(1);
      expect(moveEmployees[0].employeeId).toBe('emp-2');
    });

    it('should sort payroll data by total pay', () => {
      const payrollData = [
        { employeeId: 'emp-1', totalPay: 835, employee: createMockUser() },
        { employeeId: 'emp-2', totalPay: 915, employee: createMockUser() },
        { employeeId: 'emp-3', totalPay: 750, employee: createMockUser() },
      ];

      // Sort by total pay descending
      const sortedDesc = [...payrollData].sort(
        (a, b) => b.totalPay - a.totalPay
      );
      expect(sortedDesc[0].employeeId).toBe('emp-2'); // 915
      expect(sortedDesc[1].employeeId).toBe('emp-1'); // 835
      expect(sortedDesc[2].employeeId).toBe('emp-3'); // 750

      // Sort by total pay ascending
      const sortedAsc = [...payrollData].sort(
        (a, b) => a.totalPay - b.totalPay
      );
      expect(sortedAsc[0].employeeId).toBe('emp-3'); // 750
      expect(sortedAsc[1].employeeId).toBe('emp-1'); // 835
      expect(sortedAsc[2].employeeId).toBe('emp-2'); // 915
    });

    it('should search employees by name', () => {
      const payrollData = [
        {
          employeeId: 'emp-1',
          employee: createMockUser({ fullName: 'John Smith' }),
        },
        {
          employeeId: 'emp-2',
          employee: createMockUser({ fullName: 'Jane Doe' }),
        },
        {
          employeeId: 'emp-3',
          employee: createMockUser({ fullName: 'Bob Johnson' }),
        },
      ];

      // Search for "John"
      const johnResults = payrollData.filter((emp) =>
        emp.employee.fullName.toLowerCase().includes('john')
      );
      expect(johnResults).toHaveLength(2); // John Smith and Bob Johnson

      // Search for "Jane"
      const janeResults = payrollData.filter((emp) =>
        emp.employee.fullName.toLowerCase().includes('jane')
      );
      expect(janeResults).toHaveLength(1);
      expect(janeResults[0].employee.fullName).toBe('Jane Doe');
    });
  });

  describe('Export Data Formatting', () => {
    it('should format data for ADP export', () => {
      const payrollData = [
        {
          employeeId: 'emp-1',
          employee: createMockUser({
            id: 'emp-1',
            fullName: 'John Smith',
            email: 'john@example.com',
          }),
          totalHours: 40,
          grossWages: 600,
          tips: 150,
          bonuses: 85,
          commission: 0,
          totalPay: 835,
        },
      ];

      // Format for ADP (simplified example)
      const adpFormat = payrollData.map((emp) => ({
        employeeId: emp.employeeId,
        employeeName: emp.employee.fullName,
        email: emp.employee.email,
        regularHours: emp.totalHours,
        regularPay: emp.grossWages,
        tips: emp.tips,
        bonuses: emp.bonuses,
        commission: emp.commission,
        totalPay: emp.totalPay,
      }));

      expect(adpFormat[0]).toEqual({
        employeeId: 'emp-1',
        employeeName: 'John Smith',
        email: 'john@example.com',
        regularHours: 40,
        regularPay: 600,
        tips: 150,
        bonuses: 85,
        commission: 0,
        totalPay: 835,
      });
    });

    it('should calculate estimated file size for export', () => {
      const payrollData = Array(50)
        .fill(null)
        .map((_, i) => ({
          employeeId: `emp-${i}`,
          employee: createMockUser({ id: `emp-${i}` }),
          totalPay: 1000,
        }));

      // Estimate file size (simplified calculation)
      const baseSize = payrollData.length * 0.5; // KB per employee
      const detailedMultiplier = 2;
      const summaryMultiplier = 1;

      const detailedSize = Math.max(
        1,
        Math.round(baseSize * detailedMultiplier)
      );
      const summarySize = Math.max(1, Math.round(baseSize * summaryMultiplier));

      expect(detailedSize).toBe(50); // 50 employees * 0.5 KB * 2
      expect(summarySize).toBe(25); // 50 employees * 0.5 KB * 1
    });
  });

  describe('Chart Data Transformation', () => {
    it('should transform payroll data for chart visualization', () => {
      // Mock historical payroll data
      const historicalData = [
        { date: '2025-01-01', totalPay: 45000, hours: 1200, bonuses: 3500 },
        { date: '2025-01-08', totalPay: 48000, hours: 1280, bonuses: 4200 },
        { date: '2025-01-15', totalPay: 52000, hours: 1350, bonuses: 4800 },
      ];

      // Filter data by time range
      const filterByTimeRange = (
        data: typeof historicalData,
        range: string
      ) => {
        const referenceDate = new Date('2025-01-15');
        let daysToSubtract = 90;

        if (range === '30d') daysToSubtract = 30;
        else if (range === '7d') daysToSubtract = 7;

        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);

        return data.filter((item) => {
          const itemDate = new Date(item.date);
          return itemDate >= startDate;
        });
      };

      const last7Days = filterByTimeRange(historicalData, '7d');
      const last30Days = filterByTimeRange(historicalData, '30d');

      expect(last7Days).toHaveLength(2); // Only last 2 entries within 7 days
      expect(last30Days).toHaveLength(3); // All entries within 30 days
    });

    it('should format chart tooltip data correctly', () => {
      const formatChartTooltip = (value: number, name: string) => {
        if (name === 'totalPay' || name === 'bonuses') {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        } else if (name === 'hours') {
          return `${value.toLocaleString()}h`;
        }
        return value.toString();
      };

      expect(formatChartTooltip(45000, 'totalPay')).toBe('$45,000');
      expect(formatChartTooltip(1200, 'hours')).toBe('1,200h');
      expect(formatChartTooltip(3500, 'bonuses')).toBe('$3,500');
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate labor cost percentages for performance tracking', () => {
      expect(calculateLaborPercentage(140, 1000)).toBe(14); // 14%
      expect(calculateLaborPercentage(240, 1000)).toBe(24); // 24%
      expect(calculateLaborPercentage(0, 1000)).toBe(0); // 0%
      expect(calculateLaborPercentage(100, 0)).toBe(0); // Handle division by zero
    });

    it('should determine performance status based on goals', () => {
      const getPerformanceStatus = (
        actualPercent: number,
        goalPercent: number
      ) => {
        return actualPercent <= goalPercent ? 'good' : 'needs-improvement';
      };

      expect(getPerformanceStatus(14, 14)).toBe('good'); // At goal
      expect(getPerformanceStatus(12, 14)).toBe('good'); // Under goal
      expect(getPerformanceStatus(16, 14)).toBe('needs-improvement'); // Over goal
    });

    it('should calculate trend percentages for dashboard cards', () => {
      expect(calculateTrend(1100, 1000).percentage).toBe(10); // 10% increase
      expect(calculateTrend(1100, 1000).isPositive).toBe(true);
      expect(calculateTrend(900, 1000).percentage).toBe(-10); // 10% decrease
      expect(calculateTrend(900, 1000).isPositive).toBe(false);
      expect(calculateTrend(1000, 1000).percentage).toBe(0); // No change
      expect(calculateTrend(1000, 1000).isPositive).toBe(false);
      expect(calculateTrend(1000, 0).percentage).toBe(0); // Handle division by zero
      expect(calculateTrend(1000, 0).isPositive).toBe(false);
    });
  });
});
