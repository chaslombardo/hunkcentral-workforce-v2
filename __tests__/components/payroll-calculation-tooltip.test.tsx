import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalculationTooltip, QuickCalculationHelp } from '@/components/features/reports/payroll-calculation-tooltip';

import { vi } from 'vitest';

// Mock formatCurrency function
vi.mock('@/lib/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

const mockLaborCostData = {
  hours: 8,
  rate: 20,
  department: 'junk' as const,
  role: 'captain' as const,
  goalPercentage: 14,
  actualPercentage: 16,
  revenue: 1000,
};

const mockBonusData = {
  goalPercentage: 14,
  actualPercentage: 12,
  revenue: 1000,
  bonusAmount: 20,
  department: 'junk' as const,
};

const mockTipDistributionData = {
  totalTips: 80,
  teamMembers: 4,
  myShare: 20,
  jobId: 'J2025-001',
  distribution: [
    { name: 'John Smith', role: 'captain', share: 20 },
    { name: 'Jane Doe', role: 'wingman', share: 20 },
    { name: 'Bob Johnson', role: 'wingman', share: 20 },
    { name: 'Alice Brown', role: 'wingman', share: 20 },
  ],
};

const mockDepartmentRateData = {
  department: 'junk' as const,
  captainRate: 20,
  wingmanRate: 16,
  currentRate: 20,
  role: 'captain' as const,
  explanation: 'Captain rate applies when serving as captain or co-captain',
};

describe('CalculationTooltip', () => {
  it('renders labor cost explanation correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <CalculationTooltip type="labor-cost" data={mockLaborCostData}>
        <button>Labor Cost</button>
      </CalculationTooltip>
    );
    
    // Hover over the trigger
    await user.hover(screen.getByText('Labor Cost'));
    
    await waitFor(() => {
      expect(screen.getByText('Labor Cost Calculation')).toBeInTheDocument();
      expect(screen.getByText('8h')).toBeInTheDocument();
      expect(screen.getByText('$20.00/hr')).toBeInTheDocument();
      expect(screen.getByText('$160.00')).toBeInTheDocument(); // 8 * 20
      expect(screen.getByText('16.0%')).toBeInTheDocument();
      expect(screen.getByText('14.0%')).toBeInTheDocument();
    });
  });

  it('renders bonus explanation correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <CalculationTooltip type="bonus" data={mockBonusData}>
        <button>Bonus</button>
      </CalculationTooltip>
    );
    
    await user.hover(screen.getByText('Bonus'));
    
    await waitFor(() => {
      expect(screen.getByText('Labor Efficiency Bonus')).toBeInTheDocument();
      expect(screen.getByText('14.0%')).toBeInTheDocument(); // Goal
      expect(screen.getByText('12.0%')).toBeInTheDocument(); // Actual
      expect(screen.getByText('+2.0%')).toBeInTheDocument(); // Efficiency gain
      expect(screen.getByText('$20.00')).toBeInTheDocument(); // Bonus amount
    });
  });

  it('renders tips explanation correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <CalculationTooltip type="tips">
        <button>Tips</button>
      </CalculationTooltip>
    );
    
    await user.hover(screen.getByText('Tips'));
    
    await waitFor(() => {
      expect(screen.getByText('Tips Distribution')).toBeInTheDocument();
      expect(screen.getByText(/Tips are divided equally among all team members/)).toBeInTheDocument();
      expect(screen.getByText('Total Tips ÷ Team Members = Your Share')).toBeInTheDocument();
    });
  });

  it('renders department rate explanation correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <CalculationTooltip type="department-rate" data={mockDepartmentRateData}>
        <button>Rate</button>
      </CalculationTooltip>
    );
    
    await user.hover(screen.getByText('Rate'));
    
    await waitFor(() => {
      expect(screen.getByText('Department Rate')).toBeInTheDocument();
      expect(screen.getByText('$20.00/hr')).toBeInTheDocument(); // Captain rate
      expect(screen.getByText('$16.00/hr')).toBeInTheDocument(); // Wingman rate
      expect(screen.getByText('Captain rate applies when serving as captain or co-captain')).toBeInTheDocument();
    });
  });

  it('renders efficiency explanation correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <CalculationTooltip type="efficiency" data={mockLaborCostData}>
        <button>Efficiency</button>
      </CalculationTooltip>
    );
    
    await user.hover(screen.getByText('Efficiency'));
    
    await waitFor(() => {
      expect(screen.getByText('Labor Efficiency')).toBeInTheDocument();
      expect(screen.getByText('16.0%')).toBeInTheDocument(); // Current
      expect(screen.getByText('14.0%')).toBeInTheDocument(); // Target
      expect(screen.getByText(/Focus on completing jobs faster/)).toBeInTheDocument();
    });
  });

  it('renders tip distribution explanation correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <CalculationTooltip type="tip-distribution" data={mockTipDistributionData}>
        <button>Tip Distribution</button>
      </CalculationTooltip>
    );
    
    await user.hover(screen.getByText('Tip Distribution'));
    
    await waitFor(() => {
      expect(screen.getByText('Tip Distribution')).toBeInTheDocument();
      expect(screen.getByText('J2025-001')).toBeInTheDocument();
      expect(screen.getByText('$80.00')).toBeInTheDocument(); // Total tips
      expect(screen.getByText('4')).toBeInTheDocument(); // Team members
      expect(screen.getByText('$20.00')).toBeInTheDocument(); // My share
      expect(screen.getByText('John Smith (captain)')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe (wingman)')).toBeInTheDocument();
    });
  });

  it('shows positive efficiency message for good performance', async () => {
    const user = userEvent.setup();
    const goodEfficiencyData = {
      ...mockLaborCostData,
      actualPercentage: 12, // Better than 14% goal
    };
    
    render(
      <CalculationTooltip type="efficiency" data={goodEfficiencyData}>
        <button>Efficiency</button>
      </CalculationTooltip>
    );
    
    await user.hover(screen.getByText('Efficiency'));
    
    await waitFor(() => {
      expect(screen.getByText(/Great job! You're operating efficiently/)).toBeInTheDocument();
    });
  });

  it('shows negative bonus for poor efficiency', async () => {
    const user = userEvent.setup();
    const poorBonusData = {
      ...mockBonusData,
      actualPercentage: 16, // Worse than 14% goal
      bonusAmount: 0,
    };
    
    render(
      <CalculationTooltip type="bonus" data={poorBonusData}>
        <button>Bonus</button>
      </CalculationTooltip>
    );
    
    await user.hover(screen.getByText('Bonus'));
    
    await waitFor(() => {
      expect(screen.getByText('-2.0%')).toBeInTheDocument(); // Negative efficiency
      expect(screen.getByText('$0.00')).toBeInTheDocument(); // No bonus
    });
  });

  it('handles missing data gracefully', async () => {
    const user = userEvent.setup();
    
    render(
      <CalculationTooltip type="labor-cost" data={null}>
        <button>Labor Cost</button>
      </CalculationTooltip>
    );
    
    await user.hover(screen.getByText('Labor Cost'));
    
    // Should not crash and should not show content
    await waitFor(() => {
      expect(screen.queryByText('Labor Cost Calculation')).not.toBeInTheDocument();
    });
  });

  it('uses correct positioning', async () => {
    const user = userEvent.setup();
    
    render(
      <CalculationTooltip type="tips" side="right">
        <button>Tips</button>
      </CalculationTooltip>
    );
    
    await user.hover(screen.getByText('Tips'));
    
    await waitFor(() => {
      expect(screen.getByText('Tips Distribution')).toBeInTheDocument();
    });
  });
});

