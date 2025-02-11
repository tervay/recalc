# [ReCalc](https://reca.lc/)

ReCalc is a collaboration focused mechanical design calculator, primarily for FRC.

## Local setup

You'll need Node version 18 and Yarn version 1.22.

```
$ yarn
```

## Basic dev commands:

`yarn start` - start server

`yarn build` - build to `./build`

`yarn test` - run tests

`yarn dev:analyze` - check bundle sizes

`yarn dev:coverage` - run test coverage report

`yarn dev:format` - format source files

`yarn dev:encrypt` - encrypt secrets/credentials

`yarn dev:webp` - convert images to `.webp`


### Playwright

```bash
yarn playwright install
yarn playwright install chrome
yarn playwright install-deps
yarn playwright test
```

---

### Priority list

1. UI tests
2. Docs
3. Target reduction -> Gearbox calc
4. ILITE Drivetrain calc
5. CSS overhaul
6. Export models to csv/json
7. PDF renderer
