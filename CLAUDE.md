### Project Overview

ReCalc is a collaboration-focused mechanical design calculator & simulator for FIRST Robotics. It is primarily focused on FRC, but could be used for FTC or similar competitions. It is critical that this project maintains correctness, usability, and approachability. It is important that the project stay up to date with the latest web development technologies. Performance is important, as many students utilizing the site may use it on low-power Chromebooks (or similar devices).

Simulations are achieved by compiling WPILib to WebAssembly using Emscripten. Webworkers then call the WebAssembly code from background workers, sometimes in pools to find optimal mechanism configurations. WebAssembly artifacts are checked into source code in order to make CI faster and keep it accessible for new developers. WPILib target code is updated periodically.

This project utilizes a heavy amount of math and physics. It is important that you are familiar with differential equations, linear algebra, basic kinematics, and DC motor models.

The developer may be using jujutsu for version control rather than git. First, check if jj is available, before utilizing git. If jj is not available, it is safe to fall back to git commands.

The core technologies involve React Router, TailwindCSS, Shadcn, Base UI, Vite, nuqs, Emscripten, and Comlink. The project is hosted on Vercel, and usage analytics are gathered through [OpenPanel](https://openpanel.dev). Linting is done through Oxlint and formatting through Oxfmt. However, some ESLint rules are installed to cover areas Oxlint misses. Dependencies should be pinned as strictly as possible, in order to increase build reproducibility across platforms and machines.

Developer environment can be maintained using [Mise](https://mise.jdx.dev/). You are free to make suggestions about new CLI tools that may help the developer.

NEVER modify generated files directly. Regenerate them using CLI tools.

General guidelines:

- Use pnpm instead of npm, yarn, or bun.
- When making a change, before finishing the task, the build and tests must pass.
- When making a change, before finishing the task, fix any formatting or linting problems.
- You can fix formatting with `pnpm run format:fix` (web only), `pnpm run format:wpi` (C++ only), or `mise run format` (both simultaneously). Fix most linting problems with `pnpm run lint:fix`.
- Accompany non-UI logic with unit tests where possible.
- Accompany UI changes with playwright tests where possible.
- Do not use emojis.
- Avoid using `as` typecasting when possible.
- Use zod to convert to stricter types when necessary.
- Avoid using `any`.
- ReCalc uses Shadcn, Tailwind CSS, React Router v7 (framework mode).
- ReCalc uses Measurement, a thin wrapper around js-quantities, for managing units.
- ReCalc offloads compute-heavy tasks to background workers through Comlink in order to keep the UI responsive.
- Do not create dynamic style strings. Use `cn`, which is a thin wrapper around `clsx` and `tw-merge`.
- Always use absolute imports.
- Be thorough about divide-by-zero errors.
- You should be intimately familiar with the latest FIRST Robotics Competition rules, vendors, and COTS products.
- Tests should be as thorough and as specific as possible, in order to catch behavioral changes.
- Proper error-handling is paramount.
- The `.git` directory may not exist; in this case, the author is using the Jujutsu VCS.
- Prefer to manage non-NPM dependencies with Mise.
- Always ask before running any Mise or Jujutsu command.
- Always use absolute imports.
- Always check if a component exists in Shadcn.
- If a component does exist in Shadcn, install it via the command line (`pnpm dlx shadcn@latest add <component>`).
- When installing new NPM dependencies, always pin to a specific version.
- Before running Playwright tests, make sure to build the app with `pnpm run build`. Use `mise run test:e2e` to handle the build step automatically.
- Prefer `rg` (ripgrep) over `grep`, `find`, or `eval` for searching.

### 1. Plan Node Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

---

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

---

### 3. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

---

### 4. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

---

### 5. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards

## Test-Driven Development (MANDATORY)

**CRITICAL**: All code changes MUST follow test-driven development (TDD).
This is not optional.

### Red-Green-Refactor Cycle

1. **RED** - Write a failing test first (must fail for the right reason)
2. **GREEN** - Write minimum code to pass the test
3. **REFACTOR** - Clean up while keeping tests green
4. **VERIFY** - Run full test suite before committing

### Mandatory TDD Rules

1. **NEVER write implementation code without a failing test first**
2. **NEVER commit code without tests**
3. **NEVER skip tests or mark them as skipped to make CI pass**
4. **NEVER disable existing tests** - fix them or fix the code
5. Each test should verify ONE specific behavior
6. Test names should describe the scenario being tested

### Test Quality Standards

- Test behavior, not implementation
- One assertion per test when possible (easier diagnosis)
- Clear naming
- Use existing test utilities if present
- Tests must be deterministic (no random values or race conditions)
