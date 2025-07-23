# Development Guide

## 🚀 Quick Start

This guide helps developers get up to speed with the HUNKCentral codebase and development workflow.

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Latest version (comes with Node.js)
- **Git**: For version control
- **VS Code**: Recommended editor with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Prisma
  - ESLint
  - Prettier

## 🏗️ Project Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **UI Library**: Shadcn/UI with New York theme
- **Styling**: Tailwind CSS
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand (minimal usage)
- **Deployment**: Vercel

### Folder Structure
```
/app                    # Next.js App Router pages
  /auth                 # Authentication pages
  /(protected)          # Protected routes with middleware
    /dashboard          # Role-based dashboard views
    /logs               # Log management pages
    /commission         # Commission tracking pages
    /reports            # Payroll and reporting pages
    /admin              # Administrative pages

/components             # React components
  /ui                   # Shadcn/UI base components
  /features             # Feature-specific components
  /layout               # Layout and navigation components
  /forms                # Reusable form components

/lib                    # Utility libraries
  /auth.ts              # Authentication utilities
  /prisma.ts            # Database client
  /payCalculator.ts     # Business logic for payroll
  /validations.ts       # Zod schemas
  /utils.ts             # General utilities

/hooks                  # Custom React hooks
/types                  # TypeScript type definitions
/prisma                 # Database schema and migrations
```

## 🎨 UI Development Guidelines

### Component Usage
1. **Always use Shadcn/UI blocks or if no relevant blocks then components** instead of custom implementations
2. **Follow the New York theme** styling patterns
3. **Apply College Hunks brand colors**:
   - Primary: `#026937` (College Hunks Green)
   - Secondary: `#ea7200` (College Hunks Orange)

### Mobile-First Design
- Start with mobile layouts, then enhance for desktop
- Use minimum 44px touch targets
- Implement appropriate keyboard types for inputs
- Test on actual mobile devices

### Component Patterns (always check for blocks first)
```typescript
// Example: Using Shadcn/UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ExampleComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example Form</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter value" />
        <Button className="mt-4">Submit</Button>
      </CardContent>
    </Card>
  )
}
```

## 🗄️ Database Development

### Prisma Workflow
```bash
# Make schema changes in prisma/schema.prisma
# Generate Prisma client
npx prisma generate

# Push changes to database
npx prisma db push

# Open database browser
npx prisma studio
```

### Database Patterns
- Use Server Actions for data mutations
- Use Server Components for data fetching
- Implement row-level security policies
- Follow the established schema patterns

## 🔐 Authentication & Authorization

### Role-Based Access Control
The system supports 5 roles:
- **admin**: Full system access
- **manager**: Review logs, generate reports
- **captain**: Create and submit logs
- **sales**: Enter commission entries
- **wingman**: Basic employee access

### Implementation Pattern
```typescript
// Check user roles
import { hasRole } from "@/lib/auth"

if (hasRole(user, ['admin', 'manager'])) {
  // Allow access
}

// Protect routes
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

<ProtectedRoute allowedRoles={['captain']}>
  <LogCreationForm />
</ProtectedRoute>
```

## 📝 Form Development

### Form Pattern with React Hook Form + Zod
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const formSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  revenue: z.number().min(0, "Revenue must be positive"),
})

export function ExampleForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobId: "",
      revenue: 0,
    }
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Handle form submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

## 🧪 Testing Guidelines

### Unit Testing
- Test business logic in `/lib` functions
- Test form validation schemas
- Test utility functions

### Integration Testing
- Test complete user workflows
- Test database operations
- Test authentication flows

### E2E Testing
- Test critical user journeys
- Test across different roles
- Test mobile responsiveness

## 🚀 Performance Best Practices

### Next.js Optimization
- Use Server Components for data-heavy pages
- Use Client Components only for interactivity
- Implement proper loading states
- Use Next.js Image component for images

### Database Optimization
- Use appropriate indexes
- Implement pagination for large datasets
- Use database queries efficiently
- Cache frequently accessed data

## 🔧 Development Workflow

### Daily Development
1. **Check current task** in `tasks.md`
2. **Create feature branch** from main
3. **Follow component patterns** from UI documentation
4. **Test thoroughly** on mobile and desktop
5. **Update documentation** if needed
6. **Mark task complete** when finished

### Code Quality
- Run `npm run lint` before committing
- Use TypeScript strict mode
- Follow established naming conventions
- Write meaningful commit messages

### Debugging
- Use browser dev tools for client-side debugging
- Use console.log for server-side debugging
- Use Prisma Studio for database inspection
- Check Network tab for API issues

## 📚 Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/UI Documentation](https://ui.shadcn.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)

### Project-Specific
- [Requirements Document](../.kiro/specs/hunkcentral-workforce-app/requirements.md)
- [Design Document](../.kiro/specs/hunkcentral-workforce-app/design.md)
- [UI Components Guide](./ui-components.md)
- [Implementation Tasks](../.kiro/specs/hunkcentral-workforce-app/tasks.md)

## 🆘 Common Issues

### Database Connection
- Ensure Supabase connection string is correct
- Check if database is accessible
- Verify Prisma schema is up to date

### Authentication Issues
- Check NextAuth configuration
- Verify environment variables
- Ensure session management is working

### UI Component Issues
- Ensure Shadcn/UI components are properly installed
- Check Tailwind CSS configuration
- Verify component imports are correct

## 📞 Getting Help

1. **Check documentation** in `/docs` and `.kiro/specs`
2. **Review similar implementations** in the codebase
3. **Check the current task requirements** in `tasks.md`
4. **Test on multiple devices** and browsers
5. **Follow established patterns** from existing code