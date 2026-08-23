import react from '@jarsec/eslint-config/react';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist', 'src/routeTree.gen.ts', 'src/api/generated']),
    ...react,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['eslint.config.js', 'openapi-ts.config.ts'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
]);
