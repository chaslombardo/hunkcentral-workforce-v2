import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { BrandLoading } from '@/components/brand/brand-loading';

// Mock matchMedia for reduced motion tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('BrandLoading', () => {
  it('renders with default props', () => {
    render(<BrandLoading />);
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with text prop', () => {
    render(<BrandLoading text="Loading data..." />);
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveAttribute(
      'aria-label',
      'Loading: Loading data...'
    );
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders spinner variant by default', () => {
    render(<BrandLoading />);
    const loadingElement = screen.getByRole('status');
    expect(loadingElement.querySelector('svg')).toBeInTheDocument();
  });

  it('renders dots variant', () => {
    render(<BrandLoading variant="dots" />);
    const loadingElement = screen.getByRole('status');
    // Should have 3 dots - look for the specific dot elements
    const dotsContainer = loadingElement.querySelector('.gap-1');
    const dots = dotsContainer?.querySelectorAll('div');
    expect(dots).toHaveLength(3);
  });

  it('renders pulse variant', () => {
    render(<BrandLoading variant="pulse" />);
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeInTheDocument();
  });

  it('applies size variants correctly', () => {
    const { rerender } = render(<BrandLoading size="sm" />);
    let loadingElement = screen.getByRole('status');
    expect(loadingElement.firstChild).toHaveClass('w-4', 'h-4');

    rerender(<BrandLoading size="md" />);
    loadingElement = screen.getByRole('status');
    expect(loadingElement.firstChild).toHaveClass('w-6', 'h-6');

    rerender(<BrandLoading size="lg" />);
    loadingElement = screen.getByRole('status');
    expect(loadingElement.firstChild).toHaveClass('w-8', 'h-8');
  });

  it('applies color variants correctly', () => {
    const { rerender } = render(<BrandLoading color="primary" />);
    let loadingElement = screen.getByRole('status');
    expect(loadingElement.firstChild).toHaveClass('text-hunks-green');

    rerender(<BrandLoading color="secondary" />);
    loadingElement = screen.getByRole('status');
    expect(loadingElement.firstChild).toHaveClass('text-hunks-orange');

    rerender(<BrandLoading color="white" />);
    loadingElement = screen.getByRole('status');
    expect(loadingElement.firstChild).toHaveClass('text-white');
  });

  it('respects reduced motion preference', () => {
    // Mock reduced motion preference
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<BrandLoading variant="spinner" respectReducedMotion={true} />);
    const loadingElement = screen.getByRole('status');

    // Should render pulse variant instead of spinner when reduced motion is preferred
    expect(loadingElement.firstChild).toHaveClass('animate-pulse');
  });

  it('can disable reduced motion respect', () => {
    // Mock reduced motion preference
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<BrandLoading variant="spinner" respectReducedMotion={false} />);
    const loadingElement = screen.getByRole('status');

    // Should still render spinner even with reduced motion preference
    expect(loadingElement.querySelector('svg')).toBeInTheDocument();
  });

  it('forwards additional props', () => {
    render(
      <BrandLoading data-testid="custom-loading" className="custom-class" />
    );
    const loadingElement = screen.getByTestId('custom-loading');
    expect(loadingElement).toHaveClass('custom-class');
  });
});
