import myConfig from '@jarsec/eslint-config';

export default [
    { ignores: ['dist/**', 'src/db/types.ts'] },
    ...myConfig,
    {
        files: ['**/*.{js,ts}'],
        rules: {
            '@stylistic/max-len': [
                'error',
                { code: 100, ignoreUrls: true },
            ],
            '@stylistic/newline-per-chained-call': ['error', { ignoreChainWithDepth: 2 }],
            '@stylistic/object-curly-newline': ['error', { consistent: true, multiline: true }],
            '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
            'curly': ['error', 'all'],
        },
    },
];
