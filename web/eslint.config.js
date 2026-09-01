import react from '@jarsec/eslint-config/react';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist', 'src/routeTree.gen.ts', 'src/api/generated']),
    ...react,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['eslint.config.js'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
]);
