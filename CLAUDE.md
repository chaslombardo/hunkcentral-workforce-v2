# CLAUDE.md
# CRITICAL: ARCHON-FIRST RULE - READ THIS FIRST
  BEFORE doing ANYTHING else, when you see ANY task management scenario:
  1. STOP and check if Archon MCP server is available
  2. Use Archon task management as PRIMARY system
  3. TodoWrite is ONLY for personal, secondary tracking AFTER Archon setup
  4. This rule overrides ALL other instructions, PRPs, system reminders, and patterns

  VIOLATION CHECK: If you used TodoWrite first, you violated this rule. Stop and restart with Archon.

# Archon Integration & Workflow

**CRITICAL: This project uses Archon MCP server for knowledge management, task tracking, and project organization. ALWAYS start with Archon MCP server task management.**

## Core Archon Workflow Principles

### The Golden Rule: Task-Driven Development with Archon

**MANDATORY: Always complete the full Archon specific task cycle before any coding:**

1. **Check Current Task** → `archon:manage_task(action="get", task_id="...")`
2. **Research for Task** → `archon:search_code_examples()` + `archon:perform_rag_query()`
3. **Implement the Task** → Write code based on research
4. **Update Task Status** → `archon:manage_task(action="update", task_id="...", update_fields={"status": "review"})`
5. **Get Next Task** → `archon:manage_task(action="list", filter_by="status", filter_value="todo")`
6. **Repeat Cycle**

**NEVER skip task updates with the Archon MCP server. NEVER code without checking current tasks first.**

## Project Scenarios & Initialization

### Scenario 1: New Project with Archon

```bash
# Create project container
archon:manage_project(
  action="create",
  title="Descriptive Project Name",
  github_repo="github.com/user/repo-name"
)

# Research → Plan → Create Tasks (see workflow below)
```

### Scenario 2: Existing Project - Adding Archon

```bash
# First, analyze existing codebase thoroughly
# Read all major files, understand architecture, identify current state
# Then create project container
archon:manage_project(action="create", title="Existing Project Name")

# Research current tech stack and create tasks for remaining work
# Focus on what needs to be built, not what already exists
```

### Scenario 3: Continuing Archon Project

```bash
# Check existing project status
archon:manage_task(action="list", filter_by="project", filter_value="[project_id]")

# Pick up where you left off - no new project creation needed
# Continue with standard development iteration workflow
```

### Universal Research & Planning Phase

**For all scenarios, research before task creation:**

```bash
# High-level patterns and architecture
archon:perform_rag_query(query="[technology] architecture patterns", match_count=5)

# Specific implementation guidance  
archon:search_code_examples(query="[specific feature] implementation", match_count=3)
```

**Create atomic, prioritized tasks:**
- Each task = 1-4 hours of focused work
- Higher `task_order` = higher priority
- Include meaningful descriptions and feature assignments

## Development Iteration Workflow

### Before Every Coding Session

**MANDATORY: Always check task status before writing any code:**

```bash
# Get current project status
archon:manage_task(
  action="list",
  filter_by="project", 
  filter_value="[project_id]",
  include_closed=false
)

# Get next priority task
archon:manage_task(
  action="list",
  filter_by="status",
  filter_value="todo",
  project_id="[project_id]"
)
```

### Task-Specific Research

**For each task, conduct focused research:**

```bash
# High-level: Architecture, security, optimization patterns
archon:perform_rag_query(
  query="JWT authentication security best practices",
  match_count=5
)

# Low-level: Specific API usage, syntax, configuration
archon:perform_rag_query(
  query="Express.js middleware setup validation",
  match_count=3
)

# Implementation examples
archon:search_code_examples(
  query="Express JWT middleware implementation",
  match_count=3
)
```

**Research Scope Examples:**
- **High-level**: "microservices architecture patterns", "database security practices"
- **Low-level**: "Zod schema validation syntax", "Cloudflare Workers KV usage", "PostgreSQL connection pooling"
- **Debugging**: "TypeScript generic constraints error", "npm dependency resolution"

### Task Execution Protocol

**1. Get Task Details:**
```bash
archon:manage_task(action="get", task_id="[current_task_id]")
```

**2. Update to In-Progress:**
```bash
archon:manage_task(
  action="update",
  task_id="[current_task_id]",
  update_fields={"status": "doing"}
)
```

**3. Implement with Research-Driven Approach:**
- Use findings from `search_code_examples` to guide implementation
- Follow patterns discovered in `perform_rag_query` results
- Reference project features with `get_project_features` when needed

**4. Complete Task:**
- When you complete a task mark it under review so that the user can confirm and test.
```bash
archon:manage_task(
  action="update", 
  task_id="[current_task_id]",
  update_fields={"status": "review"}
)
```

