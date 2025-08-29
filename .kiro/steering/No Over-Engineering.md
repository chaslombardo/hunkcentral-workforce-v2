---
inclusion: always
---

# Simplicity & Engineering Principles

## Core Philosophy

Keep implementations simple and focused. Avoid over-engineering solutions that add complexity without clear business value.

## Dependency Management

- Use existing dependencies in the project stack (Next.js, Shadcn/UI, Prisma, etc.)
- Avoid adding new dependencies unless absolutely necessary
- Prefer built-in solutions over third-party libraries when possible
- No extensive monitoring frameworks or complex observability stacks

## Code Patterns

- Write straightforward, readable code over clever abstractions
- Use standard React patterns and Next.js conventions
- Implement features incrementally rather than building complex systems upfront
- Prefer composition over inheritance

## Architecture Guidelines

- Keep components focused on single responsibilities
- Use server components and server actions for data operations
- Minimize client-side state management complexity
- Avoid premature optimization

## Implementation Approach

- Start with the simplest solution that works
- Refactor only when complexity becomes a real problem
- Focus on core business functionality over technical sophistication
- Prioritize maintainability and clarity over performance micro-optimizations
