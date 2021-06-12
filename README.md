# ⎰ReCalc

This is a collaboration focused mechanical design calculator, primarily for FRC.

## Local setup

```
$ nvm use 15
$ yarn --version
1.22.5
$ yarn
```

You'll also need to the `REACT_APP_SKIP_GAUTH` (set to `true`) field to the `.env` file:

```
SKIP_PREFLIGHT_CHECK=true
REACT_APP_SKIP_GAUTH=true
```

### Basic dev commands:

`yarn dev:start` - start server

`yarn dev:coverage` - run test coverage report

`yarn dev:compress` - compress `./build` directory to brotli and gzip

`yarn dev:webp` - convert images to `.webp`

`yarn dev:analyze` - check bundle sizes

`yarn dev:bump` - bump version

`yarn dev:format` - format source files

`yarn travis:build` - build to `./build`

`yarn travis:test` - run tests

`yarn heroku:build` - build & compress

`yarn heroku:start` - start server in prod mode
