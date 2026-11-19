import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["tests/unit/quarto/**/*.test.ts", "tests/contract/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "miniapp",
          environment: "happy-dom",
          include: ["tests/unit/miniapp/**/*.test.tsx"],
        },
      },
    ],
  },
});