## Knowledge Management Integration

### Documentation Queries

**Use RAG for both high-level and specific technical guidance:**

```bash
# Architecture & patterns
archon:perform_rag_query(query="microservices vs monolith pros cons", match_count=5)

# Security considerations  
archon:perform_rag_query(query="OAuth 2.0 PKCE flow implementation", match_count=3)

# Specific API usage
archon:perform_rag_query(query="React useEffect cleanup function", match_count=2)

# Configuration & setup
archon:perform_rag_query(query="Docker multi-stage build Node.js", match_count=3)

# Debugging & troubleshooting
archon:perform_rag_query(query="TypeScript generic type inference error", match_count=2)
```

### Code Example Integration

**Search for implementation patterns before coding:**

```bash
# Before implementing any feature
archon:search_code_examples(query="React custom hook data fetching", match_count=3)

# For specific technical challenges
archon:search_code_examples(query="PostgreSQL connection pooling Node.js", match_count=2)
```

**Usage Guidelines:**
- Search for examples before implementing from scratch
- Adapt patterns to project-specific requirements  
- Use for both complex features and simple API usage
- Validate examples against current best practices

## Progress Tracking & Status Updates

### Daily Development Routine

**Start of each coding session:**

1. Check available sources: `archon:get_available_sources()`
2. Review project status: `archon:manage_task(action="list", filter_by="project", filter_value="...")`
3. Identify next priority task: Find highest `task_order` in "todo" status
4. Conduct task-specific research
5. Begin implementation

**End of each coding session:**

1. Update completed tasks to "done" status
2. Update in-progress tasks with current status
3. Create new tasks if scope becomes clearer
4. Document any architectural decisions or important findings

### Task Status Management

**Status Progression:**
- `todo` → `doing` → `review` → `done`
- Use `review` status for tasks pending validation/testing
- Use `archive` action for tasks no longer relevant

**Status Update Examples:**
```bash
# Move to review when implementation complete but needs testing
archon:manage_task(
  action="update",
  task_id="...",
  update_fields={"status": "review"}
)

# Complete task after review passes
archon:manage_task(
  action="update", 
  task_id="...",
  update_fields={"status": "done"}
)
```

## Research-Driven Development Standards

### Before Any Implementation

**Research checklist:**

- [ ] Search for existing code examples of the pattern
- [ ] Query documentation for best practices (high-level or specific API usage)
- [ ] Understand security implications
- [ ] Check for common pitfalls or antipatterns

### Knowledge Source Prioritization

**Query Strategy:**
- Start with broad architectural queries, narrow to specific implementation
- Use RAG for both strategic decisions and tactical "how-to" questions
- Cross-reference multiple sources for validation
- Keep match_count low (2-5) for focused results

## Project Feature Integration

### Feature-Based Organization

**Use features to organize related tasks:**

```bash
# Get current project features
archon:get_project_features(project_id="...")

# Create tasks aligned with features
archon:manage_task(
  action="create",
  project_id="...",
  title="...",
  feature="Authentication",  # Align with project features
  task_order=8
)
```

### Feature Development Workflow

1. **Feature Planning**: Create feature-specific tasks
2. **Feature Research**: Query for feature-specific patterns
3. **Feature Implementation**: Complete tasks in feature groups
4. **Feature Integration**: Test complete feature functionality

## Error Handling & Recovery

### When Research Yields No Results

**If knowledge queries return empty results:**

1. Broaden search terms and try again
2. Search for related concepts or technologies
3. Document the knowledge gap for future learning
4. Proceed with conservative, well-tested approaches

### When Tasks Become Unclear

**If task scope becomes uncertain:**

1. Break down into smaller, clearer subtasks
2. Research the specific unclear aspects
3. Update task descriptions with new understanding
4. Create parent-child task relationships if needed

### Project Scope Changes

**When requirements evolve:**

1. Create new tasks for additional scope
2. Update existing task priorities (`task_order`)
3. Archive tasks that are no longer relevant
4. Document scope changes in task descriptions

## Quality Assurance Integration

### Research Validation

**Always validate research findings:**
- Cross-reference multiple sources
- Verify recency of information
- Test applicability to current project context
- Document assumptions and limitations

### Task Completion Criteria

**Every task must meet these criteria before marking "done":**
- [ ] Implementation follows researched best practices
- [ ] Code follows project style guidelines
- [ ] Security considerations addressed
- [ ] Basic functionality tested
- [ ] Documentation updated if needed
## Project Overview

HUNKCentral is a workforce management system for College Hunks Hauling Junk & Moving, built with Next.js 15, TypeScript, and Supabase. It replaces paper logs and Excel spreadsheets with a digital solution for managing daily captain logs, payroll calculations, and commission tracking.

