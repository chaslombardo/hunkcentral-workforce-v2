# Usage Guidelines

This document provides comprehensive guidelines on when and how to use the enhanced theme components in HUNKCentral. Following these guidelines ensures consistency, accessibility, and optimal user experience across the application.

## 🎨 Component Selection Guide

### Buttons

#### When to Use BrandButton Variants

##### Primary (`variant="primary"`)
**Use for:**
- Main call-to-action on a page or section
- Form submission buttons
- Primary navigation actions
- Confirmation actions in dialogs

**Examples:**
```tsx
// Form submission
<BrandButton variant="primary" type="submit">
  Save Changes
</BrandButton>

// Main page action
<BrandButton variant="primary">
  Create New Log
</BrandButton>

// Dialog confirmation
<BrandButton variant="primary" onClick={handleConfirm}>
  Confirm Delete
</BrandButton>
```

**Guidelines:**
- Limit to one primary button per section
- Use for the most important action
- Always make the action clear and specific

##### Secondary (`variant="secondary"`)
**Use for:**
- Secondary actions that need emphasis
- Alternative paths or options
- Actions that complement the primary action

**Examples:**
```tsx
// Complementary action
<div className="flex gap-3">
  <BrandButton variant="primary">Save Draft</BrandButton>
  <BrandButton variant="secondary">Publish Now</BrandButton>
</div>

// Alternative action
<BrandButton variant="secondary">
  Export to PDF
</BrandButton>
```

**Guidelines:**
- Use sparingly - typically one per section
- Should not compete with primary actions
- Use for actions that are important but not primary

##### Outline (`variant="outline-primary"` / `variant="outline-secondary"`)
**Use for:**
- Cancel actions
- Secondary navigation
- Actions that need less visual weight
- Paired with solid buttons

**Examples:**
```tsx
// Cancel action
<div className="flex gap-3">
  <BrandButton variant="primary">Save</BrandButton>
  <BrandButton variant="outline-primary">Cancel</BrandButton>
</div>

// Secondary navigation
<BrandButton variant="outline-primary" size="sm">
  View Details
</BrandButton>
```

**Guidelines:**
- Perfect for cancel/back actions
- Use when you need a button but don't want visual dominance
- Good for secondary navigation items

##### Ghost (`variant="ghost-primary"` / `variant="ghost-secondary"`)
**Use for:**
- Tertiary actions
- Navigation items
- Actions within cards or lists
- Minimal visual impact needed

**Examples:**
```tsx
// Navigation
<nav className="flex space-x-1">
  <BrandButton variant="ghost-primary" size="sm">Dashboard</BrandButton>
  <BrandButton variant="ghost-primary" size="sm">Reports</BrandButton>
</nav>

// Card actions
<Card>
  <CardHeader>
    <CardTitle>Log Entry #123</CardTitle>
    <BrandButton variant="ghost-primary" size="sm">
      Edit
    </BrandButton>
  </CardHeader>
</Card>
```

**Guidelines:**
- Use for actions that should be available but not prominent
- Good for repeated actions in lists or cards
- Ideal for navigation items

#### Button Sizing Guidelines

```tsx
// Small buttons for compact spaces
<BrandButton size="sm" variant="ghost-primary">
  Quick Action
</BrandButton>

// Default size for most use cases
<BrandButton variant="primary">
  Standard Action
</BrandButton>

// Large buttons for important actions or mobile
<BrandButton size="lg" variant="primary" className="w-full md:w-auto">
  Mobile-Friendly Action
</BrandButton>

// Icon-only buttons
<BrandButton size="icon" variant="ghost-primary" aria-label="Close">
  <X className="h-4 w-4" />
</BrandButton>
```

### Form Components

#### SmartInput Usage

##### When to Use Progressive Validation
```tsx
// Good: For complex forms where immediate feedback helps
<SmartInput
  label="Password"
  type="password"
  validationRules={[
    commonValidationRules.required(),
    commonValidationRules.strongPassword()
  ]}
  progressiveValidation={true}
  showPasswordToggle
/>

// Good: For fields with complex validation rules
<SmartInput
  label="Username"
  validationRules={[
    commonValidationRules.required(),
    commonValidationRules.minLength(3),
    customUsernameAvailabilityCheck
  ]}
  progressiveValidation={true}
  debounceMs={500}
/>
```

