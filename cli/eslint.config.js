import myConfig from '@jarsec/eslint-config';

export default [
    ...myConfig,
    {
        files: ['**/*.{js,ts}'],
        rules: {
            '@stylistic/max-len': [
                'error',
                { code: 100, ignoreUrls: true },
            ],
            '@stylistic/newline-per-chained-call': ['error', { ignoreChainWithDepth: 2 }],
            '@stylistic/object-curly-newline': ['error', {
                ExportDeclaration: { consistent: true, multiline: true },
                ImportDeclaration: { consistent: true, multiline: true },
                ObjectExpression: {
                    consistent: true,
                    minProperties: 3,
                    multiline: true,
                },
                ObjectPattern: { consistent: true, multiline: true },
            }],
            '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
            '@stylistic/padding-line-between-statements': [
                'error',
                {
                    blankLine: 'always',
                    next: 'return',
                    prev: '*',
                },
                {
                    blankLine: 'always',
                    next: '*',
                    prev: 'block-like',
                },
                {
                    blankLine: 'always',
                    next: 'if',
                    prev: '*',
                },
            ],
            'curly': ['error', 'all'],
        },
    },
];