describe('QuickCalculationHelp', () => {
  it('renders help button', () => {
    render(<QuickCalculationHelp type="labor-cost" />);
    
    const helpButton = screen.getByRole('button');
    expect(helpButton).toBeInTheDocument();
    expect(helpButton).toHaveClass('h-6', 'w-6');
  });

  it('shows tooltip on hover', async () => {
    const user = userEvent.setup();
    
    render(<QuickCalculationHelp type="tips" />);
    
    const helpButton = screen.getByRole('button');
    await user.hover(helpButton);
    
    await waitFor(() => {
      expect(screen.getByText('Tips Distribution')).toBeInTheDocument();
    });
  });
});

describe('CalculationTooltip Requirements Validation', () => {
  it('meets requirement 7.3: Creates calculation explanation tooltips', async () => {
    const user = userEvent.setup();
    
    render(
      <CalculationTooltip type="labor-cost" data={mockLaborCostData}>
        <button>Labor Cost</button>
      </CalculationTooltip>
    );
    
    await user.hover(screen.getByText('Labor Cost'));
    
    await waitFor(() => {
      // Should show detailed calculation explanation
      expect(screen.getByText('Labor Cost Calculation')).toBeInTheDocument();
      expect(screen.getByText('Hours Worked:')).toBeInTheDocument();
      expect(screen.getByText('Hourly Rate (captain):')).toBeInTheDocument();
      expect(screen.getByText('Labor Cost:')).toBeInTheDocument();
      expect(screen.getByText(/Labor cost = Hours × Rate/)).toBeInTheDocument();
    });
  });

  it('meets requirement 7.3: Provides help documentation', async () => {
    const user = userEvent.setup();
    
    render(
      <CalculationTooltip type="bonus" data={mockBonusData}>
        <button>Bonus</button>
      </CalculationTooltip>
    );
    
    await user.hover(screen.getByText('Bonus'));
    
    await waitFor(() => {
      // Should show formula and explanation
      expect(screen.getByText('Labor Efficiency Bonus')).toBeInTheDocument();
      expect(screen.getByText(/Bonus = \(Goal% - Actual%\) × Revenue/)).toBeInTheDocument();
      expect(screen.getByText(/Only captains earn efficiency bonuses/)).toBeInTheDocument();
    });
  });

  it('meets requirement 7.4: Supports different tooltip types', async () => {
    const user = userEvent.setup();
    
    // Test multiple tooltip types
    const tooltipTypes = [
      { type: 'labor-cost' as const, data: mockLaborCostData, expectedText: 'Labor Cost Calculation' },
      { type: 'bonus' as const, data: mockBonusData, expectedText: 'Labor Efficiency Bonus' },
      { type: 'tips' as const, data: null, expectedText: 'Tips Distribution' },
      { type: 'department-rate' as const, data: mockDepartmentRateData, expectedText: 'Department Rate' },
      { type: 'efficiency' as const, data: mockLaborCostData, expectedText: 'Labor Efficiency' },
      { type: 'tip-distribution' as const, data: mockTipDistributionData, expectedText: 'Tip Distribution' },
    ];
    
    for (const { type, data, expectedText } of tooltipTypes) {
      const { unmount } = render(
        <CalculationTooltip type={type} data={data}>
          <button>{type}</button>
        </CalculationTooltip>
      );
      
      await user.hover(screen.getByText(type));
      
      await waitFor(() => {
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      });
      
      unmount();
    }
  });
});