##### When to Avoid Progressive Validation
```tsx
// Simple forms with basic validation
<SmartInput
  label="Full Name"
  validationRules={[commonValidationRules.required()]}
  progressiveValidation={false}
  validateOnBlur={true}
/>
```

##### Mobile Optimization
```tsx
// Email input with appropriate keyboard
<SmartInput
  label="Email Address"
  type="email"
  keyboardType="email"
  validationRules={[commonValidationRules.email()]}
  mobileOptimized
/>

// Phone number input
<SmartInput
  label="Phone Number"
  keyboardType="tel"
  placeholder="(555) 123-4567"
  validationRules={[commonValidationRules.phone()]}
  mobileOptimized
/>

// Numeric input
<SmartInput
  label="Amount"
  keyboardType="numeric"
  validationRules={[commonValidationRules.positiveNumber()]}
  mobileOptimized
/>
```

### Dashboard Components

#### MetricCard Usage

##### Color Selection Guidelines
```tsx
// Revenue and financial metrics - use green
<MetricCard
  title="Total Revenue"
  value="$24,500"
  color="green"
  change={{ value: 12.5, type: 'increase', period: 'this month' }}
/>

// Operational metrics - use orange
<MetricCard
  title="Active Jobs"
  value="156"
  color="orange"
  change={{ value: -3.2, type: 'decrease', period: 'this week' }}
/>

// Performance metrics - use blue
<MetricCard
  title="Efficiency Score"
  value="94%"
  color="blue"
  change={{ value: 2.1, type: 'increase', period: 'this quarter' }}
/>

// User metrics - use purple
<MetricCard
  title="Team Members"
  value="24"
  color="purple"
  change={{ value: 8.3, type: 'increase', period: 'this month' }}
/>
```

##### Layout Patterns
```tsx
// Dashboard grid layout
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  <MetricCard {...revenueMetric} />
  <MetricCard {...jobsMetric} />
  <MetricCard {...efficiencyMetric} />
  <MetricCard {...teamMetric} />
</div>

// Responsive card layout
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {metrics.map((metric) => (
    <MetricCard key={metric.id} {...metric} />
  ))}
</div>
```

#### Status Indicators

##### Status Mapping Guidelines
```tsx
// Log statuses
<StatusIndicator variant="success">Approved</StatusIndicator>
<StatusIndicator variant="warning">Pending Review</StatusIndicator>
<StatusIndicator variant="error">Rejected</StatusIndicator>
<StatusIndicator variant="info">Draft</StatusIndicator>

// Commission statuses
<StatusIndicator variant="success">Matched</StatusIndicator>
<StatusIndicator variant="warning">Pending</StatusIndicator>
<StatusIndicator variant="error">Conflict</StatusIndicator>

// Pay period statuses
<StatusIndicator variant="info">Open</StatusIndicator>
<StatusIndicator variant="warning">Locked</StatusIndicator>
<StatusIndicator variant="success">Closed</StatusIndicator>
```

## 📱 Responsive Design Guidelines

### Mobile-First Approach

#### Button Layouts
```tsx
// Mobile: Full width, Desktop: Auto width
<div className="flex flex-col sm:flex-row gap-3">
  <BrandButton 
    variant="primary" 
    className="w-full sm:w-auto"
  >
    Primary Action
  </BrandButton>
  <BrandButton 
    variant="outline-primary" 
    className="w-full sm:w-auto"
  >
    Secondary Action
  </BrandButton>
</div>

// Mobile: Larger touch targets
<BrandButton 
  variant="primary"
  size="lg"
  className="md:size-default"
>
  Mobile-Friendly
</BrandButton>
```

#### Form Layouts
```tsx
// Responsive form layout
<form className="space-y-4 md:space-y-6">
  <div className="grid gap-4 md:grid-cols-2">
    <SmartInput label="First Name" mobileOptimized />
    <SmartInput label="Last Name" mobileOptimized />
  </div>
  
  <SmartInput 
    label="Email Address" 
    type="email"
    keyboardType="email"
    mobileOptimized 
  />
  
  <div className="flex flex-col sm:flex-row gap-3 pt-4">
    <BrandButton 
      type="submit" 
      variant="primary"
      className="w-full sm:w-auto"
    >
      Submit
    </BrandButton>
    <BrandButton 
      type="button" 
      variant="outline-primary"
      className="w-full sm:w-auto"
    >
      Cancel
    </BrandButton>
  </div>
</form>
```

