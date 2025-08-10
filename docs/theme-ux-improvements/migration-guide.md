# Migration Guide

This guide helps you migrate existing HUNKCentral code to use the new theme and UX improvements. Follow these steps to update your components while maintaining functionality and improving user experience.

## 🚀 Quick Migration Checklist

### Phase 1: Button Migration
- [ ] Replace generic `Button` components with `BrandButton`
- [ ] Update button variants to use brand colors
- [ ] Add loading states where appropriate
- [ ] Ensure accessibility attributes are present

### Phase 2: Form Migration
- [ ] Replace `Input` components with `SmartInput`
- [ ] Add validation rules and progressive validation
- [ ] Update mobile keyboard types
- [ ] Implement proper error handling

### Phase 3: Dashboard Migration
- [ ] Replace generic cards with `MetricCard` components
- [ ] Update loading states with `BrandLoading`
- [ ] Implement `StatusIndicator` for consistent status display
- [ ] Add proper empty states

### Phase 4: Navigation Migration
- [ ] Implement `SmartBreadcrumbs` for navigation
- [ ] Update mobile navigation patterns
- [ ] Add role-based navigation filtering

## 🔄 Component Migration

### Button Migration

#### Before (Generic Button)
```tsx
import { Button } from '@/components/ui/button'

// Old implementation
<Button className="bg-green-600 hover:bg-green-700">
  Save Changes
</Button>

<Button variant="outline" className="border-green-600 text-green-600">
  Cancel
</Button>

<Button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

#### After (BrandButton)
```tsx
import { BrandButton } from '@/components/brand/brand-button'

// New implementation
<BrandButton variant="primary">
  Save Changes
</BrandButton>

<BrandButton variant="outline-primary">
  Cancel
</BrandButton>

<BrandButton 
  variant="primary"
  loading={isLoading}
  loadingText="Submitting your request"
>
  Submit
</BrandButton>
```

#### Migration Steps
1. **Import the new component**:
   ```tsx
   // Replace this
   import { Button } from '@/components/ui/button'
   
   // With this
   import { BrandButton } from '@/components/brand/brand-button'
   ```

2. **Update component usage**:
   ```tsx
   // Find and replace patterns
   <Button className="bg-green-600" → <BrandButton variant="primary"
   <Button className="bg-orange-500" → <BrandButton variant="secondary"
   <Button variant="outline" → <BrandButton variant="outline-primary"
   ```

3. **Add loading states**:
   ```tsx
   // Before
   <Button disabled={isLoading}>
     {isLoading ? 'Loading...' : 'Save'}
   </Button>
   
   // After
   <BrandButton 
     loading={isLoading}
     loadingText="Saving your changes"
   >
     Save
   </BrandButton>
   ```

### Input Migration

#### Before (Generic Input)
```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Old implementation
<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input 
    id="email"
    type="email"
    placeholder="Enter your email"
    className={errors.email ? 'border-red-500' : ''}
  />
  {errors.email && (
    <p className="text-red-500 text-sm">{errors.email}</p>
  )}
</div>
```

#### After (SmartInput)
```tsx
import { SmartInput, commonValidationRules } from '@/components/forms/smart-input'

// New implementation
<SmartInput
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  validationRules={[
    commonValidationRules.required(),
    commonValidationRules.email()
  ]}
  progressiveValidation
  error={errors.email}
