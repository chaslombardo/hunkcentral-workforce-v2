# UI Component Architecture

**_IMPORTANT_** (use shadcn/ui blocks (list_blocks and get_block) instead of single components where possible)

This document outlines the comprehensive UI component architecture for HUNKCentral, built with Shadcn/UI components using the New York theme and College Hunks brand colors.

## 🎨 Design Philosophy

**Visual Identity:**

- College Hunks Green (#026937) as primary brand color
- College Hunks Orange (#ea7200) as secondary accent
- New York theme for sophisticated, professional aesthetic
- Flowing, seamless transitions between all interactions
- Eye-catching visual elements that create memorable experiences

## 🏗️ Global Layout Components (use shadcn/ui blocks (list_blocks and get_block) instead of single components where possible)

### Navigation System

- **NavigationMenu**: Top-level navigation with dropdown menus for different user roles
- **Breadcrumb**: Context navigation showing current location in app hierarchy
- **Sheet**: Mobile slide-out navigation panel
- **Avatar** + **DropdownMenu**: User profile menu with settings and logout

### Layout Structure

- **Desktop**: **Collapsible** sidebar with **NavigationMenu** in header
- **Mobile**: **Sheet** for slide-out navigation, **Drawer** for bottom-up interactions
- **Responsive**: **NavigationMenu** adapts to screen size seamlessly

## 📝 Log Management Components (use shadcn/ui blocks (list_blocks and get_block) instead of single components where possible)

### Core Log Form Structure

- **LogForm**: Multi-section form using **Tabs** for log sections (Junk, Move, Other Hours) with **Card** containers and **Separator** elements
- **CaptainSelector**: **Select** component with searchable dropdown for captain selection, defaults to current user
- **LogSectionSelector**: **Checkbox** group for dynamic section visibility selection

### Dynamic Job Management

- **JobSection**: **Card** layout container for multiple job entries with **Collapsible** optional fields
- **JobTile**: **Card** with **CardHeader** and **CardContent**, includes **Button** with "Add Another Job" functionality
- **TeamHoursSection**: **Accordion** for employee hour entries with **Button** "Add HUNK" functionality
- **HunkEntry**: **Card** component with **Select** for employee/department and **Input** for hours, **Checkbox** for co-captain

### Real-Time Calculations

- **SectionSummary**: **Card** with **Progress** bars for labor cost percentages, **Badge** for tips per HUNK, **HoverCard** for calculation explanations
- **LogTotals**: **Card** with comprehensive statistics, **Table** for employee summary, **Badge** clusters for status

### Review Interface

- **LogReviewQueue**: **Table** with sortable columns, **Badge** for status, **Button** for bulk actions, **Input** for search
- **LogDetail**: **Resizable** panels for side-by-side comparison, **Tabs** for sections, **Popover** for inline editing

## 💰 Commission Components

### Entry and Tracking

- **CommissionForm**: **Card** with clean form layout, **Select** for sales consultant, **Input** with validation, **Calendar** for dates
- **SalesConsultantSelector**: **Select** component with searchable dropdown, defaults to current user with sales role
- **CommissionList**: **Table** with status columns, **Badge** for commission status, **Progress** for booking accuracy, **HoverCard** for details
- **CommissionMatcher**: Service with **Toast** notifications for successful matches and **Alert** for conflicts

## 📊 Report Components

### Payroll and Analytics

- **PayrollReport**: **Tabs** for report types, **Table** with advanced sorting/filtering, **Card** summaries, **Chart** for analytics, **Progress** for generation
- **IndividualReport**: **Accordion** for expandable sections, **Card** for compensation breakdown, **Progress** for performance metrics, **Separator** for pay components
- **ReportExport**: **Button** with **Dialog** for export options, **Progress** indicator, **Toast** for completion feedback

## ⚙️ Admin Components

### User and System Management

- **UserForm**: **Dialog** for user creation/editing, **Tabs** for information sections, **Input** for compensation fields, **Checkbox** group for roles
- **PayPeriodManager**: **Card** grid for period overview, **Calendar** for dates, **Badge** for status, **AlertDialog** for confirmations

## 🔐 Authentication Components

### Login and Security

- **LoginForm**: **Card** with **CardHeader**, **CardContent**, **CardFooter** layout, **Input** components with validation, **Button** with loading states
- **ProtectedRoute**: HOC for role-based access control with **Alert** for unauthorized access
- **RoleGuard**: Component for conditional rendering based on multiple roles
- **UserProfile**: **Tabs** for different profile sections, **Card** layout for settings, **Avatar** with **DropdownMenu**
- **LogoutButton**: **Button** with confirmation **AlertDialog** and session cleanup

## 🎭 Advanced UX Features

### Motion & Feedback

- **HoverCard**: Contextual information reveals with smooth animations
- **Popover**: Quick actions and details with polished interactions
- **Toast**: Notifications for all user actions with brand styling
- **Sheet**/**Drawer**: Mobile-optimized interactions with fluid transitions

### Visual Polish

- **Progress**: Components with smooth animations and brand colors
- **AspectRatio**: Consistent sizing for images and charts
- **Separator**: Visual hierarchy with subtle brand color accents
- **Badge**: Custom brand styling with gradient effects

### Smart Interactions

- **ContextMenu**: Right-click actions for power users
- **Collapsible**: Space management with fluid transitions
- **ToggleGroup**/**RadioGroup**: Option selection with clear states
- **Slider**: Numeric range inputs with brand styling

### Rich Context

- **AlertDialog**: Critical confirmations with clear actions
- **Accordion**: Organized information display with smooth expansion
- **Tooltip**: Helpful hints and explanations with proper positioning

## 🚀 Implementation Phases

### Phase 1: Core Layout (Foundation)

1. **NavigationMenu** with role-based structure
2. **Card** layouts for main content areas
3. **Button** components with brand styling
4. **Input**/**Select** form foundations

### Phase 2: Dynamic Features (Interaction)

1. **Tabs** for log sections
2. **Collapsible**/**Accordion** for space management
3. **Progress**/**Badge** for real-time feedback
4. **HoverCard**/**Tooltip** for enhanced UX

### Phase 3: Advanced Interactions (Power Features)

1. **Table** with sorting and filtering
2. **Dialog**/**AlertDialog** for confirmations
3. **Sheet**/**Drawer** for mobile optimization
4. **Chart** components for visual analytics

### Phase 4: Polish & Performance (Excellence)

1. **Toast** notifications system
2. **Skeleton** loading states
3. **ContextMenu** for advanced users
4. **Resizable** panels for customization

## 🎨 Brand Integration Strategy

### Color Application

- Primary buttons use College Hunks Green (#026937)
- Secondary actions use College Hunks Orange (#ea7200)
- **Badge** components reflect brand colors for status
- **Progress** bars use brand colors for visual consistency

### Theme Enhancements

- Clean typography with proper hierarchy
- Subtle shadows and rounded corners
- Consistent spacing using Tailwind scale
- Professional color palette with brand accents

### Responsive Behavior

- **Sheet** replaces sidebar on mobile
- **NavigationMenu** adapts to screen size
- **Table** becomes scrollable on small screens
- Touch targets minimum 44px for mobile

## 💎 Eye-Catching Features

### Visual Hierarchy

- **Card** components with subtle elevation
- **Separator** lines with brand color accents
- **Badge** components with custom brand styling
- **Progress** bars with gradient effects

### Interactive Elements

- **HoverCard** reveals with smooth animations
- **Collapsible** sections with fluid transitions
- **Button** hover states with brand color shifts
- **NavigationMenu** dropdowns with polished animations

### Data Visualization

- **Table** with alternating row colors and hover effects
- **Progress** components showing labor cost percentages
- **Chart** integration for payroll analytics
- **Badge** clusters for status visualization

This component architecture creates a cohesive, modern, and memorable user experience that flows seamlessly across all user interactions while maintaining the professional aesthetic appropriate for workforce management.

## 📋 Component Implementation Mapping

### 🏠 Dashboard Components (Based on dashboard-01 block)

- **Role-Based Dashboard**: **Tabs** for different dashboard views per role
- **Metrics Cards**: **Card** grid layout for key performance indicators
- **Quick Actions**: **Button** group with role-appropriate actions
- **Analytics Charts**: **Chart** components for visual data representation
- **Status Indicators**: **Badge** components with real-time updates

### 🔐 Authentication Flow (Based on login-02 block)

- **Login Interface**: Clean **Card** layout with professional styling
- **Form Validation**: **Input** components with real-time validation
- **Loading States**: **Button** with spinner and disabled states
- **Error Handling**: **Alert** components for authentication errors
- **Password Reset**: **HoverCard** for password requirements

### 🧭 Navigation System (Based on sidebar-07 block)

- **Team Switching**: Dropdown for multi-location support
- **Role-Based Menus**: Dynamic navigation based on user permissions
- **Mobile Adaptation**: **Sheet** component for mobile navigation
- **Contextual Actions**: **DropdownMenu** for user-specific options

### 📝 Form Architecture Patterns

- **Multi-Section Forms**: **Tabs** with **Card** containers and **Separator** elements
- **Dynamic Content**: **Collapsible** sections with **Button** add/remove functionality
- **Real-Time Feedback**: **Progress** bars and **Badge** components for live calculations
- **Auto-Save**: **Toast** notifications with **Skeleton** loading states

### 📊 Data Display Patterns

- **Sortable Tables**: **Table** with **Badge** status indicators and **Input** search
- **Side-by-Side Views**: **Resizable** panels for comparison interfaces
- **Expandable Content**: **Accordion** for detailed information display
- **Contextual Information**: **HoverCard** and **Popover** for additional details

### 🎯 Interaction Patterns

- **Bulk Operations**: **Checkbox** multi-select with **DropdownMenu** actions
- **Confirmations**: **AlertDialog** for critical actions
- **Inline Editing**: **Popover** components for quick modifications
- **Mobile Gestures**: **Drawer** for bottom-up interactions

## 📋 Implementation Progress

### ✅ Phase 0: Foundation Complete

- [x] Project structure with Next.js 15 and TypeScript
- [x] Shadcn/UI New York theme with College Hunks brand colors (#026937, #ea7200)
- [x] Tailwind CSS configuration with custom color scheme
- [x] Component architecture planning and documentation

### 🔄 Phase 1: Core Layout (In Progress)

- [ ] **NavigationMenu** with role-based structure and dropdowns
- [ ] **Card** layouts for main content areas with brand styling
- [ ] **Button** components with College Hunks Green/Orange variants
- [ ] **Input**/**Select** form foundations with validation states

### 📅 Phase 2: Dynamic Features (Next)

- [ ] **Tabs** for log sections with smooth transitions
- [ ] **Collapsible**/**Accordion** for space-efficient layouts
- [ ] **Progress**/**Badge** for real-time feedback and status
- [ ] **HoverCard**/**Tooltip** for enhanced user experience

### 🚀 Phase 3: Advanced Interactions (Planned)

- [ ] **Table** with sorting, filtering, and pagination
- [ ] **Dialog**/**AlertDialog** for confirmations and forms
- [ ] **Sheet**/**Drawer** for mobile-optimized interactions
- [ ] **Chart** components for analytics and reporting

### 💎 Phase 4: Polish & Performance (Final)

- [ ] **Toast** notification system with brand styling
- [ ] **Skeleton** loading states for all components
- [ ] **ContextMenu** for power user functionality
- [ ] **Resizable** panels for customizable layouts

## 🎨 Brand Integration Status

### ✅ Completed Brand Elements

- Primary color (#026937) integrated into component variants
- Secondary color (#ea7200) applied to accent elements
- New York theme typography and spacing established
- Professional color palette with brand consistency

### 🔄 In Progress Brand Elements

- **Button** hover states with brand color transitions
- **Progress** bars with College Hunks Green gradients
- **Badge** components with custom brand styling
- **NavigationMenu** dropdowns with brand accent colors

### 📅 Planned Brand Enhancements

- **Card** components with subtle brand-colored borders
- **Separator** elements with brand color accents
- **HoverCard** animations with brand color highlights
- **Chart** components with brand color schemes

## 🔗 Related Documentation

- [Implementation Tasks](../.kiro/specs/hunkcentral-workforce-app/tasks.md) - Detailed task breakdown with component specifications
- [Design Document](../.kiro/specs/hunkcentral-workforce-app/design.md) - Complete technical architecture and component details
- [Requirements Document](../.kiro/specs/hunkcentral-workforce-app/requirements.md) - Functional specifications and business rules
- [Shadcn/UI Steering Rules](../.kiro/steering/shadcn-ui.md) - Component usage guidelines and best practices
