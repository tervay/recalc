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
      framework: "create-react-app",
      bundler: "webpack",
    },
  },
});