/>
```

#### Migration Steps
1. **Replace Input + Label combinations**:
   ```tsx
   // Before
   <div className="space-y-2">
     <Label htmlFor="field">Field Label</Label>
     <Input id="field" />
   </div>
   
   // After
   <SmartInput label="Field Label" />
   ```

2. **Add validation rules**:
   ```tsx
   // Before: Manual validation
   const [email, setEmail] = useState('')
   const [emailError, setEmailError] = useState('')
   
   const validateEmail = (value: string) => {
     if (!value) {
       setEmailError('Email is required')
     } else if (!/\S+@\S+\.\S+/.test(value)) {
       setEmailError('Please enter a valid email')
     } else {
       setEmailError('')
     }
   }
   
   // After: Built-in validation
   <SmartInput
     label="Email"
     validationRules={[
       commonValidationRules.required(),
       commonValidationRules.email()
     ]}
     onValidationChange={(isValid, errors) => {
       // Handle validation state
     }}
   />
   ```

3. **Update mobile optimization**:
   ```tsx
   // Add mobile-specific props
   <SmartInput
     label="Phone Number"
     keyboardType="tel"
     mobileOptimized
   />
   
   <SmartInput
     label="Email"
     keyboardType="email"
     mobileOptimized
   />
   ```

### Card Migration

#### Before (Generic Card)
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// Old implementation
<Card>
  <CardHeader>
    <CardTitle>Revenue</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">$12,450</div>
    <p className="text-green-600">+12.5% from last month</p>
  </CardContent>
</Card>
```

#### After (MetricCard)
```tsx
import { MetricCard } from '@/components/brand/metric-card'
import { DollarSign } from 'lucide-react'

// New implementation
<MetricCard
  title="Revenue"
  value="$12,450"
  change={{ value: 12.5, type: 'increase', period: 'last month' }}
  color="green"
  icon={DollarSign}
/>
```

#### Migration Steps
1. **Identify metric cards**:
   ```tsx
   // Look for cards that display:
   // - Numeric values
   // - Percentage changes
   // - Status indicators
   // - Dashboard metrics
   ```

2. **Extract data structure**:
   ```tsx
   // Before: Inline content
   <Card>
     <CardContent>
       <div className="text-2xl">156</div>
       <p>Active Jobs</p>
       <span className="text-green-600">+8 this week</span>
     </CardContent>
   </Card>
   
   // After: Structured props
   <MetricCard
     title="Active Jobs"
     value={156}
     change={{ value: 8, type: 'increase', period: 'this week' }}
     color="orange"
   />
   ```

3. **Add loading states**:
   ```tsx
   <MetricCard
     title="Revenue"
     value={isLoading ? undefined : revenue}
     loading={isLoading}
     color="green"
   />
   ```

### Loading State Migration

#### Before (Generic Loading)
```tsx
// Old implementations
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>

<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

#### After (BrandLoading)
```tsx
import { BrandLoading } from '@/components/brand/brand-loading'

// New implementations
<BrandLoading variant="spinner" size="md" />

<BrandButton 
  variant="primary"
  loading={isLoading}
  loadingText="Processing your request"
>
  Submit
</BrandButton>
```

## 📱 Mobile Migration

### Touch Target Updates
```tsx
// Before: Small touch targets
<Button size="sm" className="h-8 px-2">
  Action
</Button>

// After: Mobile-friendly sizing
<BrandButton 
  size="sm"
  className="min-h-[44px] md:h-8"
>
  Action
</BrandButton>
```

### Keyboard Type Updates
```tsx
// Before: Generic input types
<Input type="email" />
<Input type="tel" />
<Input type="number" />

// After: Mobile-optimized keyboards
<SmartInput 
  label="Email"
  type="email"
  keyboardType="email"
  mobileOptimized
/>

<SmartInput 
  label="Phone"
  type="tel"
  keyboardType="tel"
  mobileOptimized
/>

<SmartInput 
  label="Amount"
  type="number"
  keyboardType="numeric"
  mobileOptimized
/>
```

## 🎨 Styling Migration

### Color Class Updates
```tsx
// Before: Custom green/orange classes
className="bg-green-600 hover:bg-green-700"
className="text-green-600 border-green-600"
className="bg-orange-500 hover:bg-orange-600"

// After: Brand color classes
className="bg-hunks-green hover:bg-hunks-green-700"
className="text-hunks-green border-hunks-green"
className="bg-hunks-orange hover:bg-hunks-orange-600"
```

### CSS Custom Property Updates
```css
/* Before: Hardcoded colors */
.custom-component {
  background-color: #10b981; /* Generic green */
  border-color: #f59e0b;     /* Generic orange */
}

