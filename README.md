# [ReCalc](https://reca.lc/)

ReCalc is a collaboration focused mechanical design calculator, primarily for FRC.

## Local setup

You'll need Node version 14 and Yarn version 1.22.

```
$ yarn
```

If you want to run UI tests, you'll need to install a few dependencies beforehand in order to run Cypress. Read Cypress official docs for instructions regarding your OS.

https://docs.cypress.io/guides/getting-started/installing-cypress

## Basic dev commands:

`yarn start` - start server

`yarn build` - build to `./build`

`yarn test` - run tests

`yarn dev:analyze` - check bundle sizes

`yarn dev:coverage` - run test coverage report

`yarn dev:format` - format source files

`yarn dev:encrypt` - encrypt secrets/credentials

`yarn dev:webp` - convert images to `.webp`

---

### Feature parity

| Calculator | Math | Math tests | Inputs | Input tests | Select tests | Graph | Docs | Labels |
|:----------:|:----:|:----------:|:------:|:-----------:|:------------:|:-----:|:----:|:------:|
|    Arm     |  ✓   |     ~      |   ✓    |             |              |   ✓   |  ✓   |   ✓    |
|    Belt    |  ✓   |     ✓      |   ✓    |      ✓      |              |   x   |  ✓   |   ✓    |
|  Flywheel  |  ✓   |     ✓      |   ✓    |      ✓      |              |   x   |  ✓   |   ✓    |
|   Linear   |  ✓   |     ~      |   ✓    |             |              |   ✓   |      |   ✓    |
| Pneumatic  |  ✓   |            |   ✓    |             |              |   ✓   |  ~   |   ✓    |
|   Chain    |  ✓   |     ✓      |   ✓    |             |              |   x   |      |   ✓    |

---

### Priority list

1. UI tests
2. Docs
3. Target reduction -> Gearbox calc
4. ILITE Drivetrain calc
5. CSS overhaul
6. Export models to csv/json
7. PDF renderer

I'd like to overhaul the UI with DaisyUI v2, which is a plugin for Tailwind v3. Tailwind v3 requires postcss v8, but postcss v8 is only supported in either (react-scripts v4 + tailwind v2) OR (react-scripts v5 + tailwind v3). So I would need to upgrade ReCalc to use react-scripts v5. However, react-scripts v5 upgrades webpack from v4 to v5, and webpack v5 removes Node polyfills, which breaks the Google Spreadsheet API wrapper I'm using.
