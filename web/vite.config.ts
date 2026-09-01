/// <reference types="vitest/config" />
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        tanstackRouter({ autoCodeSplitting: true, target: 'react' }),
        react(),
    ],
    server: {
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        passWithNoTests: true,
        setupFiles: ['./src/test/setup.ts'],
    },
});