/* After: Brand variables */
.custom-component {
  background-color: var(--brand-primary);
  border-color: var(--brand-secondary);
}
```

## ♿ Accessibility Migration

### ARIA Label Updates
```tsx
// Before: Missing accessibility
<Button onClick={handleDelete}>
  <Trash2 className="h-4 w-4" />
</Button>

// After: Proper accessibility
<BrandButton 
  variant="destructive"
  onClick={handleDelete}
  aria-label="Delete item"
>
  <Trash2 className="h-4 w-4" />
</BrandButton>
```

### Form Accessibility
```tsx
// Before: Manual ARIA setup
<div>
  <Label htmlFor="password">Password</Label>
  <Input 
    id="password"
    type="password"
    aria-describedby="password-error"
    aria-invalid={!!errors.password}
  />
  <div id="password-error" role="alert">
    {errors.password}
  </div>
</div>

// After: Built-in accessibility
<SmartInput
  label="Password"
  type="password"
  error={errors.password}
  validationRules={[commonValidationRules.strongPassword()]}
  showPasswordToggle
/>
```

## 🧪 Testing Migration

### Update Test Selectors
```tsx
// Before: Generic selectors
const button = screen.getByRole('button', { name: /save/i })
const input = screen.getByLabelText(/email/i)

// After: Component-specific testing
import { render, screen } from '@testing-library/react'
import { BrandButton } from '@/components/brand/brand-button'

// Test brand button variants
const primaryButton = screen.getByRole('button', { name: /save/i })
expect(primaryButton).toHaveClass('bg-hunks-green')

// Test smart input validation
const emailInput = screen.getByLabelText(/email/i)
await userEvent.type(emailInput, 'invalid-email')
fireEvent.blur(emailInput)
expect(screen.getByText(/valid email/i)).toBeInTheDocument()
```

### Update Accessibility Tests
```tsx
// Before: Manual accessibility checks
it('should have proper ARIA attributes', () => {
  render(<Button aria-label="Close dialog">×</Button>)
  expect(screen.getByLabelText(/close dialog/i)).toBeInTheDocument()
})