#### Dashboard Layouts
```tsx
// Responsive metric cards
<div className="grid gap-4 sm:gap-6">
  {/* Single column on mobile, 2 on tablet, 4 on desktop */}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {primaryMetrics.map(metric => (
      <MetricCard key={metric.id} {...metric} />
    ))}
  </div>
  
  {/* Secondary metrics - 1 column on mobile, 3 on desktop */}
  <div className="grid gap-4 md:grid-cols-3">
    {secondaryMetrics.map(metric => (
      <MetricCard key={metric.id} {...metric} />
    ))}
  </div>
</div>
```

## ♿ Accessibility Best Practices

### Keyboard Navigation
```tsx
// Ensure proper tab order
<div className="space-y-4">
  <SmartInput label="Field 1" tabIndex={1} />
  <SmartInput label="Field 2" tabIndex={2} />
  <div className="flex gap-3">
    <BrandButton variant="primary" tabIndex={3}>
      Submit
    </BrandButton>
    <BrandButton variant="outline-primary" tabIndex={4}>
      Cancel
    </BrandButton>
  </div>
</div>

// Skip links for screen readers
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to main content
</a>
```

### ARIA Labels and Descriptions
```tsx
// Descriptive button labels
<BrandButton 
  variant="primary"
  aria-label="Save customer information and return to dashboard"
>
  Save Customer
</BrandButton>

// Form field descriptions
<SmartInput
  label="Password"
  type="password"
  aria-describedby="password-requirements"
  validationRules={[commonValidationRules.strongPassword()]}
/>
<div id="password-requirements" className="text-sm text-muted-foreground">
  Password must be at least 8 characters with uppercase, lowercase, number, and special character
</div>

// Status announcements
<div aria-live="polite" aria-atomic="true">
  {statusMessage && (
    <StatusIndicator variant="success">
      {statusMessage}
    </StatusIndicator>
  )}
</div>
```

## 🎭 Animation and Motion

### Respecting User Preferences
```tsx
// Components that respect reduced motion
<BrandButton 
  variant="primary"
  loading={isLoading}
  respectReducedMotion={true} // Default
>
  Save Changes
</BrandButton>

// Custom animations with fallbacks
<div className={cn(
  'transition-all duration-300 hover:scale-105',
  'motion-reduce:transition-none motion-reduce:transform-none'
)}>
  Hover to scale
</div>
```

### Appropriate Animation Usage
```tsx
// Good: Subtle feedback animations
<BrandButton 
  variant="primary"
  success={isSuccess}
  className="animate-success-celebration"
>
  {isSuccess ? 'Saved!' : 'Save'}
</BrandButton>

// Good: Loading states
<BrandLoading variant="spinner" size="sm" />

// Avoid: Excessive or distracting animations
// Don't use multiple competing animations
// Don't use animations that could trigger seizures
```

## 📊 Performance Guidelines

### Component Optimization
```tsx
// Use React.memo for expensive components
const OptimizedMetricCard = React.memo(MetricCard)

// Lazy load heavy components
const HeavyDashboard = React.lazy(() => import('./HeavyDashboard'))

function App() {
  return (
    <Suspense fallback={<BrandLoading variant="spinner" />}>
      <HeavyDashboard />
    </Suspense>
  )
}
```

### Bundle Size Considerations
```tsx
// Import only what you need
import { BrandButton } from '@/components/brand/brand-button'
import { MetricCard } from '@/components/brand/metric-card'

// Avoid importing entire libraries
// Don't: import * from '@/components/brand'
// Do: import { BrandButton } from '@/components/brand/brand-button'
```

## 🧪 Testing Guidelines

