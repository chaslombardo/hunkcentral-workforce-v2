// Unit tests for log calculation logic
import {
  calculateJobTotals,
  calculateSectionSummary,
  calculateOtherHoursSection,
  calculateOverallTotals,
  formatCurrency,
  formatPercentage,
} from '@/lib/logCalculations';
import type {
  LogJobFormData,
  LogHourFormData,
  DailyLogFormData,
} from '@/lib/validations';
import type { User } from '@/types';

// Mock user data for testing
const mockUsers: User[] = [
  {
    id: '1',
    email: 'captain@test.com',
    fullName: 'Test Captain',
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
    fullName: 'Test Wingman',
    roles: ['wingman'],
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
];

describe('Log Calculations', () => {
  describe('calculateJobTotals', () => {
    it('should calculate junk job totals correctly', () => {
      const jobs: LogJobFormData[] = [
        {
          jobType: 'junk',
          jobId: 'J001',
          clientName: 'Client 1',
          revenue: 500,
          tips: 50,
        },
        {
          jobType: 'junk',
          jobId: 'J002',
          clientName: 'Client 2',
          revenue: 300,
          tips: 30,
        },
        {
          jobType: 'move',
          jobId: 'M001',
          clientName: 'Client 3',
          revenue: 1000,
          tips: 100,
        },
      ];

      const result = calculateJobTotals(jobs, 'junk', 50);

      expect(result.revenue).toBe(800);
      expect(result.tips).toBe(80);
      expect(result.disposalCostPercentage).toBe(6.25); // 50/800 * 100
    });

    it('should calculate move job totals with upsells correctly', () => {
      const jobs: LogJobFormData[] = [
        {
          jobType: 'move',
          jobId: 'M001',
          clientName: 'Client 1',
          revenue: 1000,
          tips: 100,
          junkOnMove: 200,
          valuation: 50,
          materials: 75,
        },
        {
          jobType: 'move',
          jobId: 'M002',
          clientName: 'Client 2',
          revenue: 800,
          tips: 80,
          junkOnMove: 100,
          valuation: 25,
          materials: 0,
        },
      ];

      const result = calculateJobTotals(jobs, 'move');

      expect(result.revenue).toBe(1800);
      expect(result.tips).toBe(180);
      expect(result.upsells).toBe(450); // 200+50+75+100+25+0
      expect(result.upsellPercentage).toBe(25); // 450/1800 * 100
    });

    it('should handle empty job arrays', () => {
      const result = calculateJobTotals([], 'junk');

      expect(result.revenue).toBe(0);
      expect(result.tips).toBe(0);
    });
  });

  describe('calculateSectionSummary', () => {
    it('should calculate junk section summary correctly', () => {
      const jobs: LogJobFormData[] = [
        {
          jobType: 'junk',
          jobId: 'J001',
          clientName: 'Client 1',
          revenue: 1000,
          tips: 100,
        },
      ];

      const hours: LogHourFormData[] = [
        {
          employeeId: '1',
          department: 'junk',
          hours: 8,
          isCoCaptain: false,
        },
        {
          employeeId: '2',
          department: 'junk',
          hours: 8,
          isCoCaptain: false,
        },
      ];

      const result = calculateSectionSummary(jobs, hours, mockUsers, 'junk');

      expect(result.totalRevenue).toBe(1000);
      expect(result.totalTips).toBe(100);
      expect(result.totalHours).toBe(16);
      expect(result.employeeCount).toBe(2);
      expect(result.tipsPerHunk).toBe(50); // 100/2
      expect(result.totalLaborCost).toBe(280); // (20*8) + (15*8) - captain gets captain rate, wingman gets wingman rate
      expect(result.laborCostPercentage).toBeCloseTo(28, 1); // 280/1000 * 100
      expect(result.isUnderGoal).toBe(false); // 32% > 14%
      expect(result.goal).toBe(14);
    });

    it('should calculate move section summary correctly', () => {
      const jobs: LogJobFormData[] = [
        {
          jobType: 'move',
          jobId: 'M001',
          clientName: 'Client 1',
          revenue: 2000,
          tips: 200,
          junkOnMove: 300,
          valuation: 100,
          materials: 50,
        },
      ];

      const hours: LogHourFormData[] = [
        {
          employeeId: '1',
          department: 'move',
          hours: 10,
          isCoCaptain: false,
        },
        {
          employeeId: '2',
          department: 'move',
          hours: 10,
          isCoCaptain: true, // Co-captain gets captain rate
        },
      ];

      const result = calculateSectionSummary(jobs, hours, mockUsers, 'move');

      expect(result.totalRevenue).toBe(2000);
      expect(result.totalTips).toBe(200);
      expect(result.totalUpsells).toBe(450);
      expect(result.upsellPercentage).toBe(22.5); // 450/2000 * 100
      expect(result.totalHours).toBe(20);
      expect(result.employeeCount).toBe(2);
      expect(result.tipsPerHunk).toBe(100); // 200/2
      expect(result.totalLaborCost).toBe(440); // (22*10) + (22*10) - captain gets captain rate, co-captain gets captain rate
      expect(result.laborCostPercentage).toBeCloseTo(22, 1); // 440/2000 * 100
      expect(result.isUnderGoal).toBe(true); // 19.5% < 24%
      expect(result.goal).toBe(24);
    });

    it('should handle sections with no jobs but hours', () => {
      const jobs: LogJobFormData[] = [];
      const hours: LogHourFormData[] = [
        {
          employeeId: '1',
          department: 'junk',
          hours: 4,
          isCoCaptain: false,
        },
      ];

      const result = calculateSectionSummary(jobs, hours, mockUsers, 'junk');

      expect(result.totalRevenue).toBe(0);
      expect(result.totalTips).toBe(0);
      expect(result.totalHours).toBe(4);
      expect(result.employeeCount).toBe(1);
      expect(result.tipsPerHunk).toBe(0);
      expect(result.totalLaborCost).toBe(80); // 20*4 (captain rate)
      expect(result.laborCostPercentage).toBe(0); // No revenue
      expect(result.isUnderGoal).toBe(true); // No revenue means "under goal"
    });
  });

  describe('calculateOtherHoursSection', () => {
    it('should calculate other hours section correctly', () => {
      const hours: LogHourFormData[] = [
        {
          employeeId: '1',
          department: 'training',
          hours: 4,
          isCoCaptain: false,
        },
        {
          employeeId: '2',
          department: 'admin',
          hours: 2,
          isCoCaptain: false,
        },
        {
          employeeId: '1',
          department: 'warehouse',
          hours: 3,
          isCoCaptain: false,
        },
        // Should ignore junk/move hours
        {
          employeeId: '2',
          department: 'junk',
          hours: 8,
          isCoCaptain: false,
        },
      ];

      const result = calculateOtherHoursSection(hours, mockUsers);

      expect(result.totalRevenue).toBe(0);
      expect(result.totalTips).toBe(0);
      expect(result.totalHours).toBe(9); // 4+2+3 (ignores junk hours)
      expect(result.employeeCount).toBe(2);
      expect(result.totalLaborCost).toBe(146); // (16*4) + (20*2) + (14*3) = 64 + 40 + 42
      expect(result.laborCostPercentage).toBe(0);
      expect(result.isUnderGoal).toBe(true);
    });

    it('should handle empty other hours', () => {
      const hours: LogHourFormData[] = [
        {
          employeeId: '1',
          department: 'junk',
          hours: 8,
          isCoCaptain: false,
        },
      ];

      const result = calculateOtherHoursSection(hours, mockUsers);

      expect(result.totalHours).toBe(0);
      expect(result.employeeCount).toBe(0);
      expect(result.totalLaborCost).toBe(0);
    });
  });

  describe('calculateOverallTotals', () => {
    it('should calculate overall totals correctly', () => {
      const formData: DailyLogFormData = {
        captainId: '1',
        logDate: new Date(),
        sections: {
          junk: true,
          move: true,
          otherHours: true,
        },
        jobs: [
          {
            jobType: 'junk',
            jobId: 'J001',
            clientName: 'Client 1',
            revenue: 1000,
            tips: 100,
          },
          {
            jobType: 'move',
            jobId: 'M001',
            clientName: 'Client 2',
            revenue: 2000,
            tips: 200,
            junkOnMove: 300,
            valuation: 100,
            materials: 50,
          },
        ],
        disposalCost: 50,
        hours: [
          {
            employeeId: '1',
            department: 'junk',
            hours: 8,
            isCoCaptain: false,
          },
          {
            employeeId: '2',
            department: 'move',
            hours: 10,
            isCoCaptain: false,
          },
          {
            employeeId: '1',
            department: 'training',
            hours: 2,
            isCoCaptain: false,
          },
        ],
      };

      const result = calculateOverallTotals(formData, mockUsers);

      expect(result.totalRevenue).toBe(3000); // 1000 + 2000
      expect(result.totalTips).toBe(300); // 100 + 200
      expect(result.totalHours).toBe(20); // 8 + 10 + 2
      expect(result.totalLaborCost).toBe(362); // (20*8) + (17*10) + (16*2)
      expect(result.overallLaborCostPercentage).toBeCloseTo(12.07, 2); // 362/3000 * 100
      expect(result.employeeSummary).toHaveLength(2);

      // Check employee summary
      const captain = result.employeeSummary.find(
        (emp) => emp.employeeId === '1'
      );
      expect(captain).toBeDefined();
      expect(captain!.totalHours).toBe(10); // 8 + 2
      expect(captain!.totalTips).toBe(100); // Only gets junk tips (100/1 employee in junk)
      expect(captain!.departments).toHaveLength(2);

      const wingman = result.employeeSummary.find(
        (emp) => emp.employeeId === '2'
      );
      expect(wingman).toBeDefined();
      expect(wingman!.totalHours).toBe(10);
      expect(wingman!.totalTips).toBe(200); // Only gets move tips (200/1 employee in move)
    });

    it('should handle form with only one section enabled', () => {
      const formData: DailyLogFormData = {
        captainId: '1',
        logDate: new Date(),
        sections: {
          junk: true,
          move: false,
          otherHours: false,
        },
        jobs: [
          {
            jobType: 'junk',
            jobId: 'J001',
            clientName: 'Client 1',
            revenue: 500,
            tips: 50,
          },
        ],
        disposalCost: 25,
        hours: [
          {
            employeeId: '1',
            department: 'junk',
            hours: 6,
            isCoCaptain: false,
          },
        ],
      };

      const result = calculateOverallTotals(formData, mockUsers);

      expect(result.totalRevenue).toBe(500);
      expect(result.totalTips).toBe(50);
      expect(result.totalHours).toBe(6);
      expect(result.sectionBreakdown.junk).toBeDefined();
      expect(result.sectionBreakdown.move).toBeUndefined();
      expect(result.sectionBreakdown.other).toBeUndefined();
    });
  });

  describe('Utility Functions', () => {
    describe('formatCurrency', () => {
      it('should format currency correctly', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56');
        expect(formatCurrency(0)).toBe('$0.00');
        expect(formatCurrency(999999.99)).toBe('$999,999.99');
      });
    });

    describe('formatPercentage', () => {
      it('should format percentage correctly', () => {
        expect(formatPercentage(12.345)).toBe('12.3%');
        expect(formatPercentage(0)).toBe('0.0%');
        expect(formatPercentage(100)).toBe('100.0%');
        expect(formatPercentage(12.345, 2)).toBe('12.35%');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle division by zero gracefully', () => {
      const jobs: LogJobFormData[] = [];
      const hours: LogHourFormData[] = [
        {
          employeeId: '1',
          department: 'junk',
          hours: 8,
          isCoCaptain: false,
        },
      ];

      const result = calculateSectionSummary(jobs, hours, mockUsers, 'junk');

      expect(result.laborCostPercentage).toBe(0);
      expect(result.tipsPerHunk).toBe(0);
      expect(result.isUnderGoal).toBe(true);
    });

    it('should handle missing employee data', () => {
      const jobs: LogJobFormData[] = [
        {
          jobType: 'junk',
          jobId: 'J001',
          clientName: 'Client 1',
          revenue: 1000,
          tips: 100,
        },
      ];

      const hours: LogHourFormData[] = [
        {
          employeeId: 'nonexistent',
          department: 'junk',
          hours: 8,
          isCoCaptain: false,
        },
      ];

      const result = calculateSectionSummary(jobs, hours, mockUsers, 'junk');

      expect(result.totalLaborCost).toBe(0); // No employee found, no labor cost
      expect(result.employeeCount).toBe(0);
      expect(result.tipsPerHunk).toBe(0);
    });

    it('should handle co-captain rate calculation correctly', () => {
      const jobs: LogJobFormData[] = [
        {
          jobType: 'junk',
          jobId: 'J001',
          clientName: 'Client 1',
          revenue: 1000,
          tips: 100,
        },
      ];

      const hours: LogHourFormData[] = [
        {
          employeeId: '2', // Wingman
          department: 'junk',
          hours: 8,
          isCoCaptain: true, // But serving as co-captain
        },
      ];

      const result = calculateSectionSummary(jobs, hours, mockUsers, 'junk');

      expect(result.totalLaborCost).toBe(160); // 20*8 (captain rate, not wingman rate)
      expect(result.employees[0].isCoCaptain).toBe(true);
    });

    it('should handle multiple departments for same employee', () => {
      const hours: LogHourFormData[] = [
        {
          employeeId: '1',
          department: 'training',
          hours: 4,
          isCoCaptain: false,
        },
        {
          employeeId: '1',
          department: 'admin',
          hours: 3,
          isCoCaptain: false,
        },
        {
          employeeId: '1',
          department: 'warehouse',
          hours: 2,
          isCoCaptain: false,
        },
      ];

      const result = calculateOtherHoursSection(hours, mockUsers);

      expect(result.totalHours).toBe(9);
      expect(result.employeeCount).toBe(1);
      expect(result.employees[0].hours).toBe(9);
      expect(result.totalLaborCost).toBe(152); // (16*4) + (20*3) + (14*2) = 64 + 60 + 28
    });
  });
});
