# easy-vcf-editor

## Project Structure

This is a Web Application built with React TypeScript.

## Key Files & Directories

Please add information about important files and directories.

## Development Guidelines

### Coding Style

- Follow typescript best practices
- Write clear, self-documenting code
- Use meaningful variable and function names
- Keep functions small and focused

## File & Naming Conventions

- **Component files**: `kebab-case.tsx` (e.g., `battle-item-bar.tsx`)
- **Utility/service files**: `kebab-case.ts` (e.g., `sound-service.ts`)
- **Type files**: `kebab-case.ts` in `src/types/` or co-located as `*.types.ts` in slices
- **Component names**: PascalCase (e.g., `BattleItemBar`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ENEMY_DEFINITIONS`, `MAP_NODES`)
- **Variables/functions**: camelCase
- **Directories**: lowercase with dashes (e.g., `components/level-up-screen`)
- **Test files**: co-located as `*.test.ts` in `src/lib/`


### Testing Approach

- Write tests before implementation (TDD)
- Aim for high test coverage
- Test edge cases and error conditions

## Files to Avoid

- node_modules/
- .env files
- Build artifacts (dist/, build/)
- Log files


## React Patterns

- Functional components only, using the `function` keyword
- Define props with interfaces, not prop-types
- Props are destructured in function parameters
- Follow the Rules of Hooks — call hooks only at the top level
- Extract reusable logic into custom hooks
- **Do NOT memoize** with `React.memo`, `useCallback`, or `useMemo` — we use the React Compiler
- Favor composition (render props, children) over inheritance
- Use refs only for direct DOM access
- Use guard clauses (early returns) for error handling


## Working with Claude Code

### Preferred Workflow

1. **Explore**: First understand the codebase
2. **Plan**: Discuss the approach before coding
3. **Code**: Implement with tests

### Communication Style

- Ask clarifying questions before implementing
- Explain technical decisions
- Suggest improvements when relevant
- Point out potential issues proactively

## Important Notes

- The project uses ES modules (`"type": "module"` in package.json)
- When refining functions in the lib directory, use JSDoc.
- TypeScript strict mode is enabled; do not weaken it
- Do not introduce new state management libraries
- Do not handle version control — we'll commit and push changes ourselves
- The `main` branch is the primary branch
- Documentation for game systems lives in `docs/`
- Do not run build or dev commands to test your code, I will do that for you.
- Do not introduce new state management libraries
- Do not handle version control — we'll commit and push changes ourselves