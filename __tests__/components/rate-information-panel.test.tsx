import { render, screen } from '@testing-library/react';
import { RateInformationPanel } from '@/components/features/reports/payroll-breakdown/rate-information-panel';
import type { User, Department } from '@/types';

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

const mockDepartmentHours: Record<Department, number> = {
  junk: 30,
  move: 8,
  zigma: 2,
  training: 0,
  estimating: 0,
  warehouse: 0,
  admin: 0,
};

describe('RateInformationPanel', () => {
  it('renders rate information panel with correct data', () => {
    render(
      <RateInformationPanel
        user={mockUser}
        departmentHours={mockDepartmentHours}
      />
    );

    // Check if rate information title is rendered
    expect(screen.getByText('Rate Information')).toBeInTheDocument();

    // Check if department labels are rendered
    expect(screen.getByText('Junk Removal')).toBeInTheDocument();
    expect(screen.getByText('Moving Services')).toBeInTheDocument();
    expect(screen.getByText('Zigma Operations')).toBeInTheDocument();

    // Check if rates are displayed correctly
    expect(screen.getByText('$20.00')).toBeInTheDocument(); // Junk captain rate
    expect(screen.getByText('$16.00')).toBeInTheDocument(); // Junk wingman rate
    expect(screen.getByText('$22.00')).toBeInTheDocument(); // Move captain rate
    expect(screen.getByText('$18.00')).toBeInTheDocument(); // Move wingman rate
  });

  it('shows worked hours badges for active departments', () => {
    render(
      <RateInformationPanel
        user={mockUser}
        departmentHours={mockDepartmentHours}
      />
    );

    // Check if worked hours badges are shown
    expect(screen.getByText('30h worked')).toBeInTheDocument(); // Junk
    expect(screen.getByText('8h worked')).toBeInTheDocument(); // Move
    expect(screen.getByText('2h worked')).toBeInTheDocument(); // Zigma
  });

  it('calculates summary statistics correctly', () => {
    render(
      <RateInformationPanel
        user={mockUser}
        departmentHours={mockDepartmentHours}
      />
    );

    // Check summary statistics
    expect(screen.getByText('3')).toBeInTheDocument(); // Active departments
    expect(screen.getByText('7')).toBeInTheDocument(); // Total departments

    // Average rate calculation: (20 + 18 + 19) / 3 = 19
    expect(screen.getByText('$19.00')).toBeInTheDocument();
  });

  it('displays user role information', () => {
    render(
      <RateInformationPanel
        user={mockUser}
        departmentHours={mockDepartmentHours}
      />
    );

    // Check if user roles are displayed
    expect(screen.getByText('Your Roles: captain')).toBeInTheDocument();

    // Check role description
    expect(
      screen.getByText(/As a captain, you earn captain rates when leading jobs/)
    ).toBeInTheDocument();
  });

  it('handles wingman user correctly', () => {
    const wingmanUser = { ...mockUser, roles: ['wingman'] };

    render(
      <RateInformationPanel
        user={wingmanUser}
        departmentHours={mockDepartmentHours}
      />
    );

    // Check wingman role description
    expect(
      screen.getByText(/You earn wingman rates for junk and move departments/)
    ).toBeInTheDocument();
  });
});
