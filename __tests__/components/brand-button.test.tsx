import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { BrandButton } from '@/components/brand/brand-button'
import { User, Settings } from 'lucide-react'

describe('BrandButton', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<BrandButton>Click me</BrandButton>)
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-hunks-green') // primary variant default
    })

    it('renders children correctly', () => {
      render(<BrandButton>Test Button</BrandButton>)
      expect(screen.getByText('Test Button')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<BrandButton className="custom-class">Button</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Brand Variants', () => {
    it('renders primary variant with College Hunks Green', () => {
      render(<BrandButton variant="primary">Primary</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-hunks-green', 'text-white')
    })

    it('renders secondary variant with College Hunks Orange', () => {
      render(<BrandButton variant="secondary">Secondary</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-hunks-orange', 'text-white')
    })

    it('renders success variant with brand green', () => {
      render(<BrandButton variant="success">Success</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-hunks-green-500', 'text-white')
    })

    it('renders warning variant with brand orange', () => {
      render(<BrandButton variant="warning">Warning</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-hunks-orange-400', 'text-white')
    })

    it('renders outline-primary variant', () => {
      render(<BrandButton variant="outline-primary">Outline Primary</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-hunks-green', 'text-hunks-green')
    })

    it('renders outline-secondary variant', () => {
      render(<BrandButton variant="outline-secondary">Outline Secondary</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-hunks-orange', 'text-hunks-orange')
    })

    it('renders ghost-primary variant', () => {
      render(<BrandButton variant="ghost-primary">Ghost Primary</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-hunks-green')
    })

    it('renders ghost-secondary variant', () => {
      render(<BrandButton variant="ghost-secondary">Ghost Secondary</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-hunks-orange')
    })

    it('renders destructive variant', () => {
      render(<BrandButton variant="destructive">Destructive</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive', 'text-white')
    })
  })

  describe('Sizes', () => {
    it('renders default size', () => {
      render(<BrandButton size="default">Default</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-4', 'py-2')
    })

    it('renders small size', () => {
      render(<BrandButton size="sm">Small</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-8', 'px-3')
    })

    it('renders large size', () => {
      render(<BrandButton size="lg">Large</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-6')
    })

    it('renders icon size', () => {
      render(<BrandButton size="icon" aria-label="Icon button"><User /></BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('size-9')
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when loading is true', () => {
      render(<BrandButton loading>Loading Button</BrandButton>)
      const button = screen.getByRole('button')
      const spinner = button.querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-pulse')
      expect(screen.getByText('Loading Button')).toBeInTheDocument()
    })

    it('disables button when loading', () => {
      render(<BrandButton loading>Loading Button</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('does not show icon when loading', () => {
      render(<BrandButton loading icon={User}>Loading Button</BrandButton>)
      // Should show spinner, not the User icon
      const button = screen.getByRole('button')
      const userIcon = button.querySelector('[data-testid="user"]')
      expect(userIcon).not.toBeInTheDocument()
    })
  })

  describe('Icon Support', () => {
    it('renders with icon', () => {
      render(<BrandButton icon={User}>With Icon</BrandButton>)
      const button = screen.getByRole('button')
      expect(button.querySelector('svg')).toBeInTheDocument()
      expect(screen.getByText('With Icon')).toBeInTheDocument()
    })

    it('renders icon-only button', () => {
      render(<BrandButton icon={Settings} size="icon" aria-label="Settings" />)
      const button = screen.getByRole('button')
      expect(button.querySelector('svg')).toBeInTheDocument()
      expect(button).toHaveAccessibleName('Settings')
    })
  })

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<BrandButton disabled>Disabled Button</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('disables button when loading is true', () => {
      render(<BrandButton loading>Loading Button</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Event Handling', () => {
    it('handles click events', () => {
      const handleClick = vi.fn()
      render(<BrandButton onClick={handleClick}>Clickable</BrandButton>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not handle click when disabled', () => {
      const handleClick = vi.fn()
      render(<BrandButton onClick={handleClick} disabled>Disabled</BrandButton>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('does not handle click when loading', () => {
      const handleClick = vi.fn()
      render(<BrandButton onClick={handleClick} loading>Loading</BrandButton>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper focus-visible styles', () => {
      render(<BrandButton>Focusable</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:ring-hunks-green/20')
    })

    it('supports aria-label for icon buttons', () => {
      render(<BrandButton icon={User} size="icon" aria-label="User profile" />)
      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName('User profile')
    })

    it('maintains accessibility when loading', () => {
      render(<BrandButton loading aria-label="Submitting form">Submit</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName('Submitting form')
      expect(button).toBeDisabled()
    })
  })

  describe('AsChild Prop', () => {
    it('renders as child component when asChild is true', () => {
      render(
        <BrandButton asChild>
          <a href="/test">Link Button</a>
        </BrandButton>
      )
      
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
      expect(link).toHaveTextContent('Link Button')
      // The button should not exist when using asChild
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Brand Color Consistency', () => {
    it('applies consistent brand colors across variants', () => {
      const { rerender } = render(<BrandButton variant="primary">Primary</BrandButton>)
      let button = screen.getByRole('button')
      expect(button).toHaveClass('bg-hunks-green')

      rerender(<BrandButton variant="secondary">Secondary</BrandButton>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('bg-hunks-orange')

      rerender(<BrandButton variant="outline-primary">Outline Primary</BrandButton>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('border-hunks-green', 'text-hunks-green')

      rerender(<BrandButton variant="ghost-secondary">Ghost Secondary</BrandButton>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('text-hunks-orange')
    })
  })

  describe('Hover and Focus States', () => {
    it('has proper hover states for brand variants', () => {
      render(<BrandButton variant="primary">Primary</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-hunks-green-700')
    })

    it('has proper focus states with brand colors', () => {
      render(<BrandButton variant="secondary">Secondary</BrandButton>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:ring-hunks-orange/20')
    })
  })
})