# BrandButton Component

The `BrandButton` component is an enhanced version of the shadcn/ui Button component with College Hunks brand variants, accessibility improvements, and performance optimizations.

## Overview

The BrandButton extends the standard button functionality with:
- **Brand variants** using College Hunks colors
- **Loading states** with branded animations
- **Accessibility enhancements** with ARIA support
- **Performance monitoring** and optimization
- **Motion preferences** respect for reduced motion
- **Keyboard shortcuts** support

## API Reference

### Props

```tsx
interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Appearance
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 
           'outline-primary' | 'outline-secondary' | 
           'ghost-primary' | 'ghost-secondary' | 
           'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  
  // Behavior
  asChild?: boolean
  loading?: boolean
  success?: boolean
  error?: boolean
  
  // Content
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  
  // Accessibility
  loadingText?: string
  successText?: string
  errorText?: string
  shortcut?: string
  
  // Performance
  respectReducedMotion?: boolean
}
```

### Variants

#### Brand Variants
- **`primary`** - College Hunks Green background with white text
- **`secondary`** - College Hunks Orange background with white text
- **`success`** - Success green variant
- **`warning`** - Warning orange variant

#### Outline Variants
- **`outline-primary`** - Green border with green text, fills on hover
- **`outline-secondary`** - Orange border with orange text, fills on hover

#### Ghost Variants
- **`ghost-primary`** - Transparent with green text, subtle background on hover
- **`ghost-secondary`** - Transparent with orange text, subtle background on hover

#### Standard Variants
- **`destructive`** - Red variant for dangerous actions
- **`outline`** - Standard outline variant
- **`ghost`** - Standard ghost variant
- **`link`** - Link-style button

### Sizes
- **`default`** - 36px height, standard padding
- **`sm`** - 32px height, compact padding
- **`lg`** - 40px height, generous padding
- **`icon`** - 36px square for icon-only buttons

## Usage Examples

### Basic Usage

```tsx
import { BrandButton } from '@/components/brand/brand-button'

// Primary brand button
<BrandButton variant="primary">
  Save Changes
</BrandButton>

// Secondary brand button
<BrandButton variant="secondary">
  Cancel
</BrandButton>

// With icon
<BrandButton variant="primary" icon={Save}>
  Save Document
</BrandButton>
```

### Loading States

```tsx
<BrandButton 
  variant="primary" 
  loading={isSubmitting}
  loadingText="Saving your changes"
>
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</BrandButton>
```

### Success and Error States

```tsx
<BrandButton 
  variant="primary"
  success={isSuccess}
  successText="Changes saved successfully"
>
  Save Changes
</BrandButton>

<BrandButton 
  variant="primary"
  error={hasError}
  errorText="Failed to save changes"
>
  Save Changes
</BrandButton>
```

### Keyboard Shortcuts

```tsx
<BrandButton 
  variant="primary"
  shortcut="s"
  aria-label="Save changes (Ctrl+S)"
>
  Save
</BrandButton>
```

### Form Integration

```tsx
import { useForm } from 'react-hook-form'

function MyForm() {
  const { handleSubmit, formState: { isSubmitting, isValid } } = useForm()
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      
      <div className="flex gap-3">
        <BrandButton 
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={!isValid}
        >
          Submit Form
        </BrandButton>
        
        <BrandButton 
          type="button"
          variant="outline-primary"
          onClick={onCancel}
        >
          Cancel
        </BrandButton>
      </div>
    </form>
  )
}
```

### Responsive Usage

```tsx
<BrandButton 
  variant="primary"
  size="sm"
  className="md:size-default lg:size-lg"
>
  Responsive Button
</BrandButton>
```

## Accessibility Features

### ARIA Support
- **`aria-label`** - Custom accessible label
- **`aria-describedby`** - Links to description elements
- **`aria-busy`** - Indicates loading state
- **`aria-pressed`** - For toggle buttons

### Keyboard Navigation
- **Enter/Space** - Activates the button
- **Custom shortcuts** - Configurable keyboard shortcuts
- **Focus management** - Proper focus indicators

### Screen Reader Support
```tsx
<BrandButton 
  variant="primary"
  loading={isLoading}
  loadingText="Processing your request, please wait"
  aria-describedby="save-help"
>
  Save
</BrandButton>

<div id="save-help" className="sr-only">
  This will save your changes permanently
</div>
```

## Styling and Customization

### CSS Classes
The component generates classes following this pattern:
```css
/* Base classes */
.inline-flex.items-center.justify-center
.gap-2.whitespace-nowrap.rounded-md
.text-sm.font-medium.transition-all

/* Variant classes */
.bg-hunks-green.text-white.shadow-xs
.hover:bg-hunks-green-700
.focus-visible:ring-hunks-green/20

/* Size classes */
.h-9.px-4.py-2  /* default */
.h-8.px-3       /* sm */
.h-10.px-6      /* lg */
.size-9         /* icon */
```

### Custom Styling
```tsx
// With custom classes
<BrandButton 
  variant="primary"
  className="rounded-full shadow-lg"
>
  Custom Styled
</BrandButton>

// With CSS-in-JS
const StyledButton = styled(BrandButton)`
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(2, 105, 55, 0.3);
`
```

### Theme Customization
```css
:root {
  --brand-primary: #026937;
  --brand-primary-foreground: #ffffff;
  --brand-primary-hover: #1e5a32;
  --brand-primary-focus: rgba(2, 105, 55, 0.2);
}
```

