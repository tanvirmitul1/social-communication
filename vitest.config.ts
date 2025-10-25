import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
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
      '@app': path.resolve(__dirname, './app'),
      '@core': path.resolve(__dirname, './core'),
      '@config': path.resolve(__dirname, './app/config'),
      '@controllers': path.resolve(__dirname, './app/controllers'),
      '@services': path.resolve(__dirname, './app/services'),
      '@repositories': path.resolve(__dirname, './app/repositories'),
      '@models': path.resolve(__dirname, './app/models'),
      '@routes': path.resolve(__dirname, './app/routes'),
      '@sockets': path.resolve(__dirname, './app/sockets'),
      '@middlewares': path.resolve(__dirname, './app/middlewares'),
      '@utils': path.resolve(__dirname, './core/utils'),
      '@errors': path.resolve(__dirname, './core/errors'),
      '@logger': path.resolve(__dirname, './core/logger'),
      '@validations': path.resolve(__dirname, './core/validations'),
      '@constants': path.resolve(__dirname, './core/constants'),
    },
  },
});
