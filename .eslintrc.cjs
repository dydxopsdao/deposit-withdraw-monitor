module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'playwright'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:playwright/recommended', 'prettier'],
  rules: {
    // ban focused tests
    'playwright/no-focused-tests': 'error',
    // ban debugger
    'no-debugger': 'error',
    // ban page.pause()
    'no-restricted-properties': ['error', { object: 'page', property: 'pause', message: 'Remove page.pause()' }],
    // prefer logger over console.* (allow warn/error)
    'no-console': ['error', { allow: ['warn', 'error'] }],
    // useful TS hygiene
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
  },
  overrides: [
    // allow console in tests
    { files: ['**/*.spec.{ts,tsx,js}', '**/*test.{ts,tsx,js}'], rules: { 'no-console': 'off' } },
    // allow console in these repo-specific files
    {
      files: ['global-setup.ts', 'playwright.config.ts', 'src/scripts/**/*.{ts,js}', 'src/utils/logger/**/*.{ts,js}'],
      rules: { 'no-console': 'off' },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/', 'playwright-report/', 'traces/', 'out/'],
};
