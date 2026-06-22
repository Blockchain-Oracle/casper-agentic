import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    exclude: ["**/.next/**", "**/.thoughts/raw/repos/**", "**/node_modules/**"],
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    restoreMocks: true,
    watch: false,
  },
});
