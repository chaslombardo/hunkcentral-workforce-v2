# Shadcn/UI Implementation Rules

## Usage Rule

When asked to use shadcn components, use the MCP server to get blocks & component code, demos, and metadata. You should always use blocks when available.

## Planning Rule

When asked to plan anything related to UI/UX or related to shadcn:

- Use the MCP Server during planning and implementation.
- Use get_directory_structure, list_blocks, get_block, use demo tool to see how to properly use and to get correct blocks, components and metadata.
- Use shadcn whole blocks, compatible with TailwindCSS, everywhere possible (e.g. login page, cards, descriptions, page headers and footers, section headers and footers, sign-in, settings, etc...)
- Apply components wherever blocks are not available

## Implementation Rule

When implementing shadcn components:

1. **Call up the demo tool FIRST** - This is really important -- list_blocks, get_block, demo tool
2. Check how the blocks are actually used (or if no block then you can use components)
3. Use that information in the actual code
4. Implement it so it is implemented correctly

## Block vs Component Priority

Always prioritize using shadcn/ui blocks over shadcn/ui components. That should always be used instead of custom implementations

- Login pages → Use shadcn auth blocks and if no blocks then components
- Cards → Use Card blocks and if no blocks then components are okay to use with CardHeader, CardContent, CardFooter
- Forms → Use Form blocks and if no blocks then components are okay to use with proper validation
- Navigation → Use appropriate navigation blocks and if no blocks then components are okay to use
- Buttons → Use Button blocks and if no blocks then components are okay to use with proper variants
- Inputs → Use Input, Select, Textarea blocks and if no blocks then components are okay to use
- Layout → Use shadcn layout patterns

## Quality Standards

- Use New York theme styling
- Ensure blocks and components are accessible and responsive
- Follow shadcn/ui best practices from demos
- Maintain consistency across all UI elements
