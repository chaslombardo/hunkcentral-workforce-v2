# MCP Server Usage Rules

## Available MCP Servers

### 1. Shadcn/UI Server (everywhere a component is mentioned below you should check for shadcn/ui blocks first)
**Usage**: UI component implementation and planning
- **When to use**: Any time working with UI components, layouts, or design
- **Rule**: Always use this server before implementing any UI component
- **Auto-approved**: `list_components`, `get_component_demo`

### 2. Context7 Server  
**Usage**: Documentation and library research
- **When to use**: Need documentation for libraries, frameworks, or APIs
- **Rule**: Use when researching Next.js, Prisma, NextAuth, or other library documentation
- **Process**: First resolve library ID, then get documentation

### 3. Sequential Thinking Server
**Usage**: Complex problem solving and planning
- **When to use**: Breaking down complex implementation problems, debugging, or architectural decisions
- **Rule**: Use for multi-step problem analysis that requires deep thinking
- **Best for**: Algorithm design, complex business logic, troubleshooting

### 4. Memory Server
**Usage**: Knowledge graph and context management
- **When to use**: Tracking project context, relationships between components, or maintaining implementation history
- **Rule**: Use to store and retrieve important project decisions and patterns
- **Auto-approved**: All memory operations

## Implementation Guidelines

### Before Starting Any Task:
1. **Check Context7** for relevant documentation if using new libraries
2. **Use Sequential Thinking** for complex planning or problem-solving
3. **Use Shadcn/UI** for any UI component work
4. **Update Memory** with important decisions and patterns

### During Implementation:
1. **Shadcn/UI**: Always get component demos before implementing
2. **Context7**: Reference documentation for proper API usage
3. **Sequential Thinking**: Break down complex logic step-by-step
4. **Memory**: Store successful patterns for reuse

### Problem Solving Priority:
1. **Sequential Thinking** for complex analysis
2. **Context7** for documentation lookup
4. **Shadcn/UI** for component-specific issues

## Specific Use Cases for HUNKCentral

### UI Development:
- Use **Shadcn/UI** for all component implementation
- Use **Sequential Thinking** for complex form logic
- Use **Memory** to track UI patterns and decisions

### Business Logic:
- Use **Sequential Thinking** for payroll calculations, bonus formulas
- Use **Context7** for Prisma/NextAuth documentation
- Use **Memory** to store calculation patterns

### Architecture Decisions:
- Use **Sequential Thinking** for complex architectural choices
- Use **Memory** to track architectural decisions
- Use **Context7** for framework best practices

## Quality Standards
- Always leverage available MCP servers before manual research
- Document important findings in Memory for future reference
- Use Sequential Thinking for any multi-step problem solving
- Prioritize MCP server usage over external research