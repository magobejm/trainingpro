import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/framer-motion')) {
            return 'charts';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  optimizeDeps: {
    include: ['react-native-web'],
  },
  plugins: [react()],
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
    include: ['src/**/*.test.ts'],
  },
});
