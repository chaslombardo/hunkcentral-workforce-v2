import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { SmartBreadcrumbs } from '@/components/layout/smart-breadcrumbs'

// Mock Next.js usePathname hook
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

const mockUsePathname = vi.mocked(await import('next/navigation')).usePathname

describe('SmartBreadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard breadcrumb for root path', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    
    render(<SmartBreadcrumbs />)
    
    // Should not render anything for single dashboard item
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('renders breadcrumbs for nested paths', () => {
    mockUsePathname.mockReturnValue('/logs/create')
    
    render(<SmartBreadcrumbs />)
    
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Daily Logs')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
  })

  it('handles dynamic routes with numeric IDs', () => {
    mockUsePathname.mockReturnValue('/logs/123')
    
    render(<SmartBreadcrumbs />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Daily Logs')).toBeInTheDocument()
    expect(screen.getByText('Log #123')).toBeInTheDocument()
  })

  it('handles dynamic routes with UUIDs', () => {
    mockUsePathname.mockReturnValue('/logs/550e8400-e29b-41d4-a716-446655440000')
    
    render(<SmartBreadcrumbs />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Daily Logs')).toBeInTheDocument()
    expect(screen.getByText('Log Details')).toBeInTheDocument()
  })

  it('handles admin user routes', () => {
    mockUsePathname.mockReturnValue('/admin/users/456')
    
    render(<SmartBreadcrumbs />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('User #456')).toBeInTheDocument()
  })

  it('respects maxItems prop', () => {
    mockUsePathname.mockReturnValue('/admin/users/456/edit/profile')
    
    render(<SmartBreadcrumbs maxItems={3} />)
    
    const navigation = screen.getByRole('navigation')
    // Should limit to 3 items: Dashboard + last 2 segments
    const breadcrumbItems = navigation.querySelectorAll('li[class*="inline-flex"]')
    expect(breadcrumbItems.length).toBeLessThanOrEqual(3)
  })

  it('can disable icons', () => {
    mockUsePathname.mockReturnValue('/logs/create')
    
    render(<SmartBreadcrumbs showIcons={false} />)
    
    // Icons should not be present when showIcons is false
    const navigation = screen.getByRole('navigation')
    const icons = navigation.querySelectorAll('svg')
    expect(icons.length).toBe(2) // Only the separator chevrons should be present (2 separators for 3 items)
  })

  it('handles commission routes', () => {
    mockUsePathname.mockReturnValue('/commission/list')
    
    render(<SmartBreadcrumbs />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Commission')).toBeInTheDocument()
    expect(screen.getByText('Track')).toBeInTheDocument()
  })

  it('handles reports routes', () => {
    mockUsePathname.mockReturnValue('/reports/my-payroll')
    
    render(<SmartBreadcrumbs />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('My Payroll')).toBeInTheDocument()
  })
})