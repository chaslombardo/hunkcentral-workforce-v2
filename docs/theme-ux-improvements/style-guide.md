# HUNKCentral Style Guide

This style guide defines the visual design system for HUNKCentral, including brand colors, typography, spacing, and component styling guidelines.

## 🎨 Brand Colors

### Primary Brand Colors

#### College Hunks Green
- **Primary**: `#026937` (hunks-green-600)
- **Usage**: Primary buttons, success states, brand accents
- **Accessibility**: WCAG AA compliant with white text

```css
/* CSS Custom Properties */
--hunks-green: #026937;
--brand-primary: var(--hunks-green);

/* Tailwind Classes */
.bg-hunks-green
.text-hunks-green
.border-hunks-green
```

#### College Hunks Orange
- **Secondary**: `#ea7200` (hunks-orange-500)
- **Usage**: Secondary buttons, warning states, accent elements
- **Accessibility**: WCAG AA compliant with white text

```css
/* CSS Custom Properties */
--hunks-orange: #ea7200;
--brand-secondary: var(--hunks-orange);

/* Tailwind Classes */
.bg-hunks-orange
.text-hunks-orange
.border-hunks-orange
```

### Color Palette

#### Green Shades
```css
hunks-green-50:  #f0f9f4  /* Very light backgrounds */
hunks-green-100: #dcf2e4  /* Light backgrounds */
hunks-green-200: #bce5cd  /* Subtle accents */
hunks-green-300: #8dd1a8  /* Disabled states */
hunks-green-400: #57b67c  /* Hover states */
hunks-green-500: #339b5a  /* Active states */
hunks-green-600: #026937  /* Primary brand */
hunks-green-700: #1e5a32  /* Pressed states */
hunks-green-800: #1a4a2a  /* Dark themes */
hunks-green-900: #163d24  /* Very dark */
hunks-green-950: #0b2214  /* Darkest */
```

#### Orange Shades
```css
hunks-orange-50:  #fef7ed  /* Very light backgrounds */
hunks-orange-100: #fdecd4  /* Light backgrounds */
hunks-orange-200: #fbd5a8  /* Subtle accents */
hunks-orange-300: #f8b871  /* Disabled states */
hunks-orange-400: #f59338  /* Hover states */
hunks-orange-500: #ea7200  /* Secondary brand */
hunks-orange-600: #dc5f02  /* Pressed states */
hunks-orange-700: #b64906  /* Dark themes */
hunks-orange-800: #92390c  /* Very dark */
hunks-orange-900: #78300d  /* Darker */
hunks-orange-950: #411703  /* Darkest */
```

### Semantic Color Mapping

```css
/* Success States */
--brand-success: var(--hunks-green);
--brand-success-light: #339b5a;
--brand-success-dark: #1e5a32;

/* Warning States */
--brand-warning: var(--hunks-orange);
--brand-warning-light: #f59338;
--brand-warning-dark: #dc5f02;

/* Error States */
--brand-error: #dc2626;
--brand-error-light: #ef4444;
--brand-error-dark: #b91c1c;

/* Info States */
--brand-info: #3b82f6;
--brand-info-light: #60a5fa;
--brand-info-dark: #2563eb;
```

## 🔤 Typography

### Font Stack
```css
font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
```

### Type Scale
```css
/* Headings */
.text-4xl  /* 36px - Page titles */
.text-3xl  /* 30px - Section headers */
.text-2xl  /* 24px - Card titles */
.text-xl   /* 20px - Subsection headers */
.text-lg   /* 18px - Large body text */

/* Body Text */
.text-base /* 16px - Default body text */
.text-sm   /* 14px - Secondary text */
.text-xs   /* 12px - Captions, labels */
```

### Font Weights
```css
.font-light    /* 300 - Light text */
.font-normal   /* 400 - Body text */
.font-medium   /* 500 - Emphasized text */
.font-semibold /* 600 - Headings */
.font-bold     /* 700 - Strong emphasis */
```

## 📏 Spacing & Layout

### Spacing Scale
```css
/* Tailwind spacing scale */
.p-1   /* 4px */
.p-2   /* 8px */
.p-3   /* 12px */
.p-4   /* 16px */
.p-6   /* 24px */
.p-8   /* 32px */
.p-12  /* 48px */
.p-16  /* 64px */
```

### Component Spacing Guidelines

#### Buttons
- **Padding**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Small**: `px-3 py-1.5` (12px horizontal, 6px vertical)
- **Large**: `px-6 py-3` (24px horizontal, 12px vertical)
- **Icon**: `p-2` (8px all sides)

#### Cards
- **Padding**: `p-6` (24px all sides)
- **Header**: `pb-4` (16px bottom)
- **Content**: `py-4` (16px vertical)
- **Footer**: `pt-4` (16px top)

#### Forms
- **Field spacing**: `space-y-4` (16px between fields)
- **Label margin**: `mb-2` (8px bottom)
- **Input padding**: `px-3 py-2` (12px horizontal, 8px vertical)

## 🎯 Component Styling

### Buttons

#### Primary Button
```tsx
<BrandButton variant="primary">
  Primary Action
</BrandButton>
```
- **Background**: `bg-hunks-green`
- **Text**: `text-white`
- **Hover**: `hover:bg-hunks-green-700`
- **Focus**: `focus-visible:ring-hunks-green/20`

#### Secondary Button
```tsx
<BrandButton variant="secondary">
  Secondary Action
</BrandButton>
```
- **Background**: `bg-hunks-orange`
- **Text**: `text-white`
- **Hover**: `hover:bg-hunks-orange-600`
- **Focus**: `focus-visible:ring-hunks-orange/20`

