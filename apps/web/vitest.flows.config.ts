import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@trainerpro/ui',
        replacement: resolve(__dirname, '../../packages/ui/src/index.ts'),
      },
      {
        find: '@trainerpro/shared',
        replacement: resolve(__dirname, '../../packages/shared/src/index.ts'),
      },
      {
        find: /^react-native$/,
        replacement: 'react-native-web',
      },
    ],
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 60_000,
    include: ['flows/**/*.test.ts'],
    sequence: { concurrent: false },
    testTimeout: 60_000,
  },
});
