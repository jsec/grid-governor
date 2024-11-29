import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['src/db/**/*.ts'],
      include: ['src/**/*.ts'],
      provider: 'v8',
    },
    reporters: [
      'default',
      'hanging-process',
    ],
    server: {
      deps: {
        inline: ['@fastify/autoload'],
      },
    },
  },
});
