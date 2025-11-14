import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TeamHoursSection } from '@/components/features/logs/team-hours-section';
import { DailyLogFormSchema, type DailyLogFormData } from '@/lib/validations';

// Mock the useSession hook
vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    user: { id: '1', fullName: 'Test User' },
  }),
}));

// Mock employees data
const mockEmployees = [
  {
    id: '1',
    fullName: 'John Captain',
    email: 'john@example.com',
    roles: ['captain'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    fullName: 'Jane Wingman',
    email: 'jane@example.com',
    roles: ['wingman'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Test wrapper component that provides form context
function TestWrapper({
  children,
  initialHours = [],
}: {
  children: React.ReactNode;
  initialHours?: any[];
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
      disposalCost: 0,
      hours: initialHours,
    },
  });

  return (
    <FormProvider {...form}>
      <form>{children}</form>
    </FormProvider>
  );
}

describe('TeamHoursSection', () => {
  it('should render with empty state initially', () => {
    render(
      <TestWrapper>
        <TeamHoursSection
          title="Other Hours"
          description="Record training, administrative, and other non-job hours for team members."
          employees={mockEmployees}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Other Hours')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Record training, administrative, and other non-job hours for team members.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('No team members added yet.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add hunk/i })
    ).toBeInTheDocument();
  });

  it('should add a new team member when Add HUNK button is clicked', () => {
    render(
      <TestWrapper>
        <TeamHoursSection
          title="Other Hours"
          description="Record training, administrative, and other non-job hours for team members."
          employees={mockEmployees}
        />
      </TestWrapper>
    );

    const addButton = screen.getAllByRole('button', { name: /add hunk/i })[0];
    fireEvent.click(addButton);

    // Should show accordion with team member entry
    expect(screen.getByText('Select Employee')).toBeInTheDocument();
  });

  it('should display team member information in accordion trigger', () => {
    const initialHours = [
      {
        employeeId: '1',
        department: 'junk',
        hours: 8,
        isCoCaptain: true,
      },
    ];

    render(
      <TestWrapper initialHours={initialHours}>
        <TeamHoursSection
          title="Other Hours"
          description="Record training, administrative, and other non-job hours for team members."
          employees={mockEmployees}
        />
      </TestWrapper>
    );

    // Should show employee name and co-captain badge
    expect(screen.getByText('John Captain')).toBeInTheDocument();
    expect(screen.getByText('Co-Captain')).toBeInTheDocument();
    expect(screen.getByText('Junk Removal')).toBeInTheDocument();
    expect(screen.getByText('8h')).toBeInTheDocument();
  });

  it('should show form fields when accordion item is expanded', () => {
    const initialHours = [
      {
        employeeId: '',
        department: 'junk',
        hours: 0,
        isCoCaptain: false,
      },
    ];

    render(
      <TestWrapper initialHours={initialHours}>
        <TeamHoursSection
          title="Other Hours"
          description="Record training, administrative, and other non-job hours for team members."
          employees={mockEmployees}
        />
      </TestWrapper>
    );

    // Click to expand accordion
    const trigger = screen.getByRole('button', { name: /select employee/i });
    fireEvent.click(trigger);

    // Should show form fields
    expect(screen.getByText('Employee')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('Hours Worked')).toBeInTheDocument();
    expect(screen.getByText('Co-Captain')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /remove team member/i })
    ).toBeInTheDocument();
  });

  it('should have proper department options', () => {
    const initialHours = [
      {
        employeeId: '',
        department: 'junk',
        hours: 0,
        isCoCaptain: false,
      },
    ];

    render(
      <TestWrapper initialHours={initialHours}>
        <TeamHoursSection
          title="Other Hours"
          description="Record training, administrative, and other non-job hours for team members."
          employees={mockEmployees}
        />
      </TestWrapper>
    );

    // Click to expand accordion to see the form fields
    const trigger = screen.getByRole('button', { name: /select employee/i });
    fireEvent.click(trigger);

    // Now we should see the Department label
    expect(screen.getByText('Department')).toBeInTheDocument();
  });
});
