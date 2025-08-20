import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { JobSection } from '@/components/features/logs/job-section';
import { DailyLogFormSchema, type DailyLogFormData } from '@/lib/validations';
import type { User } from '@/types';

// Mock users for testing
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

// Test wrapper component
function TestWrapper({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues?: Partial<DailyLogFormData>;
}) {
  const form = useForm<DailyLogFormData>({
    resolver: zodResolver(DailyLogFormSchema),
    defaultValues: {
      captainId: '1',
      logDate: new Date(),
      sections: {
        junk: true,
        move: true,
        otherHours: true,
      },
      jobs: [],
      hours: [],
      disposalCost: 0,
      ...defaultValues,
    },
  });

  return <FormProvider {...form}>{children}</FormProvider>;
}

describe('JobSection Team Hours Integration', () => {
  it('should render team hours section for junk jobs', () => {
    render(
      <TestWrapper>
        <JobSection
          jobType="junk"
          title="Junk Removal Jobs"
          description="Test description"
          employees={mockUsers}
        />
      </TestWrapper>
    );

    expect(
      screen.getByText('Team Hours - Junk Removal Jobs')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Record employee hours for junk department work')
    ).toBeInTheDocument();
  });

  it('should render team hours section for move jobs', () => {
    render(
      <TestWrapper>
        <JobSection
          jobType="move"
          title="Moving Jobs"
          description="Test description"
          employees={mockUsers}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Team Hours - Moving Jobs')).toBeInTheDocument();
    expect(
      screen.getByText('Record employee hours for move department work')
    ).toBeInTheDocument();
  });

  it('should allow adding team members to junk section', async () => {
    render(
      <TestWrapper>
        <JobSection
          jobType="junk"
          title="Junk Removal Jobs"
          description="Test description"
          employees={mockUsers}
        />
      </TestWrapper>
    );

    // Find the "Add HUNK" button in the team hours section
    const addHunkButtons = screen.getAllByText('Add HUNK');
    const teamHoursAddButton = addHunkButtons.find(
      (button) =>
        button.closest('[data-testid="team-hours-section"]') ||
        button.parentElement?.textContent?.includes('No team members added yet')
    );

    expect(teamHoursAddButton).toBeInTheDocument();

    // Click to add a team member
    fireEvent.click(teamHoursAddButton!);

    // Should show accordion with employee selection
    await waitFor(() => {
      expect(screen.getByText('Select Employee')).toBeInTheDocument();
    });
  });

  it('should allow adding team members to move section', async () => {
    render(
      <TestWrapper>
        <JobSection
          jobType="move"
          title="Moving Jobs"
          description="Test description"
          employees={mockUsers}
        />
      </TestWrapper>
    );

    // Find the "Add HUNK" button in the team hours section
    const addHunkButtons = screen.getAllByText('Add HUNK');
    const teamHoursAddButton = addHunkButtons.find(
      (button) =>
        button.closest('[data-testid="team-hours-section"]') ||
        button.parentElement?.textContent?.includes('No team members added yet')
    );

    expect(teamHoursAddButton).toBeInTheDocument();

    // Click to add a team member
    fireEvent.click(teamHoursAddButton!);

    // Should show accordion with employee selection
    await waitFor(() => {
      expect(screen.getByText('Select Employee')).toBeInTheDocument();
    });
  });

  it('should show co-captain checkbox for team members', async () => {
    render(
      <TestWrapper>
        <JobSection
          jobType="junk"
          title="Junk Removal Jobs"
          description="Test description"
          employees={mockUsers}
        />
      </TestWrapper>
    );

    // Add a team member
    const addHunkButtons = screen.getAllByText('Add HUNK');
    const teamHoursAddButton = addHunkButtons.find((button) =>
      button.parentElement?.textContent?.includes('No team members added yet')
    );

    fireEvent.click(teamHoursAddButton!);

    // Wait for the accordion item to appear
    await waitFor(() => {
      expect(screen.getByText('Select Employee')).toBeInTheDocument();
    });

    // Click on the accordion trigger to expand it
    const accordionTrigger = screen.getByRole('button', { expanded: false });
    fireEvent.click(accordionTrigger);

    // Should show co-captain checkbox after expanding
    await waitFor(() => {
      expect(screen.getByText('Co-Captain')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Check if this employee served as co-captain for this section'
        )
      ).toBeInTheDocument();
    });
  });

  it('should filter hours by department correctly', () => {
    const initialData: Partial<DailyLogFormData> = {
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
          hours: 6,
          isCoCaptain: true,
        },
        {
          employeeId: '1',
          department: 'training',
          hours: 2,
          isCoCaptain: false,
        },
      ],
    };

    render(
      <TestWrapper defaultValues={initialData}>
        <JobSection
          jobType="junk"
          title="Junk Removal Jobs"
          description="Test description"
          employees={mockUsers}
        />
      </TestWrapper>
    );

    // Should only show junk department hours (1 entry)
    // The move and training hours should not appear in the junk section
    expect(screen.getByText('John Captain')).toBeInTheDocument();
    expect(screen.getByText('8h')).toBeInTheDocument();
    expect(screen.getByText('Junk Removal')).toBeInTheDocument();

    // Should not show the move department entry
    expect(screen.queryByText('6h')).not.toBeInTheDocument();
  });
});
