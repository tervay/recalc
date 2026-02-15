# Project Context for AI Agents

## Project Overview

ReCalc is a design calculator website for FIRST Robotics Competition (FRC) and FIRST Tech Challenge (FTC). Built with React Router v7, TypeScript, and Tailwind CSS.

## Tooling & Commands

**Package Manager**: pnpm (v10.28.1+)
**Node**: v24+ (mise configured for Node 24)
**Runtime Manager**: mise

### Essential Commands

```sh
pnpm install              # Install dependencies
pnpm run dev              # Start dev server
pnpm run build            # Production build
pnpm run typecheck        # Type check with tsc
pnpm run lint             # Run ESLint
pnpm run lint:fix         # Fix linting issues
pnpm run format:fix       # Fix formatting with Prettier
pnpm run test             # Run Vitest unit tests
pnpm run test -u          # Update snapshots
pnpm run test:playwright  # Run E2E tests (requires build first)
```

### Special Commands

```sh
pnpm run build:wpi        # Build WASM bindings from wpilib (requires Docker)
pnpm run downloadProducts # Download vendor product data
pnpm run generateTests    # Generate test files
```

## Tech Stack

- **Framework**: React Router v7 (framework mode with @react-router/node)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Shadcn UI components
- **State Management**: React hooks
- **Build Tool**: Vite
- **Testing**: Vitest (unit), Playwright (E2E)
- **Workers**: Comlink for background tasks
- **Icons**: Iconify (https://icon-sets.iconify.design/)
- **WASM**: Custom WPILib bindings in `/wpilib` directory

## Project Structure

- `/app` - React Router application code
- `/scripts` - Build and generation scripts
- `/wpilib` - WASM bindings for WPILib
- `/public` - Static assets
- `/playwright-tests` - E2E tests

## Development Notes

- Always run `pnpm run typecheck` before committing
- Use `pnpm run lint:fix && pnpm run format:fix` to fix code style
- Build required before running Playwright tests
- WASM build requires Docker for wpilib compilation
- **Search**: Prefer `rg` (ripgrep) over `grep` for faster code searching
- **Version Control**: This project may use Jujutsu (jj) instead of git. If the `.git` directory does not exist, use `jj` commands instead of `git` commands
- **Comments**: The best code is self-explanatory and doesn't need comments. However, use comments when something isn't immediately clear to save mental energy for developers. Don't over-comment everything—only explain the "why" when the "what" isn't obvious
