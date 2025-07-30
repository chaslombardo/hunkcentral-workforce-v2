import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TipsDetailView } from '@/components/features/reports/payroll-breakdown/tips-detail-view';
import type { TipEntry } from '@/lib/payCalculator';

// Mock the formatters
vi.mock('@/lib/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  formatDate: (date: Date) => date.toLocaleDateString(),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockTips: TipEntry[] = [
  {
    date: new Date('2025-01-02'),
    jobId: 'J2025-001',
    clientName: 'Smith Residence',
    totalJobTips: 80,
    teamMembers: 4,
    myShare: 20,
    jobType: 'junk',
    logId: 'log-1',
  },
  {
    date: new Date('2025-01-03'),
    jobId: 'M2025-001',
    clientName: 'Miller Apartment',
    totalJobTips: 60,
    teamMembers: 3,
    myShare: 20,
    jobType: 'move',
    logId: 'log-2',
  },
  {
    date: new Date('2025-01-04'),
    jobId: 'J2025-002',
    clientName: 'Johnson Family',
    totalJobTips: 100,
    teamMembers: 2,
    myShare: 50,
    jobType: 'junk',
    logId: 'log-3',
  },
];

const defaultProps = {
  tips: mockTips,
  totalTips: 90,
  payPeriodStart: new Date('2025-01-01'),
  payPeriodEnd: new Date('2025-01-07'),
};

