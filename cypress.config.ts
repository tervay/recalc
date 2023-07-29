import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  projectId: "rq9vfm",
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
  defaultCommandTimeout: 1000 * 10,
  retries: {
    runMode: 3,
    openMode: 3,
  },
  screenshotOnRunFailure: false,
  video: false,
});