### Component Testing
```tsx
// Test user interactions
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Form Interaction', () => {
  it('should validate email input', async () => {
    render(
      <SmartInput
        label="Email"
        validationRules={[commonValidationRules.email()]}
      />
    )
    
    const input = screen.getByLabelText(/email/i)
    await userEvent.type(input, 'invalid-email')
    fireEvent.blur(input)
    
    expect(screen.getByText(/valid email/i)).toBeInTheDocument()
  })
})
```

### Accessibility Testing
```tsx
// Test keyboard navigation
it('should be keyboard accessible', () => {
  render(<BrandButton variant="primary">Click me</BrandButton>)
  
  const button = screen.getByRole('button')
  button.focus()
  
  expect(button).toHaveFocus()
  
  fireEvent.keyDown(button, { key: 'Enter' })
  // Assert expected behavior
})

// Test screen reader support
it('should have proper ARIA labels', () => {
  render(
    <MetricCard
      title="Revenue"
      value="$1,000"
      aria-label="Revenue is $1,000, increased by 10% this month"
    />
  )
  
  expect(screen.getByLabelText(/revenue is \$1,000/i)).toBeInTheDocument()
})
```

## 🔧 Customization Guidelines

### Theme Customization
```tsx
// Extend theme colors
const customTheme = {
  colors: {
    'hunks-green': {
      // Custom green shades
    },
    'hunks-orange': {
      // Custom orange shades
    }
  }
}

// Custom component variants
const CustomButton = styled(BrandButton)`
  &.variant-custom {
    background-color: ${props => props.theme.colors.custom};
    color: white;
    
    &:hover {
      background-color: ${props => props.theme.colors.customDark};
    }
  }
`
```

### CSS Custom Properties
```css
/* Override theme variables */
:root {
  --brand-primary: #your-green;
  --brand-secondary: #your-orange;
  --component-radius: 8px;
  --component-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Component-specific customization */
.custom-button {
  --button-padding-x: 2rem;
  --button-padding-y: 0.75rem;
  --button-font-weight: 600;
}
```

## 📋 Common Patterns

### Form Patterns
```tsx
// Standard form layout
function StandardForm() {
  return (
    <form className="space-y-6 max-w-md mx-auto">
      <div className="space-y-4">
        <SmartInput
          label="Email Address"
          type="email"
          validationRules={[
            commonValidationRules.required(),
            commonValidationRules.email()
          ]}
          progressiveValidation
        />
        
        <SmartInput
          label="Password"
          type="password"
          showPasswordToggle
          validationRules={[
            commonValidationRules.required(),
            commonValidationRules.strongPassword()
          ]}
          progressiveValidation
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <BrandButton 
          type="submit" 
          variant="primary"
          className="flex-1 sm:flex-none"
        >
          Sign In
        </BrandButton>
        <BrandButton 
          type="button" 
          variant="outline-primary"
          className="flex-1 sm:flex-none"
        >
          Cancel
        </BrandButton>
      </div>
    </form>
  )
}
```

### Dashboard Patterns
```tsx
// Dashboard layout with metrics and actions
function DashboardLayout() {
  return (
    <div className="space-y-8">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <BrandButton variant="outline-primary" size="sm">
            Export Data
          </BrandButton>
          <BrandButton variant="primary" size="sm">
            Create New
          </BrandButton>
        </div>
      </div>
      
      {/* Metrics grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(metric => (
          <MetricCard key={metric.id} {...metric} />
        ))}
      </div>
      
      {/* Content sections */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Main content */}
        </div>
        <div>
          {/* Sidebar content */}
        </div>
      </div>
    </div>
  )
}
```

### Navigation Patterns
```tsx
// Breadcrumb navigation
<nav aria-label="Breadcrumb" className="mb-6">
  <ol className="flex items-center space-x-2 text-sm">
    <li>
      <BrandButton variant="ghost-primary" size="sm">
        Dashboard
      </BrandButton>
    </li>
    <li className="text-muted-foreground">/</li>
    <li>
      <BrandButton variant="ghost-primary" size="sm">
        Logs
      </BrandButton>
    </li>
    <li className="text-muted-foreground">/</li>
    <li className="font-medium">Log #123</li>
  </ol>
</nav>
```

Following these usage guidelines ensures consistent, accessible, and performant user interfaces throughout HUNKCentral while maintaining the College Hunks brand identity.