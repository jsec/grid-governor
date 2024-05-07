module.exports = {
  extends: [
    '@jarsec/eslint-config'
  ],
  ignorePatterns: [
    '.eslintrc.cjs'
  ],
  rules: {
    // TODO: move this to the test overrides of the config
    'n/no-unpublished-import': 'off'
  }
};