## Performance Considerations

### Memoization
The component is wrapped with `React.memo` and uses memoized calculations:
```tsx
const BrandButton = React.memo(React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ variant, size, className, ...props }, ref) => {
    // Memoized class calculations
    const buttonClassName = React.useMemo(() => 
      cn(brandButtonVariants({ variant, size }), className), 
      [variant, size, className]
    )
    
    // Component implementation
  }
))
```

### Bundle Analysis
The component includes development-time bundle analysis:
```tsx
React.useEffect(() => {
  bundleAnalysis.warnLargeProps('BrandButton', props, 200)
  bundleAnalysis.trackRender('BrandButton', variant, props)
}, [props, variant])
```

### Performance Monitoring
Built-in performance monitoring tracks render times:
```tsx
const monitor = usePerformanceMonitor('BrandButton')
const startMarkRef = React.useRef<string>('')

React.useLayoutEffect(() => {
  startMarkRef.current = monitor.startRender()
})

React.useLayoutEffect(() => {
  monitor.endRender(startMarkRef.current)
})
```

## Testing

### Unit Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { BrandButton } from './brand-button'

describe('BrandButton', () => {
  it('renders with primary variant', () => {
    render(<BrandButton variant="primary">Click me</BrandButton>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toHaveClass('bg-hunks-green')
  })
  
  it('shows loading state', () => {
    render(
      <BrandButton loading loadingText="Processing">
        Submit
      </BrandButton>
    )
    expect(screen.getByLabelText(/processing/i)).toBeInTheDocument()
  })
  
  it('handles keyboard shortcuts', () => {
    const onClick = jest.fn()
    render(
      <BrandButton shortcut="s" onClick={onClick}>
        Save
      </BrandButton>
    )
    
    fireEvent.keyDown(screen.getByRole('button'), {
      key: 's',
      ctrlKey: true
    })
    
    expect(onClick).toHaveBeenCalled()
  })
})
```

### Accessibility Tests
```tsx
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should not have accessibility violations', async () => {
  const { container } = render(
    <BrandButton variant="primary">Accessible Button</BrandButton>
  )
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Best Practices

### When to Use Each Variant

#### Primary (`variant="primary"`)
- **Use for**: Main call-to-action buttons
- **Examples**: "Save", "Submit", "Create", "Continue"
- **Limit**: One primary button per section

#### Secondary (`variant="secondary"`)
- **Use for**: Secondary actions that need emphasis
- **Examples**: "Edit", "Delete", "Export"
- **Context**: When you need a second prominent action

#### Outline (`variant="outline-primary"`)
- **Use for**: Secondary actions with less emphasis
- **Examples**: "Cancel", "Back", "Preview"
- **Context**: Paired with primary buttons

#### Ghost (`variant="ghost-primary"`)
- **Use for**: Tertiary actions or navigation
- **Examples**: "Skip", "Learn More", "View Details"
- **Context**: Minimal visual weight needed

### Loading States
```tsx
// Good: Descriptive loading text
<BrandButton 
  loading={isSubmitting}
  loadingText="Saving your changes to the server"
>
  Save Changes
</BrandButton>

// Avoid: Generic loading without context
<BrandButton loading={isSubmitting}>
  Save Changes
</BrandButton>
```

### Error Handling
```tsx
// Good: Clear error communication
<BrandButton 
  error={hasError}
  errorText="Unable to save. Please check your connection and try again."
  onClick={retrySubmit}
>
  {hasError ? 'Retry' : 'Save Changes'}
</BrandButton>
```

### Mobile Considerations
```tsx
// Good: Appropriate sizing for mobile
<BrandButton 
  variant="primary"
  size="lg"
  className="w-full md:w-auto"
>
  Mobile-Friendly Button
</BrandButton>
```

## Common Patterns

### Form Submission
```tsx
<div className="flex flex-col sm:flex-row gap-3">
  <BrandButton 
    type="submit"
    variant="primary"
    loading={isSubmitting}
    disabled={!isValid}
    className="flex-1 sm:flex-none"
  >
    {isSubmitting ? 'Saving...' : 'Save Changes'}
  </BrandButton>
  
  <BrandButton 
    type="button"
    variant="outline-primary"
    onClick={onCancel}
    disabled={isSubmitting}
  >
    Cancel
  </BrandButton>
</div>
```

### Confirmation Dialogs
```tsx
<div className="flex justify-end gap-3">
  <BrandButton 
    variant="outline-primary"
    onClick={onCancel}
  >
    Cancel
  </BrandButton>
  
  <BrandButton 
    variant="destructive"
    onClick={onConfirm}
    loading={isDeleting}
  >
    {isDeleting ? 'Deleting...' : 'Delete Item'}
  </BrandButton>
</div>
```

### Navigation
```tsx
<nav className="flex items-center space-x-1">
  <BrandButton variant="ghost-primary" size="sm">
    Dashboard
  </BrandButton>
  <BrandButton variant="ghost-primary" size="sm">
    Reports
  </BrandButton>
  <BrandButton variant="primary" size="sm">
    Create New
  </BrandButton>
</nav>
```

The BrandButton component provides a solid foundation for all button interactions in HUNKCentral while maintaining brand consistency, accessibility, and performance standards.