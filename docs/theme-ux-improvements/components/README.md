# Component Library Documentation

This directory contains detailed documentation for all enhanced components in the HUNKCentral theme system.

## 📁 Component Categories

### 🎨 Brand Components
- **[BrandButton](./brand-button.md)** - Enhanced buttons with College Hunks brand variants
- **[BrandLoading](./brand-loading.md)** - Branded loading states and animations
- **[MetricCard](./metric-card.md)** - Dashboard cards with trend indicators
- **[StatusIndicator](./status-indicator.md)** - Consistent status communication

### 📝 Form Components
- **[SmartInput](./smart-input.md)** - Progressive validation with real-time feedback
- **[FormFeedback](./form-feedback.md)** - Enhanced form validation and success states
- **[MobileForm](./mobile-form.md)** - Mobile-optimized form layouts

### 🧭 Navigation Components
- **[SmartBreadcrumbs](./smart-breadcrumbs.md)** - Dynamic navigation with context awareness
- **[NavigationContext](./navigation-context.md)** - Navigation state management

### 🎭 Feature Components
- **[EmptyStates](./empty-states.md)** - Engaging empty state illustrations and messaging

## 📋 Component Standards

### Documentation Structure
Each component documentation includes:
- **Overview** - Purpose and key features
- **API Reference** - Props, types, and interfaces
- **Usage Examples** - Common use cases with code
- **Accessibility** - WCAG compliance and screen reader support
- **Styling** - Customization options and CSS classes
- **Best Practices** - When and how to use the component

### Code Examples
All examples include:
- TypeScript interfaces
- Accessibility attributes
- Error handling
- Mobile considerations
- Performance optimizations

### Testing Coverage
Each component includes:
- Unit tests with React Testing Library
- Accessibility tests
- Visual regression tests
- Performance benchmarks

## 🚀 Quick Reference

### Import Patterns
```tsx
// Brand components
import { BrandButton } from '@/components/brand/brand-button'
import { MetricCard } from '@/components/brand/metric-card'
import { StatusIndicator } from '@/components/brand/status-indicator'
import { BrandLoading } from '@/components/brand/brand-loading'

// Form components
import { SmartInput } from '@/components/forms/smart-input'
import { FormFeedback } from '@/components/forms/form-feedback'
import { MobileForm } from '@/components/forms/mobile-form'

// Feature components
import { EmptyStates } from '@/components/features/empty-states'
```

### Common Props
Most components share these common props:
```tsx
interface CommonProps {
  className?: string
  'aria-label'?: string
  'aria-describedby'?: string
  loading?: boolean
  disabled?: boolean
}
```

### Brand Color Props
Components that support brand colors use this pattern:
```tsx
interface BrandColorProps {
  color?: 'green' | 'orange' | 'blue' | 'purple' | 'neutral'
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
}
```

## 🎨 Styling Guidelines

### CSS Classes
All components use consistent CSS class patterns:
```css
/* Component base classes */
.brand-button { /* Base button styles */ }
.metric-card { /* Base card styles */ }
.smart-input { /* Base input styles */ }

/* State classes */
.is-loading { /* Loading state */ }
.is-error { /* Error state */ }
.is-success { /* Success state */ }

/* Variant classes */
.variant-primary { /* Primary variant */ }
.variant-secondary { /* Secondary variant */ }
```

### Custom Properties
Components expose CSS custom properties for theming:
```css
.brand-button {
  --button-bg: var(--brand-primary);
  --button-text: var(--brand-primary-foreground);
  --button-hover: var(--brand-primary-dark);
}
```

## ♿ Accessibility Standards

### WCAG Compliance
All components meet WCAG 2.1 AA standards:
- **Color contrast**: 4.5:1 minimum for normal text
- **Focus indicators**: Visible and high contrast
- **Keyboard navigation**: Full keyboard support
- **Screen readers**: Proper ARIA labels and descriptions

### Testing Tools
Components are tested with:
- **axe-core** - Automated accessibility testing
- **NVDA/JAWS** - Screen reader testing
- **Keyboard navigation** - Tab order and shortcuts
- **Color contrast** - Automated contrast checking

## 📱 Mobile Optimization

### Touch Targets
All interactive elements meet mobile standards:
- **Minimum size**: 44px × 44px (iOS) / 48px × 48px (Android)
- **Spacing**: 8px minimum between touch targets
- **Feedback**: Visual and haptic feedback where appropriate

### Responsive Behavior
Components adapt to different screen sizes:
- **Breakpoints**: Mobile-first responsive design
- **Typography**: Scalable text sizes
- **Spacing**: Adjusted padding and margins
- **Layout**: Flexible grid and flexbox layouts

## 🔧 Customization

### Theme Variables
Override theme variables to customize appearance:
```css
:root {
  --brand-primary: #your-color;
  --brand-secondary: #your-color;
  --component-radius: 8px;
  --component-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### Component Variants
Create custom variants by extending base components:
```tsx
const CustomButton = styled(BrandButton)`
  /* Custom styles */
`

// Or with className
<BrandButton className="custom-variant">
  Custom Button
</BrandButton>
```

## 📊 Performance

### Bundle Size
Component bundle sizes (gzipped):
- **BrandButton**: ~2KB
- **MetricCard**: ~3KB
- **SmartInput**: ~4KB
- **Total library**: ~25KB

### Runtime Performance
- **Render time**: < 16ms per component
- **Memory usage**: < 1MB for full library
- **Tree shaking**: Unused components excluded from bundle

## 🧪 Testing

### Test Coverage
- **Unit tests**: 95%+ coverage
- **Integration tests**: Key user flows
- **Visual regression**: Automated screenshot comparison
- **Accessibility**: Automated and manual testing

### Running Tests
```bash
# Unit tests
npm run test:components

# Visual regression
npm run test:visual

# Accessibility
npm run test:a11y

# All tests
npm run test
```

## 📈 Analytics

### Usage Tracking
Components include optional analytics:
```tsx
<BrandButton
  variant="primary"
  analytics={{
    event: 'button_click',
    category: 'navigation',
    label: 'save_form'
  }}
>
  Save
</BrandButton>
```

### Performance Monitoring
Built-in performance monitoring:
- **Render times**: Component render duration
- **Bundle analysis**: Size impact tracking
- **Error boundaries**: Graceful error handling

This component library provides a comprehensive foundation for building consistent, accessible, and performant user interfaces in HUNKCentral.