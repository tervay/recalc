import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/setupTests.ts"],
    environment: "jsdom",
  },
  plugins: [viteTsconfigPaths(), react()],
});
