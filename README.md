# ReCalc

A design calculator website for FIRST Robotics Competition (FRC) and FIRST Tech Challenge (FTC).

## Quick Start

Requires Node.js 22+ and pnpm.

```sh
pnpm install
pnpm run dev
```

## Commands

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run build:wpi` - Build WASM bindings from wpilib (requires Docker)
- `pnpm run start` - Preview production build
- `pnpm run lint` - Run linter
- `pnpm run lint:fix` - Fix linting issues
- `pnpm run format:fix` - Fix formatting issues
- `pnpm run typecheck` - Type check TypeScript

## Testing

- `pnpm run test` - Run unit tests (Vitest)
- `pnpm run test -u` - Update snapshot tests (use when snapshot output changes)
- `pnpm exec playwright test` - Run Playwright UI tests (requires build first: `pnpm run build`)

## Tech Stack

- React Router v7 (framework mode)
- TypeScript
- Shadcn UI + Tailwind CSS
- Comlink (for background workers)
- Vitest + Playwright (testing)
- Icons: https://icon-sets.iconify.design/
