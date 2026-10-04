import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globalSetup: ['@grid-governor/core/testing/database'],
    },
});