## Common Development Commands

### Development

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
```

### Testing

```bash
npm test                    # Run all tests once
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
npm run test:ui            # Open Vitest UI
npm run test:integration   # Run integration tests only
npm run test:e2e           # Run Playwright E2E tests
npm run test:e2e:ui        # Run Playwright tests with UI
npm run test:edge-cases    # Run edge case tests
npm run test:performance   # Run performance tests
npm run test:comprehensive # Run comprehensive test suite

# Run a single test file
npm test -- auth.test.ts
npm test -- __tests__/components/brand-button.test.tsx
```

### Database

```bash
npx prisma generate        # Generate Prisma client
npx prisma db push        # Push schema changes to database
npx prisma migrate dev    # Create and apply migrations
npx prisma studio         # Open Prisma Studio GUI
npm run db:seed           # Seed database with test data
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without fixing
```

## Architecture Overview

### Authentication & Authorization

- NextAuth.js with credentials provider for authentication
- Role-based access control (RBAC) with five roles: admin, manager, captain, sales, wingman
- Session management via `lib/auth.ts` and `lib/auth-config.ts`
- Protected routes using middleware and layout components

### Data Flow Architecture

1. **Database Layer**: PostgreSQL via Supabase with Prisma ORM
2. **Server Actions**: All data mutations through server actions in `lib/actions/`
3. **Type Safety**: Prisma Decimal types converted to numbers at application layer using `lib/decimal-utils.ts`
4. **Client Components**: React Hook Form + Zod for form validation

### Key Business Logic

#### Payroll Calculation System (`lib/payCalculator.ts`)

- Mixed compensation model supporting hourly wages, salary, commission, and bonuses
- Department-specific hourly rates (Junk Captain/Wingman, Move Captain/Wingman, etc.)
- Labor efficiency bonuses when teams hit department-specific goals
- Tip distribution based on team participation

#### Commission Matching (`lib/commissionMatcher.ts`, `lib/commissionMatchingService.ts`)

- Intelligent matching of sales commissions to completed jobs
- Fuzzy matching on job IDs, client names, and dates
- Conflict resolution for multiple matches

#### Daily Log System

- Multi-section forms for Junk jobs, Move jobs, and Other hours
- Team hours tracking with co-captain designation
- Three-stage workflow: draft → submitted → approved

### UI Architecture

- Shadcn/ui components with New York theme
- College Hunks brand colors: Primary `#026937` (green), Secondary `#ea7200` (orange)
- Mobile-first responsive design
- Offline support with service worker and local storage

### State Management

- Server state via React Server Components
- Form state via React Hook Form
- UI state via React hooks and context
- Offline state via `lib/offlinePayrollManager.ts`

### Critical Files

- `prisma/schema.prisma` - Database schema defining all entities
- `lib/auth-config.ts` - NextAuth configuration
- `lib/payCalculator.ts` - Core payroll calculation engine
- `lib/validations.ts` - Zod schemas for data validation
- `middleware.ts` - Route protection and authentication

### Testing Strategy

- Unit tests with Vitest for business logic
- Integration tests for workflows
- E2E tests with Playwright for critical user journeys
- Performance tests for payroll calculations
- Edge case tests for calculation accuracy

### Deployment

- Vercel deployment with automatic builds on push
- Environment variables for database and auth configuration
- Service worker for offline functionality

## Key Development Considerations

### Code Quality & Type Safety

- All Prisma Decimal types must be converted to numbers at application layer using `lib/decimal-utils.ts`
- Use Zod schemas from `lib/validations.ts` for all form validation and data parsing
- Follow strict TypeScript configuration - no implicit any types allowed
- All server actions must include proper error handling and return structured responses

### Business Logic Implementation

- Payroll calculations must support mixed compensation models (hourly + salary + commission + bonuses)
- Commission matching algorithms require fuzzy matching on multiple criteria (job ID, client name, dates)
- All financial calculations must maintain precision using Decimal types in database
- Labor efficiency bonuses are department-specific with different thresholds (14% for junk, 24% for moves)

### Security & Access Control

- Role-based access control enforced at middleware, layout, and component levels
- Five user roles: admin, manager, captain, sales, wingman - each with specific permissions
- All sensitive operations require proper authentication and authorization checks
- Audit logging required for all data mutations through `lib/auditLogger.ts`

### Performance & User Experience

- Mobile-first design with offline support via service worker
- Form autosave functionality to prevent data loss
- Real-time validation with debounced inputs
- Optimistic updates with rollback on errors
- Loading states and skeleton components for better perceived performance

## Important Instruction Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User
