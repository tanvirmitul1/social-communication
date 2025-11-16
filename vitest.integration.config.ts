import { defineConfig } from 'vitest/config';
import path from 'path';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    include: ['tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/types.ts',
        '**/index.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, './config'),
      '@common': path.resolve(__dirname, './common'),
      '@modules': path.resolve(__dirname, './modules'),
      '@middlewares': path.resolve(__dirname, './middlewares'),
      '@infrastructure': path.resolve(__dirname, './infrastructure'),
      '@application': path.resolve(__dirname, './application'),
    },
  },
});