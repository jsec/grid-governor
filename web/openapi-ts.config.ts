import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: 'http://localhost:8000/api/openapi.json',
    output: 'src/api/generated',
    plugins: ['@hey-api/client-fetch', '@tanstack/react-query'],
});
