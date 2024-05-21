import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [ 'src/db/**/*.ts' ],
      include: [ 'src/**/*.ts' ],
      provider: 'v8'
    },
    server: {
      deps: {
        inline: [ '@fastify/autoload' ]
      }
    }
  },
});
