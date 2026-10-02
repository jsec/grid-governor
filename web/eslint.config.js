import react from '@jarsec/eslint-config/react';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist', 'src/routeTree.gen.ts']),
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
    {
        files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
        rules: {
            '@stylistic/max-len': ['error', { code: 100, ignoreUrls: true }],
            '@stylistic/newline-per-chained-call': ['error', { ignoreChainWithDepth: 2 }],
            '@stylistic/object-curly-newline': ['error', { consistent: true, multiline: true }],
            '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
            'curly': ['error', 'all'],
        },
    },
]);
