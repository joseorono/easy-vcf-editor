# easy-vcf-editor

Shared rules for AI coding agents (Claude Code, Devin Desktop, etc.). This is the single source of truth — `CLAUDE.md` imports this file.

## Architecture

- This is a front-end, offline-first app, not a full-stack application.
- No server needed, no database needed, no auth.
- Built with React + TypeScript.
- Uses Electron for the desktop app.
- Also a Progressive Web App (PWA).
- For logic, always look for existing functions and classes in `/src/lib/` before writing new ones.
- Absolutely no export barrels.
- Put constants in the `/src/constants` directory, in the appropriate file.
- Put big type definitions in the `/src/types` directory.

## Key Files & Directories

Please add information about important files and directories.

## Coding Style & Formatting

- Follow TypeScript best practices.
- Write clear, self-documenting code.
- Use meaningful variable and function names, even if a bit long.
- Keep functions small and focused.
- Prefer const assertions and explicit typing where beneficial.
- Avoid relative imports (e.g., `./utils`) when possible — use path aliases instead.

### Naming Conventions

- **Component files**: `kebab-case.tsx` (e.g., `battle-item-bar.tsx`)
- **Utility/service files**: `kebab-case.ts` (e.g., `sound-service.ts`)
- **Type files**: `kebab-case.ts` in `src/types/` or co-located as `*.types.ts` in slices
- **Component names**: PascalCase (e.g., `BattleItemBar`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ENEMY_DEFINITIONS`, `MAP_NODES`)
- **Variables/functions/props**: camelCase
- **Directories**: lowercase with dashes (e.g., `components/level-up-screen`)
- **Test files**: co-located as `*.test.ts` (e.g., in `src/lib/` or next to the component)

## Styling & UI

- Use Tailwind CSS for styling, layout, and spacing.
- Use Shadcn UI for components.
- Use icons from `lucide-react` for logos.
- Implement smooth color transitions and animations using Tailwind transition classes.

## Data Fetching & Forms

- Use React Hook Form for form handling.
- Use Zod for validation and schema definitions.

## State Management & Logic

- Do not introduce new state management libraries.
- Use React Context minimally.
- Use Jotai for global state if needed, but prioritize local state so the React Compiler can do its job.

## React Patterns

- Functional components only, using the `function` keyword.
- Define props with interfaces, not prop-types.
- Props are destructured in function parameters.
- Follow the Rules of Hooks — call hooks only at the top level.
- Extract reusable logic into custom hooks.
- **Do NOT memoize** with `React.memo`, `useCallback`, or `useMemo` — we use the React Compiler.
- Favor composition (render props, children) over inheritance.
- Use refs only for direct DOM access.
- Use guard clauses (early returns) for error handling.

## Testing

- Use Vitest for unit testing, sparingly, if needed.
- Test files co-located as `*.test.ts` (e.g., `FileName.test.ts`).
- Test edge cases and error conditions.

## Files to Avoid

- `node_modules/`
- `.env` files
- Build artifacts (`dist/`, `build/`)
- Log files

## Working with AI Agents

### Preferred Workflow

1. **Explore**: First understand the codebase.
2. **Plan**: Discuss the approach before coding.
3. **Code**: Implement with tests.

### Communication Style

- Ask clarifying questions before implementing.
- Explain technical decisions.
- Suggest improvements when relevant.
- Point out potential issues proactively.

## Important Notes

- The project uses ES modules (`"type": "module"` in `package.json`).
- When refining functions in the `lib` directory, use JSDoc.
- TypeScript strict mode is enabled; do not weaken it.
- Do not introduce new state management libraries.
- Do not handle version control — we'll commit and push changes ourselves.
- The `main` branch is the primary branch.
- Documentation lives in `docs/`.
- Do not run build or dev commands to test code — the maintainer will do that.