#### Outline Button
```tsx
<BrandButton variant="outline-primary">
  Outline Action
</BrandButton>
```
- **Border**: `border-2 border-hunks-green`
- **Text**: `text-hunks-green`
- **Hover**: `hover:bg-hunks-green hover:text-white`

### Cards

#### Primary Card
```tsx
<Card className="border-l-4 border-l-hunks-green">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
</Card>
```
- **Border accent**: `border-l-4 border-l-hunks-green`
- **Background**: `bg-card`
- **Shadow**: `shadow-xs`

#### Metric Card
```tsx
<MetricCard
  title="Revenue"
  value="$12,450"
  color="green"
  change={{ value: 12.5, type: 'increase', period: 'this month' }}
/>
```
- **Border accent**: Based on color prop
- **Gradient**: `from-primary/5 to-card bg-gradient-to-t`
- **Typography**: Tabular numbers for values

### Status Indicators

#### Success Status
```tsx
<StatusIndicator variant="success">
  Completed
</StatusIndicator>
```
- **Background**: `bg-hunks-green/10`
- **Text**: `text-hunks-green`
- **Border**: `border-hunks-green/20`

#### Warning Status
```tsx
<StatusIndicator variant="warning">
  Pending
</StatusIndicator>
```
- **Background**: `bg-hunks-orange/10`
- **Text**: `text-hunks-orange`
- **Border**: `border-hunks-orange/20`

## 🎭 Visual Effects

### Shadows
```css
/* Card shadows */
.shadow-xs    /* Subtle card elevation */
.shadow-sm    /* Small elevation */
.shadow-md    /* Medium elevation */
.shadow-lg    /* Large elevation */

/* Focus shadows */
.ring-2 .ring-hunks-green/20    /* Primary focus */
.ring-2 .ring-hunks-orange/20   /* Secondary focus */
```

### Border Radius
```css
.rounded-sm   /* 2px - Small elements */
.rounded-md   /* 6px - Default components */
.rounded-lg   /* 8px - Cards, modals */
.rounded-xl   /* 12px - Large containers */
```

### Animations
```css
/* Micro-interactions */
.transition-all .duration-200    /* Default transitions */
.hover:scale-105                 /* Subtle hover scale */
.animate-gentle-bounce          /* Success celebrations */
.animate-subtle-pulse           /* Loading states */
```

## 📱 Responsive Design

### Breakpoints
```css
sm:   /* 640px and up */
md:   /* 768px and up */
lg:   /* 1024px and up */
xl:   /* 1280px and up */
2xl:  /* 1536px and up */
```

### Mobile-First Guidelines
- **Touch targets**: Minimum 44px (iOS) / 48px (Android)
- **Font size**: Minimum 16px for inputs (prevents zoom on iOS)
- **Spacing**: Increase padding on mobile for easier interaction
- **Navigation**: Use bottom navigation or slide-out menus

### Container Queries
```css
@container/card (min-width: 250px) {
  .text-2xl { font-size: 1.875rem; }
}
```

## ♿ Accessibility Guidelines

### Color Contrast
- **Normal text**: 4.5:1 minimum ratio
- **Large text**: 3:1 minimum ratio
- **Brand colors**: Pre-tested for WCAG AA compliance

### Focus States
```css
/* Visible focus indicators */
.focus-visible:outline-none
.focus-visible:ring-2
.focus-visible:ring-ring
.focus-visible:ring-offset-2
```

### Screen Reader Support
```tsx
// Proper labeling
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// Status announcements
<div aria-live="polite" aria-atomic="true">
  Form saved successfully
</div>
```

## 🎨 Usage Examples

### Dashboard Layout
```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  <MetricCard
    title="Total Revenue"
    value="$24,500"
    change={{ value: 12.5, type: 'increase', period: 'this month' }}
    color="green"
    icon={DollarSign}
  />
  <MetricCard
    title="Active Jobs"
    value="156"
    change={{ value: -3.2, type: 'decrease', period: 'this week' }}
    color="orange"
    icon={Briefcase}
  />
</div>
```

### Form Layout
```tsx
<form className="space-y-6">
  <SmartInput
    label="Customer Name"
    validationRules={[commonValidationRules.required()]}
    progressiveValidation
  />
  <SmartInput
    label="Email Address"
    type="email"
    validationRules={[
      commonValidationRules.required(),
      commonValidationRules.email()
    ]}
    progressiveValidation
  />
  <div className="flex gap-3">
    <BrandButton variant="primary" type="submit">
      Save Customer
    </BrandButton>
    <BrandButton variant="outline-primary" type="button">
      Cancel
    </BrandButton>
  </div>
</form>
```

### Navigation Layout
```tsx
<nav className="flex items-center space-x-4">
  <BrandButton variant="ghost-primary" size="sm">
    Dashboard
  </BrandButton>
  <BrandButton variant="ghost-primary" size="sm">
    Logs
  </BrandButton>
  <BrandButton variant="primary" size="sm">
    Create Log
  </BrandButton>
</nav>
```

## 🔧 Customization

### CSS Custom Properties
```css
:root {
  /* Brand colors */
  --brand-primary: #026937;
  --brand-secondary: #ea7200;
  
  /* Semantic colors */
  --brand-success: var(--brand-primary);
  --brand-warning: var(--brand-secondary);
  --brand-error: #dc2626;
  --brand-info: #3b82f6;
  
  /* Component-specific */
  --button-radius: 6px;
  --card-radius: 8px;
  --input-radius: 6px;
}
```

### Tailwind Configuration
```js
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'hunks-green': {
        DEFAULT: '#026937',
        // ... shade variations
      },
      'hunks-orange': {
        DEFAULT: '#ea7200',
        // ... shade variations
      }
    }
  }
}
```

This style guide ensures consistent visual design across all HUNKCentral interfaces while maintaining the College Hunks brand identity and accessibility standards.