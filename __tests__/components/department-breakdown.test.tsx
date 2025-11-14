import { render, screen } from '@testing-library/react';
import {
  DepartmentBreakdown,
  type DepartmentBreakdownData,
} from '@/components/features/reports/payroll-breakdown/department-breakdown';
import type { User } from '@/types';

const mockUser: User = {
  id: '1',
  fullName: 'John Smith',
  email: 'john@example.com',
  roles: ['captain'],
  rateJunkCaptain: 20,
  rateJunkWingman: 16,
  rateMoveCaptain: 22,
  rateMoveWingman: 18,
  rateZigma: 19,
  rateTraining: 15,
  rateEstimating: 25,
  rateWarehouse: 17,
  rateAdmin: 14,
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDepartments: DepartmentBreakdownData[] = [
  {
    department: 'junk',
    hours: 30,
    rate: 20,
    grossPay: 600,
    percentage: 75,
    isPrimary: true,
  },
  {
    department: 'move',
    hours: 8,
    rate: 18,
    grossPay: 144,
    percentage: 20,
    isPrimary: false,
  },
  {
    department: 'zigma',
    hours: 2,
    rate: 19,
    grossPay: 38,
    percentage: 5,
    isPrimary: false,
  },
];

describe('DepartmentBreakdown', () => {
  it('renders department breakdown with correct data', () => {
    render(
      <DepartmentBreakdown
        departments={mockDepartments}
        totalHours={40}
        totalPay={782}
        user={mockUser}
      />
    );

    // Check if department breakdown title is rendered
    expect(screen.getByText('Department Breakdown')).toBeInTheDocument();

    // Check if department cards are rendered
    expect(screen.getByText('Junk Removal')).toBeInTheDocument();
    expect(screen.getByText('Moving Services')).toBeInTheDocument();
    expect(screen.getByText('Zigma Operations')).toBeInTheDocument();

    // Check if primary department is marked
    expect(screen.getByText('Primary')).toBeInTheDocument();

    // Check if hours and pay are displayed correctly
    expect(screen.getByText('$600.00')).toBeInTheDocument();
    expect(screen.getByText('30h @ $20.00/hr')).toBeInTheDocument();
  });

  it('shows empty state when no departments have hours', () => {
    render(
      <DepartmentBreakdown
        departments={[]}
        totalHours={0}
        totalPay={0}
        user={mockUser}
      />
    );

    expect(
      screen.getByText('No department hours recorded for this period')
    ).toBeInTheDocument();
  });

  it('calculates percentages correctly', () => {
    render(
      <DepartmentBreakdown
        departments={mockDepartments}
        totalHours={40}
        totalPay={782}
        user={mockUser}
      />
    );

    // Check percentage calculations
    expect(screen.getByText('75.0%')).toBeInTheDocument(); // Junk department
    expect(screen.getByText('20.0%')).toBeInTheDocument(); // Move department
    expect(screen.getByText('5.0%')).toBeInTheDocument(); // Zigma department
  });

  it('displays summary statistics correctly', () => {
    render(
      <DepartmentBreakdown
        departments={mockDepartments}
        totalHours={40}
        totalPay={782}
        user={mockUser}
      />
    );

    // Check summary statistics
    expect(screen.getByText('3')).toBeInTheDocument(); // Number of departments
    expect(screen.getByText('40h')).toBeInTheDocument(); // Total hours
    expect(screen.getByText('$19.55')).toBeInTheDocument(); // Average rate (782/40)
    expect(screen.getByText('junk')).toBeInTheDocument(); // Primary department
  });
});
