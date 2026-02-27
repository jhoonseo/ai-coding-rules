# Contributing to ai-coding-rules

Thanks for your interest in contributing! Here's how to get started.

## Development Workflow

1. **Fork** the repository
2. **Clone** your fork
3. **Install** dependencies: `npm install`
4. **Create a branch**: `git checkout -b feat/my-feature`
5. **Make changes** and add tests
6. **Run checks**: `npm run typecheck && npm run lint && npm run test`
7. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add new feature`
   - `fix: resolve issue with X`
   - `docs: update README`
   - `refactor: simplify generator logic`
8. **Push** and open a Pull Request

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

## Testing

All changes must include tests:

```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
```

## Project Structure

- `src/scanners/` — Project auto-detection
- `src/generators/` — Agent-specific file generators
- `src/commands/` — CLI command handlers
- `src/types/` — TypeScript types and Zod schemas
- `src/utils/` — Shared utilities
- `tests/` — Test files (mirrors src/ structure)

## Adding a New Agent

1. Create `src/generators/{agent}-generator.ts` extending `BaseGenerator`
2. Add to `src/generators/index.ts` registry
3. Add to `AgentTarget` type in `src/types/config.ts`
4. Add tests in `tests/generators/`
5. Update README.md supported agents table