describe('TipsDetailView', () => {
  it('renders performance metrics correctly', () => {
    render(<TipsDetailView {...defaultProps} />);
    
    // Check total tips using test ID
    expect(screen.getByTestId('total-tips-amount')).toHaveTextContent('$90.00');
    
    // Check average per job using test ID
    expect(screen.getByTestId('average-per-job')).toHaveTextContent('$30.00'); // 90 / 3 jobs
    
    // Check job counts
    expect(screen.getByText('3 jobs')).toBeInTheDocument();
  });

  it('displays tips breakdown table with correct data', () => {
    render(<TipsDetailView {...defaultProps} />);
    
    // Check client names are displayed (using getAllByText since they appear in both mobile and desktop views)
    expect(screen.getAllByText('Smith Residence')).toHaveLength(2); // Mobile and desktop
    expect(screen.getAllByText('Miller Apartment')).toHaveLength(2);
    expect(screen.getAllByText('Johnson Family')).toHaveLength(2);
    
    // Check job IDs
    expect(screen.getByText('J2025-001')).toBeInTheDocument();
    expect(screen.getByText('M2025-001')).toBeInTheDocument();
    expect(screen.getByText('J2025-002')).toBeInTheDocument();
  });

  it('filters tips by job type correctly', () => {
    render(<TipsDetailView {...defaultProps} />);
    
    // Find the filter select by its role
    const filterSelects = screen.getAllByRole('combobox');
    const filterSelect = filterSelects.find(select => 
      select.getAttribute('aria-expanded') === 'false'
    );
    
    expect(filterSelect).toBeInTheDocument();
    fireEvent.click(filterSelect!);
    
    // Select "Junk Only"
    const junkOption = screen.getByText('Junk Only');
    fireEvent.click(junkOption);
    
    // Should show only junk jobs (Smith and Johnson are junk, Miller is move)
    expect(screen.getAllByText('Smith Residence').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Johnson Family').length).toBeGreaterThan(0);
    expect(screen.queryByText('Miller Apartment')).not.toBeInTheDocument();
  });

  it('sorts tips by amount correctly', () => {
    render(<TipsDetailView {...defaultProps} />);
    
    // Find the sort select (second combobox)
    const selects = screen.getAllByRole('combobox');
    const sortSelect = selects[1]; // Second select is the sort dropdown
    
    fireEvent.click(sortSelect);
    
    // Select "By Amount"
    const amountOption = screen.getByText('By Amount');
    fireEvent.click(amountOption);
    
    // The highest tip ($50) should be first in the table
    const tableRows = screen.getAllByRole('row');
    // Skip header row, check first data row
    expect(tableRows[1]).toHaveTextContent('$50.00');
  });

  it('searches tips by client name', () => {
    render(<TipsDetailView {...defaultProps} />);
    
    // Find search input
    const searchInput = screen.getByPlaceholderText('Search client or job...');
    
    // Search for "Smith"
    fireEvent.change(searchInput, { target: { value: 'Smith' } });
    
    // Should show only Smith Residence (appears in both mobile and desktop views)
    expect(screen.getAllByText('Smith Residence').length).toBeGreaterThan(0);
    expect(screen.queryByText('Miller Apartment')).not.toBeInTheDocument();
    expect(screen.queryByText('Johnson Family')).not.toBeInTheDocument();
  });

  it('calculates job type averages correctly', () => {
    render(<TipsDetailView {...defaultProps} />);
    
    // Junk jobs: (20 + 50) / 2 = 35
    // Move jobs: 20 / 1 = 20
    expect(screen.getByTestId('job-type-comparison')).toHaveTextContent('$35.00 / $20.00');
  });

  it('shows tip distribution formula explanation', () => {
    render(<TipsDetailView {...defaultProps} />);
    
    expect(screen.getByText('How Tips Are Calculated')).toBeInTheDocument();
    expect(screen.getByTestId('tip-formula')).toHaveTextContent('Your share = Total Job Tips ÷ Number of Team Members');
  });

  it('displays empty state when no tips match filters', () => {
    render(<TipsDetailView {...defaultProps} />);
    
    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search client or job...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentClient' } });
    
    expect(screen.getByText('No tips match your current filters.')).toBeInTheDocument();
  });

  it('shows correct filtered totals', () => {
    render(<TipsDetailView {...defaultProps} />);
    
    // Filter to junk only
    const filterSelects = screen.getAllByRole('combobox');
    const filterSelect = filterSelects[0]; // First select is the filter dropdown
    fireEvent.click(filterSelect);
    const junkOption = screen.getByText('Junk Only');
    fireEvent.click(junkOption);
    
    // Should show filtered total (20 + 50 = 70) in the summary
    expect(screen.getByText('$70.00')).toBeInTheDocument();
  });

  it('renders tooltips for tip calculation explanations', () => {
    render(<TipsDetailView {...defaultProps} />);
    
    // Check for tooltip triggers (buttons with help content)
    const buttons = screen.getAllByRole('button');
    
    // Should have tooltip buttons for explanations
    expect(buttons.length).toBeGreaterThan(0);
    
    // Check that we have buttons that could be tooltip triggers
    const tooltipButtons = buttons.filter(button => 
      button.textContent?.includes('Per job') || 
      button.textContent?.includes('Total Tips') ||
      button.textContent?.includes('Team Size')
    );
    
    expect(tooltipButtons.length).toBeGreaterThan(0);
  });

  it('provides links to view original logs', () => {
    render(<TipsDetailView {...defaultProps} />);
    
    // Check for "View Log" links (only desktop view is visible in test environment)
    const viewLogLinks = screen.getAllByText('View Log');
    expect(viewLogLinks.length).toBe(mockTips.length); // Only desktop view visible
    
    // Check that links point to correct log IDs (tips are sorted by date desc, so log-3 is first)
    const firstLink = viewLogLinks[0].closest('a');
    expect(firstLink).toHaveAttribute('href', '/logs/log-3'); // Johnson Family (highest amount, sorted by date desc)
  });

  it('handles empty tips array gracefully', () => {
    render(<TipsDetailView {...defaultProps} tips={[]} totalTips={0} />);
    
    expect(screen.getByTestId('total-tips-amount')).toHaveTextContent('$0.00');
    expect(screen.getByText('No tips recorded for this period.')).toBeInTheDocument();
  });
});