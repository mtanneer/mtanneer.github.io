import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/github.pure.ts', 'src/lib/graph.ts', 'src/lib/projects.pure.ts'],
      thresholds: {
        lines: 95,
        statements: 95,
        branches: 85,
        functions: 95,
      },
    },
  },
});
