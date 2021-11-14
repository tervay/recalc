# [⎰ReCalc](https://reca.lc/)

ReCalc is a collaboration focused mechanical design calculator, primarily for FRC.

## Local setup

You'll need Node version 14 and Yarn version 1.22.

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

---

### Feature parity

| Calculator | Math | Math tests | Inputs | Input tests | Select tests | Graph | Docs | Labels |
|:----------:|:----:|:----------:|:------:|:-----------:|:------------:|:-----:|:----:|:------:|
|    Arm     |  ✓   |     ~      |   ✓    |             |              |   ✓   |  ✓   |   ✓    |
|    Belt    |  ✓   |     ✓      |   ✓    |      ✓      |              |   x   |  ✓   |   ✓    |
|  Flywheel  |  ✓   |     ✓      |   ✓    |      ✓      |              |   x   |  ✓   |   ✓    |
|   Linear   |  ✓   |     ~      |   ✓    |             |              |   ✓   |      |   ✓    |
| Pneumatic  |  ✓   |            |   ✓    |             |              |   ✓   |  ~   |   ✓    |
|   Chain    |  ✓   |     ✓      |        |             |              |   x   |      |        |
| Gear Load  |      |            |        |             |              |       |      |        |

---

### Probably will do later

* Arm calc 2d animation
* Export models (pulleys/belts/etc) to csv/json/etc
* Enter desired reduction -> get gearbox config list
* Breaker calc?
* Simple drivetrain calc
