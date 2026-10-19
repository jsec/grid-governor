import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        env: { TZ: 'UTC' },
        globalSetup: ['./src/testing/database.ts'],
    },
});
