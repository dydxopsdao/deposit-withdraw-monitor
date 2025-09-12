module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'playwright'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:playwright/recommended'],
  ignorePatterns: ['node_modules', 'dist', 'build', 'coverage', 'playwright-report', 'traces'],
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
  overrides: [
    { files: ['**/*.spec.*', '**/*test.*'], rules: { 'no-console': 'off' } },
    { files: ['src/utils/logger/**/*'], rules: { 'no-console': 'off' } },
  ],
};
