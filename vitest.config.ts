import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/setupTests.ts"],
    environment: "jsdom",
    coverage: {
      provider: "istanbul",
      exclude: ["**/*.tsx"],
    },
    exclude: ["playwright-tests", "node_modules"],
  },
  plugins: [viteTsconfigPaths(), react()],
});
