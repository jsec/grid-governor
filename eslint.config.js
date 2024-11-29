import config from '@jarsec/eslint-config';

export default [
  ...config,
  {
    files: [
      'eslint.config.js',
      'vitest.config.ts',
      'test/**/*.ts',
    ],
    rules: {
      'n/no-unpublished-import': 'off',
    },
  },
];