// After: Component accessibility testing
it('should meet accessibility standards', async () => {
  const { container } = render(
    <BrandButton variant="primary" aria-label="Save changes">
      Save
    </BrandButton>
  )
  
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## 📊 Performance Migration

### Bundle Size Optimization
```tsx
// Before: Large imports
import * as Icons from 'lucide-react'
import { Button, Input, Card, Badge } from '@/components/ui'

// After: Specific imports
import { Save, Edit, Trash2 } from 'lucide-react'
import { BrandButton } from '@/components/brand/brand-button'
import { SmartInput } from '@/components/forms/smart-input'
import { MetricCard } from '@/components/brand/metric-card'
```

### Component Memoization
```tsx
// Before: No optimization
function Dashboard({ metrics }) {
  return (
    <div>
      {metrics.map(metric => (
        <Card key={metric.id}>
          {/* Card content */}
        </Card>
      ))}
    </div>
  )
}

// After: Optimized rendering
const Dashboard = React.memo(function Dashboard({ metrics }) {
  return (
    <div>
      {metrics.map(metric => (
        <MetricCard 
          key={metric.id}
          {...metric}
        />
      ))}
    </div>
  )
})
```

## 🔧 Configuration Migration

### Tailwind Config Updates
```js
// Before: Custom color definitions
module.exports = {
  theme: {
    extend: {
      colors: {
        'custom-green': '#10b981',
        'custom-orange': '#f59e0b'
      }
    }
  }
}

// After: Brand color integration
module.exports = {
  theme: {
    extend: {
      colors: {
        'hunks-green': {
          DEFAULT: '#026937',
          50: '#f0f9f4',
          // ... full color scale
        },
        'hunks-orange': {
          DEFAULT: '#ea7200',
          50: '#fef7ed',
          // ... full color scale
        }
      }
    }
  }
}
```

### CSS Variable Updates
```css
/* Before: Custom variables */
:root {
  --primary-color: #10b981;
  --secondary-color: #f59e0b;
}

/* After: Brand variables */
:root {
  --brand-primary: #026937;
  --brand-secondary: #ea7200;
  --brand-success: var(--brand-primary);
  --brand-warning: var(--brand-secondary);
}
```

## 📋 Migration Automation

### Find and Replace Patterns
```bash
# Button migrations
find . -name "*.tsx" -exec sed -i 's/<Button className="bg-green-600"/<BrandButton variant="primary"/g' {} \;
find . -name "*.tsx" -exec sed -i 's/<Button variant="outline"/<BrandButton variant="outline-primary"/g' {} \;

# Color class migrations
find . -name "*.tsx" -exec sed -i 's/bg-green-600/bg-hunks-green/g' {} \;
find . -name "*.tsx" -exec sed -i 's/text-green-600/text-hunks-green/g' {} \;
find . -name "*.tsx" -exec sed -i 's/bg-orange-500/bg-hunks-orange/g' {} \;
```

### Migration Script
```tsx
// migration-helper.ts
export function migrateButtonProps(oldProps: any) {
  const newProps: any = { ...oldProps }
  
  // Migrate className to variant
  if (oldProps.className?.includes('bg-green-600')) {
    newProps.variant = 'primary'
    newProps.className = oldProps.className.replace('bg-green-600', '')
  }
  
  if (oldProps.className?.includes('bg-orange-500')) {
    newProps.variant = 'secondary'
    newProps.className = oldProps.className.replace('bg-orange-500', '')
  }
  
  // Migrate loading state
  if (oldProps.disabled && oldProps.children?.includes('Loading')) {
    newProps.loading = true
    newProps.loadingText = 'Processing request'
  }
  
  return newProps
}
```

## ✅ Migration Validation

### Checklist for Each Component
```tsx
// Validation checklist
const MigrationChecklist = {
  buttons: [
    '✅ Uses BrandButton component',
    '✅ Has appropriate variant (primary/secondary/outline/ghost)',
    '✅ Includes loading states where needed',
    '✅ Has proper ARIA labels',
    '✅ Meets touch target requirements (44px minimum)'
  ],
  
  inputs: [
    '✅ Uses SmartInput component',
    '✅ Has validation rules defined',
    '✅ Uses progressive validation appropriately',
    '✅ Has mobile keyboard types set',
    '✅ Includes proper error handling'
  ],
  
  cards: [
    '✅ Uses MetricCard for dashboard metrics',
    '✅ Has appropriate color coding',
    '✅ Includes loading states',
    '✅ Shows trend indicators where relevant',
    '✅ Has proper accessibility labels'
  ]
}
```

### Testing Migration Success
```tsx
// Test that migration is complete
describe('Migration Validation', () => {
  it('should use brand components', () => {
    // Ensure no old Button components remain
    const { container } = render(<YourComponent />)
    expect(container.querySelector('.bg-green-600')).toBeNull()
    expect(container.querySelector('[class*="bg-hunks-green"]')).toBeInTheDocument()
  })
  
  it('should have proper accessibility', async () => {
    const { container } = render(<YourComponent />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

## 🚨 Common Migration Issues

### Issue 1: Missing Loading States
```tsx
// Problem: Button doesn't show loading state
<BrandButton variant="primary" disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Save'}
</BrandButton>

// Solution: Use built-in loading prop
<BrandButton 
  variant="primary"
  loading={isLoading}
  loadingText="Saving your changes"
>
  Save
</BrandButton>
```

### Issue 2: Incorrect Color Usage
```tsx
// Problem: Using wrong brand colors
<BrandButton className="bg-green-500">Save</BrandButton>

// Solution: Use proper variant
<BrandButton variant="primary">Save</BrandButton>
```

### Issue 3: Missing Mobile Optimization
```tsx
// Problem: Small touch targets on mobile
<BrandButton size="sm">Action</BrandButton>

// Solution: Responsive sizing
<BrandButton 
  size="sm"
  className="min-h-[44px] md:h-auto"
>
  Action
</BrandButton>
```

This migration guide ensures a smooth transition to the enhanced theme system while maintaining functionality and improving user experience across HUNKCentral.